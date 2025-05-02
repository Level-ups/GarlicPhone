import 'dotenv/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import userRepository from '../repositories/userRepository'; // Import the actual repository
import userService from './userService';

// Mock the userRepository directly, matching the actual method names
vi.mock('../repositories/userRepository', () => ({
  __esModule: true,
  default: {
    findAllUsers: vi.fn(),
    findUserById: vi.fn(),
    insertUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('userService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      (userRepository.findAllUsers as any).mockResolvedValue([{ id: 1, name: 'Test User' }]);
      const result = await userService.getAllUsers();
      expect(userRepository.findAllUsers).toHaveBeenCalledWith(); // Corrected method name and expectation
      expect(result).toEqual([{ id: 1, name: 'Test User' }]);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      (userRepository.findUserById as any).mockResolvedValue({ id: '1', name: 'Test User' });
      const result = await userService.getUserById('1');
      expect(userRepository.findUserById).toHaveBeenCalledWith('1'); // Corrected method name and expectation
      expect(result).toEqual({ id: '1', name: 'Test User' });
    });

    it('should return null when user not found', async () => {
      (userRepository.findUserById as any).mockResolvedValue(null);
      const result = await userService.getUserById('999');
      expect(userRepository.findUserById).toHaveBeenCalledWith('999'); // Corrected method name and expectation
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create new user', async () => {
      const createdUser = { userId: '2', username: 'New User', email: 'new@example.com' };
      (userRepository.insertUser as any).mockResolvedValue(createdUser); // insertUser returns the created user
      const userData = { username: 'New User', email: 'new@example.com' };
      const result = await userService.createUser(userData);
      expect(userRepository.insertUser).toHaveBeenCalledWith(userData); // Corrected method name and expectation
      expect(result).toEqual(createdUser);
    });
  });

  describe('updateUser', () => {
    it('should update existing user', async () => {
      const updatedUser = { userId: '1', username: 'Updated Name', email: 'example@EMAIL' };
      (userRepository.updateUser as any).mockResolvedValue(updatedUser); // updateUser returns the updated user or null
      const updateData = { username: 'Updated Name' };
      const result = await userService.updateUser('1', updateData);
      expect(userRepository.updateUser).toHaveBeenCalledWith('1', updateData); // Corrected method name and expectation
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      (userRepository.deleteUser as any).mockResolvedValue(true); // deleteUser returns boolean
      const result = await userService.deleteUser('1');
      expect(userRepository.deleteUser).toHaveBeenCalledWith('1'); // Corrected method name and expectation
      expect(result).toBe(true);
    });
  });
});
