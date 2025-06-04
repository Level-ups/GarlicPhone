import { Router } from 'express';
import { ErrorDetails, ErrorType, ValidationErrorDetails } from "../library/error-types";
import { validateCreateUser } from '../models/User';
import userService from '../services/userService';

const router = Router();

// User routes
router.get('/', async (req, res) => {
  try {
    const [users, error] = await userService.getAllUsers();
    if (error) {
      return res.status(404).json(error);
    } else {
      return res.json(users);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [user, error] = await userService.getUserById(req.params.id);
    if (error) {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else {
        return res.status(500).json(error);
      }
    } else {
      return res.json(user);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

router.post('/', async (req, res) => {
  try{
    const validationResult = validateCreateUser(req.body);
    if (validationResult.length) {
      res.status(400).json(new ValidationErrorDetails('Invalid user data', validationResult));
    } else {
      const [user, error] = await userService.createUser(req.body);
      if (user) {
        res.status(201).json(user);
      } else if (error && error.type === ErrorType.InsertionError) {
        res.status(500).json(error);
      } else {
        res.status(500).json(new ErrorDetails('Failed to create user'));
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

router.put('/:id', (req, res) => {
  try {
    const validationResult = validateCreateUser(req.body);
    if (validationResult.length) {
      res.status(400).json(new ValidationErrorDetails('Invalid user data', validationResult));
    } else {
      res.json(userService.updateUser(req.params.id, req.body));
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

router.post('/', async (req, res) => {
  try {
    const validationResult = validateCreateUser(req.body);
    if (validationResult.length) {
      return res.status(400).json(new ValidationErrorDetails('Invalid user data', validationResult));
    } else {
      const [user, error] = await userService.createUser(req.body);
      if (user) {
        return res.status(201).json(user);
      } else if (error && error.type === ErrorType.InsertionError) {
        return res.status(500).json(error);
      } else {
        return res.status(500).json(new ErrorDetails('Failed to create user'));
      }
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [isDeleted, error] = await userService.deleteUser(req.params.id);
    if (error) {
      if (error.type === ErrorType.NotFound) {
        return res.status(404).json(error);
      } else {
        return res.status(500).json(error);
      }
    } else {
      return res.status(204).send();
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
});

router.get('/gallery', async (req, res) => {
  console.log("Fetching user gallery");
 
  try {
     const userId = req.user?.id;
 
    if (!userId) {
      return res.status(401).json(new ErrorDetails("Unauthorized", ["User is not authenticated"]));
    };
 
    const [images, error] = await userService.getUserGallery(userId);
    console.log(images![0].prompts);
   
    if (error) {
      return res.status(404).json(error);
    } else {
      return res.json(images);
    }
  } catch (error: any) {
    return res.status(500).json(new ErrorDetails("An unexpected error occurred", [error.message], error.stack));
  }
})

export { router as userRouter };

