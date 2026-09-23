import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const response = await api.post('/admin/login', {
            email,
            password,
          });

          if (response.data.success) {
            set({
              admin: response.data.admin,
              isAuthenticated: true,
            });

            return {
              success: true,
            };
          }

          return {
            success: false,
            error: 'Login failed',
          };
        } catch (error) {
          return {
            success: false,
            error:
              error.response?.data?.message ||
              'Network error occurred',
          };
        }
      },

      logout: () => {
        set({
          admin: null,
          isAuthenticated: false,
        });
      },

      updateAdmin: (adminData) => {
        set({
          admin: adminData,
        });
      },
    }),
    {
      name: 'biosync-admin-auth',
    }
  )
);

export default useAuthStore;