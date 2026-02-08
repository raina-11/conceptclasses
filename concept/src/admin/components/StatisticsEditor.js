import React, { useState, useEffect } from 'react';
import { useStatistics, statisticsOperations } from '../../hooks/useFirestore';
import '../styles/admin.css';

export default function StatisticsEditor() {
  const [activeTab, setActiveTab] = useState('india');
  const { statistics, loading } = useStatistics(activeTab);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (statistics) {
      setFormData(statistics);
    } else {
      // Default values
      setFormData(activeTab === 'india' ? {
        totalColleges: 780,
        totalSeats: 118190,
        govtColleges: 427,
        govtSeats: 59728,
        privateColleges: 353,
        privateSeats: 58462,
        aiims: { count: 20, seats: 2207 },
        jipmer: { count: 2, seats: 243 }
      } : {
        totalColleges: 0,
        totalSeats: 0,
        govtColleges: 0,
        govtSeats: 0,
        privateColleges: 0,
        privateSeats: 0
      });
    }
  }, [statistics, activeTab]);

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: parseInt(value) || 0 }));
    setSaved(false);
  }

  function handleNestedChange(parent, field, value) {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: parseInt(value) || 0 }
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await statisticsOperations.update(activeTab, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div></div>;
  }

  return (
    <div>
      <div className="admin-card">
        <h3>Medical College Statistics</h3>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'india' ? 'active' : ''}`}
            onClick={() => setActiveTab('india')}
          >
            All India
          </button>
          <button
            className={`tab ${activeTab === 'rajasthan' ? 'active' : ''}`}
            onClick={() => setActiveTab('rajasthan')}
          >
            Rajasthan
          </button>
        </div>

        <div className="admin-form">
          <h4 style={{ margin: '20px 0 10px', color: '#333' }}>Total Colleges</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Total Medical Colleges</label>
              <input
                type="number"
                value={formData.totalColleges || ''}
                onChange={e => handleChange('totalColleges', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Total MBBS Seats</label>
              <input
                type="number"
                value={formData.totalSeats || ''}
                onChange={e => handleChange('totalSeats', e.target.value)}
              />
            </div>
          </div>

          <h4 style={{ margin: '20px 0 10px', color: '#333' }}>Government Colleges</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Government Colleges</label>
              <input
                type="number"
                value={formData.govtColleges || ''}
                onChange={e => handleChange('govtColleges', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Government Seats</label>
              <input
                type="number"
                value={formData.govtSeats || ''}
                onChange={e => handleChange('govtSeats', e.target.value)}
              />
            </div>
          </div>

          <h4 style={{ margin: '20px 0 10px', color: '#333' }}>Private Colleges</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Private Colleges</label>
              <input
                type="number"
                value={formData.privateColleges || ''}
                onChange={e => handleChange('privateColleges', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Private Seats</label>
              <input
                type="number"
                value={formData.privateSeats || ''}
                onChange={e => handleChange('privateSeats', e.target.value)}
              />
            </div>
          </div>

          {activeTab === 'india' && (
            <>
              <h4 style={{ margin: '20px 0 10px', color: '#333' }}>AIIMS</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>AIIMS Institutions</label>
                  <input
                    type="number"
                    value={formData.aiims?.count || ''}
                    onChange={e => handleNestedChange('aiims', 'count', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>AIIMS Seats</label>
                  <input
                    type="number"
                    value={formData.aiims?.seats || ''}
                    onChange={e => handleNestedChange('aiims', 'seats', e.target.value)}
                  />
                </div>
              </div>

              <h4 style={{ margin: '20px 0 10px', color: '#333' }}>JIPMER</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>JIPMER Institutions</label>
                  <input
                    type="number"
                    value={formData.jipmer?.count || ''}
                    onChange={e => handleNestedChange('jipmer', 'count', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>JIPMER Seats</label>
                  <input
                    type="number"
                    value={formData.jipmer?.seats || ''}
                    onChange={e => handleNestedChange('jipmer', 'seats', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? <span className="btn-spinner" /> : 'Save Changes'}
            </button>
            {saved && <span style={{ color: '#27ae60' }}>Saved successfully!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
