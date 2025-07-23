const express = require('express');
const router = express.Router();
const { registerBidder, getBidders, updateBidderStatus, testDbConnection } = require('../Controllers/adminController');
const auth = require('../Middleware/auth');


// Bidder management routes
router.post('/bidders', registerBidder);
router.get('/bidders', getBidders);
router.patch('/bidders/:bidderId/status', updateBidderStatus);


router.get('/test-db', testDbConnection);


module.exports = router;