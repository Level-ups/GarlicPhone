// User type
export type User = {
  userId: string;
  username: string;
  email: string;
};

/**
 * This file demonstrates the separation of concerns:
 * - Models directory contains type definitions and business logic
 * - Repositories directory handles database access
 */
