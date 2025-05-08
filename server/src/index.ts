import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import morgan from 'morgan';
import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';

//---------- SETUP ----------//
// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('common'));


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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
