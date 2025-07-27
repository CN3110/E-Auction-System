const API_BASE_URL = 'http://localhost:5000/api';

// Get current auction (live or upcoming)
export const getCurrentAuction = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/bid/current-auction`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No auctions found
      }
      throw new Error('Failed to fetch current auction');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current auction:', error);
    throw error;
  }
};

// Place a bid
export const placeBid = async (auctionId, amount) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bid/place`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auctionId,
        amount,
        bidderId: 'temp-bidder-1' // For testing without auth
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to place bid');
    }
    
    return data;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};

// Get bidder rank for current auction
export const getBidderRank = async () => {
  try {
    // First get current auction
    const auction = await getCurrentAuction();
    if (!auction) {
      return { rank: null, latestBid: null };
    }

    const response = await fetch(`${API_BASE_URL}/bid/rank/${auction.auction_id}?bidderId=temp-bidder-1`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch bidder rank');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching bidder rank:', error);
    return { rank: null, latestBid: null };
  }
};

// Get minimum bid amount
export const getMinBidAmount = async () => {
  try {
    // First get current auction
    const auction = await getCurrentAuction();
    if (!auction) {
      return 1; // Default minimum
    }

    const response = await fetch(`${API_BASE_URL}/bid/min-amount/${auction.auction_id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch minimum bid amount');
    }
    
    const data = await response.json();
    return data.minBidAmount || 1;
  } catch (error) {
    console.error('Error fetching minimum bid amount:', error);
    return 1; // Default fallback
  }
};

// Get auction history
export const getAuctionHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/bid/history?bidderId=temp-bidder-1`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch auction history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching auction history:', error);
    return [];
  }
};

// Get all auctions for a specific bidder (only invited auctions)
export const getBidderAuctions = async (bidderId = 'temp-bidder-1') => {
  try {
    const response = await fetch(`${API_BASE_URL}/auction?bidderId=${bidderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch bidder auctions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching bidder auctions:', error);
    return [];
  }
};

// Get all auctions (admin function)
export const getAllAuctions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/all`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch auctions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return [];
  }
};

// Get upcoming auctions for bidder
export const getUpcomingAuctions = async (bidderId = 'temp-bidder-1') => {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/upcoming?bidderId=${bidderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch upcoming auctions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching upcoming auctions:', error);
    return [];
  }
};

// Get live auctions for bidder
export const getLiveAuctions = async (bidderId = 'temp-bidder-1') => {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/live?bidderId=${bidderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch live auctions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching live auctions:', error);
    return [];
  }
};