import React, { useState, useEffect } from 'react';
import Card from '../Common/Card';

const LiveRankings = () => {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    // Simulate incoming auction data
    const sampleData = [
      {
        bidderId: 'B007',
        amount: 630,
        timestamp: new Date().setSeconds(new Date().getSeconds() - 10),
      },
      {
        bidderId: 'B001',
        amount: 620,
        timestamp: new Date().setSeconds(new Date().getSeconds() - 30),
      },
      {
        bidderId: 'B002',
        amount: 600,
        timestamp: new Date().setSeconds(new Date().getSeconds() - 60),
      },
    ];

    // Sort by highest bid first (descending)
    sampleData.sort((a, b) => b.amount - a.amount);

    setRankings(sampleData);
  }, []);

  return (
    <Card>
      <div className="timer">25:29</div>
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Bidder ID</th>
            <th>Latest Bid</th>
            <th>Bid Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rankings.length > 0 ? (
            rankings.map((ranking, index) => (
              <tr key={ranking.bidderId}>
                <td>{index + 1}</td>
                <td>{ranking.bidderId}</td>
                <td>LKR {ranking.amount.toLocaleString()}</td>
                <td>{new Date(ranking.timestamp).toLocaleTimeString()}</td>
                <td>
                  <span className="badge bg-success">Active</span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                No active auction
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
};

export default LiveRankings;
