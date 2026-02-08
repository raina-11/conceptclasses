import React, { useState } from 'react';
import { useAllBanners, bannerOperations } from '../../hooks/useFirestore';
import ImageUploader from './ImageUploader';
import '../styles/admin.css';

export default function BannerManager() {
  const { banners, loading } = useAllBanners();
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({ altText: '', order: 1, isActive: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  function openAddModal() {
    setEditingBanner(null);
    setFormData({ altText: '', order: banners.length + 1, isActive: true });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  }

  function openEditModal(banner) {
    setEditingBanner(banner);
    setFormData({
      altText: banner.altText || '',
      order: banner.order || 1,
      isActive: banner.isActive !== false
    });
    setImageFile(null);
    setImagePreview(banner.imageUrl);
    setShowModal(true);
  }

  function handleImageSelect(file) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingBanner && !imageFile) {
      alert('Please select an image');
      return;
    }

    setSaving(true);
    try {
      if (editingBanner) {
        await bannerOperations.update(editingBanner.id, formData, imageFile);
      } else {
        await bannerOperations.add(formData, imageFile);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error saving banner: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(banner) {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      await bannerOperations.delete(banner.id);
    } catch (err) {
      alert('Error deleting banner: ' + err.message);
    }
  }

  async function toggleActive(banner) {
    try {
      await bannerOperations.update(banner.id, { isActive: !banner.isActive });
    } catch (err) {
      alert('Error updating banner: ' + err.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Homepage Banners</h3>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Banner
          </button>
        </div>

        {banners.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No banners yet. Click "Add Banner" to create one.
          </p>
        ) : (
          <div className="item-list">
            {banners.map(banner => (
              <div key={banner.id} className="item-card">
                <img src={banner.imageUrl} alt={banner.altText} />
                <div className="item-card-content">
                  <h4>{banner.altText || 'Untitled Banner'}</h4>
                  <p>Order: {banner.order} | Status: {banner.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="item-card-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={() => toggleActive(banner)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button onClick={() => openEditModal(banner)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(banner)} className="btn btn-danger btn-sm">
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
              <h2>{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <ImageUploader
                onSelect={handleImageSelect}
                preview={imagePreview}
                label="Upload Banner Image"
              />

              <div className="form-group">
                <label>Alt Text (for accessibility)</label>
                <input
                  type="text"
                  value={formData.altText}
                  onChange={e => setFormData({ ...formData, altText: e.target.value })}
                  placeholder="Describe the banner"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    min="1"
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
                  {saving ? <span className="btn-spinner" /> : 'Save Banner'}
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
