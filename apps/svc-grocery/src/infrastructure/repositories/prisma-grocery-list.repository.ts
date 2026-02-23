import { db } from '@grocery/core-db';
import type { PrismaClient } from '@grocery/core-db';
import type {
  IGroceryListRepository,
  GroceryListReadModel,
} from '../../application/ports/repositories';

export class PrismaGroceryListRepository implements IGroceryListRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? db;
  }

  async findById(id: string): Promise<GroceryListReadModel | null> {
    const list = await this.prisma.groceryList.findUnique({
      where: { id },
    });

    return list ? this.toReadModel(list) : null;
  }

  async findByUserId(userId: string): Promise<GroceryListReadModel | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { list: true },
    });

    return user?.list ? this.toReadModel(user.list) : null;
  }

  async calculateSpent(listId: string): Promise<number> {
    const result = await this.prisma.groceryItem.aggregate({
      where: {
        listId,
        status: 'BOUGHT',
        actualPrice: { not: null },
      },
      _sum: {
        actualPrice: true,
      },
    });

    return result._sum.actualPrice ?? 0;
  }

  private toReadModel(list: any): GroceryListReadModel {
    return {
      id: list.id,
      name: list.name,
      monthlyBudget: list.monthlyBudget,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };
  }
}
