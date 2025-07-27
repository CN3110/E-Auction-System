import React, { useState, useEffect } from 'react';
import Card from '../Common/Card';
import Alert from '../Common/Alert';
import { getLiveAuctions, placeBid, getBidderRank, getMinBidAmount } from '../../services/bidService';

const LiveAuction = () => {
  const [bidAmount, setBidAmount] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [auction, setAuction] = useState(null);
  const [bidderInfo, setBidderInfo] = useState({
    rank: null,
    latestBid: null,
    minBidAmount: 0
  });
  const [timeLeft, setTimeLeft] = useState('00:00');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchAuctionData();
    const interval = setInterval(fetchAuctionData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const updateTimer = React.useCallback(() => {
    if (!auction || auction.status !== 'live') return;

    const now = new Date();
    const auctionStart = new Date(`${auction.auction_date}T${auction.start_time}`);
    const auctionEnd = new Date(auctionStart.getTime() + auction.duration_minutes * 60000);
    
    const timeRemaining = auctionEnd - now;
    
    if (timeRemaining <= 0) {
      setTimeLeft('00:00');
      setAuction(prev => ({ ...prev, status: 'ended' }));
    } else {
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  }, [auction]);

  useEffect(() => {
    if (auction && auction.status === 'live') {
      const timer = setInterval(() => {
        updateTimer();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [auction, updateTimer]);

  const fetchAuctionData = async () => {
    try {
      // Get current auction first
      const auctionData = await getLiveAuctions();
      setAuction(auctionData);
      
      if (auctionData && auctionData.id) {
        // Get bidder rank and minimum bid for this auction
        const [rankData, minBid] = await Promise.all([
          getBidderRank(auctionData.id),
          getMinBidAmount(auctionData.id)
        ]);
        
        setBidderInfo({
          rank: rankData.rank,
          latestBid: rankData.latestBid,
          minBidAmount: minBid
        });
        
        // Set a reasonable default bid amount
        if (!bidAmount) {
          setBidAmount((minBid || 1).toString());
        }
      } else {
        // No auction available
        setBidderInfo({
          rank: null,
          latestBid: null,
          minBidAmount: 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching auction data:', error);
      showAlert('Error fetching auction data', 'danger');
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    const bidValue = parseFloat(bidAmount);
    
    if (!bidValue || bidValue <= 0) {
      showAlert('Please enter a valid bid amount', 'danger');
      return;
    }

    if (bidValue < bidderInfo.minBidAmount && bidderInfo.minBidAmount > 0) {
      showAlert(`Bid amount must be less than LKR ${bidderInfo.minBidAmount.toLocaleString()}`, 'danger');
      return;
    }

    if (auction?.status !== 'live') {
      showAlert('Auction is not currently live', 'danger');
      return;
    }

    setLoading(true);
    try {
      await placeBid(auction.id, bidValue);
      showAlert('Bid placed successfully!', 'success');
      
      // Refresh data after successful bid
      setTimeout(fetchAuctionData, 1000);
      
    } catch (error) {
      showAlert(error.message || 'Failed to place bid', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
  };

  const formatDateTime = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (initialLoading) {
    return (
      <div className="live-auction">
        <div className="text-center p-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading auction data...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="live-auction">
        <div className="text-center p-4">
          <div className="alert alert-info">
            <h4>No Active Auctions</h4>
            <p>There are currently no auctions available for you to participate in.</p>
            <p>Please check back later or contact the administrator if you believe this is an error.</p>
          </div>
        </div>
      </div>
    );
  }

  if (auction.status === 'scheduled') {
    return (
      <div className="live-auction">
        <h2>Upcoming Auction</h2>
        <div className="alert alert-info">
          <h4>Auction Not Started Yet</h4>
          <p>The auction is scheduled to start at {formatDateTime(auction.auction_date, auction.start_time)}</p>
        </div>
        
        <Card title="Auction Details">
          <p><strong>Title:</strong> {auction.title}</p>
          <p><strong>Auction ID:</strong> {auction.auction_id}</p>
          <p><strong>Start Date:</strong> {formatDateTime(auction.auction_date, auction.start_time)}</p>
          <p><strong>Duration:</strong> {auction.duration_minutes} minutes</p>
          {auction.special_notices && (
            <div>
              <strong>Special Notices:</strong>
              <div className="alert alert-info mt-2 small">
                {auction.special_notices}
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (auction.status === 'ended') {
    return (
      <div className="live-auction">
        <h2>Auction Ended</h2>
        <div className="alert alert-warning">
          <h4>This auction has ended</h4>
          <p>Check your auction history for results.</p>
        </div>
        
        <Card title="Auction Results">
          <p><strong>Title:</strong> {auction.title}</p>
          <p><strong>Auction ID:</strong> {auction.auction_id}</p>
          <p><strong>Duration:</strong> {auction.duration_minutes} minutes</p>
          <p><strong>Your Final Rank:</strong> {bidderInfo.rank || 'N/A'}</p>
          <p><strong>Your Latest Bid:</strong> {bidderInfo.latestBid ? `LKR ${bidderInfo.latestBid.toLocaleString()}` : 'No bids placed'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="live-auction">
      <h2>Live Auction</h2>
      
      <div className="timer-container text-center mb-4">
        <div className="timer display-4 text-primary fw-bold">{timeLeft}</div>
        <small className="text-muted">Time Remaining</small>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <Card title="Place Your Bid">
            <div className="user-info mb-3">
              <p className="mb-2">
                <strong>Your Current Rank:</strong> 
                <span className={`badge ms-2 ${bidderInfo.rank === 1 ? 'bg-success' : bidderInfo.rank <= 3 ? 'bg-warning' : 'bg-secondary'}`}>
                  {bidderInfo.rank ? `#${bidderInfo.rank}` : 'No rank yet'}
                </span>
              </p>
              <p className="mb-2">
                <strong>Your Latest Bid:</strong> 
                <span className="fw-bold text-success ms-2">
                  {bidderInfo.latestBid ? `LKR ${bidderInfo.latestBid.toLocaleString()}` : 'No bids yet'}
                </span>
              </p>
              {bidderInfo.minBidAmount > 0 && (
                <p className="mb-3">
                  <strong>To Lead:</strong> 
                  <span className="fw-bold text-primary ms-2">
                    Bid below LKR {bidderInfo.minBidAmount.toLocaleString()}
                  </span>
                </p>
              )}
            </div>
            
            <div className="bid-input">
              <div className="input-group mb-3">
                <span className="input-group-text">LKR</span>
                <input 
                  type="number" 
                  className="form-control"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount" 
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              <button 
                className="btn btn-primary w-100" 
                onClick={handlePlaceBid}
                disabled={loading || !bidAmount}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Placing Bid...
                  </>
                ) : (
                  'Place Bid'
                )}
              </button>
            </div>
            
            {alert.show && (
              <Alert 
                message={alert.message} 
                type={alert.type}
                onClose={() => setAlert({ show: false, message: '', type: '' })}
              />
            )}
          </Card>
        </div>
        
        <div className="col-md-6">
          <Card title="Auction Details">
            <p><strong>Title:</strong> {auction.title}</p>
            <p><strong>Auction ID:</strong> {auction.auction_id}</p>
            <p><strong>Start Time:</strong> {formatDateTime(auction.auction_date, auction.start_time)}</p>
            <p><strong>Duration:</strong> {auction.duration_minutes} minutes</p>
            <p><strong>Status:</strong> 
              <span className="badge bg-success ms-2">LIVE</span>
            </p>
            
            {auction.special_notices && (
              <div className="mt-3">
                <strong>Special Notices:</strong>
                <div className="alert alert-info mt-2 small">
                  {auction.special_notices}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveAuction;