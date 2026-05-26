import { useState } from 'react';
import { useData } from '../hooks/useData';
import { api } from '../api';
import Modal from '../components/Modal';
import './Page.css';

const EMPTY_ORDER = { CustomerID: '', EmployeeID: '', OrderDate: '', ShippedDate: '', PaidDate: '', StatusID: '', Notes: '' };
const EMPTY_DETAIL = { ProductID: '', Quantity: 1, UnitPrice: '' };

export default function OrdersPage() {
  const { data: orders, loading, error, reload } = useData(api.orders.list);
  const { data: customers } = useData(api.customers.list);
  const { data: employees } = useData(api.employees.list);
  const { data: products } = useData(api.products.list);
  const { data: statuses } = useData(api.orderStatus.list);
  const { data: settings } = useData(api.settings.get, null);

  // TaxRate stored as integer e.g. 85 = 8.5% (divide by 1000)
  const taxRate = settings?.TaxRate ? parseInt(settings.TaxRate) / 1000 : 0;

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_ORDER);
  const [details, setDetails] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const toDateInput = (val) => val ? new Date(val).toISOString().slice(0, 10) : '';

  const openAdd = () => {
    setForm(EMPTY_ORDER); setDetails([]); setSaveError(null); setModal({ mode: 'add' });
  };

  const openEdit = async (row) => {
    const full = await api.orders.get(row.OrderID);
    setForm({
      CustomerID: full.CustomerID || '',
      EmployeeID: full.EmployeeID || '',
      OrderDate: toDateInput(full.OrderDate),
      ShippedDate: toDateInput(full.ShippedDate),
      PaidDate: toDateInput(full.PaidDate),
      StatusID: full.StatusID || '',
      Notes: full.Notes || '',
    });
    setDetails(full.details || []);
    setSaveError(null);
    setModal({ mode: 'edit', row });
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const addDetail = () => setDetails(d => [...d, { ...EMPTY_DETAIL }]);
  const updateDetail = (i, field, value) => setDetails(d => d.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const removeDetail = (i) => setDetails(d => d.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      const payload = {
        ...form,
        CustomerID: form.CustomerID || null,
        EmployeeID: form.EmployeeID || null,
        StatusID: form.StatusID || null,
        OrderDate: form.OrderDate || null,
        ShippedDate: form.ShippedDate || null,
        PaidDate: form.PaidDate || null,
        details: details.map(d => ({ ProductID: parseInt(d.ProductID), Quantity: parseInt(d.Quantity), UnitPrice: parseFloat(d.UnitPrice) })),
      };
      if (modal.mode === 'add') await api.orders.create(payload);
      else await api.orders.update(modal.row.OrderID, payload);
      setModal(null); reload();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this order and all its details?')) return;
    try { await api.orders.delete(id); reload(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Orders</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ New Order</button>
      </div>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Employee</th><th>Order Date</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.OrderID}>
                  <td>{o.OrderID}</td>
                  <td>{o.CustomerName}</td>
                  <td>{o.EmployeeName}</td>
                  <td>{o.OrderDate ? new Date(o.OrderDate).toLocaleDateString() : '—'}</td>
                  <td>{o.StatusName}</td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => openEdit(o)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.OrderID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'add' ? 'New Order' : `Edit Order #${modal.row.OrderID}`} onClose={() => setModal(null)}>
          <div className="form-grid">
            <label><span>Customer</span>
              <select name="CustomerID" value={form.CustomerID} onChange={handleChange}>
                <option value="">— Select —</option>
                {customers.map(c => <option key={c.CustomerID} value={c.CustomerID}>{c.CustomerName}</option>)}
              </select>
            </label>
            <label><span>Employee</span>
              <select name="EmployeeID" value={form.EmployeeID} onChange={handleChange}>
                <option value="">— Select —</option>
                {employees.map(e => <option key={e.EmployeeID} value={e.EmployeeID}>{e.FirstName} {e.LastName}</option>)}
              </select>
            </label>
            <label><span>Status</span>
              <select name="StatusID" value={form.StatusID} onChange={handleChange}>
                <option value="">— Select —</option>
                {statuses.map(s => <option key={s.StatusID} value={s.StatusID}>{s.StatusName}</option>)}
              </select>
            </label>
            <label><span>Order Date</span><input type="date" name="OrderDate" value={form.OrderDate} onChange={handleChange} /></label>
            <label><span>Shipped Date</span><input type="date" name="ShippedDate" value={form.ShippedDate} onChange={handleChange} /></label>
            <label><span>Paid Date</span><input type="date" name="PaidDate" value={form.PaidDate} onChange={handleChange} /></label>
            <label className="full-width"><span>Notes</span><textarea name="Notes" value={form.Notes} onChange={handleChange} rows={2} /></label>
          </div>

          <div className="section-header">
            <strong>Order Lines</strong>
            <button className="btn btn-sm" onClick={addDetail}>+ Add Line</button>
          </div>
          <table className="detail-table">
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th><th></th></tr></thead>
            <tbody>
              {details.map((d, i) => (
                <tr key={i}>
                  <td>
                    <select value={d.ProductID} onChange={e => {
                      const p = products.find(p => p.ProductID === parseInt(e.target.value));
                      updateDetail(i, 'ProductID', e.target.value);
                      if (p) updateDetail(i, 'UnitPrice', p.UnitPrice);
                    }}>
                      <option value="">— Select —</option>
                      {products.map(p => <option key={p.ProductID} value={p.ProductID}>{p.ProductName}</option>)}
                    </select>
                  </td>
                  <td><input type="number" min="1" value={d.Quantity} onChange={e => updateDetail(i, 'Quantity', e.target.value)} style={{width:'60px'}} /></td>
                  <td><input type="number" step="0.01" value={d.UnitPrice} onChange={e => updateDetail(i, 'UnitPrice', e.target.value)} style={{width:'90px'}} /></td>
                  <td>${(parseFloat(d.Quantity || 0) * parseFloat(d.UnitPrice || 0)).toFixed(2)}</td>
                  <td><button className="btn btn-sm btn-danger" onClick={() => removeDetail(i)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {details.length > 0 && (() => {
            const subtotal = details.reduce((s, d) => s + parseFloat(d.Quantity || 0) * parseFloat(d.UnitPrice || 0), 0);
            const tax = subtotal * taxRate;
            return (
              <div className="order-totals">
                <span>Subtotal: <strong>${subtotal.toFixed(2)}</strong></span>
                <span>Tax ({(taxRate * 100).toFixed(1)}%): <strong>${tax.toFixed(2)}</strong></span>
                <span>Total: <strong>${(subtotal + tax).toFixed(2)}</strong></span>
              </div>
            );
          })()}

          {saveError && <p className="error">{saveError}</p>}
          <div className="form-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
