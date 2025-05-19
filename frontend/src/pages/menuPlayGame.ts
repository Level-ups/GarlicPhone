import { menuNav } from "../components/menuNav";
import { createButton, createInput } from "../components/ui";
import { apiFetch } from "../lib/fetch";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { der, sig } from "../lib/util/signal";
import wavingGarlic from "/assets/waving-garlic.png";
type PlayerInfo = {
    id: number;
    name: string;
    avatarUrl?: string;
    isHost?: boolean;
    isReady?: boolean
};

async function createGame() {
    const res = await apiFetch("post", "/api/games/create", {});

    const data = await res.json();

    return data as { gameCode: string };
}

async function joinGame(gameCode: string) {
    const res = await apiFetch("post", `/api/games/join/${gameCode}`, {});

    const data = await res.json();
    debugLog("JOIN LOBBY:", data);

    return data;
}



export const menuPlayGamePage: PageRenderer = ({ page }, { globalState, onUpdate }) => {
    //----- Initialization ----//
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const urlCode = params.get('code');
    if (token) {
        debugLog('Token received');
        sessionStorage.setItem("google-id-token", token);
        
        // // Only attempt to initialize socket if we haven't already done so in this session
        // // and we're not currently in the process of initializing
        // const sseInitializing = sessionStorage.getItem("socket-init");
        
        // if (sseInitializing) {
        //     // Mark as initializing to prevent concurrent initialization attempts
        //     sessionStorage.setItem("socket-init", "true");
            
        //     // Use setTimeout to ensure router is initialized before accessing it
        //     setTimeout(() => {
        //         try
        //         {
        //             if (router == null)             { debugErr('> ROUTER UNAVAILABLE'); return; }
        //             if (router.socketInitialized()) { debugLog('> SOCKET ALREADY INITIALIZED, SKIPPING'); return; }

        //             debugLog('> ATTEMPTING SOCKET INITIALIZATION');
        //             router.initializeSocketIfAuthenticated();
        //             debugLog('> INITIALIZATION COMPLETE');

        //         } catch (err) {
        //             debugErr('> ERR DURING SOCKET INITIALIZATION', err);
        //         } finally {
        //             // Clear init flag regardless of success/failure
        //             sessionStorage.removeItem("socket-init");
        //         }
        //     }, 1000);

        // } else { debugLog('> SOCKET INITIALIZATION ALREADY IN PROGRESS, SKIPPING'); }
    }

    //----- Page state signals -----//
    let gameCodeInp = sig<string>(urlCode ?? "");
    let gameCode = der<string>(() => gameCodeInp().trim());

    let joiningGame = sig<boolean>(false);
    let joinGameLabel = der<string>(() => joiningGame() ? "Joining..." : "Join Game");

    let creatingGame = sig<boolean>(false);
    let createGameLabel = der<string>(() => creatingGame() ? "Creating..." : "Create Game");


    //----- Button handlers -----//
    // Create a new lobby and redirect to lobby page
    function handleCreateGame() {        
        creatingGame(true);

        try {
            // Use local createLobby function instead of lobbyService.createLobby
            (async () => {
                const response = await createGame();
                debugLog("Create game response:", response);
                
                if (response && response.gameCode) {
                    // Store game code in globalState and sessionStorage
                    globalState.gameCode = response.gameCode;
                    debugLog("Game created with code:", response.gameCode);
                    
                    // Redirect to lobby page
                    visit('lobby');
                } else {
                    throw new Error("Invalid response from server");
                }
            })();
        } catch (error) {
            debugErr("Error creating game:", error);
            alert(`Error creating lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
            creatingGame(false);
        }
    };


    // Join an existing lobby and redirect to lobby page
    async function handleJoinGame() {
        if (gameCode() == "") { alert('Please enter a lobby code'); return; }
        
        joiningGame(true);
        
        try {
            (async () => {
                debugLog("Joining game with code:", gameCodeInp());
                
                const response = await joinGame(gameCodeInp());
                debugLog("Join game response:", response);
                
                // Store game code in globalState
                globalState.gameCode = gameCodeInp();
                debugLog("Game code stored in globalState:", globalState.gameCode);
                
                // Redirect to lobby page
                visit('lobby');
            })();
        } catch (error) {
            debugErr("Error joining game:", error);
            joiningGame(false);
            alert(`Error joining lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };


    //----- Render page ----//
    return parseInto(page, {
        ...menuNav(),
        "|section.game-entry": {
            $: {
                maxWidth: "900px",
                width: "100%"
            },
            "|article.card.welcome-card": {
                "|img.waving-garlic": {
                    "@": { 
                        src: wavingGarlic, 
                        alt: "Waving Garlic" 
                    },
                },
                "|h2.welcome-heading": { _: "Welcome to Garlic Phone" },
                $: {
                    textAlign: "center",
                    marginBottom: "2rem"
                }
            },
            "|section.game-options": {
                $: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "stretch",
                    gap: "2rem",
                    flexWrap: "wrap"
                },
                "|article.create-game.card": {
                    "|h3": { _: "Create a New Game" },
                    ...createButton(createGameLabel, handleCreateGame, ["base-button--accent"], creatingGame),
                    $: {
                        textAlign: "center",
                        padding: "2rem",
                        flex: "1",
                        minWidth: "250px"
                    }
                },
                "|article.join-game.card": {
                    "|h3": { _: "Join a Game" },
                    "|form#join-form": {
                        ...createInput("Enter game code", gameCodeInp),
                        ...createButton(joinGameLabel, handleJoinGame, ["base-button--accent"], joiningGame),
                    },
                    $: {
                        textAlign: "center",
                        padding: "2rem",
                        flex: "1",
                        minWidth: "250px"
                    }
                }
            }
        }
    });
};