import * as lobbyService from '../services/lobbyService';
import express, { Request, Response } from 'express';
import { ErrorDetails, ErrorType, NotFoundErrorDetails } from '../library/error-types';
import { UUID } from 'crypto';
import { createServerSentEventHandler } from '../library/serverSentEvents';
import { registerClient, removeClient } from '../library/lobbyEventBroadcaster';

export const lobbyRouter = express.Router();

// Create a new lobby
lobbyRouter.post('/', (req: Request, res: Response) => {
  try {
    const { hostId, hostName, hostAvatarUrl, maxPlayers } = req.body;
    if (!hostId || !hostName) {
      // TODO: use ValidationResults to let the user know what fields are missing.
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const lobby = lobbyService.createLobby(hostId, hostName, hostAvatarUrl || '', maxPlayers);
    
    return res.status(201).json(lobby);
  } catch (error) {
    console.error('Error creating lobby:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
});

// Join a lobby by code
lobbyRouter.post('/join', (req: Request, res: Response) => {
  try {
    const { code, playerId, playerName, playerAvatarUrl } = req.body;
    
    if (!code || !playerId || !playerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const lobby = lobbyService.joinLobbyByCode(code, playerId, playerName, playerAvatarUrl || '');
    
    return res.status(200).json(lobby);
  } catch (error) {
    console.error('Error joining lobby:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
});

// Leave a lobby
lobbyRouter.post('/:lobbyId/leave', (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Missing player ID' });
    }
    
    const updatedLobby = lobbyService.leaveLobby(lobbyId, playerId);
    
    if (!updatedLobby) {
      return res.status(404).json({ error: 'Lobby not found or player not in lobby' });
    }
    
    return res.status(200).json(updatedLobby);
  } catch (error) {
    console.error('Error leaving lobby:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
});

// Set player ready status
lobbyRouter.post('/:lobbyId/ready', (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { playerId, isReady } = req.body;
    
    if (!playerId || isReady === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const updatedLobby = lobbyService.setPlayerReady(lobbyId, playerId, isReady);
    
    return res.status(200).json(updatedLobby);
  } catch (error) {
    console.error('Error setting player ready status:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
});

// Start the game
lobbyRouter.post('/:lobbyId/start', async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { playerId } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Missing player ID' });
    }
    
    const updatedLobby = await lobbyService.startGame(lobbyId, playerId);
    
    return res.status(200).json(updatedLobby);
  } catch (error) {
    console.error('Error starting game:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
});

// TODO: add code for moving to next phase

// End the game
lobbyRouter.post('/:lobbyId/end', async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    
    const updatedLobby = await lobbyService.endGame(lobbyId);
    
    return res.status(200).json(updatedLobby);
  } catch (error) {
    console.error('Error ending game:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
});

// Get a lobby by ID
lobbyRouter.get('/:lobbyId', (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    
    const lobby = lobbyService.getLobbyById(lobbyId);
    
    return res.status(200).json(lobby);
  } catch (error) {
    console.error('Error fetching lobby:', error);
    return res.status(404).json({ error: (error as Error).message });
  }
});

// Get a lobby by code
lobbyRouter.get('/code/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const lobby = lobbyService.getLobbyByCode(code);
    
    return res.status(200).json(lobby);
  } catch (error) {
    console.error('Error fetching lobby by code:', error);
    return res.status(404).json({ error: (error as Error).message });
  }
});

// Connect to lobby updates via Server-Sent Events
lobbyRouter.get('/:lobbyId/events', createServerSentEventHandler(sendEvent => {
  try {
    // Access the lobbyId from the request
    if (!sendEvent.request) {
      console.error('Request object is not available in SSE handler');
      sendEvent('error', { message: 'Internal server error' });
      return;
    }
    
    const lobbyId = sendEvent.request.params.lobbyId;
    
    if (!lobbyId) {
      console.error('Lobby ID not found in request params');
      sendEvent('error', { message: 'Lobby ID is required' });
      return;
    }
    
    // Send initial lobby state
    try {
      const lobby = lobbyService.getLobbyById(lobbyId);
      sendEvent('lobby_state', lobby);
      
      // Register this client for lobby updates
      registerClient(lobbyId, sendEvent);
      
      // Clean up when the client disconnects
      sendEvent.request.on('close', () => {
        removeClient(lobbyId, sendEvent);
      });
    } catch (error) {
      console.error('Error setting up lobby events:', error);
      sendEvent('error', { message: (error as Error).message });
    }
  } catch (error) {
    console.error('Error in lobby events:', error);
    sendEvent('error', { message: 'An unexpected error occurred' });
  }
})); 

lobbyRouter.get("/:lobbyId/current-phase/assignments", async (req, res) => {
  const { lobbyId } = req.params;

  try {
    const lobby = lobbyService.getLobbyById(lobbyId as UUID);
    // it is safe to alias lobbyCode as UUID at this point as it has been checked in the validateLobbyCode function.
    const [phaseAssignments, getPhaseAssignmentsError] = await lobbyService.getLobbyPhases(lobbyId as UUID);

    if (phaseAssignments) {
      const currentPhaseAssignments = phaseAssignments.filter((phase) => phase.phase.index === lobby.currentPhase.index);
      return res.status(200).json(currentPhaseAssignments);
    } else if (getPhaseAssignmentsError) {
      if (getPhaseAssignmentsError.type === ErrorType.NotFound) {
        return res.status(404).json(getPhaseAssignmentsError);
      } else {
        return res.status(500).json(getPhaseAssignmentsError);
      }
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }  
})

lobbyRouter.get("/:lobbyId/current-phase", async (req, res) => {
  const { lobbyId } = req.params;

  try {
    const lobby = await lobbyService.getLobbyById(lobbyId as UUID);
  
    if (lobby) {
      return res.status(200).json(lobby.currentPhase);
    } else {
      return res.status(404).json(new NotFoundErrorDetails("Lobby not found"));
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
})

lobbyRouter.put("/:lobbyCode/phase", async (req, res) => {
  const { lobbyCode } = req.params;

  try {
    const foundLobby = await lobbyService.getLobbyById(lobbyCode as UUID);

    if (!foundLobby) {
      return res.status(404).json(new NotFoundErrorDetails("Lobby not found"));
    } else if (foundLobby && foundLobby.currentPhase.phase === "Complete") {
      return res.status(403).json(new ErrorDetails("This game is already completed."));
    }
  
    // it is safe to alias lobbyCode as UUID at this point as it has been checked in the validateLobbyCode function.
    const [lobby, error] = await lobbyService.updateLobbyPhase(lobbyCode as UUID);
  
    if (lobby) {
      return res.status(200).json(lobby);
    } else {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else if (error.type === ErrorType.UpdatedError) {
        return res.status(400).json(error);
      } else {
        return res.status(500).json(error);
      }
    }
    
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
  
});
