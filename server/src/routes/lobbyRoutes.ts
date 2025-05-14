import * as lobbyService from '../services/lobbyService';
import express, { Request, Response } from 'express';
import { registerClient, removeClient } from '../library/lobbyEventBroadcaster';
import { ErrorDetails, ErrorType, NotFoundErrorDetails, ValidationErrorDetails } from '../library/error-types';
import { createServerSentEventHandler } from '../library/serverSentEvents';
import { validateLobbyJoinCode, validateLobbyUrlId } from "../models/Lobby";
import { UUID } from 'crypto';

export const lobbyRouter = express.Router();

// Create a new lobby
lobbyRouter.post('/', (req: Request, res: Response) => {
  try {
    const { hostId, hostName, hostAvatarUrl, maxPlayers } = req.body;

    // console.log("BODY:", req.body);

    if (hostId == null || hostName == null) {
      // TODO: use ValidationResults to let the user know what fields are missing.
      return res.status(400).json(new ValidationErrorDetails(
        "Missing required fields",
        [{
          field: "hostId",
          message: "hostId is required",
          isValid: !!hostId,
        }, {
          field: "hostName",
          message: "hostName is required",
          isValid: !!hostName,
        }]
      ));
    }
    
    const [lobby, error] = lobbyService.createLobby(hostId, hostName, hostAvatarUrl || '', maxPlayers);
    
    return res.status(201).json(lobby);
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// Join a lobby by code
lobbyRouter.post('/join', (req: Request, res: Response) => {
  try {
    const { code, playerId, playerName, playerAvatarUrl } = req.body;
    
    if (code == null || playerId == null || playerName == null) {
      return res.status(400).json(new ValidationErrorDetails(
        "Missing required fields",
        [{
          field: "code",
          message: "code is required",
          isValid:!!code,
        }, {
          field: "playerId",
          message: "playerId is required",
          isValid:!!playerId,
        }, {
          field: "playerName",
          message: "playerName is required",
          isValid:!!playerName,
        }]
      ));
    }
    
    const [lobby, joinLobbyError] = lobbyService.joinLobbyByCode(code, playerId, playerName, playerAvatarUrl || '');
    
    if (joinLobbyError) {
      return res.status(404).json(joinLobbyError);
    }
    return res.status(200).json(lobby);
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// Leave a lobby
lobbyRouter.post('/:lobbyId/leave', (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { playerId } = req.body;

    const lobbyIdValidationResult = validateLobbyUrlId(lobbyId);
    if (!lobbyIdValidationResult.length) {
      return res.status(400).json(new ValidationErrorDetails('Invalid lobby ID', lobbyIdValidationResult));
    } 
    
    if (!playerId) {
      return res.status(400).json(new ValidationErrorDetails('Missing required fields', [{
        field: "playerId",
        message: "playerId is required",
        isValid: false,
      }]));
    }
    
    const [updatedLobby, updateLobbyError] = lobbyService.leaveLobby(lobbyId as UUID, playerId);
    
    if (!updateLobbyError) {
      return res.status(404).json(updateLobbyError);
    }
    
    return res.status(200).json(updatedLobby);
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// Set player ready status
lobbyRouter.post('/:lobbyId/ready', (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { playerId, isReady } = req.body;

    const validationResults = ([...validateLobbyUrlId(lobbyId), {
          field: "playerId",
          message: "playerId is required",
          isValid: !!playerId,
        }, {
          field: "isReady",
          message: "isReady is required",
          isValid: !!isReady,
        }
    ]).filter((result) => !result.isValid);

    if (validationResults.length) {
      return res.status(400).json(new ValidationErrorDetails('Validation failed', validationResults));
    }
    
    const [updatedLobby, updateLobbyError] = lobbyService.setPlayerReady(lobbyId as UUID, playerId, isReady);
    
    if (updateLobbyError) {
      return res.status(404).json(updateLobbyError);
    }

    return res.status(200).json(updatedLobby);
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// Start the game
lobbyRouter.post('/:lobbyId/start', async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const { playerId } = req.body;
    
    const validationResults = ([...validateLobbyUrlId(lobbyId), {
      field: "playerId",
      message: "playerId is required",
      isValid: !!playerId,
    }
  ]).filter((result) => !result.isValid);

  if (validationResults.length) {
    return res.status(400).json(new ValidationErrorDetails('Validation failed', validationResults));
  }
    
    const [updatedLobby, updatedLobbyError] = await lobbyService.startGame(lobbyId as UUID, playerId);
    
    if (updatedLobbyError) {
      return res.status(404).json(updatedLobbyError);
    }

    return res.status(200).json(updatedLobby);
  } catch (error: any) {
    return res.status(400).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// End the game
lobbyRouter.post('/:lobbyId/end', async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;

    const validationResults = validateLobbyUrlId(lobbyId);

    if (validationResults.length) {
      return res.status(400).json(new ValidationErrorDetails('Validation failed', validationResults));
    }
    
    const updatedLobby = await lobbyService.endGame(lobbyId as UUID);
    
    return res.status(200).json(updatedLobby);
  } catch (error: any) {
    return res.status(400).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// Get a lobby by ID
lobbyRouter.get('/:lobbyId', (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;

    const validationResults = validateLobbyUrlId(lobbyId);

    if (validationResults.length) {
      return res.status(400).json(new ValidationErrorDetails('Validation failed', validationResults));
    }
    
    const [lobby, findLobbyError] = lobbyService.getLobbyById(lobbyId);
    
    if (findLobbyError) {
      return res.status(404).json(findLobbyError);
    }

    return res.status(200).json(lobby);
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// Get a lobby by code
lobbyRouter.get('/code/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const validationResults = validateLobbyJoinCode(code);
    
    if (validationResults.length) {
      return res.status(400).json(new ValidationErrorDetails('Validation failed', validationResults));
    }

    const [lobby, findLobbyError] = lobbyService.getLobbyByCode(code);
    
    if (findLobbyError) {
      return res.status(404).json(findLobbyError);
    }

    return res.status(200).json(lobby);
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// Connect to lobby updates via Server-Sent Events
lobbyRouter.get('/:lobbyId/events', createServerSentEventHandler(sendEvent => {
  try {
    // Access the lobbyId from the request
    if (!sendEvent.request) {
      sendEvent('error', new NotFoundErrorDetails('Lobby ID not found'));
      return;
    }
    
    const lobbyId = sendEvent.request.params.lobbyId;

    const validationResults = validateLobbyUrlId(lobbyId);

    if (validationResults.length) {
      sendEvent('error', new ValidationErrorDetails('Validation failed', validationResults));
      return;
    }
    
    // Send initial lobby state
    try {
      const [lobby, findLobbyError] = lobbyService.getLobbyById(lobbyId);
      if (findLobbyError) {
        sendEvent('error', findLobbyError);
        return;
      }

      sendEvent('lobby_state', lobby);
      
      // Register this client for lobby updates
      registerClient(lobbyId, sendEvent);
      
      // Clean up when the client disconnects
      sendEvent.request.on('close', () => {
        removeClient(lobbyId, sendEvent);
      });
    } catch (error: any) {
      sendEvent('error', new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
    }
  } catch (error: any) {
    sendEvent('error', new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
})); 

lobbyRouter.get("/:lobbyId/current-phase/assignments", async (req, res) => {
  const { lobbyId } = req.params;

  try {
    
    const validationResults = validateLobbyUrlId(lobbyId);
    
    if (validationResults.length) {
      return res.status(400).json(new ValidationErrorDetails('Validation failed', validationResults));
    }

    const [lobby, findLobbyError] = lobbyService.getLobbyById(lobbyId as UUID);

    if (findLobbyError) {
      return res.status(404).json(findLobbyError);
    }
    // it is safe to alias lobbyCode as UUID at this point as it has been checked in the validateLobbyCode function.
    const [phaseAssignments, getPhaseAssignmentsError] = await lobbyService.getLobbyPhases(lobbyId as UUID);

    if (phaseAssignments) {
      const currentPhaseAssignments = phaseAssignments.filter((phase) => phase.phase.index === lobby.phases.getCurrentPhase().index);
      return res.status(200).json(currentPhaseAssignments);
    } else if (getPhaseAssignmentsError) {
      if (getPhaseAssignmentsError.type === ErrorType.NotFound) {
        return res.status(404).json(getPhaseAssignmentsError);
      } else {
        return res.status(500).json(getPhaseAssignmentsError);
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }  
})

lobbyRouter.get("/:lobbyId/current-phase", async (req, res) => {
  const { lobbyId } = req.params;

  try {
    const validationResults = validateLobbyUrlId(lobbyId);
    
    if (validationResults.length) {
      return res.status(400).json(new ValidationErrorDetails('Validation failed', validationResults));
    }

    const [lobby, findLobbyError] = await lobbyService.getLobbyById(lobbyId as UUID);
  
    if (lobby) {
      return res.status(200).json(lobby.phases.getCurrentPhase());
    } else {
      return res.status(404).json(findLobbyError);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
})

lobbyRouter.put("/:lobbyCode/phase", async (req, res) => {
  const { lobbyCode } = req.params;

  try {
    const [foundLobby, findLobbyError] = lobbyService.getLobbyById(lobbyCode as UUID);

    if (!foundLobby) {
      return res.status(404).json(findLobbyError);
    } else if (foundLobby.phases.getCurrentPhase().phase === "Complete") {
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
    
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
  
});
