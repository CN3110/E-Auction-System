const express = require('express');
const router = express.Router();
const { 
  createAuction,
  getAllAuctions,
  getBidderAuctions,
  getBidderUpcomingAuctions,
  getBidderLiveAuctions,
  getAuctionById,
  updateAuctionStatus
} = require('../Controllers/auctionController');
//const { authenticateToken, requireAdmin, requireBidder } = require('../Middleware/auth');

// Create auction (admin only)
router.post('/create', createAuction);

// Get all auctions (admin view)
router.get('/all', getAllAuctions);

// Get auctions for specific bidder
router.get('/bidder/:bidderId', getBidderAuctions);
router.get('/bidder', getBidderAuctions); // Using query parameter

// Get upcoming auctions for bidder
router.get('/upcoming', getBidderUpcomingAuctions);

// Get live auctions for bidder
router.get('/live', getBidderLiveAuctions);

// Get specific auction by ID
router.get('/:auctionId', getAuctionById);

// Update auction status (admin)
router.put('/:auctionId/status', updateAuctionStatus);

// Default route - get bidder auctions
router.get('/', getBidderAuctions);

module.exports = router;