import { test, expect } from '@playwright/test';

test.describe('Karnaugh Map Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText('Karnaugh Map Solver');
  });

  test('displays initial 4 variables', async ({ page }) => {
    // Check that there are 4 variable input fields (A, B, C, D)
    const variableInputs = page.locator('input.form-control-sm[maxlength="3"]');
    await expect(variableInputs).toHaveCount(5); // 4 variables + 1 output
  });

  test('can add a variable', async ({ page }) => {
    // Find the + button and click it
    const addButton = page.locator('bs-button-group button:has-text("+")');
    await addButton.click();

    // Should now have 5 variable inputs + 1 output = 6
    const variableInputs = page.locator('input.form-control-sm[maxlength="3"]');
    await expect(variableInputs).toHaveCount(6);
  });

  test('can remove a variable', async ({ page }) => {
    // Find the - button and click it
    const removeButton = page.locator('bs-button-group button:has-text("−")');
    await removeButton.click();

    // Should now have 3 variable inputs + 1 output = 4
    const variableInputs = page.locator('input.form-control-sm[maxlength="3"]');
    await expect(variableInputs).toHaveCount(4);
  });

  test('displays karnaugh map component', async ({ page }) => {
    const karnaughMap = page.locator('mintplayer-karnaugh-map');
    await expect(karnaughMap).toBeVisible();
  });

  test('has solve button', async ({ page }) => {
    const solveButton = page.locator('button:has-text("Solve Automatically")');
    await expect(solveButton).toBeVisible();
  });

  test('has random fill button', async ({ page }) => {
    const randomButton = page.locator('button:has-text("Random Fill")');
    await expect(randomButton).toBeVisible();
  });

  test('has clear button', async ({ page }) => {
    const clearButton = page.locator('button:has-text("Clear")');
    await expect(clearButton).toBeVisible();
  });

  test('can switch between edit and solve modes', async ({ page }) => {
    const editButton = page.locator('bs-button-group button:has-text("Edit")');
    const solveButton = page.locator('bs-button-group button:has-text("Solve")');

    // Initially in Edit mode
    await expect(editButton).toHaveClass(/btn-primary/);
    await expect(solveButton).toHaveClass(/btn-outline-primary/);

    // Switch to Solve mode
    await solveButton.click();
    await expect(solveButton).toHaveClass(/btn-primary/);
    await expect(editButton).toHaveClass(/btn-outline-primary/);

    // Switch back to Edit mode
    await editButton.click();
    await expect(editButton).toHaveClass(/btn-primary/);
  });

  test('shows result after solving', async ({ page }) => {
    // Click random fill first to have some values
    const randomButton = page.locator('button:has-text("Random Fill")');
    await randomButton.click();

    // Click solve
    const solveButton = page.locator('button:has-text("Solve Automatically")');
    await solveButton.click();

    // Result card should appear
    const resultCard = page.locator('bs-card-header:has-text("Result")');
    await expect(resultCard).toBeVisible();

    // Should show SOP expression
    const sopLabel = page.locator('text=Sum of Products (SOP)');
    await expect(sopLabel).toBeVisible();
  });
});
