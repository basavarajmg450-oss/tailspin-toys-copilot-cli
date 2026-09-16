import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    // Check that the main page heading is present
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    // Check that the site branding is present in the header (no longer an h1)
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    // Check that the welcome message is present using more specific locator
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });

  test('should filter games by category, publisher, and both', async ({ page }) => {
    const allCards = page.getByTestId('game-card');
    const initialCount = await allCards.count();
    const publisherFilter = page.getByTestId('publisher-filter');
    const categoryFilter = page.getByTestId('category-filter');
    const categoryOption = categoryFilter.locator('option').nth(1);
    const publisherOption = publisherFilter.locator('option').nth(1);
    const categoryId = await categoryOption.getAttribute('value');
    const publisherId = await publisherOption.getAttribute('value');

    if (!categoryId || !publisherId) {
      throw new Error('Filter options are missing ids');
    }

    const categoryCount = await page.locator(`[data-testid="game-card"][data-category-id="${categoryId}"]`).count();
    const publisherCount = await page.locator(`[data-testid="game-card"][data-publisher-id="${publisherId}"]`).count();
    const combinedCount = await page.locator(
      `[data-testid="game-card"][data-category-id="${categoryId}"][data-publisher-id="${publisherId}"]`,
    ).count();

    await categoryFilter.selectOption(categoryId);
    await page.getByTestId('apply-filters').click();

    await expect(page).toHaveURL(new RegExp(`categoryId=${categoryId}`));
    const visibleCards = page.locator('[data-testid="game-card"]:visible');
    await expect(visibleCards).toHaveCount(categoryCount);
    expect(await visibleCards.evaluateAll((cards) => cards.every((card) => card.dataset.categoryId === categoryId))).toBe(true);

    await page.getByTestId('clear-filters').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('game-card')).toHaveCount(initialCount);

    await publisherFilter.selectOption(publisherId);
    await page.getByTestId('apply-filters').click();

    await expect(page).toHaveURL(new RegExp(`publisherId=${publisherId}`));
    await expect(visibleCards).toHaveCount(publisherCount);
    expect(await visibleCards.evaluateAll((cards) => cards.every((card) => card.dataset.publisherId === publisherId))).toBe(true);

    await categoryFilter.selectOption(categoryId);
    await page.getByTestId('apply-filters').click();

    await expect(page).toHaveURL(new RegExp(`categoryId=${categoryId}`));
    await expect(page).toHaveURL(new RegExp(`publisherId=${publisherId}`));
    await expect(visibleCards).toHaveCount(combinedCount);
    expect(
      await visibleCards.evaluateAll((cards) =>
        cards.every((card) => card.dataset.categoryId === categoryId && card.dataset.publisherId === publisherId),
      ),
    ).toBe(true);
  });
});
