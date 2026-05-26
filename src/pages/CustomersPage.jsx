import { useState } from 'react';
import { useData } from '../hooks/useData';
import { api } from '../api';
import Modal from '../components/Modal';
import './Page.css';

const EMPTY = {
  CustomerName: '', PrimaryContactLastName: '', PrimaryContactFirstName: '',
  PrimaryContactJobTitle: '', PrimaryContactEmailAddress: '', BusinessPhone: '',
  Address: '', City: '', State: '', Zip: '', Website: '', Notes: '',
};

export default function CustomersPage() {
  const { data: customers, loading, error, reload } = useData(api.customers.list);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', row }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const openAdd = () => { setForm(EMPTY); setSaveError(null); setModal({ mode: 'add' }); };
  const openEdit = (row) => { setForm({ ...row }); setSaveError(null); setModal({ mode: 'edit', row }); };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      if (modal.mode === 'add') await api.customers.create(form);
      else await api.customers.update(modal.row.CustomerID, form);
      setModal(null);
      reload();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try { await api.customers.delete(id); reload(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Customers</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>City</th><th>State</th><th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.CustomerID}>
                  <td>{c.CustomerName}</td>
                  <td>{[c.PrimaryContactFirstName, c.PrimaryContactLastName].filter(Boolean).join(' ')}</td>
                  <td>{c.PrimaryContactEmailAddress}</td>
                  <td>{c.BusinessPhone}</td>
                  <td>{c.City}</td>
                  <td>{c.State}</td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.CustomerID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Customer' : 'Edit Customer'} onClose={() => setModal(null)}>
          <div className="form-grid">
            {[
              ['CustomerName', 'Company Name'],
              ['PrimaryContactFirstName', 'First Name'],
              ['PrimaryContactLastName', 'Last Name'],
              ['PrimaryContactJobTitle', 'Job Title'],
              ['PrimaryContactEmailAddress', 'Email'],
              ['BusinessPhone', 'Phone'],
              ['Address', 'Address'],
              ['City', 'City'],
              ['State', 'State (2-letter)'],
              ['Zip', 'Zip'],
              ['Website', 'Website'],
            ].map(([name, label]) => (
              <label key={name}>
                <span>{label}</span>
                <input name={name} value={form[name] || ''} onChange={handleChange} />
              </label>
            ))}
            <label className="full-width">
              <span>Notes</span>
              <textarea name="Notes" value={form.Notes || ''} onChange={handleChange} rows={3} />
            </label>
          </div>
          {saveError && <p className="error">{saveError}</p>}
          <div className="form-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
