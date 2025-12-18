import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import './Login.css';

// Social login icons as simple components
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#1DA1F2">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  
  const { login, register, loginWithSSO, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/dashboard');
    } catch {
      // Error is handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSO = async (provider: string) => {
    setSsoLoading(provider);
    
    try {
      await loginWithSSO(provider);
      navigate('/dashboard');
    } catch {
      // Error is handled by context
    } finally {
      setSsoLoading(null);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-gradient" />
        <div className="login-bg-pattern" />
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
      </div>

      <div className="login-container">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <Zap size={28} />
            </div>
            <h1 className="login-logo-text">Social Publisher</h1>
          </div>

          <p className="login-subtitle">
            {isLogin 
              ? 'Welcome back! Sign in to continue.' 
              : 'Create an account to get started.'}
          </p>

          {/* SSO Buttons */}
          <div className="login-sso">
            <button 
              className="login-sso-btn"
              onClick={() => handleSSO('google')}
              disabled={ssoLoading !== null}
            >
              {ssoLoading === 'google' ? (
                <span className="login-sso-spinner" />
              ) : (
                <GoogleIcon />
              )}
              <span>Google</span>
            </button>
            <button 
              className="login-sso-btn"
              onClick={() => handleSSO('facebook')}
              disabled={ssoLoading !== null}
            >
              {ssoLoading === 'facebook' ? (
                <span className="login-sso-spinner" />
              ) : (
                <FacebookIcon />
              )}
              <span>Facebook</span>
            </button>
            <button 
              className="login-sso-btn"
              onClick={() => handleSSO('twitter')}
              disabled={ssoLoading !== null}
            >
              {ssoLoading === 'twitter' ? (
                <span className="login-sso-spinner" />
              ) : (
                <TwitterIcon />
              )}
              <span>Twitter</span>
            </button>
            <button 
              className="login-sso-btn"
              onClick={() => handleSSO('linkedin')}
              disabled={ssoLoading !== null}
            >
              {ssoLoading === 'linkedin' ? (
                <span className="login-sso-spinner" />
              ) : (
                <LinkedInIcon />
              )}
              <span>LinkedIn</span>
            </button>
          </div>

          <div className="login-divider">
            <span>or continue with email</span>
          </div>

          {/* Login/Register Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <Input
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              required
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            {error && <p className="login-error">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="login-toggle">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="login-toggle-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Feature highlights */}
        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">📱</div>
            <h3>Multi-Platform</h3>
            <p>Publish to all major social networks at once</p>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">📊</div>
            <h3>Track Status</h3>
            <p>Real-time publishing status and analytics</p>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">🚀</div>
            <h3>Save Time</h3>
            <p>Schedule posts and automate your workflow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
