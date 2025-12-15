import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Bell, 
  Search,
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import './Header.css';

const mobileNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/create', icon: PlusCircle, label: 'Create' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/accounts', icon: Settings, label: 'Accounts' },
];

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Get current page title from pathname
  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('create')) return 'Create Post';
    if (path.includes('publish')) return 'Publish';
    if (path.includes('status')) return 'Publishing Status';
    if (path.includes('history')) return 'Post History';
    if (path.includes('accounts')) return 'Manage Accounts';
    return 'Social Publisher';
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button
            className="header-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="header-title">{getPageTitle()}</h1>
        </div>

        <div className="header-right">
          <button className="header-icon-btn" aria-label="Search">
            <Search size={20} />
          </button>
          <button className="header-icon-btn header-notification-btn" aria-label="Notifications">
            <Bell size={20} />
            <span className="header-notification-badge">3</span>
          </button>
          <div className="header-user">
            <Avatar name={user?.name || 'User'} size="sm" />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="mobile-menu-logo">
                <div className="mobile-menu-logo-icon">
                  <Zap size={20} />
                </div>
                <span>Social Publisher</span>
              </div>
              <button
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="mobile-menu-nav">
              {mobileNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `mobile-menu-item ${isActive ? 'mobile-menu-item-active' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <div className="mobile-menu-footer">
              {user && (
                <div className="mobile-menu-user">
                  <Avatar name={user.name} size="md" />
                  <div className="mobile-menu-user-info">
                    <span className="mobile-menu-user-name">{user.name}</span>
                    <span className="mobile-menu-user-email">{user.email}</span>
                  </div>
                </div>
              )}
              <button className="mobile-menu-logout" onClick={logout}>
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
