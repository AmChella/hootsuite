import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import { postsApi, publishApi } from '../services/mockApi';
import type { Post, PublishResult } from '../services/mockApi';

interface PostState {
  posts: Post[];
  currentPost: {
    caption: string;
    mediaFiles: File[];
    selectedPlatforms: string[];
    scheduledFor?: Date;
  };
  publishResults: Map<string, PublishResult[]>;
  isLoading: boolean;
  isPublishing: boolean;
  error: string | null;
}

type PostAction =
  | { type: 'FETCH_POSTS_START' }
  | { type: 'FETCH_POSTS_SUCCESS'; payload: Post[] }
  | { type: 'FETCH_POSTS_ERROR'; payload: string }
  | { type: 'SET_CAPTION'; payload: string }
  | { type: 'SET_MEDIA_FILES'; payload: File[] }
  | { type: 'SET_SELECTED_PLATFORMS'; payload: string[] }
  | { type: 'SET_SCHEDULED_FOR'; payload: Date | undefined }
  | { type: 'RESET_CURRENT_POST' }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'PUBLISH_START' }
  | { type: 'PUBLISH_UPDATE'; payload: { postId: string; results: PublishResult[] } }
  | { type: 'PUBLISH_END' };

const initialState: PostState = {
  posts: [],
  currentPost: {
    caption: '',
    mediaFiles: [],
    selectedPlatforms: [],
    scheduledFor: undefined,
  },
  publishResults: new Map(),
  isLoading: false,
  isPublishing: false,
  error: null,
};

function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case 'FETCH_POSTS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_POSTS_SUCCESS':
      return { ...state, posts: action.payload, isLoading: false };
    case 'FETCH_POSTS_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CAPTION':
      return { ...state, currentPost: { ...state.currentPost, caption: action.payload } };
    case 'SET_MEDIA_FILES':
      return { ...state, currentPost: { ...state.currentPost, mediaFiles: action.payload } };
    case 'SET_SELECTED_PLATFORMS':
      return { ...state, currentPost: { ...state.currentPost, selectedPlatforms: action.payload } };
    case 'SET_SCHEDULED_FOR':
      return { ...state, currentPost: { ...state.currentPost, scheduledFor: action.payload } };
    case 'RESET_CURRENT_POST':
      return { ...state, currentPost: initialState.currentPost };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };
    case 'PUBLISH_START':
      return { ...state, isPublishing: true };
    case 'PUBLISH_UPDATE': {
      const newResults = new Map(state.publishResults);
      newResults.set(action.payload.postId, action.payload.results);
      return { ...state, publishResults: newResults };
    }
    case 'PUBLISH_END':
      return { ...state, isPublishing: false };
    default:
      return state;
  }
}

interface PostContextType extends PostState {
  fetchPosts: () => Promise<void>;
  setCaption: (caption: string) => void;
  setMediaFiles: (files: File[]) => void;
  setSelectedPlatforms: (platforms: string[]) => void;
  setScheduledFor: (date: Date | undefined) => void;
  resetCurrentPost: () => void;
  createAndPublishPost: () => Promise<string>;
  getPublishResults: (postId: string) => PublishResult[];
  retryPublish: (postId: string, platformId: string) => Promise<void>;
  subscribeToUpdates: (postId: string) => () => void;
}

const PostContext = createContext<PostContextType | null>(null);

export function PostProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(postReducer, initialState);

  const fetchPosts = useCallback(async () => {
    dispatch({ type: 'FETCH_POSTS_START' });
    try {
      const posts = await postsApi.getPosts();
      dispatch({ type: 'FETCH_POSTS_SUCCESS', payload: posts });
    } catch (error) {
      dispatch({ type: 'FETCH_POSTS_ERROR', payload: 'Failed to fetch posts' });
    }
  }, []);

  const setCaption = (caption: string) => dispatch({ type: 'SET_CAPTION', payload: caption });
  const setMediaFiles = (files: File[]) => dispatch({ type: 'SET_MEDIA_FILES', payload: files });
  const setSelectedPlatforms = (platforms: string[]) => 
    dispatch({ type: 'SET_SELECTED_PLATFORMS', payload: platforms });
  const setScheduledFor = (date: Date | undefined) => 
    dispatch({ type: 'SET_SCHEDULED_FOR', payload: date });
  const resetCurrentPost = () => dispatch({ type: 'RESET_CURRENT_POST' });

  const createAndPublishPost = async (): Promise<string> => {
    dispatch({ type: 'PUBLISH_START' });
    
    try {
      // Create the post
      const post = await postsApi.createPost({
        caption: state.currentPost.caption,
        mediaFiles: state.currentPost.mediaFiles.map((f) => f.name),
        mediaTypes: state.currentPost.mediaFiles.map((f) => f.type),
        platforms: state.currentPost.selectedPlatforms,
        scheduledFor: state.currentPost.scheduledFor,
      });

      dispatch({ type: 'ADD_POST', payload: post });

      // If not scheduled, publish immediately
      if (!state.currentPost.scheduledFor) {
        publishApi.publishPost(post.id, state.currentPost.selectedPlatforms);
      }

      dispatch({ type: 'RESET_CURRENT_POST' });
      
      return post.id;
    } finally {
      dispatch({ type: 'PUBLISH_END' });
    }
  };

  const getPublishResults = (postId: string): PublishResult[] => {
    return state.publishResults.get(postId) || [];
  };

  const retryPublish = async (postId: string, platformId: string) => {
    try {
      await publishApi.retryPublish(postId, platformId);
    } catch (error) {
      throw new Error('Failed to retry publishing');
    }
  };

  const subscribeToUpdates = (postId: string) => {
    return publishApi.subscribeToPublishUpdates(postId, (results) => {
      dispatch({ type: 'PUBLISH_UPDATE', payload: { postId, results } });
    });
  };

  return (
    <PostContext.Provider
      value={{
        ...state,
        fetchPosts,
        setCaption,
        setMediaFiles,
        setSelectedPlatforms,
        setScheduledFor,
        resetCurrentPost,
        createAndPublishPost,
        getPublishResults,
        retryPublish,
        subscribeToUpdates,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
}
