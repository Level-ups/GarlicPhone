import { Chain } from "./Chain";
import { GamePhase } from "./GamePhase";
import { Player } from './Player';


export class PhasePlayerAssignment {
  phase: GamePhase;
  player: Player;
  chain: Chain;

  constructor(phase: GamePhase, player: Player, chain: Chain) {
    this.phase = phase;
    this.player = player;
    this.chain = chain;
  }
}
