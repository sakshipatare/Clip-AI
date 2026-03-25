import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
              C
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              ClipAI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-medium transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                >
                  + New Video
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-medium transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Page content ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
