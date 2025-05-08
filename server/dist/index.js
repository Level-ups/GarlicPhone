"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const userRoutes_1 = require("./routes/userRoutes");
const authRoutes_1 = require("./routes/authRoutes");
//---------- SETUP ----------//
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('common'));
//---------- FRONTEND ----------//
const fePath = path_1.default.join(__dirname, 'dist', 'public');
app.use(express_1.default.static(fePath));
app.get('*', (_, res) => {
    res.sendFile(path_1.default.join(fePath, 'index.html'));
});
//---------- API ----------//
// Routes
app.use('/api/users', userRoutes_1.userRouter);
app.use('/api/auth', authRoutes_1.authRouter);
//---------- INIT ----------//
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
exports.default = app;
