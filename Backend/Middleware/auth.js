const jwt = require('jsonwebtoken');
const { supabaseClient } = require('../Config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      throw new Error('User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Please authenticate' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Role ${req.user.role} is not allowed to access this resource` 
      });
    }
    next();
  };
};

// Legacy middleware names for backward compatibility
const authenticateToken = authenticate;
const requireAdmin = authorizeRoles('admin');
const requireBidder = authorizeRoles('bidder');

module.exports = { 
  authenticate, 
  authorizeRoles,
  authenticateToken,
  requireAdmin,
  requireBidder
};