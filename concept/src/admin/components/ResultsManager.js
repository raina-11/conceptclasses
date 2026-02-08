import React, { useState } from 'react';
import { useAllResults, resultsOperations } from '../../hooks/useFirestore';
import ImageUploader from './ImageUploader';
import '../styles/admin.css';

const CATEGORIES = [
  { value: 'medical', label: 'Medical' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'prefoundation', label: 'Pre-Foundation' }
];

export default function ResultsManager() {
  const { results, loading } = useAllResults();
  const [activeTab, setActiveTab] = useState('medical');
  const [showModal, setShowModal] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'medical', order: 1, isActive: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredResults = results.filter(r => r.category === activeTab);

  function openAddModal() {
    setEditingResult(null);
    setFormData({
      title: '',
      category: activeTab,
      order: filteredResults.length + 1,
      isActive: true
    });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  }

  function openEditModal(result) {
    setEditingResult(result);
    setFormData({
      title: result.title || '',
      category: result.category,
      order: result.order || 1,
      isActive: result.isActive !== false
    });
    setImageFile(null);
    setImagePreview(result.imageUrl);
    setShowModal(true);
  }

  function handleImageSelect(file) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingResult && !imageFile) {
      alert('Please select an image');
      return;
    }

    setSaving(true);
    try {
      if (editingResult) {
        await resultsOperations.update(editingResult.id, formData, imageFile);
      } else {
        await resultsOperations.add(formData, imageFile);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error saving result: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(result) {
    if (!window.confirm('Are you sure you want to delete this result?')) return;

    try {
      await resultsOperations.delete(result.id);
    } catch (err) {
      alert('Error deleting result: ' + err.message);
    }
  }

  async function toggleActive(result) {
    try {
      await resultsOperations.update(result.id, { isActive: !result.isActive });
    } catch (err) {
      alert('Error updating result: ' + err.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Results Images</h3>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Result
          </button>
        </div>

        <div className="tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`tab ${activeTab === cat.value ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.value)}
            >
              {cat.label} ({results.filter(r => r.category === cat.value).length})
            </button>
          ))}
        </div>

        {filteredResults.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No results in this category. Click "Add Result" to upload one.
          </p>
        ) : (
          <div className="item-list">
            {filteredResults.map(result => (
              <div key={result.id} className="item-card">
                <img src={result.imageUrl} alt={result.title} />
                <div className="item-card-content">
                  <h4>{result.title || 'Untitled Result'}</h4>
                  <p>Order: {result.order} | Status: {result.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="item-card-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={result.isActive}
                      onChange={() => toggleActive(result)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button onClick={() => openEditModal(result)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(result)} className="btn btn-danger btn-sm">
                    Delete
                  </button>
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
              <h2>{editingResult ? 'Edit Result' : 'Add Result'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <ImageUploader
                onSelect={handleImageSelect}
                preview={imagePreview}
                label="Upload Result Image"
              />

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., NEET 2024 Toppers"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : 'Save Result'}
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
