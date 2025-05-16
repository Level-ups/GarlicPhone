import { DEFAULT_FLEX_CONFIG, ROW_FLEX_CONFIG, wrapAsFlex } from "../lib/flex";
import { forEl, parseInto, type ElemTree } from "../lib/parse";
import type { PageRenderer } from "../lib/router";
import { menuNav, titleCard } from "../components/menuNav";
import * as lobbyService from "../services/lobbyService";
import type { Player } from "../services/lobbyService";
import { der, sig, type Signal } from "../lib/signal";
import { wrapAsCard } from "../lib/card";
import { apiFetch } from "../lib/fetch";
import { GALLERY_FLEX_CONFIG} from "../lib/flex";
import { updateSSEHandler } from "../lib/sse";
import type { Lobby, WithClient } from "../services/lobbyService";

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

    const data = await res.json()

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
    players(data.players);

    return data;
}

// Set the current player as ready
async function setAsReady(lobbyId: string, playerId: string | number, players: Signal<PlayerInfo[]>) {
    const playerIdNum = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;
    const res = await apiFetch("post", `/api/lobbies/${lobbyId}/ready`, { playerId: playerIdNum, isReady: true });
    const data = await res.json();

    players(data.players);
}

async function startGame(gameId: string, playerId: string | number) {
    const playerIdNum = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;
    const res = await apiFetch("post", `/api/lobbies/${gameId}/start`, { playerId: playerIdNum });

    const data = await res.json();
}


