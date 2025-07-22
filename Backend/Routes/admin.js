const express = require('express');
const router = express.Router();
const { registerBidder, getBidders, updateBidderStatus } = require('../Controllers/adminController');
const auth = require('../Middleware/auth');

router.post('/register-bidder', auth, registerBidder);
router.get('/bidders', auth, getBidders);
router.put('/bidders/:bidderId/status', auth, updateBidderStatus);

module.exports = router;