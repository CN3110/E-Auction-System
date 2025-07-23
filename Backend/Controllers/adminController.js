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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to E-Auction System</h2>
        <p>Dear ${name},</p>
        <p>Your bidder account has been created successfully for <strong>${company}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Login Credentials:</h3>
          <p><strong>User ID:</strong> ${bidderId}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        
        <p>Please keep these credentials safe and change your password after your first login.</p>
        <p>Thank you for joining our auction platform!</p>
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
    
    console.log('Attempting to send email to:', email);
    const emailResult = await sendEmail(email, 'E-Auction Account Created - Login Credentials', emailHTML);
    
    if (emailResult.success) {
      console.log('Email sent successfully');
    } else {
      console.error('Email failed to send:', emailResult.error);
    }
    
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

const deactivateBidder = async (req, res) => {
  try {
    const { bidderId } = req.params;

    // First verify bidder exists and is active
    const { data: bidder, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', bidderId)
      .is('deleted_at', null)
      .single();

    if (findError || !bidder) {
      return res.status(404).json({
        success: false,
        error: 'Bidder not found or already deactivated'
      });
    }

    // Perform deactivation
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', bidderId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Bidder deactivated successfully',
      bidderId,
      deactivated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Deactivation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const reactivateBidder = async (req, res) => {
  try {
    const { bidderId } = req.params;

    // Verify bidder exists and is deactivated
    const { data: bidder, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', bidderId)
      .not('deleted_at', 'is', null)
      .single();

    if (findError || !bidder) {
      return res.status(404).json({
        success: false,
        error: 'Bidder not found or already active'
      });
    }

    // Perform reactivation
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        deleted_at: null,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', bidderId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Bidder reactivated successfully',
      bidderId
    });

  } catch (error) {
    console.error('Reactivation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
  deactivateBidder,
  reactivateBidder,
  testDbConnection
};