export const lobbyPage: PageRenderer = ({ page }) => {
    // State
    let eventSource: EventSource | null = null;
    let currentLobby: lobbyService.Lobby | null = null;
    
    // Get stored player and lobby info from session storage
    const playerId = sessionStorage.getItem('playerId') || '';
    const playerName = sessionStorage.getItem('playerName') || '';
    const lobbyId = sessionStorage.getItem('lobbyId') || '';
    const lobbyCode = sessionStorage.getItem('lobbyCode') || '';
    const isHost = sessionStorage.getItem('isHost') === 'true';
    
    // Validate necessary data
    if (!playerId || !playerName || !lobbyId || !lobbyCode) {
        alert('Missing player or lobby information. Redirecting to home page...');
        visit('home');
        return;
    }

    // Handle player ready button
    const handleReadyClick = async (): Promise<void> => {
        if (!currentLobby) return;
        
        try {
            const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
            if (readyBtn) {
                readyBtn.disabled = true;
            }
            
            // Create a signal with the current players
            const playersSignal = sig<PlayerInfo[]>(currentLobby.players as unknown as PlayerInfo[]);
            
            // Use local setAsReady function instead of lobbyService.setPlayerReady
            await setAsReady(lobbyId, playerId, playersSignal);
            
        } catch (error) {
            alert(`Error updating ready status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
            if (readyBtn) {
                readyBtn.disabled = false;
            }
        }
    };
    
    // Handle start game button
    const handleStartGame = async (): Promise<void> => {
        if (!currentLobby) return;
        
        try {
            const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
            if (startGameBtn) {
                startGameBtn.disabled = true;
                startGameBtn.textContent = 'Starting...';
            }
            
            // Use local startGame function instead of lobbyService.startGame
            await startGame(lobbyId, playerId);
            
        } catch (error) {
            alert(`Error starting game: ${error instanceof Error ? error.message : 'Unknown error'}`);
            const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
            if (startGameBtn) {
                startGameBtn.disabled = false;
                startGameBtn.textContent = 'Start Game';
            }
        }
    };
    
    // Handle leave lobby button
    const handleLeaveLobby = async (): Promise<void> => {
        if (!currentLobby) return;
        
        try {
            const leaveLobbyBtn = document.getElementById('leave-lobby-btn') as HTMLButtonElement;
            if (leaveLobbyBtn) {
                leaveLobbyBtn.disabled = true;
            }
            
            // Use string version of player ID for lobbyService
            await lobbyService.leaveLobby(lobbyId, playerId);
            disconnectAndRedirectHome();
            
        } catch (error) {
            alert(`Error leaving lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
            const leaveLobbyBtn = document.getElementById('leave-lobby-btn') as HTMLButtonElement;
            if (leaveLobbyBtn) {
                leaveLobbyBtn.disabled = false;
            }
        }
    };
    
    // Handle share lobby button
    const handleShareLobby = (): void => {
        const url = `${window.location.origin}/?code=${lobbyCode}`;
        
        // Check if the Web Share API is available
        if (navigator.share) {
            navigator.share({
                title: 'Join my Garlic Phone game!',
                text: `Join my game with code: ${lobbyCode}`,
                url: url
            }).catch(console.error);
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(url)
                .then(() => alert('Lobby link copied to clipboard!'))
                .catch((err) => {
                    console.error('Could not copy link: ', err);
                    prompt('Copy this link to share with friends:', url);
                });
        }
    };

    // Disconnect from events and redirect to home page
    const disconnectAndRedirectHome = (message?: string): void => {
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        
        if (message) {
            alert(message);
        }
        
        // Clear session storage and redirect
        sessionStorage.clear();
        visit('home');
    };

    // Update the UI based on lobby state
    const updateUI = (lobby: lobbyService.Lobby): void => {
        currentLobby = lobby;
        
        // Update lobby capacity
        const lobbyCapacity = document.querySelector('.lobby-capacity');
        if (lobbyCapacity) {
            lobbyCapacity.textContent = `${lobby.players.length}/${lobby.maxPlayers || 10} players`;
        }
        
        // Update players list
        const playersList = document.getElementById('players-list');
        if (playersList) {
            // Create a document fragment to hold all new player items
            const fragment = document.createDocumentFragment();
            
            // Remove all existing children from playersList
            while (playersList.firstChild) {
                playersList.removeChild(playersList.firstChild);
            }
            
            // Create player items
            lobby.players.forEach((player) => {
                // Create player item container
                const playerItem = document.createElement('li');
                playerItem.className = 'player-item';
                
                // Create player avatar
                const playerAvatar = document.createElement('figure');
                playerAvatar.className = 'player-avatar';
                const avatarImg = document.createElement('img');
                avatarImg.src = './public/assets/default-avatar.svg';
                avatarImg.alt = 'Player avatar';
                playerAvatar.appendChild(avatarImg);
                
                // Create player details
                const playerDetails = document.createElement('section');
                playerDetails.className = 'player-details';
                
                const playerNameEl = document.createElement('h3');
                playerNameEl.className = 'player-name';
                // Compare player IDs as strings to handle both string and number IDs
                playerNameEl.textContent = player.name + (String(player.id) === playerId ? ' (You)' : '');
                
                const playerStatus = document.createElement('p');
                playerStatus.className = 'player-status';
                
                if (player.isHost) {
                    playerStatus.textContent = 'Host';
                    playerStatus.classList.add('host');
                } else if (player.isReady) {
                    playerStatus.textContent = 'Ready';
                    playerStatus.classList.add('ready');
                } else {
                    playerStatus.textContent = 'Not Ready';
                    playerStatus.classList.add('not-ready');
                }
                
                playerDetails.appendChild(playerNameEl);
                playerDetails.appendChild(playerStatus);
                
                // Add all elements to the player item
                playerItem.appendChild(playerAvatar);
                playerItem.appendChild(playerDetails);
                
                // Add the player item to the fragment
                fragment.appendChild(playerItem);
            });
            
            // Add all player items to the players list at once
            playersList.appendChild(fragment);
        }
        
        // Check if current player is ready
        // Compare player IDs as strings to handle both string and number IDs
        const currentPlayer = lobby.players.find(p => String(p.id) === playerId);
        const isReady = currentPlayer?.isReady || false;
        
        // Update ready button
        const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
        if (readyBtn) {
            readyBtn.textContent = 'Ready';
            if (isReady) {
                readyBtn.classList.add('ready');
            } else {
                readyBtn.classList.remove('ready');
            }
        }
        
        // Show/hide host buttons
        if (readyBtn) {
            readyBtn.style.display = isHost ? 'none' : 'block';
        }
        
        const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
        if (startGameBtn) {
            startGameBtn.style.display = isHost ? 'block' : 'none';
            
            // Enable/disable start game button based on all players ready
            const allPlayersReady = lobby.players.every(p => p.isReady || p.isHost);
            const hasEnoughPlayers = lobby.players.length >= 2;
            startGameBtn.disabled = !(isHost && allPlayersReady && hasEnoughPlayers);
        }
        
        // If game has started, update UI accordingly
        if (lobby.status === 'started') {
            if (readyBtn) readyBtn.style.display = 'none';
            if (startGameBtn) startGameBtn.style.display = 'none';
            // In a real implementation, you would redirect to the game page here
            alert('Game has started! Redirecting to game page...');
            visit('prompt');
        }
    };

    // Connect to lobby events
    const connectToLobbyEvents = (): void => {
        // Clean up any existing connection
        if (eventSource) {
            eventSource.close();
        }
        
        // Connect to events with callbacks
        eventSource = lobbyService.connectToLobbyEvents(
            lobbyId,
            {
                onLobbyState: (lobby) => updateUI(lobby),
                onLobbyUpdate: (lobby) => updateUI(lobby),
                onError: (event) => {
                    console.error('Lobby event error:', event);
                    
                    // If connection closed, check if lobby was deleted
                    if (eventSource && eventSource.readyState === EventSource.CLOSED) {
                        disconnectAndRedirectHome('The lobby no longer exists.');
                    }
                }
            }
        );
    };

    // Connect to lobby events when page loads
    setTimeout(() => {
        connectToLobbyEvents();
        
        // Initialize ready button class based on player status
        const readyBtn = document.getElementById('ready-btn');
        if (readyBtn && currentLobby) {
            // Compare player IDs as strings to handle both string and number IDs
            const currentPlayer = currentLobby.players.find(p => String(p.id) === playerId);
            if (currentPlayer?.isReady) {
                readyBtn.classList.add('ready');
            }
        }
    }, 0);

    // Render page
    return parseInto(page, {
        ...menuNav(),
        ...titleCard("Lobby"),
        "|section.lobby-container": {
            $: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%"
            },
            "|article.lobby-info.card": {
                "|h2": { _: "Lobby" },
                "|section.code-display": {
                    $: {
                        backgroundColor: "var(--accent-color)",
                        padding: "1.5rem",
                        borderRadius: "var(--border-radius)",
                        textAlign: "center",
                        marginBottom: "1.5rem"
                    },
                    "|p": { 
                        _: "Your Lobby Code: ",
                        "|strong#lobby-code-display": { _: lobbyCode }
                    },
                    "|button#share-lobby-btn": {
                        _: "Share Lobby Link",
                        "@": { type: "button" },
                        "%click": handleShareLobby
                    }
                },
                "|section.player-controls": {
                    "|h3": { _: "Game Controls" },
                    "|nav.buttons-container": {
                        "@": { role: "toolbar", "aria-label": "Game control options" },
                        $: {
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "1rem",
                            flexWrap: "wrap",
                            margin: "1rem 0",
                            padding: "0"
                        },
                        "|button#ready-btn": {
                            _: "Ready",
                            "@": { type: "button" },
                            "%click": handleReadyClick,
                            $: {
                                display: isHost ? "none" : "block",
                                flex: "1",
                                minWidth: "100px"
                            }
                        },
                        "|button#leave-lobby-btn": {
                            _: "Leave Lobby",
                            "@": { type: "button" },
                            "%click": handleLeaveLobby,
                            $: {
                                flex: "1",
                                minWidth: "100px"
                            }
                        },
                        "|button#start-game-btn": {
                            _: "Start Game",
                            "@": { 
                                type: "button",
                                disabled: "true"
                            },
                            "%click": handleStartGame,
                            $: {
                                backgroundColor: "var(--host-color)",
                                display: isHost ? "block" : "none",
                                flex: "1",
                                minWidth: "100px"
                            }
                        }
                    }
                }
            },
            "|article.players-panel.card": {
                "|h2": { _: "Players" },
                "|p.lobby-capacity": {
                    $: {
                        fontSize: "0.9rem",
                        color: "var(--secondary-color)",
                        marginTop: "-0.5rem",
                        marginBottom: "1rem"
                    },
                    _: "Loading..."
                },
                "|ol#players-list.players-list": {
                    $: {
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem"
                    }
                }
            }
        }
    });
}