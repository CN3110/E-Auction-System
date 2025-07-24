const { supabaseAdmin } = require('../Config/database');
const { generateAuctionId } = require('../Utils/generators');
const { sendEmail } = require('../Config/email');

const createAuction = async (req, res) => {
  try {
    const { title, auction_date, start_time, duration_minutes, special_notices, selected_bidders } = req.body;
    
    // Validate input
    if (!title || !auction_date || !start_time || !selected_bidders?.length) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Get last auction ID
    const { data: lastAuction, error: lastAuctionError } = await supabase
      .from('auctions')
      .select('auction_id')
      .order('auction_id', { ascending: false })
      .limit(1);
    
    if (lastAuctionError) throw lastAuctionError;
    
    const auctionId = generateAuctionId(lastAuction?.[0]?.auction_id);
    
    // Create auction with explicit field selection
    // Create auction without created_by
const { data: auction, error: auctionError } = await supabase
  .from('auctions')
  .insert([{
    auction_id: auctionId,
    title,
    auction_date,
    start_time,
    duration_minutes,
    special_notices
  }])
  .select('id, auction_id')
  .single();

    
    if (auctionError) throw auctionError;
    
    // Add selected bidders
    const bidderInvites = selected_bidders.map(bidderId => ({
      auction_id: auction.id,  // Now using the correct ID
      bidder_id: bidderId
    }));
    
    const { error: biddersError } = await supabase
      .from('auction_bidders')
      .insert(bidderInvites);
    
    if (biddersError) throw biddersError;
    
    // Send emails to selected bidders
    const { data: bidders } = await supabase
      .from('users')
      .select('email, name')
      .in('id', selected_bidders)
      .eq('role', 'bidder')
      .eq('is_active', true);
    
    for (const bidder of bidders) {
      const emailHTML = `
        <h2>Auction Invitation - Anunine Holdings Pvt Ltd</h2>
        <p>Dear ${bidder.name},</p>
        <p>You've been invited to participate in a new auction:</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Date:</strong> ${auction_date}</p>
        <p><strong>Time:</strong> ${start_time}</p>
        <p><strong>Duration:</strong> ${duration_minutes} minutes</p>
        ${special_notices ? `<p><strong>Special Notices:</strong> ${special_notices}</p>` : ''}
        <p>Please login to participate.</p>
        <br>
        <p>Best regards,<br>Anunine Holdings Pvt Ltd</p>
      `;
      
      await sendEmail(bidder.email, `Auction Invitation - ${title}`, emailHTML);
    }
    
    res.json({ success: true, auction, auction_id: auctionId });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get live auction for a specific bidder
const getLiveAuction = async (req, res) => {
  try {
    const bidderId = req.user.id;
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

   

    if (!bidderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing bidder ID'
      });
    }

    // 1. Try to fetch live auction
    const { data: liveAuction, error: liveError } = await supabaseAdmin
      .from('auctions')
      .select(`
        *,
        auction_bidders!inner(bidder_id)
      `)
      .eq('auction_bidders.bidder_id', bidderId)
      .eq('auction_date', currentDate)
      .lte('start_time', currentTime)
      .eq('status', 'live')
      .single();

    if (liveError && liveError.code !== 'PGRST116') {
      console.error('Get live auction error:', liveError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch live auction'
      });
    }

    let auctionToReturn = liveAuction;

    // 2. If no live auction, check if a scheduled one should be live now
    if (!liveAuction) {
      const { data: scheduledAuction, error: scheduledError } = await supabaseAdmin
        .from('auctions')
        .select(`
          *,
          auction_bidders!inner(bidder_id)
        `)
        .eq('auction_bidders.bidder_id', bidderId)
        .eq('auction_date', currentDate)
        .lte('start_time', currentTime)
        .eq('status', 'scheduled')
        .single();

      if (scheduledError && scheduledError.code !== 'PGRST116') {
        console.error('Check scheduled auction error:', scheduledError);
        return res.status(500).json({
          success: false,
          error: 'Failed to check scheduled auction'
        });
      }

      if (scheduledAuction) {
        // Update status to 'live'
        await supabaseAdmin
          .from('auctions')
          .update({ status: 'live' })
          .eq('id', scheduledAuction.id);

        auctionToReturn = scheduledAuction;
      }
    }

    // 3. If still no auction, return null
    if (!auctionToReturn) {
      return res.json({
        success: true,
        auction: null
      });
    }

    // 4. Check if auction should have ended
    const startTime = new Date(`${auctionToReturn.auction_date}T${auctionToReturn.start_time}`);
    const endTime = new Date(startTime.getTime() + auctionToReturn.duration_minutes * 60000);

    if (now > endTime) {
      await endAuction(auctionToReturn.id);
      return res.json({
        success: true,
        auction: null
      });
    }

    // 5. Return valid auction
    return res.json({
      success: true,
      auction: auctionToReturn
    });

  } catch (error) {
    console.error('Get live auction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all auctions (with filtering)
const getAllAuctions = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = supabaseAdmin.from('auctions').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('auction_date', date);
    }

    query = query.order('auction_date', { ascending: false });

    const { data: auctions, error } = await query;

    if (error) {
      console.error('Get auctions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch auctions'
      });
    }

    res.json({
      success: true,
      auctions
    });

  } catch (error) {
    console.error('Get all auctions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get specific auction details
const getAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const { data: auction, error } = await supabaseAdmin
      .from('auctions')
      .select(`
        *,
        auction_bidders(
          bidder_id,
          users(name, company)
        )
      `)
      .eq('id', auctionId)
      .single();

    if (error) {
      console.error('Get auction error:', error);
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    res.json({
      success: true,
      auction
    });

  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get live rankings for an auction
const getLiveRankings = async (req, res) => {
  try {
    const { auctionId } = req.params;

    // Get latest bid from each bidder for this auction
    const { data: rankings, error } = await supabaseAdmin
      .rpc('get_auction_rankings', { auction_uuid: auctionId });

    if (error) {
      console.error('Get rankings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch rankings'
      });
    }

    res.json({
      success: true,
      rankings
    });

  } catch (error) {
    console.error('Get live rankings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Helper function to end auction
const endAuction = async (auctionId) => {
  try {
    // Update auction status to ended
    await supabaseAdmin
      .from('auctions')
      .update({ status: 'ended' })
      .eq('id', auctionId);

    // Get the winning bid (lowest amount)
    const { data: winningBid } = await supabaseAdmin
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: true })
      .limit(1)
      .single();

    // Get total bids count
    const { count: totalBids } = await supabaseAdmin
      .from('bids')
      .select('*', { count: 'exact' })
      .eq('auction_id', auctionId);

    // Create auction result
    if (winningBid) {
      await supabaseAdmin
        .from('auction_results')
        .insert({
          auction_id: auctionId,
          winner_id: winningBid.bidder_id,
          winning_amount: winningBid.amount,
          total_bids: totalBids || 0
        });

      // Mark winning bid
      await supabaseAdmin
        .from('bids')
        .update({ is_winning: true })
        .eq('id', winningBid.id);
    }

  } catch (error) {
    console.error('End auction error:', error);
  }
};

module.exports = {
  createAuction,
  getLiveAuction,
  getAllAuctions,
  getAuction,
  getLiveRankings
};