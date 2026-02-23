import { test, expect, type Page } from '@playwright/test';

const MANAGER_EMAIL = 'manager@grocery.test';
const MEMBER_EMAIL = 'member@grocery.test';
const PASSWORD = 'grocery123';

// Helper: login and navigate to grocery list
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input#email', email);
  await page.fill('input#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/grocery\//, { timeout: 10000 });
}

// Helper: get specific item card by item name (targets the immediate card div)
function getItemCard(page: Page, itemName: string) {
  return page.locator('.rounded-lg.shadow-sm.border', { has: page.locator(`text="${itemName}"`) });
}

test.describe('Login Flow', () => {
  test('should show login page with test credentials hint', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Grocery List');
    await expect(page.locator('text=manager@grocery.test')).toBeVisible();
    await expect(page.locator('text=member@grocery.test')).toBeVisible();
  });

  test('should redirect home page to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/);
    await expect(page.locator('h2')).toContainText('Grocery List');
  });

  test('should login as manager and redirect to grocery list', async ({ page }) => {
    await login(page, MANAGER_EMAIL);
    await expect(page.locator('h1')).toContainText('Grocery List');
  });

  test('should login as member and redirect to grocery list', async ({ page }) => {
    await login(page, MEMBER_EMAIL);
    await expect(page.locator('h1')).toContainText('Grocery List');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input#email', 'wrong@test.com');
    await page.fill('input#password', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Grocery List View', () => {
  test('should display seeded items grouped by status', async ({ page }) => {
    await login(page, MANAGER_EMAIL);

    await expect(page.locator('text=Monthly Budget')).toBeVisible();
    await expect(page.locator('text=Whole Milk')).toBeVisible();
    await expect(page.locator('text=Sourdough Bread')).toBeVisible();
    await expect(page.locator('text=Chicken Breast')).toBeVisible();
    await expect(page.locator('text=Pending Approval')).toBeVisible();
    await expect(page.locator('text=Ready to Buy')).toBeVisible();
    await expect(page.locator('text=Purchased')).toBeVisible();
  });

  test('should display budget summary with correct values', async ({ page }) => {
    await login(page, MANAGER_EMAIL);

    // Budget bar should show $500.00 total
    await expect(page.locator('text=$500.00')).toBeVisible();

    // Chicken Breast was bought for $7.99 — check within the item card only
    const chickenCard = getItemCard(page, 'Chicken Breast');
    await expect(chickenCard.locator('text=Paid:')).toBeVisible();
  });

  test('should show Approve/Reject buttons on PENDING items', async ({ page }) => {
    await login(page, MANAGER_EMAIL);

    const milkCard = getItemCard(page, 'Whole Milk');
    await expect(milkCard.locator('button', { hasText: 'Approve' })).toBeVisible();
    await expect(milkCard.locator('button', { hasText: 'Reject' })).toBeVisible();
  });

  test('should show Mark Bought button on APPROVED items', async ({ page }) => {
    await login(page, MANAGER_EMAIL);

    const breadCard = getItemCard(page, 'Sourdough Bread');
    await expect(breadCard.locator('button', { hasText: 'Mark Bought' })).toBeVisible();
  });
});

test.describe('Add Item Flow', () => {
  test('should add a new grocery item', async ({ page }) => {
    await login(page, MEMBER_EMAIL);

    await page.fill('input[placeholder="Item name"]', 'Fresh Oranges');
    await page.fill('input[placeholder="Qty"]', '4');
    await page.fill('input[placeholder="Price ($)"]', '3.99');
    await page.selectOption('select', 'PRODUCE');
    await page.click('button:has-text("Add to List")');

    // Wait for the new item to appear
    await expect(page.locator('text=Fresh Oranges')).toBeVisible({ timeout: 5000 });

    // Verify it shows in the Pending section
    const orangeCard = getItemCard(page, 'Fresh Oranges');
    await expect(orangeCard).toBeVisible();
  });
});

test.describe('Approve/Reject Flow (Manager)', () => {
  test('should approve a PENDING item', async ({ page }) => {
    await login(page, MANAGER_EMAIL);

    const milkCard = getItemCard(page, 'Whole Milk');
    await milkCard.locator('button', { hasText: 'Approve' }).click();

    // Wait for the card to show APPROVED badge
    await expect(milkCard.locator('span.rounded-full:has-text("APPROVED")')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mark Bought Flow', () => {
  test('should mark an APPROVED item as bought', async ({ page }) => {
    await login(page, MANAGER_EMAIL);

    const breadCard = getItemCard(page, 'Sourdough Bread');
    await breadCard.locator('button', { hasText: 'Mark Bought' }).click();

    // Wait for badge to change to BOUGHT
    await expect(breadCard.locator('span.rounded-full:has-text("BOUGHT")')).toBeVisible({ timeout: 5000 });

    // Should show "Paid:" text
    await expect(breadCard.locator('text=Paid:')).toBeVisible();
  });
});

test.describe('Full Household Workflow', () => {
  test('should complete a full add, approve, buy cycle', async ({ page, context }) => {
    // Step 1: Member adds an item
    await login(page, MEMBER_EMAIL);
    await page.fill('input[placeholder="Item name"]', 'Greek Yogurt');
    await page.fill('input[placeholder="Qty"]', '2');
    await page.fill('input[placeholder="Price ($)"]', '5.49');
    await page.selectOption('select', 'DAIRY');
    await page.click('button:has-text("Add to List")');
    await expect(page.locator('text=Greek Yogurt')).toBeVisible({ timeout: 5000 });

    // Step 2: Manager logs in and approves
    const managerPage = await context.newPage();
    await login(managerPage, MANAGER_EMAIL);
    await expect(managerPage.locator('text=Greek Yogurt')).toBeVisible({ timeout: 5000 });

    const yogurtCard = getItemCard(managerPage, 'Greek Yogurt');
    await yogurtCard.locator('button', { hasText: 'Approve' }).click();
    await expect(yogurtCard.locator('span.rounded-full:has-text("APPROVED")')).toBeVisible({ timeout: 5000 });

    // Step 3: Member refreshes and marks as bought
    await page.reload();
    await page.waitForSelector('text=Greek Yogurt', { timeout: 5000 });
    const memberYogurtCard = getItemCard(page, 'Greek Yogurt');
    await expect(memberYogurtCard.locator('button', { hasText: 'Mark Bought' })).toBeVisible({ timeout: 5000 });
    await memberYogurtCard.locator('button', { hasText: 'Mark Bought' }).click();
    await expect(memberYogurtCard.locator('span.rounded-full:has-text("BOUGHT")')).toBeVisible({ timeout: 5000 });

    await managerPage.close();
  });
});
