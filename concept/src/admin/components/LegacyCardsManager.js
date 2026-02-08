import React, { useState } from 'react';
import { useAllLegacyCards, legacyCardsOperations } from '../../hooks/useFirestore';
import ImageUploader from './ImageUploader';
import '../styles/admin.css';

export default function LegacyCardsManager() {
  const { cards, loading } = useAllLegacyCards();
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', order: 1, isActive: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  function openAddModal() {
    setEditingCard(null);
    setFormData({
      title: '',
      description: '',
      order: cards.length + 1,
      isActive: true
    });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  }

  function openEditModal(card) {
    setEditingCard(card);
    setFormData({
      title: card.title || '',
      description: card.description || '',
      order: card.order || 1,
      isActive: card.isActive !== false
    });
    setImageFile(null);
    setImagePreview(card.imageUrl);
    setShowModal(true);
  }

  function handleImageSelect(file) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingCard && !imageFile) {
      alert('Please select an image');
      return;
    }

    setSaving(true);
    try {
      if (editingCard) {
        await legacyCardsOperations.update(editingCard.id, formData, imageFile);
      } else {
        await legacyCardsOperations.add(formData, imageFile);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error saving card: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(card) {
    if (!window.confirm('Are you sure you want to delete this card?')) return;

    try {
      await legacyCardsOperations.delete(card.id);
    } catch (err) {
      alert('Error deleting card: ' + err.message);
    }
  }

  async function toggleActive(card) {
    try {
      await legacyCardsOperations.update(card.id, { isActive: !card.isActive });
    } catch (err) {
      alert('Error updating card: ' + err.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Legacy Cards</h3>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Card
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '20px' }}>
          These appear as stacking cards in the "X+ years of Legacy" section on the homepage.
        </p>

        {cards.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No legacy cards yet. Click "Add Card" to create one.
          </p>
        ) : (
          <div className="item-list">
            {cards.map(card => (
              <div key={card.id} className="item-card">
                <img src={card.imageUrl} alt={card.title} />
                <div className="item-card-content">
                  <h4>{card.title || 'Untitled Card'}</h4>
                  <p>{card.description ? (card.description.length > 60 ? card.description.slice(0, 60) + '...' : card.description) : 'No description'} | Order: {card.order}</p>
                </div>
                <div className="item-card-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={card.isActive}
                      onChange={() => toggleActive(card)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button onClick={() => openEditModal(card)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(card)} className="btn btn-danger btn-sm">
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
              <h2>{editingCard ? 'Edit Legacy Card' : 'Add Legacy Card'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <ImageUploader
                onSelect={handleImageSelect}
                preview={imagePreview}
                label="Upload Card Image"
              />

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Biggest Infrastructure"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., A peaceful and conducive place to study"
                  rows={3}
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
                  {saving ? <span className="btn-spinner" /> : 'Save Card'}
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
