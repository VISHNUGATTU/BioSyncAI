import api from './axios';

/**
 * BioSync AI Food Delivery & Biophysical Nutrition API Client
 */
export const foodDeliveryApi = {
  // Certified Kitchens & Restaurants
  getRestaurants: async (params = {}) => {
    const res = await api.get('/food-delivery/restaurants', { params });
    return res.data;
  },

  getRestaurantById: async (restaurantId) => {
    const res = await api.get(`/food-delivery/restaurants/${restaurantId}`);
    return res.data;
  },

  // Restaurant Menu with Biophysical Annotations
  getRestaurantMenu: async (restaurantId, mode = 'VITALS_GUARD') => {
    const res = await api.get(`/food-delivery/restaurants/${restaurantId}/menu`, {
      params: { mode },
    });
    return res.data;
  },

  // In-Silico 4-Hour Postprandial Cart Simulation
  simulateCart: async (items, overrideMode = 'VITALS_GUARD') => {
    const res = await api.post('/food-delivery/simulate-cart', {
      items,
      overrideMode,
    });
    return res.data;
  },

  // Food Order Placement
  createOrder: async (orderPayload) => {
    const res = await api.post('/food-delivery/orders', orderPayload);
    return res.data;
  },

  // Patient Order History
  getMyOrders: async () => {
    const res = await api.get('/food-delivery/orders');
    return res.data;
  },

  // Multi-Generational Family Group Plating Allocation
  allocateFamilyMeal: async (payload) => {
    const res = await api.post('/food-delivery/family-group/allocate-meal', payload);
    return res.data;
  },

  getFamilyGroup: async () => {
    const res = await api.get('/food-delivery/family-group');
    return res.data;
  },

  // Wearable Telemetry & Active Cheat Mode Ambulation
  getActiveAmbulation: async () => {
    const res = await api.get('/wearables/active-ambulation');
    return res.data;
  },

  streamAmbulationSteps: async (steps) => {
    const res = await api.post('/wearables/stream-ambulation', { steps });
    return res.data;
  },

  syncWearableBatch: async (batchData) => {
    const res = await api.post('/wearables/sync', batchData);
    return res.data;
  },
};

export default foodDeliveryApi;

