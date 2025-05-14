import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import imageService from './services/imageService';
import { ErrorDetails, ValidationErrorDetails } from './library/error-types';
import { authRouter } from './routes/authRoutes';
import { cleanupExpiredLobbies } from './services/lobbyService';
import { cleanupInactiveClients } from './library/lobbyEventBroadcaster';
import { createServerSentEventHandler } from './library/serverSentEvents';
import { fullChainDetailsRouter } from './routes/fullChainDetailsRoutes';
import { imageRouter } from './routes/imageRoutes';
import { lobbyRouter } from './routes/lobbyRoutes';
import { promptRouter } from './routes/promptRoutes';
import { userRouter } from './routes/userRoutes';
import { validateImageUploadDto } from './models/Image';
import { authenticateRequest, requireRole } from './library/authMiddleware';

//---------- SETUP ----------//import { authenticateRequest, requireRole } from './library/authMiddleware';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());

// the upload image route should not be parsed as JSON
app.use('/api/prompt/:promptId/image', express.raw({ type: 'image/png', limit: '10mb' }));
app.post('/api/prompt/:promptId/image', async (req, res) => {
  const { promptId } = req.params;
  const { userId } = req.query;

  const validationResult = validateImageUploadDto({
    userId: Number(userId),
    promptId: Number(promptId),
    image: req.body,
  });

  if (validationResult.length) {
    res.status(400).json(new ValidationErrorDetails("Error uploading image", validationResult));
  } else {
    const imageBuffer = req.body;
    const imageName = `prompts/${promptId}/image.png`;
  
    const [image, error] = await imageService.createImage({
      userId: Number(userId), 
      promptId: Number(promptId), 
      image: imageBuffer
    }, imageName);
  
    if (error) {
      res.status(500).json(new ErrorDetails("Error uploading image", error.details));
    } else {
      res.status(200).json(image);
    }
  }

});

app.use(express.json());


//---------- FRONTEND ----------//
const fePath = path.join(__dirname, '..', '..', 'dist', 'public');
app.use(express.static(fePath));
app.get('/', (_, res) => {
  res.sendFile(path.join(fePath, 'index.html'));
});


//---------- API ----------//
// Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/lobbies', lobbyRouter);
app.use('/api/chains', fullChainDetailsRouter);
app.use('/api/prompts', promptRouter);
app.use('/api/images', imageRouter);

//---------- INIT ----------//
// Health check endpoint
app.get('/health', authenticateRequest, requireRole(['player', 'admin']), (req, res) => {
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
  console.log(`Server running on http://${process.env.EC2_HOST}:${PORT}`);
});

export default app;
