import React, { useState } from 'react';
import { useAllFaqs, faqOperations } from '../../hooks/useFirestore';
import '../styles/admin.css';

export default function FAQEditor() {
  const { faqs, loading } = useAllFaqs();
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order: 0,
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  function openAddModal() {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      order: faqs.length + 1,
      isActive: true
    });
    setShowModal(true);
  }

  function openEditModal(faq) {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || '',
      answer: faq.answer || '',
      order: faq.order || 0,
      isActive: faq.isActive !== false
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFaq) {
        await faqOperations.update(editingFaq.id, formData);
      } else {
        await faqOperations.add(formData);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error saving FAQ: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(faq) {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await faqOperations.delete(faq.id);
    } catch (err) {
      alert('Error deleting FAQ: ' + err.message);
    }
  }

  async function toggleActive(faq) {
    try {
      await faqOperations.update(faq.id, { isActive: !faq.isActive });
    } catch (err) {
      alert('Error updating: ' + err.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>FAQs</h3>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add FAQ
          </button>
        </div>

        {faqs.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No FAQs yet. Click "Add FAQ" to create one.
          </p>
        ) : (
          <div className="item-list">
            {faqs.map(faq => (
              <div key={faq.id} className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#005b38',
                    flexShrink: 0
                  }}>
                    {faq.order || 0}
                  </div>
                  <div className="item-card-content" style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px' }}>{faq.question}</h4>
                    <p style={{
                      margin: 0,
                      color: '#666',
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '500px'
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                  <div className="item-card-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => openEditModal(faq)} className="btn btn-secondary btn-sm">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(faq)} className="btn btn-danger btn-sm">
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '24px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #eee'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={faq.isActive !== false}
                        onChange={() => toggleActive(faq)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: '13px', color: '#666' }}>Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g., What courses does Concept Classes offer?"
                  required
                />
              </div>

              <div className="form-group">
                <label>Answer</label>
                <textarea
                  value={formData.answer}
                  onChange={e => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : 'Save FAQ'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
