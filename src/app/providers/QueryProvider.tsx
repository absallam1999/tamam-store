import { useState, type ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  type DefaultOptions,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },
  mutations: {
    retry: 1,
    retryDelay: 1000,
  },
};

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions,
      queryCache: new QueryCache(),
      mutationCache: new MutationCache(),
    });

    // Persist cache to localStorage so it survives page reloads
    const localStoragePersister = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'STORE_QUERY_CACHE',
    });

    persistQueryClient({
      queryClient: client,
      persister: localStoragePersister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
};