import React, { useState } from 'react';
import { useAllCourses, coursesOperations } from '../../hooks/useFirestore';
import ImageUploader from './ImageUploader';
import '../styles/admin.css';

const CATEGORIES = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'medical', label: 'Medical' },
  { value: 'prefoundation', label: 'Pre Foundation' }
];

const EMPTY_FORM = {
  name: '',
  category: 'engineering',
  target: '',
  eligibility: '',
  medium: 'ENGLISH/HINDI',
  syllabus: '',
  status: 'batch starting soon',
  order: 1,
  isActive: true
};

export default function CoursesManager() {
  const { courses, loading } = useAllCourses();
  const [activeTab, setActiveTab] = useState('engineering');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCourses = courses.filter(c => c.category === activeTab);

  function openAddModal() {
    setEditingCourse(null);
    setFormData({
      ...EMPTY_FORM,
      category: activeTab,
      order: filteredCourses.length + 1
    });
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  }

  function openEditModal(course) {
    setEditingCourse(course);
    setFormData({
      name: course.name || '',
      category: course.category,
      target: course.target || '',
      eligibility: course.eligibility || '',
      medium: course.medium || 'ENGLISH/HINDI',
      syllabus: course.syllabus || '',
      status: course.status || 'batch starting soon',
      order: course.order || 1,
      isActive: course.isActive !== false
    });
    setImageFile(null);
    setImagePreview(course.imageUrl || '');
    setShowModal(true);
  }

  function handleImageSelect(file) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingCourse && !imageFile) {
      alert('Please select an image');
      return;
    }

    setSaving(true);
    try {
      if (editingCourse) {
        await coursesOperations.update(editingCourse.id, formData, imageFile);
      } else {
        await coursesOperations.add(formData, imageFile);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error saving course: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete(course) {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await coursesOperations.delete(course.id);
    } catch (err) {
      alert('Error deleting course: ' + err.message);
    }
  }

  async function toggleActive(course) {
    try {
      await coursesOperations.update(course.id, { isActive: !course.isActive });
    } catch (err) {
      alert('Error updating course: ' + err.message);
    }
  }

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Courses</h3>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add Course
          </button>
        </div>

        <div className="tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`tab ${activeTab === cat.value ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.value)}
            >
              {cat.label} ({courses.filter(c => c.category === cat.value).length})
            </button>
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No courses in this category. Click "Add Course" to create one.
          </p>
        ) : (
          <div className="item-list">
            {filteredCourses.map(course => (
              <div key={course.id} className="item-card">
                {course.imageUrl && <img src={course.imageUrl} alt={course.name} />}
                <div className="item-card-content">
                  <h4>{course.name || 'Untitled Course'}</h4>
                  <p>Target: {course.target} | Order: {course.order} | {course.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="item-card-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={course.isActive}
                      onChange={() => toggleActive(course)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button onClick={() => openEditModal(course)} className="btn btn-secondary btn-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(course)} className="btn btn-danger btn-sm">
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
              <h2>{editingCourse ? 'Edit Course' : 'Add Course'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <ImageUploader
                onSelect={handleImageSelect}
                preview={imagePreview}
                label="Upload Course Icon"
              />

              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Early Lead"
                  required
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
                <label>Target</label>
                <input
                  type="text"
                  value={formData.target}
                  onChange={e => setFormData({ ...formData, target: e.target.value })}
                  placeholder="e.g., IIT JEE (Mains & Advanced)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Eligibility</label>
                <input
                  type="text"
                  value={formData.eligibility}
                  onChange={e => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g., Class 10th to 11th moving students"
                  required
                />
              </div>

              <div className="form-group">
                <label>Medium of Classes</label>
                <input
                  type="text"
                  value={formData.medium}
                  onChange={e => setFormData({ ...formData, medium: e.target.value })}
                  placeholder="e.g., ENGLISH/HINDI"
                />
              </div>

              <div className="form-group">
                <label>Syllabus Covered</label>
                <textarea
                  value={formData.syllabus}
                  onChange={e => setFormData({ ...formData, syllabus: e.target.value })}
                  placeholder="e.g., Complete 11th + JEE syllabus of Maths, Physics and Chemistry."
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <input
                    type="text"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    placeholder="e.g., batch starting soon"
                  />
                </div>

                <div className="form-group">
                  <label>Active</label>
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
                  {saving ? <span className="btn-spinner" /> : 'Save Course'}
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
