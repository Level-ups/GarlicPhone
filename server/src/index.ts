import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { ErrorDetails, NotFoundErrorDetails, ValidationErrorDetails } from './library/error-types';
import { cleanupInactiveClients, registerClient, removeClient } from './library/lobbyEventBroadcaster';
import { createServerSentEventHandler } from './library/serverSentEvents';
import { validateImageUploadDto } from './models/Image';
import { authRouter } from './routes/authRoutes';
import { fullChainDetailsRouter } from './routes/fullChainDetailsRoutes';
import { imageRouter } from './routes/imageRoutes';
import { lobbyRouter } from './routes/lobbyRoutes';
import { promptRouter } from './routes/promptRoutes';
import { userRouter } from './routes/userRoutes';
import imageService from './services/imageService';
import * as lobbyService from './services/lobbyService';
import { cleanupExpiredLobbies } from './services/lobbyService';

//---------- SETUP ----------//import { createServerSentEventHandler } from './library/serverSentEvents';
import { authenticateRequest, requireRole } from './library/authMiddleware';
import { validateLobbyUrlId } from './models/Lobby';

//---------- SETUP ----------//
//
// Load environment variables
dotenv.config();
// Initialize express app
const app = express();
const PORT = Number(process.env.PORT) || 5000;
const EC2_HOST =  process.env.EC2_HOST

// Middleware
app.use(cors());

// the upload image route should not be parsed as JSON
app.post('/api/chain/:chainId/latest-image', authenticateRequest, express.raw({ type: 'image/png', limit: '10mb' }), async (req, res) => {
  try {
    const { chainId } = req.params;
    const userId = req.user?.id;

    console.log("Image buffer length:", req.body.length);

    if (!userId) {
      res.status(401).json(new ErrorDetails("Unauthorized"));
      return;
    }

    const validationResult = validateImageUploadDto({
      userId: Number(userId),
      chainId: Number(chainId),
      image: req.body,
    });

    if (validationResult.length) {
      res.status(400).json(new ValidationErrorDetails("Error uploading image", validationResult));
    } else {

      const imageName = `prompts/${chainId}/image.png`;
    
      const [image, error] = await imageService.createImage({
        userId: Number(userId), 
        chainId: Number(chainId), 
        image: req.body
      }, imageName);
    
      if (error) {
        res.status(500).json(new ErrorDetails("Error uploading image", error.details));
      } else {
        res.status(200).json(image);
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

app.use(express.json());


//---------- API ----------//
// Routes
// Connect to lobby updates via Server-Sent Events
app.get('/api/lobbies/:lobbyId/events', createServerSentEventHandler(sendEvent => {
  try {
    // Access the lobbyId from the request
    if (!sendEvent.request) {
      sendEvent('error', new NotFoundErrorDetails('Lobby ID not found'));
      return;
    }
    
    const lobbyId = sendEvent.request.params.lobbyId;

    const validationResults = validateLobbyUrlId(lobbyId);

    if (validationResults.length) {
      sendEvent('error', new ValidationErrorDetails('Validation failed', validationResults));
      return;
    }
    
    // Send initial lobby state
    try {
      const [lobby, findLobbyError] = lobbyService.getLobbyById(lobbyId);
      if (findLobbyError) {
        sendEvent('error', findLobbyError);
        return;
      }

      sendEvent('lobby_state', lobby);
      
      // Register this client for lobby updates
      registerClient(lobbyId, sendEvent);
      
      // Clean up when the client disconnects
      sendEvent.request.on('close', () => {
        removeClient(lobbyId, sendEvent);
      });
    } catch (error: any) {
      sendEvent('error', new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
    }
  } catch (error: any) {
    sendEvent('error', new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
}));
app.use('/api/users', authenticateRequest, userRouter);
app.use('/api/auth', authRouter);
app.use('/api/lobbies', authenticateRequest, lobbyRouter);
app.use('/api/chains', authenticateRequest, fullChainDetailsRouter);
app.use('/api/prompts', authenticateRequest, promptRouter);
app.use('/api/images', authenticateRequest, imageRouter);

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


//---------- FRONTEND ----------//
// const fePath = path.join(__dirname, '..', '..', 'public');
const fePath = path.join(__dirname, '..', 'dist', 'public');
app.use(express.static(fePath));
app.get('/*', (_, res) => {
  res.sendFile(path.join(fePath, 'index.html'));
});

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
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://${EC2_HOST}:${PORT}`);
});

// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/your-domain/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/your-domain/fullchain.pem')
// };

// https.createServer(options, app).listen(443, () => {
//   console.log('HTTPS server running on port 443');
// });

export default app;
