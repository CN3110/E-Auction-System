import React, { useState, useEffect } from 'react';
import Card from '../Common/Card';
import Alert from '../Common/Alert';
import { getCurrentAuction, placeBid, getBidderRank, getMinBidAmount } from '../../services/bidService';

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
      const [auctionData, rankData, minBid] = await Promise.all([
        getCurrentAuction(),
        getBidderRank(),
        getMinBidAmount()
      ]);
      
      setAuction(auctionData);
      setBidderInfo({
        rank: rankData.rank,
        latestBid: rankData.latestBid,
        minBidAmount: minBid
      });
      
      // Set minimum bid amount as default
      setBidAmount(minBid.toString());
    } catch (error) {
      showAlert('Error fetching auction data', 'danger');
    }
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) < bidderInfo.minBidAmount) {
      showAlert(`Minimum bid amount is LKR ${bidderInfo.minBidAmount.toLocaleString()}`, 'danger');
      return;
    }

    if (auction?.status !== 'live') {
      showAlert('Auction is not currently live', 'danger');
      return;
    }

    setLoading(true);
    try {
      const result = await placeBid(auction.auction_id, parseFloat(bidAmount));
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

  if (!auction) {
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
          <p><strong>Start Date:</strong> {formatDateTime(auction.auction_date, auction.start_time)}</p>
          <p><strong>Duration:</strong> {auction.duration_minutes} minutes</p>
          {auction.special_notices && (
            <div>
              <strong>Special Notices:</strong>
              <p>{auction.special_notices}</p>
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
        
        <Card title="Auction Details">
          <p><strong>Title:</strong> {auction.title}</p>
          <p><strong>Duration:</strong> {auction.duration_minutes} minutes</p>
          <p><strong>Your Final Rank:</strong> {bidderInfo.rank || 'N/A'}</p>
          <p><strong>Your Lastest Bid:</strong> {bidderInfo.latestBid ? `LKR ${bidderInfo.latestBid.toLocaleString()}` : 'No bids placed'}</p>
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
                  {bidderInfo.rank ? `#${bidderInfo.rank}` : 'No rank'}
                </span>
              </p>
              <p className="mb-2">
                <strong>Your Latest Bid:</strong> 
                <span className="fw-bold text-success ms-2">
                  {bidderInfo.latestBid ? `LKR ${bidderInfo.latestBid.toLocaleString()}` : 'No bids yet'}
                </span>
              </p>
              <p className="mb-3">
                <strong>Minimum Bid:</strong> 
                <span className="fw-bold text-primary ms-2">
                  LKR {bidderInfo.minBidAmount.toLocaleString()}
                </span>
              </p>
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
                  min={bidderInfo.minBidAmount}
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