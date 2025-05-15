import { DEFAULT_FLEX_CONFIG, ROW_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { menuNav, titleCard } from "../components/menuNav";
import * as lobbyService from "../services/lobbyService";
import { der, sig, type Signal } from "../../../lib/signal";
import { apiFetch } from "../lib/fetch";

type PlayerInfo = {
    id: number;
    name: string;
    avatarUrl?: string;
    isHost?: boolean;
    isReady?: boolean
};

async function createLobby(playerId: string | number) {
    const playerIdNum = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;
    const res = await apiFetch("post", "/api/lobbies", {
        hostId: playerIdNum,
        hostName: "Host Player"
    });

    const data = await res.json();
    console.log("CREATE LOBBY:", data);

    return data;
}

async function joinLobby(gameCode: string, playerId: string | number, players: Signal<PlayerInfo[]>) {
    const playerIdNum = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;
    const res = await apiFetch("post", "/api/lobbies/join", {
        playerId: playerIdNum,
        playerName: "Joined Player",
        code: gameCode
    });

    const data = await res.json();
    console.log("JOIN LOBBY:", data);
    players(data.players);

    return data;
}

export const menuPlayGamePage: PageRenderer = ({ page }) => {
    // Generate a random player ID
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) localStorage.setItem("google-id-token", token);
    const generatePlayerId = (): string => {
        return Math.random().toString(36).substring(2, 15);
    };
    
    // Store player info in session storage
    const storePlayerInfo = (name: string, id: string): void => {
        sessionStorage.setItem('playerName', name);
        sessionStorage.setItem('playerId', id);
    };
    
    // Create a new lobby and redirect to lobby page
    const handleCreateLobby = async (): Promise<void> => {
        const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
        const createLobbyBtn = document.getElementById('create-lobby-btn') as HTMLButtonElement;
        const playerName = playerNameInput.value.trim();
        
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        
        const playerId = generatePlayerId();
        
        try {
            createLobbyBtn.disabled = true;
            createLobbyBtn.textContent = 'Creating...';
            
            // Use local createLobby function instead of lobbyService.createLobby
            const lobby = await createLobby(playerId);
            
            // Store player info and lobby code in session storage
            storePlayerInfo(playerName, playerId);
            sessionStorage.setItem('lobbyCode', lobby.code);
            sessionStorage.setItem('lobbyId', lobby.id);
            sessionStorage.setItem('isHost', 'true');
            
            // Redirect to lobby page
            visit('lobby');
            
        } catch (error) {
            alert(`Error creating lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
            createLobbyBtn.disabled = false;
            createLobbyBtn.textContent = 'Create Game';
        }
    };
    
    // Join an existing lobby and redirect to lobby page
    const handleJoinLobby = async (): Promise<void> => {
        const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
        const lobbyCodeInput = document.getElementById('lobby-code') as HTMLInputElement;
        const joinLobbyBtn = document.getElementById('join-lobby-btn') as HTMLButtonElement;
        const playerName = playerNameInput.value.trim();
        const code = lobbyCodeInput.value.trim();
        
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        
        if (!code) {
            alert('Please enter a lobby code');
            return;
        }
        
        const playerId = generatePlayerId();
        
        try {
            joinLobbyBtn.disabled = true;
            joinLobbyBtn.textContent = 'Joining...';
            
            // Create a signal for players
            const playersSignal = sig<PlayerInfo[]>([]);
            
            // Use local joinLobby function instead of lobbyService.joinLobbyByCode
            const lobby = await joinLobby(code, playerId, playersSignal);
            
            // Store player info and lobby code in session storage
            storePlayerInfo(playerName, playerId);
            sessionStorage.setItem('lobbyCode', lobby.code);
            sessionStorage.setItem('lobbyId', lobby.id);
            sessionStorage.setItem('isHost', 'false');
            
            // Redirect to lobby page
            visit('lobby');
            
        } catch (error) {
            alert(`Error joining lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
            joinLobbyBtn.disabled = false;
            joinLobbyBtn.textContent = 'Join Game';
        }
    };

    // Check for lobby code in URL param (for shared links)
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');

    // Render page
    return parseInto(page, {
        ...menuNav(),
        ...titleCard("Garlic Phone"),
        "|section.game-entry": {
            $: {
                maxWidth: "900px",
                margin: "0 auto",
                width: "100%"
            },
            "|article.player-setup.card": {
                "|h2": { _: "Welcome to Garlic Phone" },
                "|form#player-form": {
                    "|fieldset": {
                        "|label": { 
                            _: "Your Name:",
                            "@": { for: "player-name" }
                        },
                        "|input#player-name": {
                            "@": { 
                                type: "text", 
                                placeholder: "Enter your name", 
                                required: "true",
                                value: ""
                            },
                            "%keypress": (e: Event) => {
                                const keyEvent = e as KeyboardEvent;
                                if (keyEvent.key === 'Enter') {
                                    e.preventDefault();
                                    const lobbyCodeInput = document.getElementById('lobby-code');
                                    if (lobbyCodeInput) {
                                        lobbyCodeInput.focus();
                                    }
                                }
                            }
                        }
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
                    "|button#create-lobby-btn": {
                        _: "Create Game",
                        "@": { type: "button" },
                        "%click": handleCreateLobby
                    },
                    $: {
                        textAlign: "center",
                        padding: "2rem",
                        flex: "1",
                        minWidth: "250px"
                    }
                },
                "|article.join-game.card": {
                    "|h3": { _: "Join a Lobby:" },
                    "|form#join-form": {
                        "|input#lobby-code": {
                            "@": { 
                                type: "text", 
                                placeholder: "Enter lobby code", 
                                maxlength: "6",
                                value: codeFromUrl || ""
                            },
                            "%keypress": (e: Event) => {
                                const keyEvent = e as KeyboardEvent;
                                if (keyEvent.key === 'Enter') {
                                    e.preventDefault();
                                    handleJoinLobby();
                                }
                            }
                        },
                        "|button#join-lobby-btn": {
                            _: "Join Game",
                            "@": { type: "button" },
                            "%click": handleJoinLobby
                        }
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