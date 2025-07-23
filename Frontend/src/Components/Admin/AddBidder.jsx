import React, { useState, useEffect } from 'react';
import Card from '../Common/Card';
import '../../styles/addBidder.css';
import { addBidder, fetchBidders, removeBidder } from '../../services/bidderService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddBidder = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const [bidders, setBidders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bidders on component mount
  useEffect(() => {
    const loadBidders = async () => {
      try {
        const data = await fetchBidders();
        setBidders(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load bidders');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBidders();
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const newBidder = await addBidder({
      name: formData.name,
      email: formData.email,
      company: formData.company,
      phone: formData.phone
    });

    // Update state with the new bidder from response
    setBidders(prev => [...prev, newBidder.bidder]);
    setFormData({ name: '', email: '', phone: '', company: '' });
    
    toast.success('Bidder added successfully!');
  } catch (error) {
    toast.error(error.message);
  }
};

  const handleRemoveBidder = async (bidderId) => {
    if (window.confirm('Are you sure you want to remove this bidder?')) {
      try {
        setIsLoading(true);
        await removeBidder(bidderId);
        setBidders(prev => prev.filter(bidder => bidder.user_id !== bidderId));
        toast.success('Bidder removed successfully');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to remove bidder');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading && bidders.length === 0) {
    return <div className="loading">Loading bidders...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Bidder Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div> 
          
          <div className="form-group">
            <label>Company *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group flex justify-center">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Bidder'}
            </button>
          </div>
        </form>

        <div className="bidder-list">
          <h4>Registered Bidders</h4>
          {bidders.length === 0 ? (
            <p>No bidders registered yet</p>
          ) : (
            <div className="bidder-cards">
              {bidders.map((bidder) => (
                <div key={bidder.user_id} className="bidder-card"> 
                  <div className="bidder-info">
                    <h5>{bidder.name} <span className="bidder-id">({bidder.user_id})</span></h5>
                    <p className="bidder-company">{bidder.company}</p>
                    <p className="bidder-contact">
                      <span>{bidder.email}</span>
                      {bidder.phone && <span> | {bidder.phone}</span>}
                    </p>
                    <p className="bidder-status">
  Status: <span className={bidder.is_active ? 'active' : 'inactive'}>
    {bidder.is_active ? 'Active' : 'Inactive'}
  </span>
</p>
                  </div>
                  <button 
                    className="remove-btn" 
                    onClick={() => handleRemoveBidder(bidder.user_id)}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default AddBidder;
