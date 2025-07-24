const express = require('express');
const router = express.Router();
const { 
  createAuction,
  getLiveAuction,
  getAllAuctions,
  getAuction,
  getLiveRankings

  } = require('../Controllers/auctionController');
const { authenticateToken, requireAdmin, requireBidder } = require('../Middleware/auth');

// Create auction (admin only)
router.post('/create', createAuction);


/// Get live auction for current bidder
router.get('/live', authenticateToken, requireBidder, getLiveAuction);

// Get all auctions (admin can see all, bidders see only their invited ones)
router.get('/', getAllAuctions);

// Get specific auction details
router.get('/:auctionId', getAuction);

// Get live rankings for an auction
router.get('/:auctionId/rankings', getLiveRankings);


module.exports = router;