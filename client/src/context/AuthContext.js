import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { View, ActivityIndicator } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [splashLoading, setSplashLoading] = useState(true);

  // ✅ 1. NEW: Global Settings State
  const [appSettings, setAppSettings] = useState({
    notifications: true,
    metricSystem: true, // true = kg/cm, false = lbs/in
  });

  const isLoggedIn = async () => {
    try {
      const userToken = await SecureStore.getItemAsync('userToken');
      const userInfo = await SecureStore.getItemAsync('userInfo');
      
      // ✅ 2. NEW: Load saved settings when app boots
      const savedSettings = await SecureStore.getItemAsync('appSettings');
      if (savedSettings) {
        setAppSettings(JSON.parse(savedSettings));
      }

      if (userToken && userInfo) {
        try {
          const parsedUser = JSON.parse(userInfo);
          setUser(parsedUser);
          api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        } catch (err) {
          console.log("Corrupted user data, logging out...");
          await logout();
        }
      }
    } catch (e) {
      console.log(`Vault check failed: ${e}`);
    } finally {
      setSplashLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

 // 🔑 LOGIN
  const login = async (email, password) => {
    try {
      setIsLoading(true);

      // ✅ FIXED: Plural 'users' and added '/auth'
      const res = await api.post('/user/login', { email, password }); 
      const userInfo = res.data;

      await SecureStore.setItemAsync('userToken', userInfo.token);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));

      api.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;

      setUser(userInfo);
    } catch (error) {
      console.log("Login Error Details:", error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 📝 REGISTER
  const register = async (data) => {
    try {
      setIsLoading(true);

      // ✅ FIXED: Plural 'users' and added '/auth'
      const res = await api.post('/user/register', data);
      const userInfo = res.data;

      await SecureStore.setItemAsync('userToken', userInfo.token);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo));

      api.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;

      setUser(userInfo);
    } catch (error) {
      console.log("Registration Error Details:", error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
    // 🚪 LOGOUT
  const logout = async () => {
    try {
      setIsLoading(true);

      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userInfo');

      delete api.defaults.headers.common['Authorization']; // ✅ FIXED

      setUser(null);
    } catch (e) {
      console.log(`Logout error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

 const updateUser = async (newUserData) => {
    try {
      setUser(newUserData);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(newUserData));
    } catch (error) {
      console.log("Error updating local user state:", error);
    }
  };

  // ✅ 3. NEW: Function to instantly save settings to phone storage
  const saveSettings = async (newSettings) => {
    try {
      setAppSettings(newSettings);
      await SecureStore.setItemAsync('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.log("Error saving settings:", error);
    }
  };

  if (splashLoading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    // ✅ 4. NEW: Export appSettings and saveSettings
    <AuthContext.Provider value={{ 
      login, register, logout, updateUser, isLoading, user, 
      appSettings, saveSettings 
    }}>
      {children}
    </AuthContext.Provider>
  );
};