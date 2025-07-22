import React, { useState } from 'react';
import Card from '../Common/Card';
import '../../styles/addBidder.css';


const AddBidder = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const [bidders, setBidders] = useState([
    {
      id: "B001",
      name: "VYS International",
      email: "vysinternational@gmail.com",
    },
    {
      id: "B002",
      name: "Techtron integrated Solutions Pvt Ltd",
      email: "gihan@techtron.lk",
      },
    {
      id: "B003",
      name: "Daylight Data Solutions Pvt Ltd",
      email: "daylightdata@gmail.com",
      },
    {
      id: "B004",
      name: "Kamsons Trading Company PVT Ltd",
      email: "kamsonhardware@gmail.com",
      
    },
    {
      id: "B005",
      name: "Colonial Engineering (Pvt) Ltd",
      email: "coloneng@sltnet.lk",
      
    },
    {
      id: "B006",
      name: "Monara Engineering & Trading (Pvt) Ltd",
      email: "sales_monara@sltnet.lk",
      
    },
    {
      id: "B007",
      name: "Thilakarathne Rubbers",
      email: "sales@methg.com",
      
    },
    {
      id: "B008",
      name: "Nikini Automation Systems (Pvt) Ltd",
      email: "nishadhi@nikiniautomation.com",
      
    },
    {
      id: "B009",
      name: "Everbolt Engineering (Pvt) Ltd",
      email: "sales6@everbolt.lk",
      
    }

  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newBidder = {
      ...formData,
      id: `B00${bidders.length + 1}`,
      status: 'Active',
      registrationDate: new Date().toISOString().split('T')[0]
    };
    setBidders([...bidders, newBidder]);
    setFormData({ name: '', email: '', phone: '', company: '' });
  };

  const handleRemoveBidder = (bidderId) => {
    if (window.confirm('Are you sure you want to remove this bidder?')) {
      setBidders(prev => prev.filter(bidder => bidder.id !== bidderId));
      alert('Bidder removed successfully');
    }
  };

  return (
     <>
    <Card>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Bidder Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div> 
        
        <div className="form-group">
          <label>Company</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
          />
        </div>
       <div className="form-group flex justify-center">
  <button type="submit" className="btn btn-primary">Add Bidder</button>
</div>

      </form>

      <div className="bidder-list">
        <h4>Registered Bidders</h4>
        <div className="bidder-cards">
          {bidders.map((bidder) => (
            <div key={bidder.id} className="bidder-card">
              <div className="bidder-info">
                <h5>{bidder.name} <span className="bidder-id">({bidder.id})</span></h5>
                <p className="bidder-company">{bidder.company}</p>
                <p className="bidder-contact">
                  <span>{bidder.email}</span>
                </p>
              </div>
              <button className="remove-btn" onClick={() => handleRemoveBidder(bidder.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
    
    </>
  );
};

export default AddBidder;
