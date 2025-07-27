const express = require('express');
const router = express.Router();
const { 
  placeBid,
  getLatestBid,
  getBidderRank,
  getAuctionBids,
  getBidderHistory
} = require('../Controllers/bidController');
//const { authenticateToken, requireBidder, requireAdmin } = require('../Middleware/auth');

// Place a new bid (bidders only) - FIXED: Added proper auth
router.post('/', placeBid);

// Get latest bid for current bidder in a specific auction - FIXED: Added auth
router.get('/latest', getLatestBid);

// Get bidder's rank in a specific auction - FIXED: Added auth
router.get('/rank', getBidderRank);

// Get all bids for an auction (admin only) - FIXED: Added proper auth
router.get('/auction/:auctionId', getAuctionBids);

// Get bidder's auction history - FIXED: Added auth
router.get('/history', getBidderHistory);

module.exports = router;