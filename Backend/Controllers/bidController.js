const { supabaseAdmin } = require('../Config/database');

//place a bid 
const placeBid = async (req, res) => {
    const { amount } = req.body;
    const { auction } = req; // Assuming auction is attached by previous middleware
    const bidder_id = req.user.id; // From authentication middleware

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ 
            error: 'Please enter a valid positive bid amount' 
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check current lowest bid (for reverse auction)
        const currentBids = await client.query(
            `SELECT MIN(amount) as current_lowest 
             FROM bids 
             WHERE auction_id = $1`,
            [auction.id]
        );

        const currentLowest = currentBids.rows[0]?.current_lowest;
        
        // Reverse auction validation (lowest bid wins)
        if (currentLowest && parseFloat(amount) >= currentLowest) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: `Your bid must be lower than ${currentLowest.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'LKR'
                })}`
            });
        }

        // Insert the new bid
        const newBid = await client.query(
            `INSERT INTO bids (id, auction_id, bidder_id, amount) 
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [uuidv4(), auction.id, bidder_id, amount]
        );

        // Get updated rank
        const rankResult = await client.query(
            'SELECT * FROM get_bidder_rank($1, $2, $3)',
            [auction.id, bidder_id, amount]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Bid placed successfully',
            bid: newBid.rows[0],
            rank: rankResult.rows[0]?.rank || null,
            currentLowest: amount // The new bid becomes the current lowest
        });

    } catch (error) {
        await client.query('ROLLBACK');
        
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ 
                error: 'Duplicate bid detected' 
            });
        }
        
        console.error('Bid placement error:', error);
        res.status(500).json({ 
            error: 'Failed to process bid',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
};

// Get latest bid for a bidder in a specific auction
const getLatestBid = async (req, res) => {
  try {
    const { auctionId } = req.query;
    const bidderId = req.user.id;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        error: 'Auction ID is required'
      });
    }

    const { data: bid, error } = await supabaseAdmin
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .eq('bidder_id', bidderId)
      .order('bid_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get latest bid error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch latest bid'
      });
    }

    res.json({
      success: true,
      bid: bid || null
    });

  } catch (error) {
    console.error('Get latest bid error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get bidder's rank in a specific auction
const getBidderRank = async (req, res) => {
  try {
    const { auctionId } = req.query;
    const bidderId = req.user.id;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        error: 'Auction ID is required'
      });
    }

    // Get the bidder's latest (lowest) bid
    const { data: bidderBid, error: bidError } = await supabaseAdmin
      .from('bids')
      .select('amount')
      .eq('auction_id', auctionId)
      .eq('bidder_id', bidderId)
      .order('amount', { ascending: true })
      .limit(1)
      .single();

    if (bidError && bidError.code !== 'PGRST116') {
      console.error('Get bidder bid error:', bidError);
      return res.json({
        success: true,
        rank: null,
        totalBidders: 0
      });
    }

    if (!bidderBid) {
      return res.json({
        success: true,
        rank: null,
        totalBidders: 0
      });
    }

    // Get all bidders' lowest bids for ranking
    const { data: allLowestBids, error: allBidsError } = await supabaseAdmin
      .from('bids')
      .select('bidder_id, amount')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: true });

    if (allBidsError) {
      console.error('Get all bids error:', allBidsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate rank'
      });
    }

    // Group by bidder and get their lowest bid
    const bidderLowestBids = {};
    allLowestBids.forEach(bid => {
      if (!bidderLowestBids[bid.bidder_id] || bid.amount < bidderLowestBids[bid.bidder_id]) {
        bidderLowestBids[bid.bidder_id] = bid.amount;
      }
    });

    // Create sorted array of unique bidders by their lowest bid
    const sortedBidders = Object.entries(bidderLowestBids)
      .sort(([, amountA], [, amountB]) => amountA - amountB);
    
    // Find the bidder's rank
    const rank = sortedBidders.findIndex(([bidder]) => bidder === bidderId) + 1;

    res.json({
      success: true,
      rank: rank || null,
      totalBidders: sortedBidders.length
    });

  } catch (error) {
    console.error('Get bidder rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all bids for an auction (admin only)
const getAuctionBids = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const { data: bids, error } = await supabaseAdmin
      .from('bids')
      .select(`
        *,
        users(name, company, user_id)
      `)
      .eq('auction_id', auctionId)
      .order('bid_time', { ascending: false });

    if (error) {
      console.error('Get auction bids error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bids'
      });
    }

    res.json({
      success: true,
      bids
    });

  } catch (error) {
    console.error('Get auction bids error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get bidder's auction history
const getBidderHistory = async (req, res) => {
  try {
    const bidderId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get bidder's auctions with their bid information
    const { data: history, error } = await supabaseAdmin
      .from('bids')
      .select(`
        auction_id,
        amount,
        bid_time,
        is_winning,
        auctions(
          auction_id,
          title, 
          auction_date, 
          status
        )
      `)
      .eq('bidder_id', bidderId)
      .order('bid_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get bidder history error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bidding history'
      });
    }

    // Group by auction and get the best (lowest) bid for each
    const auctionMap = {};
    history.forEach(bid => {
      const auctionId = bid.auction_id;
      if (!auctionMap[auctionId] || bid.amount < auctionMap[auctionId].amount) {
        auctionMap[auctionId] = bid;
      }
    });

    const processedHistory = Object.values(auctionMap);

    res.json({
      success: true,
      history: processedHistory
    });

  } catch (error) {
    console.error('Get bidder history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  placeBid,
  getLatestBid,
  getBidderRank,
  getAuctionBids,
  getBidderHistory
};