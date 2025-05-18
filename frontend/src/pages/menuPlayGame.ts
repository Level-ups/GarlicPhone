import { parseInto } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { menuNav } from "../components/menuNav";
import { der, sig, type Signal } from "../lib/signal";
import { apiFetch } from "../lib/fetch";
import { createButton, createInput } from "../components/ui";

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
        sessionStorage.setItem("google-id-token", token);
        (window as any).router?.initializeSSEIfAuthenticated();
    }

    //----- Page state signals -----//
    const playerNameInp = sig<string>("");
    const playerName = der<string>(() => playerNameInp().trim());
    const gameCodeInp = sig<string>(urlCode ?? "");
    const gameCode = der<string>(() => gameCodeInp().trim());

    const joiningGame = sig<boolean>(false);
    const joinGameLabel = der<string>(() => joiningGame() ? "Joining..." : "Join Game");

    const creatingGame = sig<boolean>(false);
    const createGameLabel = der<string>(() => creatingGame() ? "Creating..." : "Create Game");


    //----- Button handlers -----//
    // Create a new lobby and redirect to lobby page
    function handleCreateGame() {
        console.log("Creating game...");
        if (!playerName()) { alert('Please enter your name'); return; }
        
        creatingGame(true);

        try {
            // Use local createLobby function instead of lobbyService.createLobby
            (async () => {
                const gameCode = await createGame();
                globalState.playerName = playerName;
                globalState.lobbyCode = gameCode.gameCode;
                // Redirect to lobby page
                visit('lobby');
            })();
        } catch (error) {
            alert(`Error creating lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
            creatingGame(false);
        }
    };


    // Join an existing lobby and redirect to lobby page
    async function handleJoinGame() {
        if (!playerName()) { alert('Please enter your name'); return; }
        if (!gameCode()) { alert('Please enter a lobby code'); return; }
        
        joiningGame(true);
        
        try {
            await joinGame(gameCodeInp());

            // Redirect to lobby page
            visit('lobby');
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