import { Router } from 'express';
import { ErrorResponse } from '../library/types';
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
    res.status(404).json(new ErrorResponse('User not found'));
  } else {
    res.json(user);
  }
});

router.post('/', (req, res) => {
  res.json(userService.createUser(req.body));
});

router.put('/:id', (req, res) => {
  res.json(userService.updateUser(req.params.id, req.body));
});

router.delete('/:id', (req, res) => {
  res.json(userService.deleteUser(req.params.id));
});

export { router as userRouter };
