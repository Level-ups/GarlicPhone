// State machine transition functions determining how the game should progress from the current state

import type { PhaseIndex, PhaseType, PlayerIndex, GameData, ChainIndex, TransitionAlert, Timestamp, ChainPrompt, ChainImage, ChainData, ChainInfo } from "./gameTypes";


//---------- Utils ----------//

// Determine the corresponding phase type based on the phase index
export function phaseToPhaseType(phase: PhaseIndex, numPhases: number): PhaseType {
    if (phase >= numPhases-1)   { return "review"; }
    if (phase == 1)             { return "prompt"; }
    if (phase % 2 == 0)         { return "draw";   } // 2, 4, 6, ..., numPhases
    if (phase % 2 == 1)         { return "guess";  } // 3, 5, 7, ..., numPhases
    return "lobby";                                  // 0
}

// Calculate the chain index for a given player in a certain phase
export function getChainIdxForPlayer(playerIdx: PlayerIndex, phase: PhaseIndex, numPlayers: number): ChainIndex {
    return (playerIdx + phase - 1) % numPlayers;
}

function chainDataToChainInfo(chainData: ChainData): ChainInfo {
    return {
        name: chainData.startingPlayerName, // TODO: Lookup player name
        links: chainData.links
    };
}

//---------- State transition ----------//

// Given the current navigation state for a player,
// determine the next state after timer runs out
export function transition(playerIdx: PlayerIndex, gameData: GameData, timeStarted: Timestamp): TransitionAlert {
    const { players, phase: fromPhase } = gameData;

    // Calculate transition values
    const numPhases = 2 + players.length; // lobby + (draw|guess)*n + review
    const toPhase = fromPhase + 1;
    const toPhaseType: PhaseType = phaseToPhaseType(toPhase, numPhases);
    const toChainIdx = getChainIdxForPlayer(playerIdx, toPhase, players.length);

    // Add additional phase-specific data
    let alertData = {};
    if (["prompt", "draw", "guess"].includes(toPhaseType)) { alertData = { ...alertData, timeStarted }}
    if (toPhaseType == "draw") {
        alertData = { ...alertData, prompt: (gameData.chains[toChainIdx].links.at(-1) as ChainPrompt)?.prompt }
    }
    else if (toPhaseType == "guess") {
        alertData = { ...alertData, imgSrc: (gameData.chains[toChainIdx].links.at(-1) as ChainImage)?.url }
    }
    else if (toPhaseType == "review") {
        alertData = { ...alertData, chains: gameData.chains.map(chainDataToChainInfo) }
    }

    return {
        alert: "transition",
        phaseType: toPhaseType,
        ...alertData
    };
}