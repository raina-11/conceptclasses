import React, { useState } from 'react';
import { useAllAnnouncements, announcementsOperations } from '../../hooks/useFirestore';
import '../styles/admin.css';

const ROUTES = [
  { value: '/', label: 'Home' },
  { value: '/about', label: 'About Us' },
  { value: '/images', label: 'Gallery' },
  { value: '/college-search', label: 'College Search' },
  { value: '/engineering', label: 'Engineering Courses' },
  { value: '/medical', label: 'Medical Courses' },
  { value: '/pre-foundation', label: 'Pre-Foundation Courses' },
  { value: '/results/engineering', label: 'Results - Engineering' },
  { value: '/results/medical', label: 'Results - Medical' },
  { value: '/results/pre-foundation', label: 'Results - Pre-Foundation' },
  { value: '/science-champ-result-2026', label: 'Science Champ Results' },
  { value: 'tel:9928111865', label: 'Contact Us (Call)' },
];

export default function AnnouncementsEditor() {
  const { announcements, loading } = useAllAnnouncements();
  const hasActiveAnnouncement = announcements.some(a => a.isActive);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    type: 'science_champ',
    title: '',
    subtitle: '',
    description: '',
    year: '',
    hasButton: true,
    ctaText: '',
    ctaLink: '',
    isPopupEnabled: true,
    isBannerEnabled: true,
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  function openAddModal() {
    setEditingAnnouncement(null);
    setFormData({
      type: 'science_champ',
      title: '',
      subtitle: '',
      description: '',
      year: '',
      hasButton: true,
      ctaText: 'Check Results',
      ctaLink: '/science-champ-result-2026',
      isPopupEnabled: true,
      isBannerEnabled: true,
      isActive: true
    });
    setShowModal(true);
  }

  function openEditModal(announcement) {
    setEditingAnnouncement(announcement);
    setFormData({
      type: announcement.type || 'science_champ',
      title: announcement.title || '',
      subtitle: announcement.subtitle || '',
      description: announcement.description || '',
      year: announcement.year || '',
      hasButton: !!(announcement.ctaText),
      ctaText: announcement.ctaText || '',
      ctaLink: announcement.ctaLink || '',
      isPopupEnabled: announcement.isPopupEnabled !== false,
      isBannerEnabled: announcement.isBannerEnabled !== false,
      isActive: announcement.isActive !== false
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { hasButton, ...saveData } = formData;
    if (!hasButton) {
      saveData.ctaText = '';
      saveData.ctaLink = '';
    }

    setSaving(true);
    try {
      if (editingAnnouncement) {
        await announcementsOperations.update(editingAnnouncement.id, saveData);
      } else {
        await announcementsOperations.add(saveData);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error saving announcement: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(announcement) {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await announcementsOperations.delete(announcement.id);
    } catch (err) {
      alert('Error deleting announcement: ' + err.message);
    }
  }

  async function togglePopup(announcement) {
    try {
      await announcementsOperations.update(announcement.id, {
        isPopupEnabled: !announcement.isPopupEnabled
      });
    } catch (err) {
      alert('Error updating: ' + err.message);
    }
  }

  async function toggleActive(announcement) {
    if (!announcement.isActive && hasActiveAnnouncement) {
      alert('Only one active announcement allowed. Deactivate the current one first.');
      return;
    }
    try {
      await announcementsOperations.update(announcement.id, {
        isActive: !announcement.isActive
      });
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
          <h3 style={{ margin: 0 }}>Announcements</h3>
          <button
            onClick={openAddModal}
            className="btn btn-primary"
            disabled={hasActiveAnnouncement}
            title={hasActiveAnnouncement ? 'Deactivate the current announcement before adding a new one' : ''}
          >
            + Add Announcement
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>
          Only one active announcement at a time. Deactivate the current one before creating a new one.
        </p>

        {announcements.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No announcements yet. Click "Add Announcement" to create one.
          </p>
        ) : (
          <div className="item-list">
            {announcements.map(announcement => (
              <div key={announcement.id} className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: announcement.type === 'science_champ' ? '#e3f2fd' : '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    {announcement.type === 'science_champ' ? '🔬' : '📢'}
                  </div>
                  <div className="item-card-content">
                    <h4>{announcement.title}</h4>
                    <p>{announcement.subtitle} | Year: {announcement.year}</p>
                  </div>
                  <div className="item-card-actions">
                    <button onClick={() => openEditModal(announcement)} className="btn btn-secondary btn-sm">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(announcement)} className="btn btn-danger btn-sm">
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '24px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #eee'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={announcement.isPopupEnabled}
                        onChange={() => togglePopup(announcement)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: '13px', color: '#666' }}>Show Popup</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={announcement.isActive}
                        onChange={() => toggleActive(announcement)}
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
              <h2>{editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="science_champ">Science Champ</option>
                  <option value="general">General Announcement</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Science Champ 2026"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g., Results are now OUT!"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Year</label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g., 2025-2026"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasButton}
                    onChange={e => setFormData({ ...formData, hasButton: e.target.checked })}
                  />
                  Add Button
                </label>
              </div>

              {formData.hasButton && (
              <div className="form-row">
                <div className="form-group">
                  <label>Button Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="e.g., Check Results"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Button Link</label>
                  <select
                    value={formData.ctaLink}
                    onChange={e => setFormData({ ...formData, ctaLink: e.target.value })}
                  >
                    <option value="">Select a page</option>
                    {ROUTES.map(route => (
                      <option key={route.value} value={route.value}>{route.label} ({route.value})</option>
                    ))}
                  </select>
                </div>
              </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPopupEnabled}
                      onChange={e => setFormData({ ...formData, isPopupEnabled: e.target.checked })}
                    />
                    Show as Popup on Homepage
                  </label>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isBannerEnabled}
                      onChange={e => setFormData({ ...formData, isBannerEnabled: e.target.checked })}
                    />
                    Show Banner
                  </label>
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
                  {saving ? <span className="btn-spinner" /> : 'Save Announcement'}
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
