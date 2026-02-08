import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <h2>Concept</h2>
          <span>Admin Panel</span>
        </div>

        <nav>
          <ul className="admin-nav">
            <li>
              <NavLink to="/admin" end>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/banners">
                <span>Banners</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/statistics">
                <span>Statistics</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/results">
                <span>Results</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/success-stories">
                <span>Success Stories</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/announcements">
                <span>Announcements</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/legacy-cards">
                <span>Legacy Cards</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/courses">
                <span>Courses</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {currentUser?.email}
            </span>
            <button onClick={handleLogout} className="admin-logout-btn">
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
