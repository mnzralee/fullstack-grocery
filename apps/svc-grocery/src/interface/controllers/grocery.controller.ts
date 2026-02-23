import type { Request, Response, NextFunction } from 'express';
import type { CreateGroceryItemUseCase } from '../../application/use-cases/grocery';
import type { ApproveItemUseCase } from '../../application/use-cases/grocery';
import type { MarkItemBoughtUseCase } from '../../application/use-cases/grocery';
import type { GetListWithBudgetUseCase } from '../../application/use-cases/grocery';

export class GroceryController {
  constructor(
    private readonly createItemUseCase: CreateGroceryItemUseCase,
    private readonly approveItemUseCase: ApproveItemUseCase,
    private readonly markBoughtUseCase: MarkItemBoughtUseCase,
    private readonly getListUseCase: GetListWithBudgetUseCase,
  ) {}

  getListWithBudget = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const listId = req.params.listId as string;
      const result = await this.getListUseCase.execute(listId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  createItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id ?? 'anonymous';
      const listId = req.params.listId as string;
      const result = await this.createItemUseCase.execute(
        userId,
        listId,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  approveItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const itemId = req.params.itemId as string;
      const { action } = req.body;
      const result = await this.approveItemUseCase.execute(itemId, action);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  markBought = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const itemId = req.params.itemId as string;
      const { actualPrice } = req.body;
      const result = await this.markBoughtUseCase.execute(itemId, actualPrice);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
