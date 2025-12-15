import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Toggle, Badge } from '../components/ui';
import { usePosts } from '../context/PostContext';
import { usePlatforms } from '../context/PlatformContext';
import { getPlatformById } from '../data/platforms';
import './SelectPlatforms.css';

export function SelectPlatforms() {
  const navigate = useNavigate();
  const { currentPost, setSelectedPlatforms } = usePosts();
  const { accounts } = usePlatforms();

  const activeAccounts = accounts.filter((a) => a.isActive);

  const handleTogglePlatform = (platformId: string) => {
    const isSelected = currentPost.selectedPlatforms.includes(platformId);
    if (isSelected) {
      setSelectedPlatforms(currentPost.selectedPlatforms.filter((id) => id !== platformId));
    } else {
      setSelectedPlatforms([...currentPost.selectedPlatforms, platformId]);
    }
  };

  const handleSelectAll = () => {
    if (currentPost.selectedPlatforms.length === activeAccounts.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(activeAccounts.map((a) => a.platformId));
    }
  };

  const handleContinue = () => {
    navigate('/publish/confirm');
  };

  const getCaptionWarning = (platformId: string) => {
    const platform = getPlatformById(platformId);
    if (!platform) return null;
    
    if (currentPost.caption.length > platform.maxChars) {
      return `Caption exceeds ${platform.maxChars} character limit`;
    }
    return null;
  };

  const allSelected = currentPost.selectedPlatforms.length === activeAccounts.length;
  const hasSelection = currentPost.selectedPlatforms.length > 0;

  return (
    <div className="select-platforms">
      <div className="select-platforms-header">
        <Button 
          variant="ghost" 
          leftIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/create')}
        >
          Back to Editor
        </Button>
        <div className="select-platforms-count">
          <Badge variant={hasSelection ? 'primary' : 'default'}>
            {currentPost.selectedPlatforms.length} of {activeAccounts.length} selected
          </Badge>
        </div>
      </div>

      <Card className="select-platforms-card">
        <CardHeader
          action={
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          }
        >
          <CardTitle>Choose Publishing Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAccounts.length > 0 ? (
            <div className="platforms-list">
              {activeAccounts.map((account) => {
                const platform = getPlatformById(account.platformId);
                if (!platform) return null;

                const isSelected = currentPost.selectedPlatforms.includes(account.platformId);
                const warning = getCaptionWarning(account.platformId);

                return (
                  <div
                    key={account.id}
                    className={`platform-item ${isSelected ? 'platform-item-selected' : ''}`}
                  >
                    <div className="platform-item-main">
                      <div
                        className="platform-item-icon"
                        style={{ background: platform.color }}
                      >
                        <platform.icon size={24} />
                      </div>
                      
                      <div className="platform-item-info">
                        <div className="platform-item-header">
                          <span className="platform-item-name">{platform.name}</span>
                          <Badge variant="default" size="sm">
                            {platform.maxChars} chars
                          </Badge>
                        </div>
                        <span className="platform-item-username">{account.username}</span>
                        
                        {warning && (
                          <div className="platform-item-warning">
                            <AlertCircle size={14} />
                            <span>{warning}</span>
                          </div>
                        )}
                      </div>

                      <div className="platform-item-toggle">
                        <Toggle
                          checked={isSelected}
                          onChange={() => handleTogglePlatform(account.platformId)}
                          size="md"
                        />
                      </div>
                    </div>

                    {isSelected && (
                      <div className="platform-item-features">
                        <div className="platform-feature">
                          <Check size={14} />
                          <span>Image upload</span>
                        </div>
                        {platform.supportsVideo && (
                          <div className="platform-feature">
                            <Check size={14} />
                            <span>Video upload</span>
                          </div>
                        )}
                        {platform.supportsMultipleImages && (
                          <div className="platform-feature">
                            <Check size={14} />
                            <span>Multiple images</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="platforms-empty">
              <p>No active accounts available</p>
              <Button variant="secondary" onClick={() => navigate('/accounts')}>
                Connect Accounts
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="select-platforms-actions">
        <Button variant="secondary" onClick={() => navigate('/create')}>
          Back
        </Button>
        <Button
          variant="primary"
          rightIcon={<ArrowRight size={18} />}
          onClick={handleContinue}
          disabled={!hasSelection}
        >
          Continue to Publish
        </Button>
      </div>
    </div>
  );
}
