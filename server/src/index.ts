import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';
import { createServerSentEventHandler } from './library/serverSentEvents';

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
}))

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
