import { useState } from 'react';
import { useData } from '../hooks/useData';
import { api } from '../api';
import Modal from '../components/Modal';
import './Page.css';

const EMPTY = { FirstName: '', LastName: '', EmailAddress: '', JobTitle: '', PrimaryPhone: '', SecondaryPhone: '', Title: '', Notes: '' };

export default function EmployeesPage() {
  const { data: employees, loading, error, reload } = useData(api.employees.list);
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
      if (modal.mode === 'add') await api.employees.create(form);
      else await api.employees.update(modal.row.EmployeeID, form);
      setModal(null); reload();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;
    try { await api.employees.delete(id); reload(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Employees</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Name</th><th>Title</th><th>Job Title</th><th>Email</th><th>Phone</th><th></th></tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.EmployeeID}>
                  <td>{e.FirstName} {e.LastName}</td>
                  <td>{e.Title}</td>
                  <td>{e.JobTitle}</td>
                  <td>{e.EmailAddress}</td>
                  <td>{e.PrimaryPhone}</td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => openEdit(e)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.EmployeeID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Employee' : 'Edit Employee'} onClose={() => setModal(null)}>
          <div className="form-grid">
            {[['FirstName','First Name'],['LastName','Last Name'],['Title','Title'],['JobTitle','Job Title'],['EmailAddress','Email'],['PrimaryPhone','Primary Phone'],['SecondaryPhone','Secondary Phone']].map(([name, label]) => (
              <label key={name}><span>{label}</span><input name={name} value={form[name] || ''} onChange={handleChange} /></label>
            ))}
            <label className="full-width">
              <span>Notes</span>
              <textarea name="Notes" value={form.Notes || ''} onChange={handleChange} rows={3} />
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
