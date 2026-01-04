/**
 * Navbar Component
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            🎬 VideoStream
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="hover:text-blue-200 transition">
                Dashboard
              </Link>
              <Link to="/videos" className="hover:text-blue-200 transition">
                My Videos
              </Link>
              {(user.role === 'editor' || user.role === 'admin') && (
                <Link to="/upload" className="hover:text-blue-200 transition">
                  Upload
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:text-blue-200 transition">
                  Admin
                </Link>
              )}
              
              {/* User Menu */}
              <div className="flex items-center gap-4">
                <span className="text-sm">
                  {user.firstName} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
