import { ErrorDetails, InsertErrorDetails } from "../library/error-types";
import { Either } from '../library/types';
import { User, UserDto } from '../models/User';
import userRepository from '../repositories/userRepository';

async function getAllUsers(): Promise<Either<User[], ErrorDetails>> {
  try {
    const users = await userRepository.findAllUsers();
    if (!users) {
      return [undefined, new ErrorDetails('Failed to retrieve users')];
    } else {
      return [users, undefined];
    }
  } catch (error) {
    return [undefined, new ErrorDetails('Failed to retrieve users')];
  }
}

async function getUserById(id: string): Promise<Either<User, ErrorDetails>> {
  try {
    const user = await userRepository.findUserById(id);
    if (!user) {
      return [undefined, new ErrorDetails('User not found')];
    } else {
      return [user];
    }
  } catch (error) {
    return [undefined, new ErrorDetails('Failed to retrieve user')];
  }
}

async function getUserByGoogleId(id: string): Promise<Either<User, ErrorDetails>> {
  try {
    const user = await userRepository.findUserByGoogleId(id);
    if (!user) {
      return [undefined, new ErrorDetails('User not found')];
    } else {
      return [user];
    }
  } catch (error) {
    return [undefined, new ErrorDetails('Failed to retrieve user')];
  }
}

async function createUser(userData: UserDto): Promise<Either<User, ErrorDetails>> {
  try {
    const createdUser = await userRepository.insertUser(userData);
    if (!createdUser) {
      return [undefined, new InsertErrorDetails('Failed to create user')];
    } else {
      return [createdUser];
    }
  } catch (error) {
    return [undefined, new InsertErrorDetails('Failed to create user')];
  }
}

async function updateUser(id: string, userData: UserDto): Promise<Either<User, ErrorDetails>> {
  try {
    const updatedUser = await userRepository.updateUser(id, userData);
    if (!updatedUser) {
      return [undefined, new ErrorDetails('Failed to update user')];
    } else {
      return [updatedUser];
    }
  } catch (error) {
    return [undefined, new ErrorDetails('Failed to update user')];
  }
}

async function deleteUser(id: string): Promise<Either<boolean, ErrorDetails>> {
  try {
    const deletedUser = await userRepository.deleteUser(id);
    if (!deletedUser) {
      return [undefined, new ErrorDetails('Failed to delete user')];
    } else {
      return [deletedUser];
    }
  } catch (error) {
    return [undefined, new ErrorDetails('Failed to delete user')];
  }
}

const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByGoogleId
};

export default userService;
