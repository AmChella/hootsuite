import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, setToken } from '../services/api';
import { Spinner } from '../components/ui';
import './AuthCallback.css';

export function AuthCallback() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error first
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(errorParam);
        return;
      }

      // Check for token (from backend SSO callback - backend already exchanged the code)
      const token = searchParams.get('token');
      if (token) {
        try {
          // Save the token and navigate to dashboard
          await setToken(token);
          window.location.href = '/dashboard';
          return;
        } catch (err) {
          console.error('Token save error:', err);
          setError('Failed to save authentication token');
          return;
        }
      }

      // Fallback: Handle code exchange (for direct OAuth callbacks)
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        setError('Authentication failed - no token or code received');
        return;
      }

      if (!provider) {
        setError('Provider not specified');
        return;
      }

      try {
        // Exchange the code for a token through the backend
        const user = await authApi.handleSSOCallback(provider, code, state || undefined);
        
        if (user) {
          window.location.href = '/dashboard';
        } else {
          setError('Failed to authenticate');
        }
      } catch (err) {
        console.error('SSO callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [provider, searchParams, navigate]);

  if (error) {
    return (
      <div className="auth-callback-container">
        <div className="auth-callback-card error">
          <div className="auth-callback-icon error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2>Authentication Failed</h2>
          <p>{error}</p>
          <button 
            className="auth-callback-btn"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        <Spinner size="lg" />
        <h2>Completing Sign In</h2>
        <p>Please wait while we authenticate you with {provider}...</p>
      </div>
    </div>
  );
}
