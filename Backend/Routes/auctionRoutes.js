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

// Get live auction for current bidder (FIXED: Added proper auth)
router.get('/live', authenticateToken, requireBidder, getLiveAuction);

// Get all auctions (admin can see all, bidders see only their invited ones)
router.get('/', authenticateToken, getAllAuctions);

// Get specific auction details
router.get('/:auctionId', authenticateToken, getAuction);

// Get live rankings for an auction (FIXED: Added auth)
router.get('/:auctionId/rankings', authenticateToken, getLiveRankings);

module.exports = router;