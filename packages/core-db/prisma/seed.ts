import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Clean slate
  await prisma.groceryItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.groceryList.deleteMany();

  // Create a household grocery list
  const list = await prisma.groceryList.create({
    data: {
      name: 'Ali Family Groceries',
      monthlyBudget: 50000, // $500.00 in cents
    },
  });

  console.log(`Created list: ${list.name} (budget: $${list.monthlyBudget / 100})`);
  console.log(`  List ID: ${list.id}  ← You'll need this for the frontend URL`);

  // Create users with bcrypt-hashed passwords
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash('grocery123', 12);

  const manager = await prisma.user.create({
    data: {
      email: 'manager@grocery.test',
      name: 'Sarah (Manager)',
      password: hashedPassword,
      role: 'MANAGER',
      listId: list.id,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@grocery.test',
      name: 'Alex (Member)',
      password: hashedPassword,
      role: 'MEMBER',
      listId: list.id,
    },
  });

  console.log(`Created users: ${manager.name}, ${member.name}`);

  // Create some grocery items
  const items = await prisma.groceryItem.createMany({
    data: [
      {
        name: 'Whole Milk',
        quantity: 2,
        estimatedPrice: 350,   // $3.50
        category: 'DAIRY',
        status: 'PENDING',
        listId: list.id,
        addedById: member.id,
      },
      {
        name: 'Sourdough Bread',
        quantity: 1,
        estimatedPrice: 450,   // $4.50
        category: 'BAKERY',
        status: 'APPROVED',
        listId: list.id,
        addedById: member.id,
      },
      {
        name: 'Chicken Breast',
        quantity: 2,
        estimatedPrice: 899,   // $8.99
        category: 'MEAT',
        status: 'BOUGHT',
        actualPrice: 799,      // $7.99 (was on sale!)
        listId: list.id,
        addedById: member.id,
      },
    ],
  });

  console.log(`Created ${items.count} grocery items`);
  console.log('Seed complete!');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
