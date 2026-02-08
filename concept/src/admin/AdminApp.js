import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/Dashboard';
import BannerManager from './components/BannerManager';
import StatisticsEditor from './components/StatisticsEditor';
import ResultsManager from './components/ResultsManager';
import SuccessStoriesManager from './components/SuccessStoriesManager';
import AnnouncementsEditor from './components/AnnouncementsEditor';
import LegacyCardsManager from './components/LegacyCardsManager';
import CoursesManager from './components/CoursesManager';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function AdminRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="banners" element={<BannerManager />} />
        <Route path="statistics" element={<StatisticsEditor />} />
        <Route path="results" element={<ResultsManager />} />
        <Route path="success-stories" element={<SuccessStoriesManager />} />
        <Route path="announcements" element={<AnnouncementsEditor />} />
        <Route path="legacy-cards" element={<LegacyCardsManager />} />
        <Route path="courses" element={<CoursesManager />} />
      </Route>
    </Routes>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminRoutes />
    </AuthProvider>
  );
}
