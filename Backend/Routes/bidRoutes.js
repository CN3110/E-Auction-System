const express = require('express');
const router = express.Router();
const { 
  placeBid,
  getLatestBid,
  getBidderRank,
  getAuctionBids,
  getBidderHistory
} = require('../Controllers/bidController');
const { authenticate, authorizeRoles } = require('../Middleware/auth');

// Place a new bid (bidders only)
router.post('/', placeBid);

// Get latest bid for current bidder in a specific auction
router.get('/latest', getLatestBid);

// Get bidder's rank in a specific auction
router.get('/rank', getBidderRank);

// Get all bids for an auction (admin only)
router.get('/auction/:auctionId', getAuctionBids);

// Get bidder's auction history
router.get('/history', getBidderHistory);

module.exports = router;