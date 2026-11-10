import { expect, test } from '@playwright/test';

test('creates an idea and keeps canvas notes after reopening', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Your name').fill('Hanger Browser Test');
    await page.getByLabel('Email address').fill(`hanger-${Date.now()}@example.test`);
    await page.getByLabel('Password', { exact: true }).fill('CanvasTest123!');
    await page.getByLabel('Confirm password').fill('CanvasTest123!');
    await page.getByRole('button', { name: 'Create my space' }).click();

    await page.getByRole('button', { name: 'New idea', exact: true }).click();
    await page.getByLabel('A name for your idea').fill('A repeatable canvas idea');
    await page.getByRole('button', { name: 'Start hanging it up' }).click();

    await expect(page.getByRole('textbox', { name: 'Idea title' })).toHaveValue('A repeatable canvas idea');

    await page.getByRole('button', { name: 'Add a note' }).click();
    const newNote = page.locator('[data-idea-board] [data-item-type="note"]').last().locator('[contenteditable="true"]');
    await newNote.fill('Remember to save the morning light');
    await page.getByRole('button', { name: 'All ideas', exact: true }).click();

    await expect(page.getByRole('button', { name: /A repeatable canvas idea/ })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: /A repeatable canvas idea/ }).click();

    await expect(page.locator('[data-idea-board]')).toContainText('Remember to save the morning light');
});
