import { 
  createLobby,
  joinLobbyByCode,
  leaveLobby,
  setPlayerReady,
  startGame,
  connectToLobbyEvents,
  type Lobby,
  type Player
} from '../services/lobbyService';

export class LobbyUI {
  private container: HTMLElement;
  private playerId: string;
  private playerName: string;
  private avatarUrl: string;
  private currentLobby: Lobby | null = null;
  private eventSource: EventSource | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    this.container = container;
    
    // Generate a random ID for this player
    this.playerId = this.generatePlayerId();
    this.playerName = '';
    this.avatarUrl = '';
    
    this.init();
  }

  private init(): void {
    this.renderInitialScreen();
  }

  private generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private renderInitialScreen(): void {
    this.container.innerHTML = `
      <div class="lobby-ui">
        <h1>Garlic Phone Game</h1>
        <div class="player-setup">
          <h2>Enter Your Name</h2>
          <div class="form-group">
            <label for="player-name">Your Name:</label>
            <input type="text" id="player-name" placeholder="Enter your name">
          </div>
          <div class="action-buttons">
            <button id="create-lobby-btn" disabled>Create Lobby</button>
            <div class="join-lobby">
              <input type="text" id="lobby-code" placeholder="Enter lobby code">
              <button id="join-lobby-btn" disabled>Join Lobby</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    const createLobbyBtn = document.getElementById('create-lobby-btn') as HTMLButtonElement;
    const lobbyCodeInput = document.getElementById('lobby-code') as HTMLInputElement;
    const joinLobbyBtn = document.getElementById('join-lobby-btn') as HTMLButtonElement;

    playerNameInput.addEventListener('input', () => {
      this.playerName = playerNameInput.value.trim();
      createLobbyBtn.disabled = this.playerName === '';
      joinLobbyBtn.disabled = this.playerName === '' || lobbyCodeInput.value.trim() === '';
    });

    lobbyCodeInput.addEventListener('input', () => {
      joinLobbyBtn.disabled = this.playerName === '' || lobbyCodeInput.value.trim() === '';
    });

    createLobbyBtn.addEventListener('click', async () => {
      try {
        createLobbyBtn.disabled = true;
        createLobbyBtn.textContent = 'Creating...';
        
        const lobby = await createLobby(this.playerId, this.playerName, this.avatarUrl);
        this.currentLobby = lobby;
        this.connectToLobbyEvents(lobby.id);
        this.renderLobbyScreen();
      } catch (error) {
        alert(`Error creating lobby: ${(error as Error).message}`);
        createLobbyBtn.disabled = false;
        createLobbyBtn.textContent = 'Create Lobby';
      }
    });

    joinLobbyBtn.addEventListener('click', async () => {
      try {
        const code = lobbyCodeInput.value.trim();
        joinLobbyBtn.disabled = true;
        joinLobbyBtn.textContent = 'Joining...';
        
        const lobby = await joinLobbyByCode(code, this.playerId, this.playerName, this.avatarUrl);
        this.currentLobby = lobby;
        this.connectToLobbyEvents(lobby.id);
        this.renderLobbyScreen();
      } catch (error) {
        alert(`Error joining lobby: ${(error as Error).message}`);
        joinLobbyBtn.disabled = false;
        joinLobbyBtn.textContent = 'Join Lobby';
      }
    });
  }

  private renderLobbyScreen(): void {
    if (!this.currentLobby) return;

    const isHost = this.currentLobby.players.some((p: Player) => p.id === this.playerId && p.isHost);
    const currentPlayer = this.currentLobby.players.find((p: Player) => p.id === this.playerId);
    const allPlayersReady = this.currentLobby.players.every((p: Player) => p.isReady || p.isHost);
    const canStartGame = isHost && this.currentLobby.players.length >= 2 && allPlayersReady;

    this.container.innerHTML = `
      <div class="lobby-ui">
        <h1>Game Lobby</h1>
        <div class="lobby-info">
          <div class="lobby-code">
            <h3>Lobby Code:</h3>
            <div class="code-display">${this.currentLobby.code}</div>
            <button id="copy-code-btn">Copy Code</button>
          </div>
          <div class="players-list">
            <h3>Players (${this.currentLobby.players.length}/${this.currentLobby.maxPlayers}):</h3>
            <ul>
              ${this.currentLobby.players.map(player => `
                <li class="player ${player.isHost ? 'host' : ''} ${player.isReady ? 'ready' : ''}">
                  <span class="player-name">${player.name}</span>
                  ${player.isHost ? '<span class="host-badge">Host</span>' : ''}
                  ${player.isReady ? '<span class="ready-badge">Ready</span>' : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
        <div class="lobby-actions">
          ${!currentPlayer?.isHost && this.currentLobby.status === 'waiting' ? `
            <button id="ready-btn" class="${currentPlayer?.isReady ? 'not-ready' : 'ready'}">${currentPlayer?.isReady ? 'Not Ready' : 'Ready'}</button>
          ` : ''}
          ${isHost && this.currentLobby.status === 'waiting' ? `
            <button id="start-game-btn" ${canStartGame ? '' : 'disabled'}>Start Game</button>
          ` : ''}
          <button id="leave-lobby-btn">Leave Lobby</button>
        </div>
        ${this.currentLobby.status === 'started' ? `
          <div class="game-started">
            <h2>Game in Progress!</h2>
          </div>
        ` : ''}
      </div>
    `;

    // Add event listeners
    const copyCodeBtn = document.getElementById('copy-code-btn') as HTMLButtonElement;
    const leaveLobbyBtn = document.getElementById('leave-lobby-btn') as HTMLButtonElement;
    const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
    const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;

    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.currentLobby!.code)
          .then(() => alert('Lobby code copied to clipboard!'))
          .catch(err => debugErr('Failed to copy code', err));
      });
    }

    if (leaveLobbyBtn) {
      leaveLobbyBtn.addEventListener('click', async () => {
        try {
          leaveLobbyBtn.disabled = true;
          
          if (this.currentLobby) {
            await leaveLobby(this.currentLobby.id, this.playerId);
          }
          
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }
          
          this.currentLobby = null;
          this.renderInitialScreen();
        } catch (error) {
          alert(`Error leaving lobby: ${(error as Error).message}`);
          leaveLobbyBtn.disabled = false;
        }
      });
    }

    if (readyBtn) {
      readyBtn.addEventListener('click', async () => {
        try {
          readyBtn.disabled = true;
          
          const currentPlayer = this.currentLobby!.players.find((p: Player) => p.id === this.playerId);
          if (currentPlayer && this.currentLobby) {
            await setPlayerReady(this.currentLobby.id, this.playerId, !currentPlayer.isReady);
          }
        } catch (error) {
          alert(`Error updating ready status: ${(error as Error).message}`);
          readyBtn.disabled = false;
        }
      });
    }

    if (startGameBtn) {
      startGameBtn.addEventListener('click', async () => {
        try {
          startGameBtn.disabled = true;
          startGameBtn.textContent = 'Starting...';
          
          if (this.currentLobby) {
            await startGame(this.currentLobby.id, this.playerId);
          }
        } catch (error) {
          alert(`Error starting game: ${(error as Error).message}`);
          startGameBtn.disabled = false;
          startGameBtn.textContent = 'Start Game';
        }
      });
    }
  }

  private connectToLobbyEvents(lobbyId: string): void {
    // Close any existing connection
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = connectToLobbyEvents(lobbyId, {
      onLobbyState: (lobby) => {
        this.currentLobby = lobby;
        this.renderLobbyScreen();
      },
      onLobbyUpdate: (lobby) => {
        this.currentLobby = lobby;
        this.renderLobbyScreen();
      },
      onError: (err) => {
        debugErr('Lobby event error:', err);
        // If we get a 404, it means the lobby was deleted
        if (err.status === 404) {
          alert('The lobby no longer exists.');
          this.eventSource?.close();
          this.eventSource = null;
          this.currentLobby = null;
          this.renderInitialScreen();
        }
      }
    });
  }
} 