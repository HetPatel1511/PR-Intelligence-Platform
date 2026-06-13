import { Navigate, Outlet } from 'react-router-dom';

import { useMe } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';

/** Gate for authenticated routes. Redirects to /login when there is no session. */
export function ProtectedRoute() {
  const { data, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError || !data) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
