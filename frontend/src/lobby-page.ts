import * as lobbyService from './services/lobbyService.js';
import { Lobby, Player } from './services/lobbyService.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const lobbyCodeDisplay = document.getElementById('lobby-code-display') as HTMLElement;
  const shareLobbyBtn = document.getElementById('share-lobby-btn') as HTMLButtonElement;
  const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
  const leaveLobbyBtn = document.getElementById('leave-lobby-btn') as HTMLButtonElement;
  const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
  const playersList = document.getElementById('players-list') as HTMLOListElement;
  const playerItemTemplate = document.getElementById('player-item-template') as HTMLTemplateElement;
  
  // State
  let eventSource: EventSource | null = null;
  let currentLobby: Lobby | null = null;
  
  // Get stored player and lobby info from session storage
  const playerId = sessionStorage.getItem('playerId') || '';
  const playerName = sessionStorage.getItem('playerName') || '';
  const lobbyId = sessionStorage.getItem('lobbyId') || '';
  const lobbyCode = sessionStorage.getItem('lobbyCode') || '';
  const isHost = sessionStorage.getItem('isHost') === 'true';
  
  // Validate necessary data
  if (!playerId || !playerName || !lobbyId || !lobbyCode) {
    alert('Missing player or lobby information. Redirecting to home page...');
    window.location.href = 'home-page.html';
    return;
  }
  
  // Update UI with lobby code
  lobbyCodeDisplay.textContent = lobbyCode;
  
  // Update the players list
  const updatePlayersList = (lobby: Lobby): void => {
    playersList.innerHTML = '';
    
    lobby.players.forEach((player) => {
      const templateClone = playerItemTemplate.content.cloneNode(true) as DocumentFragment;
      const playerItem = templateClone.querySelector('.player-item') as HTMLLIElement;
      const playerName = templateClone.querySelector('.player-name') as HTMLHeadingElement;
      const playerStatus = templateClone.querySelector('.player-status') as HTMLParagraphElement;
      const playerAvatar = templateClone.querySelector('.player-avatar img') as HTMLImageElement;
      
      // Set player name
      playerName.textContent = player.name + (player.id === playerId ? ' (You)' : '');
      
      // Set player status class and text
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
      
      // Add the player item to the list
      playersList.appendChild(templateClone);
    });
  };
  
  // Update the UI based on lobby state
  const updateUI = (lobby: Lobby): void => {
    currentLobby = lobby;
    
    // Update players list
    updatePlayersList(lobby);
    
    // Check if current player is ready
    const currentPlayer = lobby.players.find(p => p.id === playerId);
    const isReady = currentPlayer?.isReady || false;
    
    // Update ready button
    readyBtn.textContent = isReady ? 'Set Not Ready' : 'Set Ready';
    readyBtn.classList.toggle('ready', isReady);
    
    // Show/hide host buttons
    readyBtn.style.display = isHost ? 'none' : 'block';
    startGameBtn.style.display = isHost ? 'block' : 'none';
    
    // Enable/disable start game button based on all players ready
    const allPlayersReady = lobby.players.every(p => p.isReady || p.isHost);
    const hasEnoughPlayers = lobby.players.length >= 2;
    startGameBtn.disabled = !(isHost && allPlayersReady && hasEnoughPlayers);
    
    // If game has started, update UI accordingly
    if (lobby.status === 'started') {
      readyBtn.style.display = 'none';
      startGameBtn.style.display = 'none';
      // In a real implementation, you would redirect to the game page here
      alert('Game has started! In a real implementation, you would be redirected to the game page.');
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
    window.location.href = 'home-page.html';
  };
  
  // Handle player ready button
  const handleReadyClick = async (): Promise<void> => {
    if (!currentLobby) return;
    
    try {
      readyBtn.disabled = true;
      
      const currentPlayer = currentLobby.players.find(p => p.id === playerId);
      if (currentPlayer) {
        await lobbyService.setPlayerReady(lobbyId, playerId, !currentPlayer.isReady);
      }
      
    } catch (error) {
      alert(`Error updating ready status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      readyBtn.disabled = false;
    }
  };
  
  // Handle start game button
  const handleStartGame = async (): Promise<void> => {
    if (!currentLobby) return;
    
    try {
      startGameBtn.disabled = true;
      startGameBtn.textContent = 'Starting...';
      
      await lobbyService.startGame(lobbyId, playerId);
      
    } catch (error) {
      alert(`Error starting game: ${error instanceof Error ? error.message : 'Unknown error'}`);
      startGameBtn.disabled = false;
      startGameBtn.textContent = 'Start Game';
    }
  };
  
  // Handle leave lobby button
  const handleLeaveLobby = async (): Promise<void> => {
    if (!currentLobby) return;
    
    try {
      leaveLobbyBtn.disabled = true;
      
      await lobbyService.leaveLobby(lobbyId, playerId);
      disconnectAndRedirectHome();
      
    } catch (error) {
      alert(`Error leaving lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
      leaveLobbyBtn.disabled = false;
    }
  };
  
  // Handle share lobby button
  const handleShareLobby = (): void => {
    const url = `${window.location.origin}/home-page.html?code=${lobbyCode}`;
    
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
  
  // Add event listeners
  readyBtn.addEventListener('click', handleReadyClick);
  startGameBtn.addEventListener('click', handleStartGame);
  leaveLobbyBtn.addEventListener('click', handleLeaveLobby);
  shareLobbyBtn.addEventListener('click', handleShareLobby);
  
  // Check for lobby code in URL when coming from a shared link
  window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    
    if (codeFromUrl) {
      // In a real implementation, you would pre-fill the lobby code input
      console.log('Lobby code from URL:', codeFromUrl);
    }
  });
  
  // Connect to lobby events when page loads
  connectToLobbyEvents();
}); 