import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { accountsApi } from '../services/api';
import type { ConnectedAccount } from '../services/api';
import { useAuth } from './AuthContext';

interface PlatformState {
  accounts: ConnectedAccount[];
  isLoading: boolean;
  error: string | null;
}

type PlatformAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ConnectedAccount[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: ConnectedAccount }
  | { type: 'REMOVE_ACCOUNT'; payload: string }
  | { type: 'UPDATE_ACCOUNT'; payload: ConnectedAccount };

const initialState: PlatformState = {
  accounts: [],
  isLoading: true,
  error: null,
};

function platformReducer(state: PlatformState, action: PlatformAction): PlatformState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, accounts: action.payload, isLoading: false };
    case 'FETCH_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'REMOVE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.payload) };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    default:
      return state;
  }
}

interface PlatformContextType extends PlatformState {
  connectAccount: (platformId: string) => Promise<void>;
  disconnectAccount: (accountId: string) => Promise<void>;
  toggleAccountStatus: (accountId: string) => Promise<void>;
  getActiveAccounts: () => ConnectedAccount[];
  getAccountByPlatform: (platformId: string) => ConnectedAccount | undefined;
  refetch: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextType | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(platformReducer, initialState);
  const { isAuthenticated } = useAuth();

  const fetchAccounts = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const accounts = await accountsApi.getConnectedAccounts();
      dispatch({ type: 'FETCH_SUCCESS', payload: accounts });
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Failed to fetch accounts' });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
    }
  }, [isAuthenticated]);

  const connectAccount = async (platformId: string) => {
    try {
      const account = await accountsApi.connectAccount(platformId);
      dispatch({ type: 'ADD_ACCOUNT', payload: account });
    } catch (error) {
      throw new Error(`Failed to connect ${platformId} account`);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    try {
      await accountsApi.disconnectAccount(accountId);
      dispatch({ type: 'REMOVE_ACCOUNT', payload: accountId });
    } catch (error) {
      throw new Error('Failed to disconnect account');
    }
  };

  const toggleAccountStatus = async (accountId: string) => {
    try {
      const updated = await accountsApi.toggleAccountStatus(accountId);
      dispatch({ type: 'UPDATE_ACCOUNT', payload: updated });
    } catch (error) {
      throw new Error('Failed to update account status');
    }
  };

  const getActiveAccounts = () => state.accounts.filter((a) => a.isActive);

  const getAccountByPlatform = (platformId: string) => 
    state.accounts.find((a) => a.platformId === platformId);

  return (
    <PlatformContext.Provider
      value={{
        ...state,
        connectAccount,
        disconnectAccount,
        toggleAccountStatus,
        getActiveAccounts,
        getAccountByPlatform,
        refetch: fetchAccounts,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatforms() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatforms must be used within a PlatformProvider');
  }
  return context;
}
