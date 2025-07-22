const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if all required environment variables are present
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.log('Make sure you have set:');
    console.log('- SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    console.log('- SUPABASE_ANON_KEY');
    process.exit(1);
}

// Create Supabase clients
// Admin client: Can bypass Row Level Security, use for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Public client: Respects Row Level Security, use for user operations
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Test database connection
async function testConnection() {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        } else {
            console.log('✅ Database connection successful!');
            return true;
        }
    } catch (err) {
        console.error('❌ Database test error:', err.message);
        return false;
    }
}

module.exports = {
    supabaseAdmin,
    supabaseClient,
    testConnection
};