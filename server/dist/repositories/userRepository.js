"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../library/db"));
const utils_1 = require("../library/utils");
// Find all users
async function findAllUsers() {
    const users = await db_1.default.any('SELECT user_id, username, email FROM users');
    return (0, utils_1.toCamelCase)(users);
}
// Find user by ID
async function findUserById(id) {
    const user = await db_1.default.oneOrNone('SELECT user_id, username, email FROM users WHERE user_id = ${id}', { id });
    return (0, utils_1.toCamelCase)(user);
}
// Create a new user
async function insertUser(userData) {
    const user = await db_1.default.one('INSERT INTO users (username, email) VALUES (${username}, ${email}) RETURNING user_id, username, email', userData);
    return (0, utils_1.toCamelCase)(user);
}
// Update a user
async function updateUser(id, userData) {
    const user = await db_1.default.oneOrNone('UPDATE users SET username = ${username}, email = ${email} WHERE user_id = ${id} RETURNING user_id, username, email', { ...userData, id });
    return (0, utils_1.toCamelCase)(user);
}
// Delete a user
async function deleteUser(id) {
    const result = await db_1.default.result('DELETE FROM users WHERE user_id = ${id}', { id });
    return result.rowCount > 0;
}
const userRepository = {
    findAllUsers,
    findUserById,
    insertUser,
    updateUser,
    deleteUser,
};
exports.default = userRepository;
