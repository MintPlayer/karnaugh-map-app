import { test, expect } from '@playwright/test';

test.describe('Karnaugh Map Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await page.waitForSelector('mintplayer-karnaugh-map');
  });

  test('has correct title', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toContainText('Karnaugh Map Solver');
  });

  test('displays initial 4 variables', async ({ page }) => {
    // Check that there are 4 variable input fields (A, B, C, D) + 1 output
    const variableInputs = page.locator('input.form-control-sm[maxlength="3"]');
    await expect(variableInputs).toHaveCount(5);
  });

  test('can add a variable', async ({ page }) => {
    const addButton = page.locator('bs-button-group button', { hasText: '+' });
    await addButton.click();

    // Should now have 5 variable inputs + 1 output = 6
    const variableInputs = page.locator('input.form-control-sm[maxlength="3"]');
    await expect(variableInputs).toHaveCount(6);
  });

  test('can remove a variable', async ({ page }) => {
    // The minus sign is a special character (−), use a more reliable selector
    const removeButton = page.locator('bs-button-group button').first();
    await removeButton.click();

    // Should now have 3 variable inputs + 1 output = 4
    const variableInputs = page.locator('input.form-control-sm[maxlength="3"]');
    await expect(variableInputs).toHaveCount(4);
  });

  test('displays karnaugh map component', async ({ page }) => {
    const karnaughMap = page.locator('mintplayer-karnaugh-map');
    await expect(karnaughMap).toBeVisible();
  });

  test('has action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Solve Automatically' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Random Fill' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('can switch between edit and solve modes', async ({ page }) => {
    const modeButtonGroup = page.locator('bs-card-header bs-button-group');
    const editButton = modeButtonGroup.getByRole('button', { name: 'Edit' });
    const solveButton = modeButtonGroup.getByRole('button', { name: 'Solve' });

    // Initially in Edit mode
    await expect(editButton).toHaveClass(/btn-primary/);

    // Switch to Solve mode
    await solveButton.click();
    await expect(solveButton).toHaveClass(/btn-primary/);

    // Switch back to Edit mode
    await editButton.click();
    await expect(editButton).toHaveClass(/btn-primary/);
  });

  test('shows result after solving', async ({ page }) => {
    // Click random fill first to have some values
    await page.getByRole('button', { name: 'Random Fill' }).click();

    // Click solve and wait for result
    await page.getByRole('button', { name: 'Solve Automatically' }).click();

    // Wait for and check result card
    const resultHeader = page.locator('bs-card-header', { hasText: 'Result' });
    await expect(resultHeader).toBeVisible({ timeout: 10000 });

    // Should show SOP expression label
    await expect(page.getByText('Sum of Products (SOP)')).toBeVisible();
  });
});
