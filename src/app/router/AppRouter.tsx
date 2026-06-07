import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from '../../features/auth/ProtectedRoute';
import { LoginPage } from '../../features/auth/LoginPage';
import { CalendarPage } from '../../features/calendar/CalendarPage';
import { ProjectDetailPage } from '../../features/projects/ProjectDetailPage';
import { ProjectsPage } from '../../features/projects/ProjectsPage';
import { AppShell } from '../../features/shell/AppShell';
import { SettingsPage } from '../../features/settings/SettingsPage';
import { StatsPage } from '../../features/stats/StatsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/app/projects" replace />} />
      <Route path="*" element={<Navigate to="/app/projects" replace />} />
    </Routes>
  );
}
