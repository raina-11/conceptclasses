import React, { useState } from 'react';
import { useAllSuccessStories, successStoriesOperations } from '../../hooks/useFirestore';
import ImageUploader from './ImageUploader';
import '../styles/admin.css';

export default function SuccessStoriesManager() {
  const { stories, loading } = useAllSuccessStories();
  const [showModal, setShowModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [formData, setFormData] = useState({ name: '', position: '', row: 1, order: 1, isActive: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  function openAddModal() {
    setEditingStory(null);
    setFormData({
      name: '',
      position: '',
      row: 1,
      order: stories.length + 1,
      isActive: true
    });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  }

  function openEditModal(story) {
    setEditingStory(story);
    setFormData({
      name: story.name || '',
      position: story.position || '',
      row: story.row || 1,
      order: story.order || 1,
      isActive: story.isActive !== false
    });
    setImageFile(null);
    setImagePreview(story.photoUrl);
    setShowModal(true);
  }

  function handleImageSelect(file) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingStory && !imageFile) {
      alert('Please select a photo');
      return;
    }

    setSaving(true);
    try {
      if (editingStory) {
        await successStoriesOperations.update(editingStory.id, formData, imageFile);
      } else {
        await successStoriesOperations.add(formData, imageFile);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error saving story: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(story) {
    if (!window.confirm('Are you sure you want to delete this success story?')) return;

    try {
      await successStoriesOperations.delete(story.id);
    } catch (err) {
      alert('Error deleting story: ' + err.message);
    }
  }

  async function toggleActive(story) {
    try {
      await successStoriesOperations.update(story.id, { isActive: !story.isActive });
    } catch (err) {
      alert('Error updating story: ' + err.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Success Stories (Alumni)</h3>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Story
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>
          These appear in the scrolling alumni section on the homepage. Row 1 shows 3 items, Row 2 shows 2 items.
        </p>

        {stories.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No success stories yet. Click "Add Story" to create one.
          </p>
        ) : (
          <div className="item-list">
            {stories.map(story => (
              <div key={story.id} className="item-card">
                <img
                  src={story.photoUrl}
                  alt={story.name}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div className="item-card-content">
                  <h4>{story.name}</h4>
                  <p>{story.position} | Row: {story.row} | Order: {story.order}</p>
                </div>
                <div className="item-card-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={story.isActive}
                      onChange={() => toggleActive(story)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button onClick={() => openEditModal(story)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(story)} className="btn btn-danger btn-sm">
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
              <h2>{editingStory ? 'Edit Success Story' : 'Add Success Story'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <ImageUploader
                onSelect={handleImageSelect}
                preview={imagePreview}
                label="Upload Photo"
              />

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Rakshit Dhalla"
                  required
                />
              </div>

              <div className="form-group">
                <label>Position / Company</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={e => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., BizOps @Amazon Web Services"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Row (1 = Top, 2 = Bottom)</label>
                  <select
                    value={formData.row}
                    onChange={e => setFormData({ ...formData, row: parseInt(e.target.value) })}
                  >
                    <option value={1}>Row 1 (Top - 3 items)</option>
                    <option value={2}>Row 2 (Bottom - 2 items)</option>
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
                  {saving ? <span className="btn-spinner" /> : 'Save Story'}
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
