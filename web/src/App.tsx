import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { PatientsListPage } from './pages/PatientsListPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { AdminTemplatesPage } from './pages/AdminTemplatesPage';
import { AdminTemplateDetailPage } from './pages/AdminTemplateDetailPage';
import { AdminExercisesPage } from './pages/AdminExercisesPage';
import { AdminPerformanceProgramsPage } from './pages/AdminPerformanceProgramsPage';
import { AdminPerformanceProgramDetailPage } from './pages/AdminPerformanceProgramDetailPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/patients"
        element={
          <RequireAuth>
            <PatientsListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/patients/:patientId"
        element={
          <RequireAuth>
            <PatientDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/organization"
        element={
          <RequireAuth>
            <OrganizationPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminTemplatesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/templates/:templateId"
        element={
          <RequireAuth>
            <AdminTemplateDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/exercises"
        element={
          <RequireAuth>
            <AdminExercisesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/performance-programs"
        element={
          <RequireAuth>
            <AdminPerformanceProgramsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/performance-programs/:templateId"
        element={
          <RequireAuth>
            <AdminPerformanceProgramDetailPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  );
}
