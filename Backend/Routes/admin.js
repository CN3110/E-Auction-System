const express = require('express');
const router = express.Router();
const { registerBidder, getBidders, updateBidderStatus, getActiveBidders, testDbConnection, deactivateBidder, reactivateBidder} = require('../Controllers/adminController');
const auth = require('../Middleware/auth');


// Bidder management routes
router.post('/bidders', registerBidder);
router.get('/bidders', getBidders);
router.patch('/bidders/:bidderId/status', updateBidderStatus);
router.get('/bidders/active', getActiveBidders); //het only active bidders

// Soft Delete Route (recommended approach)
router.patch('/bidders/:bidderId/deactivate', deactivateBidder);
router.patch('/bidders/:bidderId/reactivate', reactivateBidder);

router.get('/test-db', testDbConnection);


module.exports = router;