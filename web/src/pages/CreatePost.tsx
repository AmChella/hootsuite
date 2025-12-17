import { useNavigate } from 'react-router-dom';
import { Film, Sparkles, Hash } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Textarea,
  FileUpload,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../components/ui';
import { usePosts } from '../context/PostContext';
import { usePlatforms } from '../context/PlatformContext';
import { getPlatformById } from '../data/platforms';
import './CreatePost.css';

export function CreatePost() {
  const navigate = useNavigate();
  const { currentPost, setCaption, setMediaFiles } = usePosts();
  const { accounts } = usePlatforms();
  
  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
  };

  const handleFilesChange = (files: File[]) => {
    setMediaFiles(files);
  };

  const handleContinue = () => {
    navigate('/publish/select-platforms');
  };

  const getMinCharLimit = () => {
    const connectedPlatformIds = accounts.map((a) => a.platformId);
    const limits = connectedPlatformIds
      .map((id) => getPlatformById(id)?.maxChars || 0)
      .filter((l) => l > 0);
    return limits.length > 0 ? Math.min(...limits) : 280;
  };

  const minCharLimit = getMinCharLimit();
  const captionLength = currentPost.caption.length;
  const isOverLimit = captionLength > minCharLimit;

  const suggestedHashtags = [
    '#marketing', '#socialmedia', '#business', '#growth', 
    '#branding', '#digital', '#startup', '#entrepreneur'
  ];

  const addHashtag = (tag: string) => {
    if (!currentPost.caption.includes(tag)) {
      setCaption(currentPost.caption + (currentPost.caption ? ' ' : '') + tag);
    }
  };

  const renderPlatformPreview = (platformId: string) => {
    const platform = getPlatformById(platformId);
    if (!platform) return null;

    const account = accounts.find((a) => a.platformId === platformId);
    const hasMedia = currentPost.mediaFiles.length > 0;
    const firstMedia = hasMedia ? URL.createObjectURL(currentPost.mediaFiles[0]) : null;
    const isVideo = hasMedia && currentPost.mediaFiles[0].type.startsWith('video/');

    return (
      <div className={`preview-card preview-${platformId}`}>
        <div className="preview-header">
          <div className="preview-avatar" style={{ background: platform.color }}>
            <platform.icon size={16} />
          </div>
          <div className="preview-user">
            <span className="preview-name">{account?.displayName || 'Your Account'}</span>
            <span className="preview-username">{account?.username || '@username'}</span>
          </div>
        </div>
        
        <div className="preview-content">
          <p className="preview-text">
            {currentPost.caption || 'Your caption will appear here...'}
          </p>
          
          {hasMedia && (
            <div className="preview-media">
              {isVideo ? (
                <div className="preview-video-placeholder">
                  <Film size={32} />
                  <span>Video Preview</span>
                </div>
              ) : (
                <img src={firstMedia!} alt="Preview" className="preview-image" />
              )}
            </div>
          )}
        </div>
        
        <div className="preview-footer">
          <span className="preview-platform-name">{platform.name}</span>
          <span className="preview-char-limit">
            {captionLength}/{platform.maxChars} chars
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="create-post">
      <div className="create-post-grid">
        {/* Left Column - Editor */}
        <div className="create-post-editor">
          <Card>
            <CardHeader>
              <CardTitle>Media Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                files={currentPost.mediaFiles}
                onFilesChange={handleFilesChange}
                maxFiles={10}
                maxSizeMB={50}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caption</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your post caption here... Add hashtags and mentions to increase engagement."
                value={currentPost.caption}
                onChange={handleCaptionChange}
                charCount={captionLength}
                maxChars={minCharLimit}
                error={isOverLimit ? `Caption exceeds ${minCharLimit} character limit for some platforms` : undefined}
              />
              
              {/* AI Suggestions */}
              <div className="caption-suggestions">
                <div className="caption-suggestions-header">
                  <Sparkles size={16} />
                  <span>Suggested Hashtags</span>
                </div>
                <div className="caption-suggestions-list">
                  {suggestedHashtags.map((tag) => (
                    <button
                      key={tag}
                      className="caption-suggestion-tag"
                      onClick={() => addHashtag(tag)}
                      type="button"
                    >
                      <Hash size={12} />
                      {tag.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="create-post-actions">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={!currentPost.caption.trim()}
            >
              Continue to Select Platforms
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="create-post-preview">
          <Card className="create-post-preview-card">
            <CardHeader>
              <CardTitle>Platform Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="twitter">
                <TabsList>
                  {accounts.slice(0, 4).map((account) => {
                    const platform = getPlatformById(account.platformId);
                    return (
                      <TabsTrigger
                        key={account.platformId}
                        value={account.platformId}
                        icon={platform && <platform.icon size={16} />}
                      >
                        {platform?.name}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {accounts.map((account) => (
                  <TabsContent key={account.platformId} value={account.platformId}>
                    {renderPlatformPreview(account.platformId)}
                  </TabsContent>
                ))}
              </Tabs>

              {accounts.length === 0 && (
                <div className="create-post-no-accounts">
                  <p>No accounts connected</p>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/accounts')}>
                    Connect Accounts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="create-post-tips">
            <CardContent>
              <h4 className="tips-title">💡 Pro Tips</h4>
              <ul className="tips-list">
                <li>Keep your caption concise for better engagement</li>
                <li>Use 3-5 relevant hashtags</li>
                <li>Include a call-to-action</li>
                <li>Best times to post: 9-11 AM, 1-3 PM</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
