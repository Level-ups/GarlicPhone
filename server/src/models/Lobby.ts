import { UUID } from "crypto";
import { ValidationResult } from "../library/types";
import { deepCloneWithPrototype } from "../library/utils";
import { Chain } from "./Chain";
import { Game } from "./Game";
import { User } from "./User";

export type GamePhaseName = "Waiting" | "Prompt" | "Draw" | "Guess" | "Review" | "Complete";

export type GamePhase = {
  promptIndex: number;
  phase: GamePhaseName;
}

class GamePhaseNode {
  value: GamePhase;
  next: GamePhaseNode | null;
  
  constructor(phaseName: GamePhaseName, index?: number) {
    this.value = {
      promptIndex: index ?? 0,
      phase: phaseName,
    };
    this.next = null;
  }

  addNext(phaseName: GamePhaseName): GamePhaseNode {
    const node = new GamePhaseNode(phaseName, this.value.promptIndex + 1);
    this.next = node;
    return this.next;
  }
}

class GamePhaseList {
  public head: GamePhaseNode;
  public current: GamePhaseNode;
  public tail: GamePhaseNode;

  constructor() {
    this.head = new GamePhaseNode("Waiting");
    this.tail = this.head.addNext("Prompt");
    this.current = this.head;
  }

  addDrawAndGuessPhase() {
    this.tail = this.tail.addNext("Draw")
      .addNext("Guess");
  }

  addReviewAndCompletePhase() {
    this.tail = this.tail.addNext("Review")
     .addNext("Complete");
  }

  getCurrentPhase(): GamePhase {
    return this.current.value;
  }

  peekNextPhase(): GamePhase {
    return this.current.next ? this.current.next.value : this.head.value;
  }

  moveToNextPhase(): GamePhase {
    if (this.current.next) {
      this.current = this.current.next;
    } else {
      // TODO: Game over, terminate
    }
    return this.current.value;
  }
}

export class PhasePlayerAssignment {
  phase: GamePhase;
  drawer: User;
  guesser: User;
  chain: Chain;

  constructor(phase: GamePhase, drawer: User, guesser: User, chain: Chain) {
    this.phase = phase;
    this.drawer = drawer;
    this.guesser = guesser;
    this.chain = chain;
  }
}

export class Lobby {
  public chainSize: number;
  code: UUID;
  players: User[];
  currentPhase: GamePhase;
  nextPhase: GamePhase;
  private phases: GamePhaseList;
  phasePlayerAssignments: PhasePlayerAssignment[];
  game?: Game;
  chainPhases: GamePhaseList[];

  constructor(owner: User, chainSize: number) {
    this.chainSize = chainSize;
    this.players = owner ? [owner] : [];
    this.code = crypto.randomUUID();
    this.phases = new GamePhaseList();
    this.currentPhase = this.phases.getCurrentPhase();
    this.nextPhase = this.phases.peekNextPhase();
    this.phasePlayerAssignments = [];
    this.chainPhases = [];
  }
  
  addPlayer(user: User): Lobby | undefined {
    const playerAlreadyInLobby = this.players.find((player) => player.id === user.id);
    if (playerAlreadyInLobby) {
      return undefined;
    } else {
      this.players.push(user);
      this.phases.addDrawAndGuessPhase();
      
      return this;
    }
    
  }
  
  assignPlayersAndPhases(chainLength: number, chains: Chain[]): Lobby {
    const phases = deepCloneWithPrototype(this.phases);
    
    while (phases.getCurrentPhase().phase !== "Prompt") {
      phases.moveToNextPhase();
    }

    let chainPhases: GamePhaseList[] = [];
    this.phasePlayerAssignments = chains.flatMap((chain, chainIndex) => {
      const phasesForChain = deepCloneWithPrototype(phases);
      chainPhases.push(phasesForChain);
      const chainPlayers = this.players;
      const assignments: PhasePlayerAssignment[] = [];
      
      for (let i = 0; i < chainLength; i++) {
        phasesForChain.addDrawAndGuessPhase();
      }

      for (let phaseIndex = 0; phaseIndex < chainLength; phaseIndex++) {
        const drawerIndex = (chainIndex * chainLength + phaseIndex) % chainPlayers.length;
        const guesserIndex = (drawerIndex + 1) % chainPlayers.length;
        
        assignments.push(new PhasePlayerAssignment(
          phasesForChain.getCurrentPhase(),
          this.players[drawerIndex],
          this.players[guesserIndex],
          chain
        ));
        phasesForChain.moveToNextPhase();
      }
      return assignments;
    });

    this.phases.addReviewAndCompletePhase();
    this.chainPhases = chainPhases;
    return this;
  }
  
  progressPhase(): Lobby {
    this.phases.moveToNextPhase();
    this.currentPhase = this.phases.getCurrentPhase();
    this.nextPhase = this.phases.peekNextPhase();
    return this;
  }

  removePlayer(user: User): Lobby | undefined {
    const playerIndex = this.players.findIndex((player) => player.id === user.id);
    if (playerIndex === -1) {
      return undefined;
    } else {
      this.players.splice(playerIndex, 1);
      return this;
    }
  }

  setGame(game: Game): Lobby {
    this.game = game;
    return this;
  }

  getPhaseByIndex(index: number): PhasePlayerAssignment | undefined {
    return this.phasePlayerAssignments.find((phase) => phase.phase.promptIndex === index);
  }

  toJSON() {
    return {
      code: this.code,
      players: this.players,
      currentPhase: this.currentPhase,
      nextPhase: this.nextPhase,
      phasePlayerAssignments: this.phasePlayerAssignments,
      game: this.game,
      chainPhases: this.chainPhases,
    };
  }
}

export function validateLobbyCode(input: string | UUID): ValidationResult[] {
  function isValidUUID(uuid: string | UUID) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  const invalidFields: ValidationResult[] = [
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
  ].filter((field) => !field.isValid);
  return invalidFields;
}

export function validateLobbyAndUserId(lobbyCode: string | UUID, userId: number): ValidationResult[] {
  const invalidFields: ValidationResult[] = [
    {
      field: "userId",
      message: "'userId' is required",
      isValid: !!userId,
    }
  ].filter((field) => !field.isValid);
  return invalidFields.concat(validateLobbyCode(lobbyCode));
}