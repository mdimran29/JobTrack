import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { ApplicationDetailPage } from '../pages/ApplicationDetailPage';
import { FollowUpsPage } from '../pages/FollowUpsPage';
import { JobMatchPage } from '../pages/JobMatchPage';
import { ResumesPage } from '../pages/ResumesPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { JobSearchPage } from '../pages/JobSearchPage';

export const AppRouter = () => (
  <Routes>
    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/follow-ups" element={<FollowUpsPage />} />
        <Route path="/job-match" element={<JobMatchPage />} />
          <Route path="/resumes" element={<ResumesPage />} />
          <Route path="/job-search" element={<JobSearchPage />} />
      </Route>
    </Route>

    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
