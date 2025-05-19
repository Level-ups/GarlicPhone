// WebSocket dispatching

import { Request, Response, Router } from 'express';
import { ErrorDetails } from "../library/error-types";
import type { Alert, ChainLink, GameCode, GameData, GameId, PlayerId } from "./gameTypes";
import { SUBMISSION_ALERT } from "./gameTypes";
// import { SSECoordinator } from "./sseCoordinator";
import { Server as IOServer } from "socket.io";
import { saveGameDataToDb } from "./saveGame";
import { SockCoordinator } from "./sockCoordinator";
import { getChainIdxForPlayer, transition } from "./transition";

//---------- Setup ----------//

export const gameRouter = Router();
// export const gameSSERouter = Router();

// const coord = new WSCoordinator<Alert["alert"]>();        // ← instantiate WSCoordinator
let coord: SockCoordinator<Alert["alert"]>;
export function initializeCoordinator(io: IOServer) {
    coord = new SockCoordinator(io);
}

const currentGames: { [key: GameCode]: GameData } = {}

const _1hr = 60_000 * 60;
setInterval(clearStaleGames, _1hr);


// Promise-based sleep function that doesn't block the main thread
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
} 
//---------- Game manipulation ----------//

const GAME_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randAlNum = () => GAME_CODE_CHARS[Math.floor(Math.random() * GAME_CODE_CHARS.length)];

// Generate a random hexadecimal string of length `n`
const genGameCode = (n: number = 5) => [...Array(n)].map(randAlNum).join('');

function createNewGame(host: PlayerId): GameCode {
    const createdAt = Date.now()
    const gameId: GameId = 0;
    const gameCode = genGameCode();

    currentGames[gameCode] = {
        gameId,
        createdAt,
        chains: [],
        phase: 0,
        players: [host],
        playerNames: { },
    };

    return gameCode;
}

type AddPlayerResult = "success" | "invalidGame" | "gameAlreadyStarted" | "gameFull";
function addPlayerToGame(gameCode: GameCode, playerId: PlayerId, playerName?: string): AddPlayerResult {
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];
    if (gameData.phase > 0) return "gameAlreadyStarted";
    if (gameData.players.length >= 10) return "gameFull";

    gameData.players.push(playerId);
    if (playerName) gameData.playerNames[playerId] = playerName;

    return "success";
}

type StartGameResult = "success" | "invalidGame" | "noPlayers" | "playerIsNotHost";
async function startGame(gameCode: GameCode, requestor: PlayerId): Promise<StartGameResult> {
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];
    if (gameData.players.length == 0) return "noPlayers";
    if (gameData.players[0] != requestor) return "playerIsNotHost";

    // { startingPlayer: PlayerId, chainId: ChainId, links: ChainLink[] };
    // Initialize chains
    gameData.chains = gameData.players.map((playerId: number) => ({
        startingPlayer: playerId,
        chainId: playerId,
        startingPlayerName: gameData.playerNames[playerId] ?? `Player ${playerId}`,
        links: [],
    }));

    // Start the game progression asynchronously
    await progressGame(gameCode);

    return "success";
}

// Function to progress the game state asynchronously
async function progressGame(gameCode: GameCode) {
    const gameData = currentGames[gameCode];
    if (!gameData) return; // Game might have been deleted

    const progress = async () => {
        console.log(`Progressing game ${gameCode}, current phase: ${gameData.phase}`);
        const ps = await progressState(gameCode);

        console.log(`Progressed game ${gameCode} to phase ${gameData.phase}, result: ${ps}`);
        
        if (ps === "complete") {
            console.log(`Game ${gameCode} completed!`);
            return; // Exit the recursive function when game is complete
        } else if (ps === "in-progress") {
            // Schedule the next progression after a delay
            // This ensures we continue to the next phase
            console.log(`Scheduling next progression for game ${gameCode}`);
            setTimeout(progress, 30_000); // Check every 30 seconds
        } else {
            console.log(`Game ${gameCode} invalid or deleted`);
        }
    };

    await progress(); // Start the initial progression
}

// Alert all players in the specified game of the state to which they must transition
type ProgressStateResult = "complete" | "in-progress" | "invalidGame";
async function progressState(gameCode: GameCode): Promise<ProgressStateResult> {
    console.log('Current games are:', currentGames);
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];

    //----- Gather player data -----//
    if (gameData.phase > 0) {
        // First, notify players to submit their data
        coord.broadcast(gameData.players, SUBMISSION_ALERT, "submission");
        
        // Wait 20 seconds for players to submit their data before transitioning
        // This gives players time to submit their chain links
        await sleep(20000);
    }
    const timeStarted = Date.now();

    //----- Transition -----//
    // Alert all players of state transition
    let isReviewState = false;
    for(let pIdx = 0; pIdx < gameData.players.length; pIdx++) {
        const playerId = gameData.players[pIdx];
        const alert = transition(pIdx, gameData, timeStarted);
        isReviewState ||= alert.phaseType == "review";
        // Send transition immediately instead of with a delay to ensure proper game flow
        coord.dispatch(playerId, alert, "transition");
    }
    if (isReviewState) {
        saveGameDataToDb(gameData); // Async save game data to db
    }
    
    //----- Progress phase -----//
    gameData.phase += 1;
    console.log('gameData.phase [end of progress state]', gameData.phase);
    if (isReviewState) return "complete";
    else return "in-progress";
}

