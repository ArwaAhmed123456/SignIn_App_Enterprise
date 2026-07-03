// Final deployment version - manual logs, security, and Totmonslow data included
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MobileLanding from './pages/MobileLanding';
import MobileForm from './pages/MobileForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProjectDetails from './pages/ProjectDetails';

import AdminSignup from './pages/AdminSignup';
import AdminLayout from './components/AdminLayout';
import ActivityPage from './pages/ActivityPage';
import AttendancePage from './pages/AttendancePage';
import PeopleDirectory from './pages/PeopleDirectory';
import ManageSettings from './pages/ManageSettings';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root to Admin Login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Mobile Routes (Optional/Legacy - kept if needed via direct link) */}
        <Route path="/mobile-landing" element={<MobileLanding />} />
        <Route path="/form" element={<MobileForm />} />

        {/* Admin Login & Signup */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/signup"
          element={
            <ProtectedRoute roleRequired="superadmin">
              <AdminSignup />
            </ProtectedRoute>
          }
        />

        {/* New Modular Admin Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
            <Route index element={<Navigate to="/admin/activity" replace />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            
            {/* These pages will be built in the next phases */}
            <Route path="people" element={<PeopleDirectory />} />
            <Route path="manage/*" element={<ManageSettings />} />
            
            {/* Legacy Fallback for projects while migrating */}
            <Route path="project/:id" element={<ProjectDetails />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
