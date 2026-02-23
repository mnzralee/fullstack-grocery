import { db } from '@grocery/core-db';
import type { PrismaClient } from '@grocery/core-db';
import type {
  IGroceryItemRepository,
  GroceryItemReadModel,
  CreateGroceryItemInput,
  UpdateItemStatusInput,
} from '../../application/ports/repositories';

export class PrismaGroceryItemRepository implements IGroceryItemRepository {
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? db;
  }

  async findById(id: string): Promise<GroceryItemReadModel | null> {
    const item = await this.prisma.groceryItem.findUnique({
      where: { id },
      include: {
        addedBy: {
          select: { name: true },
        },
      },
    });

    return item ? this.toReadModel(item) : null;
  }

  async findByListId(listId: string): Promise<GroceryItemReadModel[]> {
    const items = await this.prisma.groceryItem.findMany({
      where: { listId },
      include: {
        addedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.toReadModel(item));
  }

  async findByListIdAndStatus(
    listId: string,
    status: string,
  ): Promise<GroceryItemReadModel[]> {
    const items = await this.prisma.groceryItem.findMany({
      where: { listId, status: status as any },
      include: {
        addedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.toReadModel(item));
  }

  async create(input: CreateGroceryItemInput): Promise<GroceryItemReadModel> {
    const item = await this.prisma.groceryItem.create({
      data: {
        name: input.name,
        quantity: input.quantity,
        estimatedPrice: input.estimatedPrice,
        category: input.category as any,
        status: 'PENDING',
        listId: input.listId,
        addedById: input.addedById,
      },
      include: {
        addedBy: {
          select: { name: true },
        },
      },
    });

    return this.toReadModel(item);
  }

  async updateStatus(
    id: string,
    input: UpdateItemStatusInput,
  ): Promise<GroceryItemReadModel> {
    const item = await this.prisma.groceryItem.update({
      where: { id },
      data: {
        status: input.status as any,
        ...(input.actualPrice !== undefined && { actualPrice: input.actualPrice }),
      },
      include: {
        addedBy: {
          select: { name: true },
        },
      },
    });

    return this.toReadModel(item);
  }

  private toReadModel(item: any): GroceryItemReadModel {
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      estimatedPrice: item.estimatedPrice,
      actualPrice: item.actualPrice,
      category: item.category,
      status: item.status,
      addedById: item.addedById,
      addedByName: item.addedBy?.name ?? 'Unknown',
      listId: item.listId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
