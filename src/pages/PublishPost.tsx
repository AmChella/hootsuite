import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, Clock, Image, FileText, Share2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
} from '../components/ui';
import { usePosts } from '../context/PostContext';
import { usePlatforms } from '../context/PlatformContext';
import { getPlatformById } from '../data/platforms';
import './PublishPost.css';

export function PublishPost() {
  const navigate = useNavigate();
  const { currentPost, setScheduledFor, createAndPublishPost, isPublishing } = usePosts();
  const { accounts } = usePlatforms();
  
  const [publishType, setPublishType] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const selectedAccounts = accounts.filter((a) =>
    currentPost.selectedPlatforms.includes(a.platformId)
  );

  const handlePublish = async () => {
    try {
      if (publishType === 'schedule' && scheduleDate && scheduleTime) {
        setScheduledFor(new Date(`${scheduleDate}T${scheduleTime}`));
      }
      
      const postId = await createAndPublishPost();
      navigate(`/publish/status/${postId}`);
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  const mediaCount = currentPost.mediaFiles.length;
  const hasImages = currentPost.mediaFiles.some((f) => f.type.startsWith('image/'));
  const hasVideos = currentPost.mediaFiles.some((f) => f.type.startsWith('video/'));

  return (
    <div className="publish-post">
      <div className="publish-post-header">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/publish/select-platforms')}
        >
          Back to Platform Selection
        </Button>
      </div>

      <div className="publish-post-grid">
        {/* Publish Options */}
        <Card className="publish-options">
          <CardHeader>
            <CardTitle>When to Publish</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="publish-type-options">
              <button
                className={`publish-type-option ${publishType === 'now' ? 'publish-type-option-active' : ''}`}
                onClick={() => setPublishType('now')}
              >
                <div className="publish-type-icon">
                  <Send size={24} />
                </div>
                <div className="publish-type-content">
                  <span className="publish-type-title">Publish Now</span>
                  <span className="publish-type-desc">Immediately share to all platforms</span>
                </div>
              </button>

              <button
                className={`publish-type-option ${publishType === 'schedule' ? 'publish-type-option-active' : ''}`}
                onClick={() => setPublishType('schedule')}
              >
                <div className="publish-type-icon">
                  <Calendar size={24} />
                </div>
                <div className="publish-type-content">
                  <span className="publish-type-title">Schedule for Later</span>
                  <span className="publish-type-desc">Choose a specific date and time</span>
                </div>
              </button>
            </div>

            {publishType === 'schedule' && (
              <div className="publish-schedule-inputs">
                <Input
                  type="date"
                  label="Date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  leftIcon={<Calendar size={18} />}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  type="time"
                  label="Time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  leftIcon={<Clock size={18} />}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="publish-summary">
          <CardHeader>
            <CardTitle>Publishing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="summary-section">
              <div className="summary-item">
                <div className="summary-item-icon">
                  <FileText size={20} />
                </div>
                <div className="summary-item-content">
                  <span className="summary-item-label">Caption</span>
                  <p className="summary-item-value summary-caption">
                    {currentPost.caption.slice(0, 150)}
                    {currentPost.caption.length > 150 && '...'}
                  </p>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-item-icon">
                  <Image size={20} />
                </div>
                <div className="summary-item-content">
                  <span className="summary-item-label">Media</span>
                  <span className="summary-item-value">
                    {mediaCount === 0 
                      ? 'No media attached'
                      : `${mediaCount} file${mediaCount > 1 ? 's' : ''} (${hasImages ? 'Images' : ''}${hasImages && hasVideos ? ', ' : ''}${hasVideos ? 'Video' : ''})`
                    }
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-item-icon">
                  <Share2 size={20} />
                </div>
                <div className="summary-item-content">
                  <span className="summary-item-label">Publishing to</span>
                  <div className="summary-platforms">
                    {selectedAccounts.map((account) => {
                      const platform = getPlatformById(account.platformId);
                      return (
                        <div
                          key={account.id}
                          className="summary-platform"
                          style={{ background: platform?.color }}
                        >
                          {platform && <platform.icon size={16} />}
                        </div>
                      );
                    })}
                    <span className="summary-platform-count">
                      {selectedAccounts.length} platform{selectedAccounts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={() => navigate('/publish/select-platforms')}>
              Edit Selection
            </Button>
            <Button
              variant="primary"
              size="lg"
              rightIcon={<Send size={18} />}
              onClick={handlePublish}
              isLoading={isPublishing}
              disabled={publishType === 'schedule' && (!scheduleDate || !scheduleTime)}
            >
              {publishType === 'now' ? 'Publish Now' : 'Schedule Post'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
