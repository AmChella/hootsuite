import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  User,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { statsApi } from '../../services/api';
import './Header.css';

const mobileNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/create', icon: PlusCircle, label: 'Create' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/accounts', icon: Settings, label: 'Accounts' },
];

interface Activity {
  id: string;
  type: 'publish_success' | 'publish_failed' | 'account_connected' | 'account_disconnected';
  platformId?: string;
  message: string;
  timestamp: Date;
}

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen && notifications.length === 0) {
      loadNotifications();
    }
  }, [isNotificationsOpen]);

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const activities = await statsApi.getRecentActivity();
      setNotifications(activities);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to history with search query
      navigate(`/history?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'publish_success':
        return <CheckCircle size={16} className="notification-icon success" />;
      case 'publish_failed':
        return <XCircle size={16} className="notification-icon error" />;
      case 'account_connected':
      case 'account_disconnected':
        return <LinkIcon size={16} className="notification-icon" />;
      default:
        return <Bell size={16} className="notification-icon" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
          {/* Search Dropdown */}
          <div className="header-dropdown-container" ref={searchRef}>
            <button 
              className={`header-icon-btn ${isSearchOpen ? 'active' : ''}`}
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsNotificationsOpen(false);
                setIsProfileOpen(false);
              }}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            {isSearchOpen && (
              <div className="header-dropdown search-dropdown">
                <form onSubmit={handleSearch}>
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-input-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="search-input"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="search-hints">
                    <span>Press Enter to search your posts</span>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="header-dropdown-container" ref={notificationsRef}>
            <button 
              className={`header-icon-btn header-notification-btn ${isNotificationsOpen ? 'active' : ''}`}
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsSearchOpen(false);
                setIsProfileOpen(false);
              }}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="header-notification-badge">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="header-dropdown notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <span className="dropdown-subtitle">Recent activity</span>
                </div>
                <div className="notifications-list">
                  {isLoadingNotifications ? (
                    <div className="notifications-loading">
                      <span>Loading...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notifications-empty">
                      <Bell size={24} />
                      <span>No notifications yet</span>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="notification-item">
                        {getActivityIcon(notification.type)}
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="dropdown-footer">
                    <button 
                      className="view-all-btn"
                      onClick={() => {
                        navigate('/history');
                        setIsNotificationsOpen(false);
                      }}
                    >
                      View all activity
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="header-dropdown-container" ref={profileRef}>
            <button 
              className={`header-user ${isProfileOpen ? 'active' : ''}`}
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsSearchOpen(false);
                setIsNotificationsOpen(false);
              }}
            >
              <Avatar name={user?.name || 'User'} size="sm" />
            </button>
            {isProfileOpen && (
              <div className="header-dropdown profile-dropdown">
                <div className="profile-header">
                  <Avatar name={user?.name || 'User'} size="lg" />
                  <div className="profile-info">
                    <span className="profile-name">{user?.name}</span>
                    <span className="profile-email">{user?.email}</span>
                  </div>
                </div>
                <div className="profile-menu">
                  <button 
                    className="profile-menu-item"
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileOpen(false);
                    }}
                  >
                    <User size={18} />
                    <span>My Profile</span>
                  </button>
                  <button 
                    className="profile-menu-item"
                    onClick={() => {
                      navigate('/settings');
                      setIsProfileOpen(false);
                    }}
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                  <div className="profile-menu-divider" />
                  <button 
                    className="profile-menu-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
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
