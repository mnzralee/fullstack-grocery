import { IGroceryItemRepository, IGroceryListRepository, GroceryItemReadModel } from '../../ports/repositories';
import { CreateItemDTO } from '../../dto/request';
import { GroceryItemResponseDTO, BudgetSummaryDTO } from '../../dto/response';
import { ListNotFoundError, ItemNotFoundError, BudgetExceededError } from '../../../domain/errors';
import { assertTransition } from '../../../domain/value-objects/item-status';

function mapItemToResponse(item: GroceryItemReadModel): GroceryItemResponseDTO {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    estimatedPrice: item.estimatedPrice,
    actualPrice: item.actualPrice,
    category: item.category,
    status: item.status,
    addedBy: {
      id: item.addedById,
      name: item.addedByName,
    },
    createdAt: item.createdAt.toISOString(),
  };
}

export class CreateGroceryItemUseCase {
  constructor(
    private readonly itemRepo: IGroceryItemRepository,
    private readonly listRepo: IGroceryListRepository,
  ) {}

  async execute(
    userId: string,
    listId: string,
    dto: CreateItemDTO,
  ): Promise<GroceryItemResponseDTO> {
    const list = await this.listRepo.findById(listId);
    if (!list) {
      throw new ListNotFoundError(listId);
    }

    const item = await this.itemRepo.create({
      name: dto.name,
      quantity: dto.quantity,
      estimatedPrice: dto.estimatedPrice,
      category: dto.category,
      listId: listId,
      addedById: userId,
    });

    return mapItemToResponse(item);
  }
}

export class ApproveItemUseCase {
  constructor(
    private readonly itemRepo: IGroceryItemRepository,
  ) {}

  async execute(
    itemId: string,
    action: 'APPROVE' | 'REJECT',
  ): Promise<GroceryItemResponseDTO> {
    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new ItemNotFoundError(itemId);
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    assertTransition(item.status, newStatus, action.toLowerCase());

    const updated = await this.itemRepo.updateStatus(itemId, {
      status: newStatus,
    });

    return mapItemToResponse(updated);
  }
}

export class MarkItemBoughtUseCase {
  constructor(
    private readonly itemRepo: IGroceryItemRepository,
    private readonly listRepo: IGroceryListRepository,
  ) {}

  async execute(
    itemId: string,
    actualPrice: number,
  ): Promise<GroceryItemResponseDTO> {
    const item = await this.itemRepo.findById(itemId);
    if (!item) {
      throw new ItemNotFoundError(itemId);
    }

    assertTransition(item.status, 'BOUGHT', 'mark as bought');

    const list = await this.listRepo.findById(item.listId);
    if (!list) {
      throw new ListNotFoundError(item.listId);
    }

    const totalSpent = await this.listRepo.calculateSpent(item.listId);
    const remaining = list.monthlyBudget - totalSpent;

    if (actualPrice > remaining) {
      throw new BudgetExceededError(actualPrice, remaining);
    }

    const updated = await this.itemRepo.updateStatus(itemId, {
      status: 'BOUGHT',
      actualPrice: actualPrice,
    });

    return mapItemToResponse(updated);
  }
}

export class GetListWithBudgetUseCase {
  constructor(
    private readonly itemRepo: IGroceryItemRepository,
    private readonly listRepo: IGroceryListRepository,
  ) {}

  async execute(listId: string): Promise<{
    items: GroceryItemResponseDTO[];
    budget: BudgetSummaryDTO;
  }> {
    const list = await this.listRepo.findById(listId);
    if (!list) {
      throw new ListNotFoundError(listId);
    }

    const items = await this.itemRepo.findByListId(listId);
    const totalSpent = await this.listRepo.calculateSpent(listId);

    const totalApproved = items
      .filter((i) => i.status === 'APPROVED')
      .reduce((sum, i) => sum + i.estimatedPrice * i.quantity, 0);

    const itemCounts = {
      pending: items.filter((i) => i.status === 'PENDING').length,
      approved: items.filter((i) => i.status === 'APPROVED').length,
      bought: items.filter((i) => i.status === 'BOUGHT').length,
      rejected: items.filter((i) => i.status === 'REJECTED').length,
    };

    return {
      items: items.map((item) => mapItemToResponse(item)),
      budget: {
        monthlyBudget: list.monthlyBudget,
        totalSpent,
        totalApproved,
        remaining: list.monthlyBudget - totalSpent,
        itemCounts,
      },
    };
  }
}
