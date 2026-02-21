import React from 'react';
import { Link } from 'react-router-dom';
import {
  useAllBanners,
  useAllResults,
  useAllSuccessStories,
  useAllAnnouncements,
  useAllFaqs
} from '../../hooks/useFirestore';
import '../styles/admin.css';

export default function Dashboard() {
  const { banners } = useAllBanners();
  const { results } = useAllResults();
  const { stories } = useAllSuccessStories();
  const { announcements } = useAllAnnouncements();
  const { faqs } = useAllFaqs();

  return (
    <div>
      <div className="dashboard-stats">
        <Link to="/admin/banners" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <h3>{banners.length}</h3>
            <p>Banners</p>
          </div>
        </Link>

        <Link to="/admin/results" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <h3>{results.length}</h3>
            <p>Results</p>
          </div>
        </Link>

        <Link to="/admin/success-stories" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <h3>{stories.length}</h3>
            <p>Success Stories</p>
          </div>
        </Link>

        <Link to="/admin/announcements" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <h3>{announcements.length}</h3>
            <p>Announcements</p>
          </div>
        </Link>

        <Link to="/admin/faq" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <h3>{faqs.length}</h3>
            <p>FAQs</p>
          </div>
        </Link>
      </div>

      <div className="admin-card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/admin/banners" className="btn btn-primary">
            Manage Banners
          </Link>
          <Link to="/admin/statistics" className="btn btn-primary">
            Update Statistics
          </Link>
          <Link to="/admin/results" className="btn btn-primary">
            Upload Results
          </Link>
          <Link to="/admin/announcements" className="btn btn-primary">
            Edit Announcements
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <h3>Getting Started</h3>
        <ul style={{ paddingLeft: '20px', color: '#666', lineHeight: '1.8' }}>
          <li><strong>Banners:</strong> Upload and manage homepage carousel images</li>
          <li><strong>Statistics:</strong> Update college counts, seats, and other numbers</li>
          <li><strong>Results:</strong> Upload student result images by category</li>
          <li><strong>Success Stories:</strong> Manage alumni cards with photos</li>
          <li><strong>Announcements:</strong> Control Science Champ popup and text</li>
        </ul>
      </div>
    </div>
  );
}
