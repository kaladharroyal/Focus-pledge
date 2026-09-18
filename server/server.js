const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const focusRoutes = require('./routes/focusRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/certificate', certificateRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FocusPledge API Server',
    time: new Date().toISOString()
  });
});

// Database connection with seamless In-Memory MongoDB fallback
async function connectDatabase() {
  const localUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/focuspledge';

  try {
    console.log(`[FocusPledge DB] Attempting connection to MongoDB at ${localUri}...`);
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ [FocusPledge DB] Connected to local MongoDB instance.');
  } catch (err) {
    console.warn('⚠️ [FocusPledge DB] Local MongoDB not detected. Bootstrapping embedded in-memory MongoDB store...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ [FocusPledge DB] Connected to embedded In-Memory MongoDB at ${memoryUri}`);
    } catch (memErr) {
      console.error('❌ [FocusPledge DB] Failed to start in-memory database:', memErr);
    }
  }
}

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FocusPledge Server running on http://localhost:${PORT}`);
  });
});
