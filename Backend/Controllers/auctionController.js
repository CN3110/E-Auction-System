const supabase = require('../config/supabase');
const { generateAuctionId } = require('../Utils/generators');
const { sendEmail } = require('../Config/email');

const createAuction = async (req, res) => {
  try {
    const { title, auction_date, start_time, duration_minutes, special_notices, selected_bidders } = req.body;
    
    // Get last auction ID
    const { data: lastAuction } = await supabase
      .from('auctions')
      .select('auction_id')
      .order('auction_id', { ascending: false })
      .limit(1);
    
    const auctionId = generateAuctionId(lastAuction?.[0]?.auction_id);
    
    // Create auction
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .insert([{
        auction_id: auctionId,
        title,
        auction_date,
        start_time,
        duration_minutes,
        special_notices,
        created_by: req.user.id
      }])
      .select();
    
    if (auctionError) throw auctionError;
    
    // Add selected bidders
    const bidderInvites = selected_bidders.map(bidderName => ({
      auction_id: auction[0].id,
      bidder_id: bidderName // This should be bidder ID, not name
    }));
    
    const { error: biddersError } = await supabase
      .from('auction_bidders')
      .insert(bidderInvites);
    
    if (biddersError) throw biddersError;
    
    // Send emails to selected bidders
    // Get bidder emails
    const { data: bidders } = await supabase
      .from('users')
      .select('email, name')
      .in('name', selected_bidders);
    
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
    
    res.json({ success: true, auction: auction[0] });
  } catch (error) {
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
      .order('amount', { ascending: true }) // Changed to ascending order
      .order('bid_time', { ascending: true }); // Secondary sort by time
    
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
      .sort((a, b) => a.amount - b.amount) // Sort by amount (ascending)
      .map((item, index) => ({
        ...item,
        rank: index + 1 // Assign ranks starting from 1
      }));
    
    res.json({ success: true, rankings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createAuction,
  getLiveRankings
};