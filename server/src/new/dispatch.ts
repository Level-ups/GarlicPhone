// WebSocket dispatching

import { ErrorDetails } from "../library/error-types";
import type { GameId, GameData, GameCode, PlayerId, Alert, ChainLink } from "./gameTypes";
import { SUBMISSION_ALERT } from "./gameTypes";
import { Router, Request, Response } from 'express';
// import { SSECoordinator } from "./sseCoordinator";
import { SockCoordinator } from "./sockCoordinator";
import { getChainIdxForPlayer, transition } from "./transition";
import { saveGameDataToDb } from "./saveGame";
import { Server as IOServer, Socket } from "socket.io";

//---------- Setup ----------//

export const gameRouter = Router();
// export const gameSSERouter = Router();

// const coord = new WSCoordinator<Alert["alert"]>();        // ← instantiate WSCoordinator
let coord: SockCoordinator<Alert["alert"]>;
export function initializeCoordinator(io: IOServer) {
    coord = new SockCoordinator(io);
}

const currentGames: { [key: GameCode]: GameData } = {}

const _1hr = 60_000;
setInterval(clearStaleGames, _1hr);


const sleep = (ms: number) => {
    let start = new Date().getTime(), expire = start + ms;
    while (new Date().getTime() < expire) { }
    return;
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
        players: [host]
    };

    return gameCode;
}

type AddPlayerResult = "success" | "invalidGame" | "gameAlreadyStarted" | "gameFull";
function addPlayerToGame(gameCode: GameCode, playerId: PlayerId): AddPlayerResult {
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];
    if (gameData.phase > 0) return "gameAlreadyStarted";
    if (gameData.players.length >= 10) return "gameFull";

    gameData.players.push(playerId);

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
        links: [],
    }));

    // Start the game progression asynchronously
    progressGame(gameCode);

    return "success";
}

// Function to progress the game state asynchronously
function progressGame(gameCode: GameCode) {
    const gameData = currentGames[gameCode];
    if (!gameData) return; // Game might have been deleted

    const progress = () => {
        const ps = progressState(gameCode);
        if (ps !== "complete") {
            setTimeout(progress, 10_000); // Check every 1 second (adjust as needed)
        } else {
            console.log(`Game ${gameCode} completed!`);
        }
    };

    progress(); // Start the initial progression
}

// Alert all players in the specified game of the state to which they must transition
type ProgressStateResult = "complete" | "in-progress" | "invalidGame";
function progressState(gameCode: GameCode): ProgressStateResult {
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];

    //----- Gather player data -----//
    if (gameData.phase > 0) {
        coord.broadcast(gameData.players, SUBMISSION_ALERT, "submission");
        // sleep(4000); // Wait for players to submit their data
    }
    const timeStarted = Date.now();

    //----- Transition -----//
    // Alert all players of state transition
    let isReviewState = false;
    for(let pIdx = 0; pIdx < gameData.players.length; pIdx++) {
        const playerId = gameData.players[pIdx];
        const alert = transition(pIdx, gameData, timeStarted);
        isReviewState ||= alert.phaseType == "review";
        setTimeout(() => { coord.dispatch(playerId, alert, "transition"); }, 6_000);
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
    const { gameCode } = req.params;

    const addRes = addPlayerToGame(gameCode, playerId);
    return handleFailableReturn(addRes, res);
}));

gameRouter.post('/start/:gameCode', checker(["playerId"], (req, res) => {
    const playerId = req.user!.id;
    const { gameCode } = req.params;

    const startRes = startGame(gameCode, playerId);
    return handleFailableReturn("success", res);
}));

gameRouter.get('/me', checker(["playerId"], (req, res) => {
    const playerId = req.user!.id;

    return res.status(201).json({ playerId });
}));


gameRouter.post('/submit/:gameCode', checker(["playerId"], (req, res) => {
    const playerId = req.user!.id;
    const { gameCode } = req.params;
    const { link } = req.body as { link: ChainLink };

    console.log('/submit/:gamecode',link);

    const submitRes = submitChainLink(gameCode, playerId, link);
    return handleFailableReturn(submitRes, res);
}));
