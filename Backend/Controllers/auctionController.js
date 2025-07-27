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

// Get all auctions (admin view - all auctions)
const getAllAuctions = async (req, res) => {
  try {
    const { data: auctions, error } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .order('auction_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching auctions:', error);
      return res.status(500).json({ message: 'Error fetching auctions' });
    }

    res.json(auctions || []);
  } catch (error) {
    console.error('Error in getAllAuctions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get auctions for a specific bidder (only auctions they're invited to)
const getBidderAuctions = async (req, res) => {
  try {
    const bidderId = req.query.bidderId || req.params.bidderId || 'temp-bidder-1'; // For testing

    // Get bidder info
    const { data: bidder, error: bidderError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('user_id', bidderId)
      .single();

    if (bidderError || !bidder) {
      return res.status(404).json({ message: 'Bidder not found' });
    }

    // Get auctions where this bidder is invited
    const { data: auctions, error } = await supabaseAdmin
      .from('auctions')
      .select(`
        *,
        auction_bidders!inner(
          invited_at
        )
      `)
      .eq('auction_bidders.bidder_id', bidder.id)
      .order('auction_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching bidder auctions:', error);
      return res.status(500).json({ message: 'Error fetching bidder auctions' });
    }

    // Clean up the response to remove nested auction_bidders data
    const cleanedAuctions = auctions?.map(auction => {
      const { auction_bidders, ...cleanAuction } = auction;
      return {
        ...cleanAuction,
        invited_at: auction_bidders[0]?.invited_at
      };
    }) || [];

    res.json(cleanedAuctions);
  } catch (error) {
    console.error('Error in getBidderAuctions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get upcoming auctions for a specific bidder
const getBidderUpcomingAuctions = async (req, res) => {
  try {
    const bidderId = req.query.bidderId || 'temp-bidder-1'; // For testing

    // Get bidder info
    const { data: bidder, error: bidderError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('user_id', bidderId)
      .single();

    if (bidderError || !bidder) {
      return res.status(404).json({ message: 'Bidder not found' });
    }

    // Get upcoming auctions where this bidder is invited
    const { data: auctions, error } = await supabaseAdmin
      .from('auctions')
      .select(`
        *,
        auction_bidders!inner(
          invited_at
        )
      `)
      .eq('auction_bidders.bidder_id', bidder.id)
      .eq('status', 'scheduled')
      .order('auction_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching bidder upcoming auctions:', error);
      return res.status(500).json({ message: 'Error fetching bidder upcoming auctions' });
    }

    // Clean up the response
    const cleanedAuctions = auctions?.map(auction => {
      const { auction_bidders, ...cleanAuction } = auction;
      return {
        ...cleanAuction,
        invited_at: auction_bidders[0]?.invited_at
      };
    }) || [];

    res.json(cleanedAuctions);
  } catch (error) {
    console.error('Error in getBidderUpcomingAuctions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get live auctions for a specific bidder
const getBidderLiveAuctions = async (req, res) => {
  try {
    const bidderId = req.query.bidderId || 'temp-bidder-1'; // For testing

    // Get bidder info
    const { data: bidder, error: bidderError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('user_id', bidderId)
      .single();

    if (bidderError || !bidder) {
      return res.status(404).json({ message: 'Bidder not found' });
    }

    // Get live auctions where this bidder is invited
    const { data: auctions, error } = await supabaseAdmin
      .from('auctions')
      .select(`
        *,
        auction_bidders!inner(
          invited_at
        )
      `)
      .eq('auction_bidders.bidder_id', bidder.id)
      .eq('status', 'live')
      .order('auction_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching bidder live auctions:', error);
      return res.status(500).json({ message: 'Error fetching bidder live auctions' });
    }

    // Clean up the response
    const cleanedAuctions = auctions?.map(auction => {
      const { auction_bidders, ...cleanAuction } = auction;
      return {
        ...cleanAuction,
        invited_at: auction_bidders[0]?.invited_at
      };
    }) || [];

    res.json(cleanedAuctions);
  } catch (error) {
    console.error('Error in getBidderLiveAuctions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get auction by ID
const getAuctionById = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const { data: auction, error } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .eq('auction_id', auctionId)
      .single();

    if (error || !auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auction);
  } catch (error) {
    console.error('Error in getAuctionById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update auction status (for admin use)
const updateAuctionStatus = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'live', 'ended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { data: auction, error } = await supabaseAdmin
      .from('auctions')
      .update({ status, updated_at: new Date() })
      .eq('auction_id', auctionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating auction status:', error);
      return res.status(500).json({ message: 'Error updating auction status' });
    }

    res.json({
      message: 'Auction status updated successfully',
      auction
    });
  } catch (error) {
    console.error('Error in updateAuctionStatus:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createAuction,
  getAllAuctions,
  getBidderAuctions,
  getBidderUpcomingAuctions,
  getBidderLiveAuctions,
  getUpcomingAuctions: getBidderUpcomingAuctions, // Alias for backward compatibility
  getLiveAuctions: getBidderLiveAuctions, // Alias for backward compatibility
  getAuctionById,
  updateAuctionStatus
};