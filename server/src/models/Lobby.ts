import { randomBytes, UUID } from 'crypto';
import { constants } from '../library/constants';
import { ValidationResult } from "../library/types";
import { GamePhaseList } from './GamePhase';
import { PhasePlayerAssignment } from "./PhasePlayerAssignment";
import { Player } from './Player';

export type LobbyStatus = 'waiting' | 'started' | 'finished';

export type Lobby = {
  id: UUID;
  dbGameId: number;
  code: string;
  players: Player[];
  maxPlayers: number;
  status: LobbyStatus;
  createdAt: Date;
  lastActivity: Date;
  phases: GamePhaseList;
  phasePlayerAssignments: PhasePlayerAssignment[];
}

export function generateLobbyCode(): string {
  // Generate a 6-character alphanumeric code
  const bytesNeeded = Math.ceil(constants.LOBBY_CODE_LENGTH / 2);

  return randomBytes(bytesNeeded)
    .toString('hex')
    .toUpperCase()
    .substring(0, constants.LOBBY_CODE_LENGTH);
}

export function validateLobbyJoinCode(code?: string): ValidationResult[] {
  // Lobby code must be a 6-character alphanumeric string
  const LOBBY_CODE_LENGTH = Number(constants.LOBBY_CODE_LENGTH) ?? 6;
  const alphanumericRegex = new RegExp(`^[A-Za-z0-9]{${LOBBY_CODE_LENGTH}}$`);

  const lobbyJoinCodeValidations: ValidationResult[] = [
    {
      field: "code",
      message: "'code' is required",
      isValid: !!code?.trim(),
    },
    {
      field: "code",
      message: `'code' must be ${LOBBY_CODE_LENGTH} characters long`,
      isValid: code?.length === (LOBBY_CODE_LENGTH),
    },
    {
      field: "code",
      message: "'code' must be alphanumeric",
      isValid: alphanumericRegex.test(code?.trim() ?? ""),
    }
  ]
  
  return lobbyJoinCodeValidations.filter((field) =>!field.isValid);
}

export function validateCreateLobby(input: any): ValidationResult[] {
  const MINIMUM_PLAYERS = process.env.MINIMUM_PLAYERS ?? 2;
  const MAXIMUM_PLAYERS = process.env.MAXIMUM_PLAYERS ?? 10;

  const createLobbyValidations: ValidationResult[] = [
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
      message: `'maxPlayers' must be between ${MINIMUM_PLAYERS} and ${MAXIMUM_PLAYERS}`,
      isValid: input.maxPlayers >= MINIMUM_PLAYERS && input.maxPlayers <= MAXIMUM_PLAYERS,
    }
  ]

  return createLobbyValidations.filter((field) => !field.isValid);;
}

export function validateLobbyUrlId(input: string | UUID): ValidationResult[] {
  const isValidUUID = (uuid: string | UUID | undefined) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid ?? "");
  };

  const lobbyUrlIdValidations: ValidationResult[] = [
    {
      field: "lobbyCode",
      message: "'lobbyCode' is required",
      isValid: !!input?.trim(),
    },
    {
      field: "lobbyCode",
      message: "'lobbyCode' must be a valid UUID",
      isValid: isValidUUID(input)
    }
  ];

  return lobbyUrlIdValidations.filter((field) => !field.isValid);
}