// SSE dispatching

import { ErrorDetails } from "../library/error-types";
import type { GameId, GameData, GameCode, PlayerId, Alert, ChainLink } from "./gameTypes";
import { SUBMISSION_ALERT } from "./gameTypes";
import { Router, Request, Response } from 'express';
import { SSECoordinator } from "./sseCoordinator";
import { getChainIdxForPlayer, transition } from "./transition";
import { saveGameDataToDb } from "./saveGame";

//---------- Setup ----------//

export const gameRouter = Router();

const coord = new SSECoordinator<Alert["alert"]>();
const currentGames: { [key: GameCode]: GameData } = {}

const _1hr = 60_000;
setInterval(clearStaleGames, _1hr);


const sleep: ((ms: number) => void) = (ms) => new Promise(res => setTimeout(res, ms));

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
function startGame(gameCode: GameCode, requestor: PlayerId): StartGameResult {
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];
    if (gameData.players.length == 0) return "noPlayers";
    if (gameData.players[0] != requestor) return "playerIsNotHost";

    // Initialize chains
    gameData.chains = [...Array(gameData.players.length)];

    // Apply first transition
    progressState(gameCode);

    return "success";
}

// Alert all players in the specified game of the state to which they must transition
type ProgressStateResult = "success" | "invalidGame";
function progressState(gameCode: GameCode): ProgressStateResult {
    if (!(gameCode in currentGames)) return "invalidGame";
    const gameData = currentGames[gameCode];

    //----- Gather player data -----//
    coord.broadcast(gameData.players, SUBMISSION_ALERT, "submission");
    sleep(2000); // Wait for players to submit their data

    //----- Progress phase -----//
    gameData.phase += 1;
    const timeStarted = Date.now();

    //----- Transition -----//
    // Alert all players of state transition
    let isReviewState = false;
    for(let pIdx = 0; pIdx < gameData.players.length; pIdx++) {
        const alert = transition(pIdx, gameData, timeStarted);
        isReviewState ||= alert.phaseType == "review";
        coord.dispatch(pIdx, alert, "transition");
    }

    if (isReviewState) {
        saveGameDataToDb(gameData); // Async save game data to db
    }

    return "success";
}

type SubmissionResult = "success" | "invalidGame" | "invalidPlayer";
function submitChainLink(gameCode: GameCode, playerId: PlayerId, link: ChainLink): SubmissionResult {
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
// Wrap an endpoint handler to check for specific common values & handle all other exceptions with a generic error
function checker(checks: ReqCheckType[], f: EndpointHandler): EndpointHandler {

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

function handleFailableReturn(reason: "success" | string, res: Response) {
    return reason == "success"
        ? res.status(201).json({ status: "success" })
        : res.status(500).json({ status: "failed", reason: reason })
}



// Connect to the SSE coordinator
gameRouter.post('/connect', checker(["playerId"], (req: Request, res: Response) => {
    const playerId = req.user!.id;

    const connectRes = coord.addClient(playerId, res);
    return handleFailableReturn(connectRes, res);
}));

// Create a new game
gameRouter.post('/create', checker(["playerId"], (req: Request, res: Response) => {
    const playerId = req.user!.id;
    const gameCode = createNewGame(playerId);
    
    return res.status(201).json({ gameCode });
}));

// Add new player
gameRouter.post('/join/:gameCode', checker(["playerId"], (req: Request, res: Response) => {
    const playerId = req.user!.id;
    const { gameCode } = req.params;

    const addRes = addPlayerToGame(gameCode, playerId);
    return handleFailableReturn(addRes, res);
}));

// Start game
gameRouter.post('/start/:gameCode', checker(["playerId"], (req: Request, res: Response) => {
    const playerId = req.user!.id;
    const { gameCode } = req.params;

    const startRes = startGame(gameCode, playerId);
    return handleFailableReturn(startRes, res);
}));


// Submit another link to the chain
gameRouter.post('/submit/:gameCode', checker(["playerId"], (req: Request, res: Response) => {
    const playerId = req.user!.id;
    const { gameCode } = req.params;
    const { link } = req.body as { link: ChainLink };

    const submitRes = submitChainLink(gameCode, playerId, link);
    return handleFailableReturn(submitRes, res);
}));