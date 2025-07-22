const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../Config/email');
const { generateBidderId, generatePassword } = require('../Utils/generators');

const registerBidder = async (req, res) => {
  try {
    const { name, email, company } = req.body;
    
    // Get last bidder ID
    const { data: lastBidder } = await supabase
      .from('users')
      .select('user_id')
      .eq('role', 'bidder')
      .order('user_id', { ascending: false })
      .limit(1);
    
    const bidderId = generateBidderId(lastBidder?.[0]?.user_id);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new bidder
    const { data, error } = await supabase
      .from('users')
      .insert([{
        user_id: bidderId,
        email,
        password_hash: hashedPassword,
        role: 'bidder',
        name,
        company,
        is_active: true
      }])
      .select();
    
    if (error) throw error;
    
    // Send email with credentials
    const emailHTML = `
      <h2>Welcome to E-Auction System</h2>
      <p>Dear ${name},</p>
      <p>Your bidder account has been created successfully.</p>
      <p><strong>User ID:</strong> ${bidderId}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please login and change your password.</p>
      <br>
      <p>Best regards,<br>Anunine Holdings Pvt Ltd</p>
    `;
    
    await sendEmail(email, 'E-Auction Account Created', emailHTML);
    
    res.json({
      success: true,
      message: 'Bidder registered successfully',
      bidder: data[0]
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getBidders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'bidder')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, bidders: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateBidderStatus = async (req, res) => {
  try {
    const { bidderId } = req.params;
    const { is_active } = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update({ is_active })
      .eq('user_id', bidderId)
      .select();
    
    if (error) throw error;
    
    res.json({ success: true, bidder: data[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerBidder,
  getBidders,
  updateBidderStatus
};