import { ErrorDetails, InsertErrorDetails } from "../library/error-types";
import { Either } from '../library/types';
import { User } from '../models/User';
import userRepository from '../repositories/userRepository';

async function getAllUsers(): Promise<User[]> {
  return userRepository.findAllUsers();
}

async function getUserById(id: string): Promise<User | null> {
  return userRepository.findUserById(id);
}

async function createUser(userData: Omit<User, 'userId'>): Promise<Either<User, ErrorDetails>> {
  const createdUser = await userRepository.insertUser(userData);
  if (!createdUser) {
    return [undefined, new InsertErrorDetails('Failed to create user')];
  } else {
    return [createdUser];
  }
}

async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  return userRepository.updateUser(id, userData);
}

async function deleteUser(id: string): Promise<boolean> {
  return userRepository.deleteUser(id);
}

const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
