import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { injectStore } from '../services/api/interceptors';
import { fetchProfile } from '../features/auth/authThunks';

// Inject store into axios instance
injectStore(store);

export const Providers = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const rawToken = localStorage.getItem('token');
    const token = rawToken && rawToken !== 'undefined' && rawToken !== 'null' && rawToken !== '' ? rawToken : null;
    const state = store.getState();
    // Always trigger profile fetch on mount if token exists but user data is missing
    if (token && !state.auth.user && state.auth.status !== 'error') {
      store.dispatch(fetchProfile());
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
};
