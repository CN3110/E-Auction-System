import React, { useState } from 'react';
import { TextField, Button, Checkbox, FormControlLabel, TextareaAutosize } from '@mui/material';
import '../../styles/createAuction.css';
import Card from '../Common/Card';

const CreateAuction = () => {
  const [formData, setFormData] = useState({
    auctionID: '',
    title: '',
    date: '',
    time: '',
    duration: 30,
    notices: '',
    bidders: []
  });

  const [searchTerm, setSearchTerm] = useState('');

  const biddersList = [
    { id: "B001", name: "VYS International" },
    { id: "B002", name: "Techtron Integrated Solutions Pvt Ltd" },
    { id: "B003", name: "Daylight Data Solutions Pvt Ltd" },
    { id: "B004", name: "Kamsons Trading Company PVT Ltd" },
    { id: "B005", name: "Colonial Engineering (Pvt) Ltd" },
    { id: "B006", name: "Monara Engineering & Trading (Pvt) Ltd" },
    { id: "B007", name: "Meth G (Private) Limited" },
    { id: "B008", name: "Nikini Automation Systems (Pvt) Ltd" },
    { id: "B009", name: "Everbolt Engineering (Pvt) Ltd" }
  ];

  const filteredBidders = biddersList.filter(bidder =>
    bidder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bidders: checked
        ? [...prev.bidders, value]
        : prev.bidders.filter(b => b !== value)
    }));
  };

  const handleSelectAll = (e) => {
    const { checked } = e.target;
    const filteredNames = filteredBidders.map(bidder => bidder.name);
    setFormData(prev => ({
      ...prev,
      bidders: checked
        ? [...new Set([...prev.bidders, ...filteredNames])]
        : prev.bidders.filter(bidder => !filteredNames.includes(bidder))
    }));
  };

  const isAllSelected =
    filteredBidders.length > 0 &&
    filteredBidders.every(bidder => formData.bidders.includes(bidder.name));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted Auction:', formData);
  };

  return (
    <div>
    
    <div className="container my-1">
            <Card>

      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <div className="col-md-6">
            <TextField
              fullWidth
              label="Auction Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <TextField
              fullWidth
              type="date"
              name="date"
              label="Auction Date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <TextField
              fullWidth
              type="time"
              name="time"
              label="Start Time"
              value={formData.time}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </div>
          <div className="col-md-6">
            <TextField
              fullWidth
              type="number"
              name="duration"
              label="Duration (minutes)"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Special Notices</label>
          <TextareaAutosize
            minRows={3}
            name="notices"
            value={formData.notices}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter any special instructions or notices"
          />
        </div>

        {/* Bidders Selection */}
        <div className="mb-4">
          <label className="form-label">Select Bidders</label>
          <div className="card p-3">
            <div className="d-flex flex-column flex-md-row mb-3 gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search bidders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                }
                label={`Select All (${filteredBidders.length})`}
              />
            </div>

            <div className="bidders-scroll-box border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredBidders.length > 0 ? (
                filteredBidders.map(bidder => (
                  <div key={bidder.id} className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={bidder.id}
                      value={bidder.name}
                      checked={formData.bidders.includes(bidder.name)}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor={bidder.id}>
                      {bidder.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-muted text-center">No bidders found</div>
              )}
            </div>
            <div className="text-end text-secondary mt-2">
              {formData.bidders.length} of {biddersList.length} bidders selected
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button variant="contained" color="warning" type="submit">
            Create Auction
          </Button>
        </div>
      </form>
      </Card>
    </div>
    </div>
  );
};

export default CreateAuction;
