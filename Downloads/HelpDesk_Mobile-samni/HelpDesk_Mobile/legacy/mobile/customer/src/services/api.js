// Configurable API URL
// React Native Android emulator: http://10.0.2.2:5000
// iOS simulator / local browser: http://localhost:5000

const API_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api';

export const customerApi = {
  createServiceRequest: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/service-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error || `Failed to create request (${res.status})`
      );
    }

    return res.json();
  },

  getServiceRequestById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/service-requests/${id}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error || `Failed to fetch request status (${res.status})`
      );
    }

    return res.json();
  },

  getUserNotifications: async (userId = 1) => {
    const res = await fetch(`${API_BASE_URL}/notifications/${userId}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error || `Failed to fetch notifications (${res.status})`
      );
    }

    return res.json();
  },

  markNotificationAsRead: async (id) => {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error || `Failed to mark notification as read (${res.status})`
      );
    }

    return res.json();
  },

  rateServiceRequest: async (id, payload) => {
    const res = await fetch(`${API_BASE_URL}/service-requests/${id}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error || `Failed to submit rating (${res.status})`
      );
    }

    return res.json();
  },
};