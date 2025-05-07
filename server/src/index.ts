import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(Number(process.env.PORT) || 5000, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

export default app;
