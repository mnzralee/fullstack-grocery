// ============================================================
// Dependency Injection Container
// ============================================================

// 1. Infrastructure — Repository implementations
import { PrismaGroceryItemRepository } from '../../infrastructure/repositories/prisma-grocery-item.repository';
import { PrismaGroceryListRepository } from '../../infrastructure/repositories/prisma-grocery-list.repository';

const itemRepository = new PrismaGroceryItemRepository();
const listRepository = new PrismaGroceryListRepository();

// 2. Application — Use cases (wired with repository ports)
import {
  CreateGroceryItemUseCase,
  ApproveItemUseCase,
  MarkItemBoughtUseCase,
  GetListWithBudgetUseCase,
} from '../../application/use-cases/grocery';

const createItemUseCase = new CreateGroceryItemUseCase(itemRepository, listRepository);
const approveItemUseCase = new ApproveItemUseCase(itemRepository);
const markBoughtUseCase = new MarkItemBoughtUseCase(itemRepository, listRepository);
const getListUseCase = new GetListWithBudgetUseCase(itemRepository, listRepository);

// 3. Interface — Controllers (wired with use cases)
import { GroceryController } from '../../interface/controllers/grocery.controller';

const groceryController = new GroceryController(
  createItemUseCase,
  approveItemUseCase,
  markBoughtUseCase,
  getListUseCase,
);

// Export the container
export const container = {
  groceryController,
  itemRepository,
  listRepository,
};
