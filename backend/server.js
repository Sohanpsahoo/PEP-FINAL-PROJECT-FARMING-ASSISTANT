require('dotenv').config({ override: true });
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
  origin: [
    'http://localhost:5173',   // Vite dev server
    'http://localhost:5174',   // Vite dev server (alternate)
    'http://localhost:3000',   // Alternate dev port
    'http://localhost:4173',   // Vite preview
    'https://pep-final-project-farming-assistant-three.vercel.app', // Deployed frontend
    'https://pep-final-project-farming-assistant.vercel.app',       // Vercel backend URL (same-origin fallback)
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ─── Error Handler (must be LAST middleware) ────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 8001;

async function start() {
  // Try to connect MongoDB (non-blocking — server starts even if DB is down)
  await connectDB();

  // Only call app.listen() in local development
  // Vercel manages the server lifecycle in production
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`\n🚀 Krishi Sakhi Backend running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  }
}

start();

// Export the app for Vercel serverless
module.exports = app;
