import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';
import { lobbyRouter } from './routes/lobbyRoutes';
import { createServerSentEventHandler } from './library/serverSentEvents';
import { cleanupExpiredLobbies } from './services/lobbyService';
import { cleanupInactiveClients } from './library/lobbyEventBroadcaster';

//---------- SETUP ----------//
// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json());


//---------- FRONTEND ----------//
const fePath = path.join(__dirname, '..', 'dist', 'public');
app.use(express.static(fePath))
app.get('/', (_, res) => {
  res.sendFile(path.join(fePath, 'index.html'))
});


//---------- API ----------//
// Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/lobbies', lobbyRouter);


//---------- INIT ----------//
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Server Sent Events Health Check Endpoint
app.get('/events/health', createServerSentEventHandler<string>(sendEvent => {
  setInterval(() => {
    sendEvent('health', 'healthy');
  }, 5000);
}));

// Set up periodic cleanup tasks
const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

// Clean up expired lobbies (every hour)
setInterval(() => {
  try {
    cleanupExpiredLobbies();
  } catch (err) {
    console.error('Error cleaning up expired lobbies:', err);
  }
}, HOUR_IN_MS);

// Clean up inactive clients (every 15 minutes)
setInterval(() => {
  try {
    cleanupInactiveClients();
  } catch (err) {
    console.error('Error cleaning up inactive clients:', err);
  }
}, 15 * MINUTE_IN_MS);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
