import { randomBytes } from 'crypto';
import { ValidationResult } from "../library/types";

export type Player = {
  id: string;
  name: string;
  avatarUrl: string;
  isHost: boolean;
  isReady: boolean;
};

export type LobbyStatus = 'waiting' | 'started' | 'finished';

export type Lobby = {
  id: string;
  code: string;
  players: Player[];
  maxPlayers: number;
  status: LobbyStatus;
  createdAt: Date;
  lastActivity: Date;
};

export function generateLobbyCode(): string {
  // Generate a 6-character alphanumeric code
  return randomBytes(3)
    .toString('hex')
    .toUpperCase()
    .substring(0, 6);
}

export function validateLobbyCode(code: string): boolean {
  // Lobby code must be a 6-character alphanumeric string
  return /^[A-Za-z0-9]{6}$/.test(code);
}

export function validateCreateLobby(input: any): ValidationResult[] {
  const invalidFields: ValidationResult[] = [
    {
      field: "hostId",
      message: "'hostId' is required",
      isValid: !!input.hostId?.trim(),
    },
    {
      field: "hostName",
      message: "'hostName' is required",
      isValid: !!input.hostName?.trim(),
    },
    {
      field: "maxPlayers",
      message: "'maxPlayers' must be between 2 and 10",
      isValid: input.maxPlayers >= 2 && input.maxPlayers <= 10,
    }
  ].filter((field) => !field.isValid);
  return invalidFields;
} 