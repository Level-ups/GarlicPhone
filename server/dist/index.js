"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const userRoutes_1 = require("./routes/userRoutes");
const authRoutes_1 = require("./routes/authRoutes");
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('common'));
// Routes
app.use('/api/users', userRoutes_1.userRouter);
app.use('/api/auth', authRoutes_1.authRouter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
exports.default = app;
