import db from '../library/db';
import { toCamelCase } from '../library/utils';
import { User } from '../models/User';

// Find all users
async function findAllUsers(): Promise<User[]> {
  const users = await db.any('SELECT user_id, username, email FROM users');
  return toCamelCase(users);
}

// Find user by ID
async function findUserById(id: string): Promise<User | null> {
  const user = await db.oneOrNone(
    'SELECT user_id, username, email FROM users WHERE user_id = ${id}',
    { id }
  );
  return toCamelCase(user);
}

// Create a new user
async function insertUser(userData: Omit<User, 'userId'>): Promise<User> {
  const user = await db.one(
    'INSERT INTO users (username, email) VALUES (${username}, ${email}) RETURNING user_id, username, email',
    userData
  );
  return toCamelCase(user);
}

// Update a user
async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const user = await db.oneOrNone(
    'UPDATE users SET username = ${username}, email = ${email} WHERE user_id = ${id} RETURNING user_id, username, email',
    { ...userData, id }
  );
  return toCamelCase(user);
}

// Delete a user
async function deleteUser(id: string): Promise<boolean> {
  const result = await db.result('DELETE FROM users WHERE user_id = ${id}', { id });
  return result.rowCount > 0;
}

const userRepository = {
  findAllUsers,
  findUserById,
  insertUser,
  updateUser,
  deleteUser,
};

export default userRepository;
