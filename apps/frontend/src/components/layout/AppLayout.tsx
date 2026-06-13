import { Link, Outlet } from 'react-router-dom';

import { useLogout, useMe } from '../../hooks/useAuth';
import { displayName } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

/** App shell: top bar with brand + user menu, and a centered content area. */
export function AppLayout() {
  const { data: user } = useMe();
  const logout = useLogout();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/repositories" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              PR
            </span>
            <span className="text-sm font-semibold text-slate-900">PR Intelligence</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar src={user.avatarUrl} alt={displayName(user)} size={28} />
                <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                  {displayName(user)}
                </span>
              </div>
              <Button variant="ghost" onClick={() => logout.mutate()} loading={logout.isPending}>
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
