import { useState } from 'react';
import { useData } from '../hooks/useData';
import { api } from '../api';
import Modal from '../components/Modal';
import './Page.css';

const EMPTY = { ProductCode: '', ProductName: '', ProductDescription: '', UnitPrice: '' };

export default function ProductsPage() {
  const { data: products, loading, error, reload } = useData(api.products.list);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const openAdd = () => { setForm(EMPTY); setSaveError(null); setModal({ mode: 'add' }); };
  const openEdit = (row) => { setForm({ ...row }); setSaveError(null); setModal({ mode: 'edit', row }); };
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      const payload = { ...form, UnitPrice: parseFloat(form.UnitPrice) || 0 };
      if (modal.mode === 'add') await api.products.create(payload);
      else await api.products.update(modal.row.ProductID, payload);
      setModal(null); reload();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.products.delete(id); reload(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Unit Price</th><th></th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.ProductID}>
                  <td>{p.ProductCode}</td>
                  <td>{p.ProductName}</td>
                  <td>${Number(p.UnitPrice).toFixed(2)}</td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.ProductID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <div className="form-grid">
            {[['ProductCode','Code'],['ProductName','Name'],['UnitPrice','Unit Price']].map(([name, label]) => (
              <label key={name}><span>{label}</span><input name={name} value={form[name] || ''} onChange={handleChange} /></label>
            ))}
            <label className="full-width">
              <span>Description</span>
              <textarea name="ProductDescription" value={form.ProductDescription || ''} onChange={handleChange} rows={3} />
            </label>
          </div>
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
