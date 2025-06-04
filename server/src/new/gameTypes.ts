//---------- Types ----------//

export type GameId = number;
export type GameCode = string; // Lobby code used by players

export type GameData = {
    gameId: GameId;         // Only used internally for DB transactions
    createdAt: Timestamp;
    players: PlayerId[];    // First player in the list is the host; If host leaves, 2nd to join is promoted
    chains: ChainData[];
    phase: PhaseIndex;      // [0, numPhases)
    playerNames: {
        [playerId: PlayerId]: string;
    };
};

export type PlayerId = number;
export type PlayerIndex = number;

export type PhaseIndex = number;
export type PhaseType = "lobby" | "prompt" | "draw" | "guess" | "review";

export type ChainIndex = number;
export type ChainId = number;

export type PlayerState = {
    playerIdx: PlayerIndex; // Index into gameData.players
    phaseType: PhaseType;
    chainIdx: ChainIndex;   // Index into gameData.chains
}

export type PlayerData = {
    playerId: PlayerId,
    name: string,
    avatarURL: string,
    isHost: boolean
}

export type Timestamp = number; // Time since Unix epoch in millis

export type ChainPrompt = { type: "prompt", prompt: string };
export type ChainImage = { type: "image", url: string };
export type ChainLink = ChainPrompt | ChainImage;
export type ChainInfo = { name: string, links: ChainLink[] }; // Sent to frontend
export type ChainData = { startingPlayer: PlayerId, startingPlayerName: string, chainId: ChainId, links: ChainLink[] }; // For backend use only

export type Alert = UpdateAlert | SubmissionAlert | TransitionAlert;

// Alerts player to synchronize their current state with the server
// `phaseType` marks which page the update is intended for
export type UpdateAlert = { alert: "update", phaseType: PhaseType; } & (
    { phaseType: "lobby", players: PlayerData[] }
);

// Alerts player to submit the current data they have for their phase
export type SubmissionAlert = { alert: "submission" };
export const SUBMISSION_ALERT: SubmissionAlert = { alert: "submission" };

// Alerts player that they need to transition to a new page state &
// provides initialization data for that state
export type TransitionAlert = { alert: "transition" } & (
    { phaseType: PhaseType } |
    { phaseType: "prompt", timeStarted: Timestamp } |
    { phaseType: "draw", timeStarted: Timestamp, prompt: string } |
    { phaseType: "guess", timeStarted: Timestamp, imgSrc: string } |
    { phaseType: "review", chains: ChainInfo[] }
);