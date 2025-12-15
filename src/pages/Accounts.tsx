import { useState } from 'react';
import {
  Trash2,
  RefreshCw,
  CheckCircle,
  Unlink,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Toggle,
  Modal,
  ModalFooter,
} from '../components/ui';
import { usePlatforms } from '../context/PlatformContext';
import { platforms, getPlatformById } from '../data/platforms';
import './Accounts.css';

export function Accounts() {
  const { accounts, isLoading, connectAccount, disconnectAccount, toggleAccountStatus } = usePlatforms();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectModal, setDisconnectModal] = useState<{ isOpen: boolean; accountId: string; platformName: string }>({
    isOpen: false,
    accountId: '',
    platformName: '',
  });
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connectedPlatformIds = accounts.map((a) => a.platformId);
  const availablePlatforms = platforms.filter((p) => !connectedPlatformIds.includes(p.id));

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    try {
      await connectAccount(platformId);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectAccount(disconnectModal.accountId);
      setDisconnectModal({ isOpen: false, accountId: '', platformName: '' });
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleToggleStatus = async (accountId: string) => {
    try {
      await toggleAccountStatus(accountId);
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  return (
    <div className="accounts-page">
      {/* Connected Accounts */}
      <Card className="accounts-section">
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="accounts-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 80 }} />
              ))}
            </div>
          ) : accounts.length > 0 ? (
            <div className="accounts-list">
              {accounts.map((account) => {
                const platform = getPlatformById(account.platformId);
                if (!platform) return null;

                return (
                  <div key={account.id} className="account-card">
                    <div className="account-card-main">
                      <div
                        className="account-card-icon"
                        style={{ background: platform.color }}
                      >
                        <platform.icon size={28} />
                      </div>

                      <div className="account-card-info">
                        <div className="account-card-header">
                          <span className="account-card-platform">{platform.name}</span>
                          <Badge variant={account.isActive ? 'success' : 'default'} size="sm">
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <span className="account-card-username">{account.username}</span>
                        <span className="account-card-display">{account.displayName}</span>
                      </div>

                      <div className="account-card-actions">
                        <Toggle
                          checked={account.isActive}
                          onChange={() => handleToggleStatus(account.id)}
                          size="sm"
                          label={account.isActive ? 'Enabled' : 'Disabled'}
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDisconnectModal({
                              isOpen: true,
                              accountId: account.id,
                              platformName: platform.name,
                            })
                          }
                        >
                          <Unlink size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="account-card-footer">
                      <span className="account-card-connected">
                        <CheckCircle size={14} />
                        Connected {new Date(account.connectedAt).toLocaleDateString()}
                      </span>
                      <Button variant="ghost" size="sm" rightIcon={<ExternalLink size={14} />}>
                        Manage on {platform.name}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="accounts-empty">
              <div className="accounts-empty-icon">🔗</div>
              <h3>No accounts connected</h3>
              <p>Connect your social media accounts to start publishing</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Account */}
      {availablePlatforms.length > 0 && (
        <Card className="accounts-section">
          <CardHeader>
            <CardTitle>Add New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="accounts-add-description">
              Connect additional social media accounts to publish content across more platforms.
            </p>

            <div className="platforms-grid">
              {availablePlatforms.map((platform) => (
                <button
                  key={platform.id}
                  className="platform-connect-card"
                  onClick={() => handleConnect(platform.id)}
                  disabled={connectingPlatform !== null}
                >
                  <div
                    className="platform-connect-icon"
                    style={{ background: platform.color }}
                  >
                    {connectingPlatform === platform.id ? (
                      <RefreshCw size={24} className="spin" />
                    ) : (
                      <platform.icon size={24} />
                    )}
                  </div>
                  <span className="platform-connect-name">{platform.name}</span>
                  <span className="platform-connect-action">
                    {connectingPlatform === platform.id ? 'Connecting...' : 'Connect'}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="accounts-section accounts-info">
        <CardHeader>
          <CardTitle>How OAuth Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="oauth-steps">
            <div className="oauth-step">
              <div className="oauth-step-number">1</div>
              <div className="oauth-step-content">
                <h4>Click Connect</h4>
                <p>Select the platform you want to connect</p>
              </div>
            </div>
            <div className="oauth-step">
              <div className="oauth-step-number">2</div>
              <div className="oauth-step-content">
                <h4>Authorize Access</h4>
                <p>Sign in and grant permissions to publish on your behalf</p>
              </div>
            </div>
            <div className="oauth-step">
              <div className="oauth-step-number">3</div>
              <div className="oauth-step-content">
                <h4>Start Publishing</h4>
                <p>Your account is ready to use for publishing content</p>
              </div>
            </div>
          </div>

          <div className="oauth-security">
            <span className="oauth-security-icon">🔒</span>
            <p>
              Your login credentials are never stored. We use industry-standard OAuth
              authentication to securely connect to your accounts.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Modal */}
      <Modal
        isOpen={disconnectModal.isOpen}
        onClose={() => setDisconnectModal({ isOpen: false, accountId: '', platformName: '' })}
        title="Disconnect Account"
        size="sm"
      >
        <div className="disconnect-modal-content">
          <div className="disconnect-modal-icon">
            <Unlink size={48} />
          </div>
          <p>
            Are you sure you want to disconnect your <strong>{disconnectModal.platformName}</strong> account?
          </p>
          <p className="disconnect-modal-warning">
            You will no longer be able to publish to this platform until you reconnect.
          </p>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDisconnectModal({ isOpen: false, accountId: '', platformName: '' })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            leftIcon={<Trash2 size={16} />}
            onClick={handleDisconnect}
            isLoading={isDisconnecting}
          >
            Disconnect
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
