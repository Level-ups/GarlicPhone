import { menuNav } from "../components/menuNav";
import { createButton, createInput } from "../components/ui";
import { apiFetch } from "../lib/fetch";
import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { der, sig } from "../lib/util/signal";

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
    log("JOIN LOBBY:", data);

    return data;
}



export const menuPlayGamePage: PageRenderer = ({ page }, { globalState, onUpdate }) => {
    //----- Initialization ----//
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const urlCode = params.get('code');
    if (token) {
        console.log('Token received');
        sessionStorage.setItem("google-id-token", token);
        
        // Only attempt to initialize SSE if we haven't already done so in this session
        // and we're not currently in the process of initializing
        const sseInitializing = sessionStorage.getItem("sse-initializing");
        
        if (!sseInitializing) {
            // Mark as initializing to prevent concurrent initialization attempts
            sessionStorage.setItem("sse-initializing", "true");
            
            // Use setTimeout to ensure router is initialized before accessing it
            setTimeout(() => {
                try {
                    if ((window as any).router) {
                        // Check if SSE is already connected before initializing
                        if (!(window as any).router.sseSource) {
                            console.log('Initializing SSE connection');
                            (window as any).router.initializeSSEIfAuthenticated();
                            console.log('SSE initialization complete');
                        } else {
                            console.log('SSE connection already exists, skipping initialization');
                        }
                    } else {
                        console.error('Router not available for SSE initialization');
                    }
                } catch (err) {
                    console.error('Error during SSE initialization:', err);
                } finally {
                    // Clear the initializing flag regardless of success/failure
                    sessionStorage.removeItem("sse-initializing");
                }
            }, 1000);
        } else {
            console.log('SSE initialization already in progress, skipping');
        }
    }

    //----- Page state signals -----//
    let playerNameInp = sig<string>("");
    let playerName = der<string>(() => playerNameInp().trim());
    let gameCodeInp = sig<string>(urlCode ?? "");
    let gameCode = der<string>(() => gameCodeInp().trim());

    let joiningGame = sig<boolean>(false);
    let joinGameLabel = der<string>(() => joiningGame() ? "Joining..." : "Join Game");

    let creatingGame = sig<boolean>(false);
    let createGameLabel = der<string>(() => creatingGame() ? "Creating..." : "Create Game");


    //----- Button handlers -----//
    // Create a new lobby and redirect to lobby page
    function handleCreateGame() {
        if (!playerName()) { alert('Please enter your name'); return; }
        
        creatingGame(true);

        try {
            // Use local createLobby function instead of lobbyService.createLobby
            (async () => {
                const gameCode = await createGame();
                globalState.playerName = playerName;
                globalState.gameCode = gameCode.gameCode;
                // Redirect to lobby page
                visit('lobby');
            })();
        } catch (error) {
            alert(`Error creating lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
            creatingGame(false);
        }
    };


    // Join an existing lobby and redirect to lobby page
    function handleJoinGame() {
        if (!playerName()) { alert('Please enter your name'); return; }
        if (!gameCode()) { alert('Please enter a lobby code'); return; }
        
        joiningGame(true);
        
        try {
            (async () => {
                await joinGame(gameCodeInp());
                globalState.gameCode = gameCodeInp();
                // Redirect to lobby page
                try {
                    (window as any).router.visit('lobby');
                } catch (error) {
                    console.error('Error navigating to lobby:', error);
                }
            })();
        } catch (error) {
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
            "|article.card": {
                "|h2.welcome-heading": { _: "Welcome to Garlic Phone" },
                "|form#player-form": {
                    "|fieldset.name-fieldset": {
                        "|label": { 
                            _: "Your Name:",
                            "@": { for: "player-name" }
                        },
                        ...createInput("Enter your name", playerNameInp)
                    }
                },
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