type SubmissionResult = "success" | "invalidGame" | "invalidPlayer";
export function submitChainLink(gameCode: GameCode, playerId: PlayerId, link: ChainLink): SubmissionResult {
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];
    const playerIdx = gameData.players.indexOf(playerId);
    if (playerIdx === -1) return "invalidPlayer";

    // TODO: Consider checking that the submitted link type is valid for the page the player was on
    const chainIdx = getChainIdxForPlayer(playerIdx, gameData.phase, gameData.players.length);
    gameData.chains[chainIdx].links.push(link);

    return "success";
}

const DEFAULT_STALENESS = _1hr;
function clearStaleGames(staleness: number = DEFAULT_STALENESS) {
    let toDel: string[] = [];
    for(let g in currentGames) {
        toDel = [...toDel, ...( (Date.now() - currentGames[g].createdAt > staleness) ? [g] : [] ) ];
    }
    toDel.forEach(deleteGame);
}

function deleteGame(gameCode: GameCode) { delete currentGames[gameCode]; }


//---------- Endpoints ----------//

type ReqCheckType = "playerId";
type ReqCheckResult = { status: number, message: string, details: string[] } | null;
const REQ_CHECKERS: { [key in ReqCheckType]: (req: Request) => ReqCheckResult } = {
    "playerId": (req) => (req.user?.id == null) ? { status: 401, message: "Unauthorized", details: ["User is not authenticated"] } : null,
};

type EndpointResponse = Response<any, Record<string, any>>;
type EndpointHandler = (req: Request, res: Response) => EndpointResponse;
type EndpointHandlerAsync = (req: Request, res: Response) => Promise<EndpointResponse>;
// Wrap an endpoint handler to check for specific common values & handle all other exceptions with a generic error
export function checker(checks: ReqCheckType[], f: EndpointHandler): EndpointHandler {

    return (req, res) => {
        try {
            for (let c of checks) { // Run checks
                const checkRes = REQ_CHECKERS[c](req)
                if (checkRes != null) {
                    return res.status(checkRes.status).json(new ErrorDetails(checkRes.message, checkRes.details));
                }
            }

            return f(req, res); // Attempt handling

        } catch(err: any) { // Generic catch-all
            return res.status(500).json(new ErrorDetails("An unexpected error occurred", [err.message], err.stack));
        }
    };

}

export function checkerAsync(checks: ReqCheckType[], f: EndpointHandlerAsync): EndpointHandlerAsync {

    return async (req, res) => {
        try {
            for (let c of checks) { // Run checks
                const checkRes = REQ_CHECKERS[c](req)
                if (checkRes != null) {
                    return res.status(checkRes.status).json(new ErrorDetails(checkRes.message, checkRes.details));
                }
            }

            return await f(req, res); // Attempt handling

        } catch(err: any) { // Generic catch-all
            return res.status(500).json(new ErrorDetails("An unexpected error occurred", [err.message], err.stack));
        }
    };

}

export function handleFailableReturn(reason: "success" | string, res: Response) {
    return reason == "success"
        ? res.status(201).json({ status: "success" })
        : res.status(500).json({ status: "failed", reason: reason })
}

// Existing HTTP gameRouter endpoints remain unchanged:
gameRouter.post('/create', checker(["playerId"], (req, res) => {
    const playerId = req.user!.id;
    const gameCode = createNewGame(playerId);
    
    return res.status(201).json({ gameCode });
}));

gameRouter.post('/join/:gameCode', checker(["playerId"], (req, res) => {
    const playerId = req.user!.id;
    const playerName = req.user!.name ?? `Player ${playerId}`;
    const { gameCode } = req.params;

    const addRes = addPlayerToGame(gameCode, playerId, playerName);
    return handleFailableReturn(addRes, res);
}));

gameRouter.post('/start/:gameCode', checkerAsync(["playerId"], async (req, res) => {
    const playerId = req.user!.id;
    const { gameCode } = req.params;

    const startRes = await startGame(gameCode, playerId);
    return handleFailableReturn(startRes, res);
}));

gameRouter.get('/me', checker(["playerId"], (req, res) => {
    const playerId = req.user!.id;
    const playerName = req.user!.name;

    return res.status(201).json({ playerId, playerName });
}));


gameRouter.post('/submit/:gameCode', checker(["playerId"], (req, res) => {
    const playerId = req.user!.id;
    const { gameCode } = req.params;
    const { link } = req.body as { link: ChainLink };

    console.log('/submit/:gamecode',link);

    const submitRes = submitChainLink(gameCode, playerId, link);
    return handleFailableReturn(submitRes, res);
}));
