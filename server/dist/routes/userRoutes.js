"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const types_1 = require("../library/types");
const userService_1 = __importDefault(require("../services/userService"));
const router = (0, express_1.Router)();
exports.userRouter = router;
// User routes
router.get('/', async (req, res) => {
    const users = await userService_1.default.getAllUsers();
    res.json(users);
});
router.get('/:id', async (req, res) => {
    const user = await userService_1.default.getUserById(req.params.id);
    if (!user) {
        res.status(404).json(new types_1.ErrorResponse('User not found'));
    }
    else {
        res.json(user);
    }
});
router.post('/', (req, res) => {
    res.json(userService_1.default.createUser(req.body));
});
router.put('/:id', (req, res) => {
    res.json(userService_1.default.updateUser(req.params.id, req.body));
});
router.delete('/:id', (req, res) => {
    res.json(userService_1.default.deleteUser(req.params.id));
});
