import React, { useState, useEffect } from 'react';

const AuctionHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Simulated auction history data
    const sampleHistory = [
      {
        auctionId: 'AUC1003',
        title: 'RSS3 Auction',
        bidAmount: 630,
        result: 'Won',
        date: '2025-02-04',
        time: '14:30',
      },
      {
        auctionId: 'AUC1002',
        title: 'RSS3 Auction',
        bidAmount: 650,
        result: 'Lost',
        date: '2024-12-23',
        time: '11:45',
      },
      {
        auctionId: 'AUC1001',
        title: 'RSS3 Auction',
        bidAmount: 655,
        result: 'Won',
        date: '2024-11-01',
        time: '09:15',
      },
    ];

    setHistory(sampleHistory);
  }, []);

  return (
    <div className="auction-history">
      <h4 className="mb-3">Your Auction History</h4>
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Auction ID</th>
              <th>Title</th>
              <th>Bid Amount</th>
              <th>Result</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((item) => (
                <tr key={item.auctionId}>
                  <td>{item.auctionId}</td>
                  <td>{item.title}</td>
                  <td>LKR {item.bidAmount.toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.result === 'Won' ? 'bg-success' : 'bg-danger'
                      }`}
                    >
                      {item.result}
                    </span>
                  </td>
                  <td>{item.date}</td>
                  <td>{item.time}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No past auctions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuctionHistory;
