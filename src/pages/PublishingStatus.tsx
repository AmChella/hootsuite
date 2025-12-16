import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Card, CardContent, Button, Badge, Modal, ModalFooter } from '../components/ui';
import { usePosts } from '../context/PostContext';
import { getPlatformById } from '../data/platforms';
import type { PublishResult } from '../services/api';
import './PublishingStatus.css';

export function PublishingStatus() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { getPublishResults, subscribeToUpdates, retryPublish } = usePosts();
  
  const [results, setResults] = useState<PublishResult[]>([]);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; error: string; platformId: string }>({
    isOpen: false,
    error: '',
    platformId: '',
  });
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUpdates(postId);

    // Initial fetch
    const initialResults = getPublishResults(postId);
    setResults(initialResults);

    return () => {
      unsubscribe();
    };
  }, [postId, subscribeToUpdates, getPublishResults]);

  // Update results when they change
  useEffect(() => {
    if (!postId) return;
    
    const interval = setInterval(() => {
      const currentResults = getPublishResults(postId);
      setResults(currentResults);
    }, 500);

    return () => clearInterval(interval);
  }, [postId, getPublishResults]);

  const handleRetry = async (platformId: string) => {
    if (!postId) return;
    setRetrying(platformId);
    
    try {
      await retryPublish(postId, platformId);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetrying(null);
    }
  };

  const showError = (platformId: string, error: string) => {
    setErrorModal({ isOpen: true, error, platformId });
  };

  const getStatusIcon = (status: PublishResult['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircle size={24} className="status-icon-success" />;
      case 'failed':
        return <XCircle size={24} className="status-icon-error" />;
      case 'in_progress':
        return <RefreshCw size={24} className="status-icon-progress animate-spin" />;
      default:
        return <Clock size={24} className="status-icon-pending" />;
    }
  };

  const getStatusBadge = (status: PublishResult['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'in_progress':
        return <Badge variant="info" pulse>In Progress</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const publishedCount = results.filter((r) => r.status === 'published').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const inProgressCount = results.filter((r) => r.status === 'in_progress' || r.status === 'pending').length;
  const allComplete = results.length > 0 && results.every((r) => r.status === 'published' || r.status === 'failed');

  return (
    <div className="publishing-status">
      <div className="publishing-status-header">
        <div className="publishing-status-title">
          <div className="publishing-status-icon">
            <Zap size={24} />
          </div>
          <div>
            <h1>Publishing Status</h1>
            <p>Track the progress of your post across platforms</p>
          </div>
        </div>
        
        <div className="publishing-status-summary">
          {publishedCount > 0 && (
            <Badge variant="success" size="md">
              <CheckCircle size={14} /> {publishedCount} Published
            </Badge>
          )}
          {inProgressCount > 0 && (
            <Badge variant="info" size="md" pulse>
              <RefreshCw size={14} /> {inProgressCount} In Progress
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="error" size="md">
              <XCircle size={14} /> {failedCount} Failed
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className="publishing-results">
        {results.map((result) => {
          const platform = getPlatformById(result.platformId);
          if (!platform) return null;

          return (
            <Card
              key={result.platformId}
              className={`publishing-result-card publishing-result-${result.status}`}
            >
              <CardContent className="publishing-result-content">
                <div className="publishing-result-main">
                  <div
                    className="publishing-result-platform-icon"
                    style={{ background: platform.color }}
                  >
                    <platform.icon size={28} />
                  </div>
                  
                  <div className="publishing-result-info">
                    <div className="publishing-result-header">
                      <span className="publishing-result-platform-name">{platform.name}</span>
                      {getStatusBadge(result.status)}
                    </div>

                    {result.status === 'in_progress' && (
                      <div className="publishing-result-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${result.progress || 0}%` }}
                          />
                        </div>
                        <span className="progress-text">{result.progress || 0}%</span>
                      </div>
                    )}

                    {result.status === 'published' && result.publishedAt && (
                      <span className="publishing-result-time">
                        Published at {new Date(result.publishedAt).toLocaleTimeString()}
                      </span>
                    )}

                    {result.status === 'failed' && result.error && (
                      <div className="publishing-result-error">
                        <AlertCircle size={14} />
                        <span>{result.error.slice(0, 50)}...</span>
                      </div>
                    )}
                  </div>

                  <div className="publishing-result-status-icon">
                    {getStatusIcon(result.status)}
                  </div>
                </div>

                {/* Actions */}
                <div className="publishing-result-actions">
                  {result.status === 'published' && result.postUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ExternalLink size={14} />}
                      onClick={() => window.open(result.postUrl, '_blank')}
                    >
                      View Post
                    </Button>
                  )}
                  
                  {result.status === 'failed' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showError(result.platformId, result.error || 'Unknown error')}
                      >
                        View Error
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RefreshCw size={14} />}
                        onClick={() => handleRetry(result.platformId)}
                        isLoading={retrying === result.platformId}
                      >
                        Retry
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Complete Actions */}
      {allComplete && (
        <div className="publishing-complete-actions animate-fade-in">
          <Button variant="secondary" onClick={() => navigate('/history')}>
            View Post History
          </Button>
          <Button variant="primary" onClick={() => navigate('/create')}>
            Create Another Post
          </Button>
        </div>
      )}

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, error: '', platformId: '' })}
        title="Publishing Error"
        size="sm"
      >
        <div className="error-modal-content">
          <div className="error-modal-icon">
            <XCircle size={48} />
          </div>
          <p className="error-modal-message">{errorModal.error}</p>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setErrorModal({ isOpen: false, error: '', platformId: '' })}
          >
            Close
          </Button>
          <Button
            variant="primary"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => {
              handleRetry(errorModal.platformId);
              setErrorModal({ isOpen: false, error: '', platformId: '' });
            }}
          >
            Retry
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
