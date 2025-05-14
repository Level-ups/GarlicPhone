import { UUID } from "crypto";
import { ValidationResult } from "../library/types";
import { Chain } from "./Chain";
import { Player } from "./Lobby";

export type GamePhaseName = "Waiting" | "Prompt" | "Draw" | "Guess" | "Review" | "Complete";

export type GamePhase = {
  index: number;
  phase: GamePhaseName;
}

class GamePhaseNode {
  value: GamePhase;
  next?: GamePhaseNode;
  
  constructor(phaseName: GamePhaseName, index?: number) {
    this.value = {
      index: index ?? 0,
      phase: phaseName,
    };
    this.next = undefined;
  }

  addNext(phaseName: GamePhaseName): GamePhaseNode {
    const node = new GamePhaseNode(phaseName, this.value.index + 1);
    this.next = node;
    return this.next;
  }

  pop(): GamePhaseNode | undefined {
    const poppedNode = this.next;
    this.next = undefined;
    return poppedNode;
  }
}

export class GamePhaseList {
  public head: GamePhaseNode;
  public current: GamePhaseNode;
  public tail?: GamePhaseNode;

  constructor() {
    this.head = new GamePhaseNode("Waiting");
    this.tail = this.head.addNext("Prompt");
    this.current = this.head;
  }

  addDrawAndGuessPhase() {
    this.tail = this.tail?.addNext("Draw")
      .addNext("Guess");
  }

  addReviewAndCompletePhase() {
    this.tail = this.tail?.addNext("Review")
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
      this.current = this.head; // Loop back to start
    }
    return this.current.value;
  }
}

export class PhasePlayerAssignment {
  phase: GamePhase;
  drawer: Player;
  guesser: Player;
  chain: Chain;

  constructor(phase: GamePhase, drawer: Player, guesser: Player, chain: Chain) {
    this.phase = phase;
    this.drawer = drawer;
    this.guesser = guesser;
    this.chain = chain;
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
