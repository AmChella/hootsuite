import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  Image,
  Film,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
} from '../components/ui';
import { postsApi, publishApi } from '../services/mockApi';
import type { Post, PublishResult } from '../services/mockApi'; 
import { getPlatformById } from '../data/platforms';
import './PostHistory.css';

export function PostHistory() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postResults, setPostResults] = useState<PublishResult[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsApi.getPosts();
        setPosts(data);
        setFilteredPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    let result = [...posts];

    // Search filter
    if (searchQuery) {
      result = result.filter((post) =>
        post.caption.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((post) => post.status === statusFilter);
    }

    // Platform filter
    if (platformFilter !== 'all') {
      result = result.filter((post) => post.platforms.includes(platformFilter));
    }

    setFilteredPosts(result);
  }, [posts, searchQuery, statusFilter, platformFilter]);

  const handleViewPost = async (post: Post) => {
    setSelectedPost(post);
    try {
      const results = await publishApi.getPublishResults(post.id);
      setPostResults(results);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };



  const getStatusBadge = (status: Post['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'publishing':
        return <Badge variant="info">Publishing</Badge>;
      case 'scheduled':
        return <Badge variant="warning">Scheduled</Badge>;
      default:
        return <Badge variant="default">Draft</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="post-history">
      {/* Filters */}
      <div className="post-history-filters">
        <div className="post-history-search">
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        <div className="post-history-filter-group">
          <div className="filter-select">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="publishing">Publishing</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </select>
            <ChevronDown size={14} />
          </div>

          <div className="filter-select">
            <Calendar size={16} />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="all">All Platforms</option>
              <option value="twitter">Twitter</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="post-history-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="post-history-list">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="post-history-item" variant="interactive">
              <CardContent>
                <div className="post-item-main">
                  <div className="post-item-media">
                    {post.mediaFiles.length > 0 ? (
                      post.mediaTypes[0]?.startsWith('video') ? (
                        <Film size={24} />
                      ) : (
                        <Image size={24} />
                      )
                    ) : (
                      <div className="post-item-no-media">📝</div>
                    )}
                  </div>

                  <div className="post-item-content">
                    <p className="post-item-caption">
                      {post.caption.slice(0, 120)}
                      {post.caption.length > 120 && '...'}
                    </p>
                    <div className="post-item-meta">
                      <span className="post-item-date">
                        <Calendar size={14} />
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="post-item-platforms">
                        {post.platforms.map((platformId) => {
                          const platform = getPlatformById(platformId);
                          return platform ? (
                            <span
                              key={platformId}
                              className="post-item-platform-icon"
                              style={{ color: platform.color }}
                            >
                              <platform.icon size={14} />
                            </span>
                          ) : null;
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="post-item-status">
                    {getStatusBadge(post.status)}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye size={16} />}
                    onClick={() => handleViewPost(post)}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="post-history-empty">
          <div className="post-history-empty-icon">📭</div>
          <h3>No posts found</h3>
          <p>
            {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
              ? 'Try adjusting your filters'
              : "You haven't created any posts yet"}
          </p>
          {!searchQuery && statusFilter === 'all' && platformFilter === 'all' && (
            <Button variant="primary" onClick={() => navigate('/create')}>
              Create Your First Post
            </Button>
          )}
        </div>
      )}

      {/* Post Detail Modal */}
      <Modal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        title="Post Details"
        size="lg"
      >
        {selectedPost && (
          <div className="post-detail">
            <div className="post-detail-section">
              <h4>Caption</h4>
              <p className="post-detail-caption">{selectedPost.caption}</p>
            </div>

            <div className="post-detail-section">
              <h4>Media</h4>
              <p>
                {selectedPost.mediaFiles.length > 0
                  ? `${selectedPost.mediaFiles.length} file(s) attached`
                  : 'No media attached'}
              </p>
            </div>

            <div className="post-detail-section">
              <h4>Publishing Results</h4>
              <div className="post-detail-results">
                {postResults.length > 0 ? (
                  postResults.map((result) => {
                    const platform = getPlatformById(result.platformId);
                    return (
                      <div key={result.platformId} className="post-detail-result">
                        <div
                          className="post-detail-result-icon"
                          style={{ background: platform?.color }}
                        >
                          {platform && <platform.icon size={16} />}
                        </div>
                        <span className="post-detail-result-name">{platform?.name}</span>
                        {result.status === 'published' ? (
                          <Badge variant="success">Published</Badge>
                        ) : result.status === 'failed' ? (
                          <Badge variant="error">Failed</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>No publishing results available</p>
                )}
              </div>
            </div>

            <div className="post-detail-section">
              <h4>Created</h4>
              <p>{formatDate(selectedPost.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
