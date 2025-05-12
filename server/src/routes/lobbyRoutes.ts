import { UUID } from "crypto";
import { Router } from "express";
import { ErrorDetails, ErrorType, ValidationErrorDetails } from "../library/error-types";
import { validateLobbyAndUserId, validateLobbyCode } from "../models/Lobby";
import lobbyService from "../services/lobbyService";

const router = Router();

router.get("/", async (_req, res) => {
  const [lobbies, error] = await lobbyService.getAllLobbies();

  if (error) {
    return res.status(500).json(error);
  } else {
    return res.status(200).json(lobbies);
  }
});

router.post("/", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json(new ValidationErrorDetails(
      "userId is required",
      [{
        field: "userId",
        message: "userId is required",
        isValid: false,
      }]
    ));
  } else {
    const [createdLobby, error] = await lobbyService.createLobby(userId);
    
    if (createdLobby) {
      return res.status(201).json(createdLobby);
    } else {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else {
        return res.status(500).json(error);
      } 
    }
  }
});

router.get("/:lobbyCode", async (req, res) => {
  const { lobbyCode } = req.params;

  const validationResult = validateLobbyCode(lobbyCode);

  if (validationResult.length) {
    return res.status(400).json(new ValidationErrorDetails("Invalid or Missing Lobby Code", validationResult))
  } else {
    // continue with the rest of the function
  }

  // it is safe to alias lobbyCode as UUID at this point as it has been checked in the validateLobbyCode function.
  const [lobby, error] = await lobbyService.getLobbyById(lobbyCode as UUID);

  if (lobby) {
    return res.status(200).json(lobby);
  } else {
    if (error.type === ErrorType.NotFound) {
      return res.status(404).json(error);
    } else {
      return res.status(500).json(error);
    }
  }
});

router.post("/:lobbyCode/players", async (req, res) => {
  const { lobbyCode } = req.params;
  const { userId } = req.body;

  const validationResult = validateLobbyAndUserId(lobbyCode, userId);

  if (validationResult.length) {
    return res.status(400).json(new ValidationErrorDetails("Invalid or Missing Lobby Code", validationResult))
  } else {
    // continue with the rest of the function
  }

  // it is safe to alias lobbyCode as UUID at this point as it has been checked in the validateLobbyCode function.
  const [lobby, error] = await lobbyService.addPlayerToLobby(lobbyCode as UUID, userId);

  if (lobby) {
    return res.status(200).json(lobby);
  } else {
    if (error.type === ErrorType.NotFound) {
      return res.status(404).json(error);
    } else {
      return res.status(500).json(error);
    }
  }
  
});

router.get("/:lobbyCode/current-phase/assignments", async (req, res) => {
  const { lobbyCode } = req.params;

  const validationResult = validateLobbyCode(lobbyCode);

  if (validationResult.length) {
    return res.status(400).json(new ValidationErrorDetails("Invalid or Missing Lobby Code", validationResult))
  } else {
    // continue with the rest of the function
  }

  const [lobby, findLobbyError] = await lobbyService.getLobbyById(lobbyCode as UUID);

  if (findLobbyError) {
    if (findLobbyError.type === ErrorType.NotFound) {
      return res.status(404).json(findLobbyError);
    } else {
      return res.status(500).json(findLobbyError);
    }
  } else {
    // continue with the rest of the function
  }

  // it is safe to alias lobbyCode as UUID at this point as it has been checked in the validateLobbyCode function.
  const [phaseAssignments, getPhaseAssignmentsError] = await lobbyService.getLobbyPhases(lobbyCode as UUID);

  if (phaseAssignments) {
    const currentPhaseAssignments = phaseAssignments.filter((phase) => phase.phase.promptIndex === lobby.currentPhase.promptIndex);
    return res.status(200).json(currentPhaseAssignments);
  } else if (getPhaseAssignmentsError) {
    if (getPhaseAssignmentsError.type === ErrorType.NotFound) {
      return res.status(404).json(findLobbyError);
    } else {
      return res.status(500).json(findLobbyError);
    }
  }
})

router.get("/:lobbyCode/current-phase", async (req, res) => {
  const { lobbyCode } = req.params;

  const validationResult = validateLobbyCode(lobbyCode);

  if (validationResult.length) {
    return res.status(400).json(new ValidationErrorDetails("Invalid or Missing Lobby Code", validationResult))
  } else {
    // continue with the rest of the function
  }

  const [lobby, findLobbyError] = await lobbyService.getLobbyById(lobbyCode as UUID);

  if (lobby) {
    return res.status(200).json(lobby.currentPhase);
  } else {
    if (findLobbyError.type === ErrorType.NotFound) {
      return res.status(404).json(findLobbyError);
    } else {
      return res.status(500).json(findLobbyError);
    }
  }
})

router.put("/:lobbyCode/phase", async (req, res) => {
  const { lobbyCode } = req.params;

  const validationResult = validateLobbyCode(lobbyCode);

  if (validationResult.length) {
    return res.status(400).json(new ValidationErrorDetails("Invalid or Missing Lobby Code", validationResult))
  } else {
    // continue with the rest of the function
  }

  const [foundLobby, foundLobbyError] = await lobbyService.getLobbyById(lobbyCode as UUID);

  if (foundLobby && foundLobby.currentPhase.phase === "Complete") {
    return res.status(403).json(new ErrorDetails("This game is already completed."));
  } else if (foundLobbyError) {
    if (foundLobbyError.type === ErrorType.NotFound) {
      return res.status(404).json(foundLobbyError);
    } else {
      return res.status(500).json(foundLobbyError);
    }
  } else {
    // continue with the rest of the function
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
  
});

router.delete("/:lobbyCode/players/:userId", async (req, res) => {
  const { lobbyCode, userId } = req.params;

  const validationResult = validateLobbyAndUserId(lobbyCode, Number(userId));

  if (validationResult.length) {
    return res.status(400).json(new ValidationErrorDetails("Invalid or Missing Lobby Code", validationResult))
  } else {
    // continue with the rest of the function
  }

  // it is safe to alias lobbyCode as UUID at this point as it has been checked in the validateLobbyCode function.
  const [lobby, error] = await lobbyService.removePlayerFromLobby(lobbyCode as UUID, userId);

  if (lobby) {
    return res.status(200).json(lobby);
  } else {
    if (error.type === ErrorType.NotFound) {
      return res.status(404).json(error);
    } else {
      return res.status(500).json(error);
    }
  }
})

export { router as lobbyRouter };

