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
        <h2>New Auction Invitation</h2>
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
    
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        users:bidder_id (user_id, name)
      `)
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false });
    
    if (error) throw error;
    
    // Group by bidder and get latest bid
    const rankings = [];
    const bidderMap = new Map();
    
    data.forEach(bid => {
      if (!bidderMap.has(bid.bidder_id) || bidderMap.get(bid.bidder_id).amount < bid.amount) {
        bidderMap.set(bid.bidder_id, bid);
      }
    });
    
    bidderMap.forEach((bid, bidderId) => {
      rankings.push({
        rank: rankings.length + 1,
        bidder_id: bid.users.user_id,
        bidder_name: bid.users.name,
        amount: bid.amount,
        bid_time: bid.bid_time
      });
    });
    
    rankings.sort((a, b) => b.amount - a.amount);
    rankings.forEach((rank, index) => rank.rank = index + 1);
    
    res.json({ success: true, rankings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createAuction,
  getLiveRankings
};