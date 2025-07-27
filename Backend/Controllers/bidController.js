const { supabaseAdmin } = require('../Config/database');

// Get current live auction
const getCurrentAuction = async (req, res) => {
  try {
    const { data: auction, error } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .in('status', ['scheduled', 'live'])
      .order('auction_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching auction:', error);
      return res.status(500).json({ message: 'Error fetching auction data' });
    }

    if (!auction) {
      return res.status(404).json({ message: 'No active or upcoming auctions found' });
    }

    // Check if auction should be live based on current time
    const now = new Date();
    const auctionStart = new Date(`${auction.auction_date}T${auction.start_time}`);
    const auctionEnd = new Date(auctionStart.getTime() + auction.duration_minutes * 60000);

    let currentStatus = auction.status;
    
    if (now >= auctionStart && now <= auctionEnd && auction.status === 'scheduled') {
      // Update status to live
      const { error: updateError } = await supabaseAdmin
        .from('auctions')
        .update({ status: 'live' })
        .eq('id', auction.id);
      
      if (!updateError) {
        currentStatus = 'live';
      }
    } else if (now > auctionEnd && auction.status === 'live') {
      // Update status to ended
      const { error: updateError } = await supabaseAdmin
        .from('auctions')
        .update({ status: 'ended' })
        .eq('id', auction.id);
      
      if (!updateError) {
        currentStatus = 'ended';
      }
    }

    res.json({
      ...auction,
      status: currentStatus
    });

  } catch (error) {
    console.error('Error in getCurrentAuction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Place a bid
const placeBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;
    const bidderId = req.body.bidderId || 'temp-bidder-1'; // For testing without auth

    if (!auctionId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Auction ID and valid amount are required' });
    }

    // Check if auction exists and is live
    const { data: auction, error: auctionError } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .eq('auction_id', auctionId)
      .single();

    if (auctionError || !auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status !== 'live') {
      return res.status(400).json({ message: 'Auction is not currently live' });
    }

    // Check if auction time is still valid
    const now = new Date();
    const auctionStart = new Date(`${auction.auction_date}T${auction.start_time}`);
    const auctionEnd = new Date(auctionStart.getTime() + auction.duration_minutes * 60000);

    if (now > auctionEnd) {
      // Update auction status to ended
      await supabaseAdmin
        .from('auctions')
        .update({ status: 'ended' })
        .eq('id', auction.id);
      
      return res.status(400).json({ message: 'Auction has ended' });
    }

    // Get minimum bid amount (lowest current bid + 1, or starting amount)
    const { data: minBidData } = await supabaseAdmin
      .from('bids')
      .select('amount')
      .eq('auction_id', auction.id)
      .order('amount', { ascending: true })
      .limit(1);

    const minBidAmount = minBidData && minBidData.length > 0 
      ? minBidData[0].amount - 1 
      : amount; // For first bid, any amount is accepted

    if (amount >= minBidAmount && minBidData && minBidData.length > 0) {
      return res.status(400).json({ 
        message: `Bid amount must be less than current lowest bid (LKR ${minBidData[0].amount})` 
      });
    }

    // Check bidder exists (create temp bidder for testing)
    let { data: bidder } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', bidderId)
      .single();

    if (!bidder) {
      // Create temp bidder for testing
      const { data: newBidder, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          user_id: bidderId,
          email: `${bidderId}@test.com`,
          password_hash: 'temp',
          role: 'bidder',
          name: `Test Bidder ${bidderId}`,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ message: 'Error creating test bidder' });
      }
      bidder = newBidder;
    }

    // Reset all winning bids for this auction
    await supabaseAdmin
      .from('bids')
      .update({ is_winning: false })
      .eq('auction_id', auction.id);

    // Place the bid
    const { data: bid, error: bidError } = await supabaseAdmin
      .from('bids')
      .insert({
        auction_id: auction.id,
        bidder_id: bidder.id,
        amount: parseFloat(amount),
        is_winning: true // This will be the new lowest bid
      })
      .select()
      .single();

    if (bidError) {
      console.error('Error placing bid:', bidError);
      return res.status(500).json({ message: 'Error placing bid' });
    }

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: {
        id: bid.id,
        amount: bid.amount,
        bid_time: bid.bid_time
      }
    });

  } catch (error) {
    console.error('Error in placeBid:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get bidder rank and latest bid
const getBidderRank = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const bidderId = req.query.bidderId || 'temp-bidder-1'; // For testing

    if (!auctionId) {
      return res.status(400).json({ message: 'Auction ID is required' });
    }

    // Get auction
    const { data: auction, error: auctionError } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .eq('auction_id', auctionId)
      .single();

    if (auctionError || !auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Get bidder
    const { data: bidder } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', bidderId)
      .single();

    if (!bidder) {
      return res.json({ rank: null, latestBid: null });
    }

    // Get bidder's latest bid
    const { data: latestBid } = await supabaseAdmin
      .from('bids')
      .select('amount, bid_time')
      .eq('auction_id', auction.id)
      .eq('bidder_id', bidder.id)
      .order('bid_time', { ascending: false })
      .limit(1)
      .single();

    if (!latestBid) {
      return res.json({ rank: null, latestBid: null });
    }

    // Calculate rank (count how many unique bidders have lower bids)
    const { data: lowerBids, error: rankError } = await supabaseAdmin
      .rpc('get_bidder_rank', {
        p_auction_id: auction.id,
        p_bidder_id: bidder.id,
        p_bid_amount: latestBid.amount
      });

    if (rankError) {
      // Fallback: calculate rank manually
      const { data: allBids } = await supabaseAdmin
        .from('bids')
        .select('bidder_id, amount')
        .eq('auction_id', auction.id)
        .order('amount', { ascending: true });

      // Get unique lowest bid per bidder
      const bidderLowestBids = {};
      allBids?.forEach(bid => {
        if (!bidderLowestBids[bid.bidder_id] || bid.amount < bidderLowestBids[bid.bidder_id]) {
          bidderLowestBids[bid.bidder_id] = bid.amount;
        }
      });

      // Calculate rank
      const sortedBids = Object.values(bidderLowestBids).sort((a, b) => a - b);
      const rank = sortedBids.findIndex(amount => amount >= latestBid.amount) + 1;

      return res.json({
        rank: rank || null,
        latestBid: latestBid.amount
      });
    }

    res.json({
      rank: (lowerBids?.[0]?.rank || 1),
      latestBid: latestBid.amount
    });

  } catch (error) {
    console.error('Error in getBidderRank:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get minimum bid amount
const getMinBidAmount = async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({ message: 'Auction ID is required' });
    }

    // Get auction
    const { data: auction, error: auctionError } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .eq('auction_id', auctionId)
      .single();

    if (auctionError || !auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Get lowest current bid
    const { data: lowestBid } = await supabaseAdmin
      .from('bids')
      .select('amount')
      .eq('auction_id', auction.id)
      .order('amount', { ascending: true })
      .limit(1)
      .single();

    // Minimum bid should be less than the current lowest bid
    // If no bids exist, start with a default amount
    const minBidAmount = lowestBid ? lowestBid.amount - 1 : 1;

    res.json({ minBidAmount: Math.max(1, minBidAmount) });

  } catch (error) {
    console.error('Error in getMinBidAmount:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get auction history for a bidder
const getAuctionHistory = async (req, res) => {
  try {
    const bidderId = req.query.bidderId || 'temp-bidder-1'; // For testing

    // Get bidder
    const { data: bidder } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', bidderId)
      .single();

    if (!bidder) {
      return res.json([]);
    }

    // Get ended auctions where bidder participated
    const { data: history, error } = await supabaseAdmin
      .from('auctions')
      .select(`
        auction_id,
        title,
        auction_date,
        start_time,
        status,
        bids!inner(amount, bid_time),
        auction_results(winner_id, winning_amount)
      `)
      .eq('bids.bidder_id', bidder.id)
      .eq('status', 'ended')
      .order('auction_date', { ascending: false });

    if (error) {
      console.error('Error fetching auction history:', error);
      return res.status(500).json({ message: 'Error fetching auction history' });
    }

    // Process history data
    const processedHistory = history?.map(auction => {
      // Get bidder's best (lowest) bid for this auction
      const bidderBids = auction.bids || [];
      const bestBid = bidderBids.reduce((min, bid) => 
        !min || bid.amount < min.amount ? bid : min, null);

      // Check if bidder won
      const isWinner = auction.auction_results?.[0]?.winner_id === bidder.id;

      return {
        auctionId: auction.auction_id,
        title: auction.title,
        bidAmount: bestBid?.amount || 0,
        result: isWinner ? 'Won' : 'Lost',
        date: auction.auction_date,
        time: auction.start_time
      };
    }) || [];

    res.json(processedHistory);

  } catch (error) {
    console.error('Error in getAuctionHistory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getCurrentAuction,
  placeBid,
  getBidderRank,
  getMinBidAmount,
  getAuctionHistory
};