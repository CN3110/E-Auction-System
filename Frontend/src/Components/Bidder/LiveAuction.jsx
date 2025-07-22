import React, { useState }  from 'react';
import Card from '../Common/Card';
import Alert from '../Common/Alert';

const LiveAuction = () => {
  const [bidAmount, setBidAmount] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const placeBid = () => {
    // Handle bid placement
  };

  return (
    <div className="live-auction">
      <h2>Live Auction</h2>
      
      <div className="timer">25:29</div>
      
      <div className="grid">
        <Card title="Place Your Bid">
          <div className="user-info">
            <p>Your Current Rank: <span> 1</span></p>
            <p>Your Latest Bid: <span> LKR 630</span></p>
          </div>
          <div className="bid-input">
            <input 
              type="number" 
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter bid amount" 
              min="0" 
              step="0.01" 
            />
            <button className="btn btn-primary" onClick={placeBid}>Place Bid</button>
          </div>
          {alert.show && <Alert message={alert.message} type={alert.type} />}
        </Card>
        
        <Card title="Auction Details">
          <p><strong>Title:</strong>  RSS3 Auction</p>
          <p><strong>Date:</strong>  2025-03-17</p>
          <p><strong>Time:</strong>  10:00 AM</p>
          <p><strong>Duration:</strong>  30 minutes</p>
          <div>
            <strong>Special Notices:</strong>
            <p>  All bids must be submitted before the timer expires.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LiveAuction;