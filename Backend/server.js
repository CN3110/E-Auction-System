const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./Config/database');


// Test DB connection on startup
testConnection().then(success => {
  if (!success) {
    console.error("❌ Failed to connect to database!");
    process.exit(1);
  }
  console.log("✅ Database connection verified");
});


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/admin', require('./Routes/admin'));
app.use('/api/auction', require('./Routes/auctionRoutes'));
app.use('/api/bid', require('./Routes/bidRoutes'));

console.log("Admin routes path:", require.resolve('./Routes/admin'));

// Modify your route registration
const adminRouter = require('./Routes/admin');
app.use('/api/admin', adminRouter);
console.log("Registered admin routes:");
console.log(adminRouter.stack);

// Real-time handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
  });
  
  socket.on('place-bid', async (data) => {
    // Handle bid placement
    io.to(`auction-${data.auctionId}`).emit('bid-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Test route - Add this before server.listen()
app.get('/api/test-route', (req, res) => {
  console.log("Test route was hit!");
  res.json({ message: "Backend is working!" });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});