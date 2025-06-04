import { UUID } from 'crypto';
import express, { Request, Response } from 'express';
import { ErrorDetails, ErrorType, ValidationErrorDetails } from '../library/error-types';
import { validateLobbyJoinCode, validateLobbyUrlId } from "../models/Lobby";
import * as lobbyService from '../services/lobbyService';

export const lobbyRouter = express.Router();

// Create a new lobby
lobbyRouter.post('/', (req: Request, res: Response) => {
  try {
    const { hostName, hostAvatarUrl, maxPlayers } = req.body;
    const hostId = req.user?.id;


    if (!hostId) {
      return res.status(401).json(new ErrorDetails("Unauthorized", ["User is not authenticated"]));
    };
    // debugLog("BODY:", req.body);

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
    const { code, playerName, playerAvatarUrl } = req.body;
    const playerId = req.user?.id;

    if (!playerId) {
      return res.status(401).json(new ErrorDetails("Unauthorized", ["User is not authenticated"]));
    };
    
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
    const playerId = req.user?.id;

    if (!playerId) {
      return res.status(401).json(new ErrorDetails("Unauthorized", ["User is not authenticated"]));
    };

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
    const { isReady } = req.body;
    const playerId = req.user?.id;

    if (!playerId) {
      return res.status(401).json(new ErrorDetails("Unauthorized", ["User is not authenticated"]));
    };

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
    const playerId = req.user?.id;

    if (!playerId) {
      return res.status(401).json(new ErrorDetails("Unauthorized", ["User is not authenticated"]));
    };

    const [updatedLobby, updatedLobbyError] = await lobbyService.startGame(lobbyId as UUID, playerId);
    
    if (updatedLobbyError) {
      return res.status(404).json(updatedLobbyError);
    }

    return res.status(200).json(updatedLobby);
  } catch (error: any) {
    return res.status(400).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

// TODO: add code for moving to next phase

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

lobbyRouter.get("/:lobbyId/current-phase/assignments", async (req, res) => {
  const { lobbyId } = req.params;
  const playerId = req.user?.id;

  if (!playerId) {
    return res.status(401).json(new ErrorDetails("Unauthorized", ["User is not authenticated"]));
  };

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
      if (playerId) currentPhaseAssignments.filter(assignment => assignment.player.id === Number(playerId));
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
