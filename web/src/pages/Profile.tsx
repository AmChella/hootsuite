import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  ArrowLeft,
  Shield,
  Bell as BellIcon,
  Palette,
  LogOut,
} from 'lucide-react';
import { useAuth, useTheme } from '../context';
import { Avatar } from '../components/ui';
import toast from 'react-hot-toast';
import './Profile.css';

type TabType = 'profile' | 'notifications' | 'appearance';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification settings (local state - in real app, would persist to backend)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [publishAlerts, setPublishAlerts] = useState(true);
  const [failureAlerts, setFailureAlerts] = useState(true);
  
  // Appearance settings - using context for real theme switching
  const { theme, setTheme } = useTheme();

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would call an API to update the user
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'notifications' as TabType, label: 'Notifications', icon: BellIcon },
    { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Settings</h1>
      </div>

      <div className="profile-content">
        {/* Sidebar Tabs */}
        <div className="profile-sidebar">
          <nav className="profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="profile-sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                <p>Update your personal information and profile picture</p>
              </div>

              <div className="profile-avatar-section">
                <div className="profile-avatar-container">
                  <Avatar name={user?.name || 'User'} size="xl" />
                  <button className="avatar-edit-btn">
                    <Camera size={16} />
                  </button>
                </div>
                <div className="avatar-info">
                  <h3>{user?.name}</h3>
                  <p>{user?.email}</p>
                </div>
              </div>

              <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={16} />
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Shield size={16} />
                    Account Security
                  </label>
                  <div className="security-info">
                    <p>Your account is secured with OAuth authentication</p>
                    <span className="security-badge">
                      <Shield size={14} />
                      Secured
                    </span>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={isSaving}>
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notification Preferences</h2>
                <p>Manage how and when you receive notifications</p>
              </div>

              <div className="settings-group">
                <h3>Email Notifications</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Email Notifications</span>
                    <span className="setting-description">Receive notifications via email</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Push Notifications</span>
                    <span className="setting-description">Receive push notifications in browser</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-group">
                <h3>Alert Types</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Publish Success Alerts</span>
                    <span className="setting-description">Get notified when posts are published</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={publishAlerts}
                      onChange={(e) => setPublishAlerts(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Failure Alerts</span>
                    <span className="setting-description">Get notified when posts fail to publish</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={failureAlerts}
                      onChange={(e) => setFailureAlerts(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Appearance</h2>
                <p>Customize how the app looks</p>
              </div>

              <div className="settings-group">
                <h3>Theme</h3>
                
                <div className="theme-options">
                  <button
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    <div className="theme-preview dark">
                      <div className="preview-header"></div>
                      <div className="preview-content">
                        <div className="preview-line"></div>
                        <div className="preview-line short"></div>
                      </div>
                    </div>
                    <span>Dark</span>
                  </button>

                  <button
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    <div className="theme-preview light">
                      <div className="preview-header"></div>
                      <div className="preview-content">
                        <div className="preview-line"></div>
                        <div className="preview-line short"></div>
                      </div>
                    </div>
                    <span>Light</span>
                  </button>

                  <button
                    className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => setTheme('system')}
                  >
                    <div className="theme-preview system">
                      <div className="preview-half dark">
                        <div className="preview-header"></div>
                      </div>
                      <div className="preview-half light">
                        <div className="preview-header"></div>
                      </div>
                    </div>
                    <span>System</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
