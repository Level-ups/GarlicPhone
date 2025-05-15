
export type GamePhaseName = "Waiting" | "Prompt" | "Draw" | "Guess" | "Review" | "Complete";

export type GamePhase = {
  index: number;
  phase: GamePhaseName;
}

export class GamePhaseList {
  phases: GamePhase[];
  private currentIndex: number;

  constructor() {
    this.phases = [];
    this.currentIndex = 0;
    this.addPhase("Waiting");
    this.addPhase("Prompt");
  }

  private addPhase(phaseName: GamePhaseName): void {
    const newPhase: GamePhase = {
      index: this.phases.length,
      phase: phaseName,
    };
    this.phases.push(newPhase);
  }
  
  addDrawAndGuessPhase() {
    this.addPhase("Draw");
    this.addPhase("Guess");
  }

  addNextGameLoopPhase() {
    const lastPhase = this.phases[this.phases.length - 1];
    if (lastPhase?.phase === 'Prompt' || lastPhase?.phase === "Guess") {
      this.addPhase("Draw");
    } else if (lastPhase?.phase === "Waiting") {
      this.addPhase("Prompt");
    } else {
      this.addPhase("Guess");
    }
  }

  get(index: number): GamePhase | undefined {
    return this.phases[index];
  }

  addReviewAndCompletePhase() {
    this.addPhase("Review");
    this.addPhase("Complete");
  }

  getCurrentPhase(): GamePhase {
    return this.phases[this.currentIndex];
  }

  peekNextPhase(): GamePhase | undefined {
    if (this.currentIndex + 1 < this.phases.length) {
      return this.phases[this.currentIndex + 1];
    }
    return undefined;
  }

  moveToNextPhase(): GamePhase {
    if (this.currentIndex + 1 < this.phases.length) {
      this.currentIndex++;
    }
    return this.phases[this.currentIndex];
  }

  toJSON() {
    return {...this.phases[this.currentIndex], debugDetails: { phases: this.phases, currentIndex: this.currentIndex }};
  }
}
