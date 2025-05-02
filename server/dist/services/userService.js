"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userRepository_1 = __importDefault(require("../repositories/userRepository"));
async function getAllUsers() {
    return userRepository_1.default.findAllUsers();
}
async function getUserById(id) {
    return userRepository_1.default.findUserById(id);
}
async function createUser(userData) {
    return userRepository_1.default.insertUser(userData);
}
async function updateUser(id, userData) {
    return userRepository_1.default.updateUser(id, userData);
}
async function deleteUser(id) {
    return userRepository_1.default.deleteUser(id);
}
const userService = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
exports.default = userService;
