import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { accountsApi } from '../services/api';
import { Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import './AuthCallback.css'; // Reuse the same styles

export function AccountCallback() {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        setError('Authorization code not found');
        return;
      }

      if (!state) {
        setError('State parameter not found');
        return;
      }

      if (!platform) {
        setError('Platform not specified');
        return;
      }

      try {
        // Exchange the code for account connection through the backend
        const account = await accountsApi.handleConnectCallback(platform, code, state);
        
        if (account) {
          toast.success(`${account.platformName} account connected successfully!`);
          navigate('/accounts');
        } else {
          setError('Failed to connect account');
        }
      } catch (err) {
        console.error('Account connection error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect account');
      }
    };

    handleCallback();
  }, [platform, searchParams, navigate]);

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
          <h2>Connection Failed</h2>
          <p>{error}</p>
          <button 
            className="auth-callback-btn"
            onClick={() => navigate('/accounts')}
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        <Spinner size="lg" />
        <h2>Connecting Account</h2>
        <p>Please wait while we connect your {platform} account...</p>
      </div>
    </div>
  );
}
