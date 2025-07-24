import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getCurrentAuction = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/auction/live`);
    return response.data.auction;
  } catch (error) {
    console.error('Error fetching current auction:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch current auction');
  }
};

export const placeBid = async (auctionId, amount) => {
  try {
    const response = await apiClient.post(`${API_URL}/bid/`, {
      auctionId,
      amount
    });
    return response.data;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw new Error(error.response?.data?.error || 'Failed to place bid');
  }
};

export const getBidderRank = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/bid/rank`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bidder rank:', error);
    return { rank: null, latestBid: null };
  }
};

export const getMinBidAmount = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/bid/minimum`);
    return response.data.minBidAmount;
  } catch (error) {
    console.error('Error fetching minimum bid:', error);
    return 0;
  }
};

export const getBidderHistory = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/bid/history`);
    return response.data.history;
  } catch (error) {
    console.error('Error fetching bidder history:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch auction history');
  }
};

export const getCurrentBids = async (auctionId) => {
  try {
    const response = await apiClient.get(`${API_URL}/auction/${auctionId}/bids`);
    return response.data.bids;
  } catch (error) {
    console.error('Error fetching current bids:', error);
    return [];
  }
};

export const getLatestBid = async (auctionId, bidderId) => {
  try {
    const response = await axios.get(`${API_URL}/latest`, {
      params: { auctionId, bidderId }
    });
    return response.data.bid;
  } catch (error) {
    console.error('Error fetching latest bid:', error);
    return null;
  }
};