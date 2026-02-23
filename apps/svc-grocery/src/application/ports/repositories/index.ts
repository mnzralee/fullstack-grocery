export interface GroceryItemReadModel {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number;
  actualPrice: number | null;
  category: string;
  status: string;
  addedById: string;
  addedByName: string;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroceryListReadModel {
  id: string;
  name: string;
  monthlyBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGroceryItemInput {
  name: string;
  quantity: number;
  estimatedPrice: number;
  category: string;
  listId: string;
  addedById: string;
}

export interface UpdateItemStatusInput {
  status: string;
  actualPrice?: number;
}

export interface IGroceryItemRepository {
  findById(id: string): Promise<GroceryItemReadModel | null>;
  findByListId(listId: string): Promise<GroceryItemReadModel[]>;
  findByListIdAndStatus(listId: string, status: string): Promise<GroceryItemReadModel[]>;
  create(input: CreateGroceryItemInput): Promise<GroceryItemReadModel>;
  updateStatus(id: string, input: UpdateItemStatusInput): Promise<GroceryItemReadModel>;
}

export interface IGroceryListRepository {
  findById(id: string): Promise<GroceryListReadModel | null>;
  findByUserId(userId: string): Promise<GroceryListReadModel | null>;
  calculateSpent(listId: string): Promise<number>;
}
