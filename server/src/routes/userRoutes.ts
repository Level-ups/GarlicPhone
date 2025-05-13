import { Router } from 'express';
import { ErrorDetails, ErrorType, NotFoundErrorDetails, ValidationErrorDetails } from "../library/error-types";
import { validateCreateUser } from '../models/User';
import userService from '../services/userService';

const router = Router();

// User routes
router.get('/', async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});

router.get('/:id', async (req, res) => {
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
});

router.post('/', async (req, res) => {
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
});

router.put('/:id', (req, res) => {
  const validationResult = validateCreateUser(req.body);
  if (validationResult.length) {
    res.status(400).json(new ValidationErrorDetails('Invalid user data', validationResult));
  } else {
    res.json(userService.updateUser(req.params.id, req.body));
  }
});

router.post('/', async (req, res) => {
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
});

// router.put('/:id', async (req, res) => {
//   const validationResult = validateCreateUser(req.body);
//   if (validationResult.length) {
//     return res.status(400).json(new ValidationErrorDetails('Invalid user data', validationResult));
//   } else {
//     const [user, error] = await userService.updateUser(req.params.id, req.body);
//     if (user) {
//       return res.json(user);
//     } else if (error && error.type === ErrorType.NotFound) {
//       return res.status(404).json(error);
//     } else {
//       return res.status(500).json(new ErrorDetails('Failed to update user'));
//     }
//   }
// });

router.delete('/:id', async (req, res) => {
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
});

export { router as userRouter };

