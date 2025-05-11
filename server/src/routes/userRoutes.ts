import { Router } from 'express';
import { ErrorDetails, ErrorType, NotFoundErrorDetails, ValidationErrorDetails } from "../library/error-types";
import { validateCreateOrUpdateUser } from '../models/User';
import userService from '../services/userService';

const router = Router();

// User routes
router.get('/', async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json(new NotFoundErrorDetails('User not found'));
  } else {
    res.json(user);
  }
});

router.post('/', async (req, res) => {
  const validationResult = validateCreateOrUpdateUser(req.body);
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
  const validationResult = validateCreateOrUpdateUser(req.body);
  if (validationResult.length) {
    res.status(400).json(new ValidationErrorDetails('Invalid user data', validationResult));
  } else {
    res.json(userService.updateUser(req.params.id, req.body));
  }
});

router.delete('/:id', (req, res) => {
  res.json(userService.deleteUser(req.params.id));
});

export { router as userRouter };
