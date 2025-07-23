const { supabaseAdmin } = require('../Config/database');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../Config/email');
const { generateBidderId, generatePassword } = require('../Utils/generators');

const registerBidder = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { name, email, company, phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !company) {
      throw new Error('Missing required fields');
    }

    // Get last bidder ID
    const { data: lastBidder, error: lastBidderError } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('role', 'bidder')
      .order('user_id', { ascending: false })
      .limit(1);
    
    if (lastBidderError) throw lastBidderError;
    
    const bidderId = generateBidderId(lastBidder?.[0]?.user_id);
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Creating bidder with:', {
      bidderId, email, name, company, phone
    });

    // Insert new bidder
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        user_id: bidderId,
        email,
        password_hash: hashedPassword,
        role: 'bidder',
        name,
        company,
        phone: phone || null,
        is_active: true
      }])
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Bidder created successfully:', data[0]);
    
    // Send email with credentials
    const emailHTML = `
      <h2>Welcome to E-Auction System</h2>
      <p>Your account has been created successfully.</p>
      <p><strong>User ID:</strong> ${bidderId}</p>
      <p><strong>Password:</strong> ${password}</p>
    `;
    
    await sendEmail(email, 'E-Auction Account Created', emailHTML);
    
    res.json({
      success: true,
      message: 'Bidder registered successfully',
      bidder: data[0]
    });
    
  } catch (error) {
    console.error('Error in registerBidder:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getBidders = async (req, res) => {
  try {
    // Use supabaseAdmin (the properly imported client)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'bidder')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ 
      success: true,
      bidders: data
    });
  } catch (error) {
    console.error('Error fetching bidders:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
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

const testDbConnection = async (req, res) => {
  try {
    // Test with a simple query
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      connection: "Database connected successfully",
      data: data || "No data (table might be empty)"
    });
  } catch (error) {
    console.error("Database error details:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
};

module.exports = {
  registerBidder,
  getBidders,
  updateBidderStatus,
  testDbConnection
};