const supabase = require('../Config/database').supabaseAdmin;
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

const getLiveRankings = async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    // Get all bids for this auction, ordered by amount (ascending)
    const { data: bids, error } = await supabase
      .from('bids')
      .select(`
        *,
        users:bidder_id (user_id, name)
      `)
      .eq('auction_id', auctionId)
      .order('amount', { ascending: true })
      .order('bid_time', { ascending: true });
    
    if (error) throw error;
    
    // Process bids - keep only the lowest bid per bidder
    const rankingsMap = new Map();
    
    bids.forEach(bid => {
      if (!rankingsMap.has(bid.bidder_id)) {
        rankingsMap.set(bid.bidder_id, {
          bidder_id: bid.users.user_id,
          bidder_name: bid.users.name,
          amount: bid.amount,
          bid_time: bid.bid_time
        });
      }
    });
    
    // Convert to array and assign ranks
    const rankings = Array.from(rankingsMap.values())
      .sort((a, b) => a.amount - b.amount)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    
    res.json({ success: true, rankings });
  } catch (error) {
    console.error('Get live rankings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all active bidders
const getActiveBidders = async (req, res) => {
  try {
    const { data: bidders, error } = await supabase
      .from('users')
      .select('id, user_id, name, company, email')
      .eq('role', 'bidder')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    res.json({ success: true, bidders });
  } catch (error) {
    console.error('Get active bidders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get auction details
const getAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    const { data: auction, error } = await supabase
      .from('auctions')
      .select(`
        *,
        auction_bidders (
          users (id, user_id, name, company)
        )
      `)
      .eq('auction_id', auctionId)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, auction });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all auctions
const getAllAuctions = async (req, res) => {
  try {
    const { data: auctions, error } = await supabase
      .from('auctions')
      .select(`
        *,
        auction_bidders (count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, auctions });
  } catch (error) {
    console.error('Get all auctions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get auctions for a specific bidder
const getMyAuctions = async (req, res) => {
  try {
    const bidderId = req.user.id;
    
    const { data: auctions, error } = await supabase
      .from('auction_bidders')
      .select(`
        auctions (
          id,
          auction_id,
          title,
          auction_date,
          start_time,
          duration_minutes,
          special_notices,
          status,
          created_at
        )
      `)
      .eq('bidder_id', bidderId)
      .order('auctions(auction_date)', { ascending: false });
    
    if (error) throw error;
    
    // Transform the data to flatten the structure
    const transformedAuctions = auctions
      .filter(item => item.auctions) // Filter out null auctions
      .map(item => item.auctions);
    
    res.json({ success: true, auctions: transformedAuctions });
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createAuction,
  getLiveRankings,
  getActiveBidders,
  getAuction,
  getAllAuctions,
  getMyAuctions
};