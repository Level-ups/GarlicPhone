import * as lobbyService from './services/lobbyService.js';

document.addEventListener('DOMContentLoaded', () => {
  const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
  const createLobbyBtn = document.getElementById('create-lobby-btn') as HTMLButtonElement;
  const lobbyCodeInput = document.getElementById('lobby-code') as HTMLInputElement;
  const joinLobbyBtn = document.getElementById('join-lobby-btn') as HTMLButtonElement;
  
  // Generate a random player ID
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
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
      alert('Please enter your name');
      return;
    }
    
    const playerId = generatePlayerId();
    
    try {
      createLobbyBtn.disabled = true;
      createLobbyBtn.textContent = 'Creating...';
      
      const lobby = await lobbyService.createLobby(
        playerId,
        playerName,
        '', // avatarUrl
        10 // maxPlayers
      );
      
      // Store player info and lobby code in session storage
      storePlayerInfo(playerName, playerId);
      sessionStorage.setItem('lobbyCode', lobby.code);
      sessionStorage.setItem('lobbyId', lobby.id);
      sessionStorage.setItem('isHost', 'true');
      
      // Redirect to lobby page
      window.location.href = 'lobby-page.html';
      
    } catch (error) {
      alert(`Error creating lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
      createLobbyBtn.disabled = false;
      createLobbyBtn.textContent = 'Create Game';
    }
  };
  
  // Join an existing lobby and redirect to lobby page
  const handleJoinLobby = async (): Promise<void> => {
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
      
      const lobby = await lobbyService.joinLobbyByCode(
        code,
        playerId,
        playerName,
        '' // avatarUrl
      );
      
      // Store player info and lobby code in session storage
      storePlayerInfo(playerName, playerId);
      sessionStorage.setItem('lobbyCode', lobby.code);
      sessionStorage.setItem('lobbyId', lobby.id);
      sessionStorage.setItem('isHost', 'false');
      
      // Redirect to lobby page
      window.location.href = 'lobby-page.html';
      
    } catch (error) {
      alert(`Error joining lobby: ${error instanceof Error ? error.message : 'Unknown error'}`);
      joinLobbyBtn.disabled = false;
      joinLobbyBtn.textContent = 'Join Game';
    }
  };
  
  // Event listeners
  createLobbyBtn.addEventListener('click', handleCreateLobby);
  joinLobbyBtn.addEventListener('click', handleJoinLobby);
  
  // Handle Enter key in the lobby code input
  lobbyCodeInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleJoinLobby();
    }
  });
  
  // Handle Enter key in the player name input
  playerNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (document.activeElement === playerNameInput) {
        lobbyCodeInput.focus();
      }
    }
  });

  // Check for lobby code in URL param (for shared links)
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('code');
  if (codeFromUrl) {
    lobbyCodeInput.value = codeFromUrl;
  }
}); 