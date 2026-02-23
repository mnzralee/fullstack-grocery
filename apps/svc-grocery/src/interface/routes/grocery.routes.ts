import { Router } from 'express';
import { validateBody } from '../middlewares/validation.middleware';
import { authMiddleware, requireManager, requireMember } from '../middlewares/auth.middleware';
import {
  createItemSchema,
  approveItemSchema,
  markBoughtSchema,
} from '../../application/dto/request';
import { GroceryController } from '../controllers/grocery.controller';

export function createGroceryRoutes(controller: GroceryController): Router {
  const router = Router();

  router.get(
    '/lists/:listId',
    authMiddleware,
    controller.getListWithBudget,
  );

  router.post(
    '/lists/:listId/items',
    authMiddleware,
    requireMember,
    validateBody(createItemSchema),
    controller.createItem,
  );

  router.post(
    '/items/:itemId/approve',
    authMiddleware,
    requireManager,
    validateBody(approveItemSchema),
    controller.approveItem,
  );

  router.post(
    '/items/:itemId/buy',
    authMiddleware,
    requireMember,
    validateBody(markBoughtSchema),
    controller.markBought,
  );

  return router;
}
