
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
}

export class GamePhaseList {
  private head: GamePhaseNode;
  public current: GamePhaseNode;
  private tail?: GamePhaseNode;

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

  peekNextPhase(): GamePhase | undefined {
    return this.current.next?.value;
  }

  moveToNextPhase(): GamePhase {
    this.current = this.current.next ?? this.current;
    return this.current.value;
  }

  toJSON() {
    return this.current.value;
  }
}
