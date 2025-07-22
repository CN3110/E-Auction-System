const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/admin', require('./Routes/'));
app.use('/api/auction', require('./src/routes/auction'));
app.use('/api/bidder', require('./src/routes/bidder'));

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});