const express = require('express');
const router = express.Router();
const { 
  createAuction
  } = require('../Controllers/auctionController');
const { authenticateToken, requireAdmin, requireBidder } = require('../Middleware/auth');

// Create auction (admin only)
router.post('/create', createAuction);


// Get my auctions (bidder only)
//router.get('/my-auctions', authenticateToken, requireBidder, getMyAuctions);

// Get all auctions
//router.get('/', authenticateToken, getAllAuctions);

// Get specific auction details
//router.get('/:auctionId', authenticateToken, getAuction);

// Get live rankings for an auction
//router.get('/:auctionId/rankings', authenticateToken, getLiveRankings);

module.exports = router;