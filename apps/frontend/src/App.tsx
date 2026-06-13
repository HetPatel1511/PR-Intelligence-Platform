import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { RepositoryLayout } from './components/layout/RepositoryLayout';
import LoginPage from './features/auth/LoginPage';
import RepositorySelectionPage from './features/repositories/RepositorySelectionPage';
import DashboardPage from './features/dashboard/DashboardPage';
import PullRequestListPage from './features/pull-requests/PullRequestListPage';
import PullRequestDetailsPage from './features/pull-requests/PullRequestDetailsPage';
import EngineerDetailsPage from './features/engineers/EngineerDetailsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/repositories" replace />} />
          <Route path="/repositories" element={<RepositorySelectionPage />} />

          <Route path="/repositories/:repositoryId" element={<RepositoryLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="pull-requests" element={<PullRequestListPage />} />
            <Route path="pull-requests/:pullRequestId" element={<PullRequestDetailsPage />} />
            <Route path="engineers/:engineerId" element={<EngineerDetailsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/repositories" replace />} />
    </Routes>
  );
}
