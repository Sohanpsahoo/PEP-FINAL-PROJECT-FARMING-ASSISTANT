require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ─── Import Route Files ─────────────────────────────────────────────
const weatherRoutes = require('./routes/weatherRoutes');
const farmerRoutes  = require('./routes/farmerRoutes');
const farmRoutes    = require('./routes/farmRoutes');
const activityRoutes = require('./routes/activityRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const marketRoutes   = require('./routes/marketRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const officerRoutes  = require('./routes/officerRoutes');
const schemeRoutes   = require('./routes/schemeRoutes');
const chatRoutes     = require('./routes/chatRoutes');
const diseaseRoutes  = require('./routes/diseaseRoutes');

// ─── Create Express App ─────────────────────────────────────────────
const app = express();

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Connect Database ───────────────────────────────────────────────
connectDB();

// ─── API Routes ─────────────────────────────────────────────────────
app.use('/api/weather', weatherRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/chatbot', chatRoutes);
app.use('/api/disease', diseaseRoutes);

// ─── Health Check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler (MUST be last) ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 8007;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});