import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fantasy_auth_token') || null);
  const [loading, setLoading] = useState(true);
  const [sessionError,setSessionError]=useState('');

  // Check current user on boot
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data); setSessionError('');
      } catch (err) {
        console.error('Failed to restore session:', err);
        if (![401,403,404].includes(err.response?.status)) setSessionError(err.response?.data?.detail || (err.code === 'ERR_NETWORK' || !err.response ? 'Backend server is not reachable. Start it with "npm run dev".' : 'Could not restore your session. Reload when your connection is available.'));
        if ([401,403,404].includes(err.response?.status)) {
          localStorage.removeItem('fantasy_auth_token'); setToken(null); setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('fantasy_auth_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const signup = async (email, password, fullName = '', fantasyTeamName = '') => {
    const res = await api.post('/auth/signup', {
      email,
      password,
      full_name: fullName || null,
      fantasy_team_name: fantasyTeamName || null,
    });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('fantasy_auth_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const socialLogin = async (provider, email, name) => {
    const endpoint = provider === 'google' ? '/auth/google' : '/auth/facebook';
    const res = await api.post(endpoint, {
      provider,
      email: email || undefined,
      name: name || undefined,
    });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('fantasy_auth_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const completeOnboarding = async (fullName, fantasyTeamName, avatarUrl = null) => {
    const res = await api.post('/auth/onboarding', {
      full_name: fullName,
      fantasy_team_name: fantasyTeamName,
      avatar_url: avatarUrl || undefined,
    });
    setUser(res.data.user);
    return res.data.user;
  };

  const updateAvatar = async (avatarUrl) => {
    const res = await api.post('/auth/avatar', { avatar_url: avatarUrl });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('fantasy_auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sessionError,
        login,
        signup,
        socialLogin,
        completeOnboarding,
        updateAvatar,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
