const express = require('express');
const router = express.Router();
const {
  getCurrentAuction,
  placeBid,
  getBidderRank,
  getMinBidAmount,
  getAuctionHistory
} = require('../Controllers/bidController');

// Get current live or upcoming auction
router.get('/current-auction', getCurrentAuction);

// Place a bid
router.post('/place', placeBid);

// Get bidder rank for specific auction
router.get('/rank/:auctionId', getBidderRank);

// Get minimum bid amount for auction
router.get('/min-amount/:auctionId', getMinBidAmount);

// Get auction history for bidder
router.get('/history', getAuctionHistory);

module.exports = router;