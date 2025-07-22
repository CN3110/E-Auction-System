import React, { useState }  from 'react';
import NavTabs from '../Common/NavTabs';
import LiveAuction from './LiveAuction';
import AuctionHistory from './AuctionHistory';
import '../../styles/bidder.css'
import Footer from '../Common/Footer';

const BidderDashboard = () => {
  const [activeTab, setActiveTab] = useState('liveAuction');

  const tabs = [
    { id: 'liveAuction', label: 'Live Auction' },
    { id: 'auctionHistory', label: 'Auction History' }
  ];

  return (
    <>
    <div className="bidder-dashboard">
      

      <NavTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <br></br>
      <div className="user-info">
        
        <h3>Welcome, Thilakarathne Rubbers</h3>
        <p>User ID: B007</p>
       
      </div>
      <div className="tab-content">
        {activeTab === 'liveAuction' && <LiveAuction />}
        {activeTab === 'auctionHistory' && <AuctionHistory />}
      </div>
      
    </div>
      <Footer />
    </>
  );
};

export default BidderDashboard;