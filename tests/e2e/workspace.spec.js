import { expect, test } from '@playwright/test';

test('dashboard and canvas controls work and keep edits after reopening', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto('/register');
    await page.getByLabel('Your name').fill('Hanger Browser Test');
    await page.getByLabel('Email address').fill(`hanger-${Date.now()}@example.test`);
    await page.getByLabel('Password', { exact: true }).fill('CanvasTest123!');
    await page.getByLabel('Confirm password').fill('CanvasTest123!');
    await page.getByRole('button', { name: 'Create my space' }).click();

    await page.getByRole('button', { name: 'Help' }).click();
    await expect(page.getByRole('dialog', { name: 'Make yourself at home.' })).toBeVisible();
    await page.getByRole('button', { name: 'Got it' }).click();

    await page.getByRole('button', { name: 'Current workspace' }).click();
    await expect(page.locator('[data-workspace-menu]')).toBeVisible();
    await expect(page.locator('[data-workspace-menu]').getByRole('button', { name: 'Log out' })).toBeVisible();
    await page.getByRole('button', { name: 'Current workspace' }).click();

    await page.getByRole('button', { name: 'New idea', exact: true }).click();
    let projectTitle = 'A repeatable canvas idea';
    await page.getByLabel('A name for your idea').fill(projectTitle);
    await page.getByRole('button', { name: 'Start hanging it up' }).click();
    await expect(page.getByRole('textbox', { name: 'Idea title' })).toHaveValue(projectTitle);

    const canvasTitle = page.locator('[data-idea-board] [data-item-type="heading"] strong');
    const canvasSubtitle = page.locator('[data-idea-board] .object-subtitle');
    await canvasTitle.fill('A garden of ideas');
    await canvasSubtitle.fill('Make room for the unexpected');
    await page.getByRole('button', { name: 'Add a note' }).click();
    const newNote = page.locator('[data-idea-board] [data-item-type="note"]').last();
    await newNote.locator('[contenteditable="true"]').fill('Remember the morning light');
    await expect(page.locator('[data-item-count]')).toHaveText('1 piece');

    const noteBeforeDrag = await newNote.evaluate((element) => ({
        left: Number.parseFloat(element.style.left),
        top: Number.parseFloat(element.style.top),
    }));
    const pin = await newNote.locator('.object-pin').boundingBox();
    await page.mouse.move(pin.x + pin.width / 2, pin.y + pin.height / 2);
    await page.mouse.down();
    await page.mouse.move(pin.x + pin.width / 2 + 38, pin.y + pin.height / 2 + 26);
    await page.mouse.up();
    await expect.poll(() => newNote.evaluate((element) => Number.parseFloat(element.style.left))).toBeGreaterThan(noteBeforeDrag.left);

    await page.getByRole('button', { name: 'Add text' }).click();
    await page.getByRole('button', { name: 'Add a shape' }).click();
    await page.getByRole('button', { name: 'Add a link' }).click();
    const link = page.locator('[data-item-type="link"]').last();
    await link.locator('[contenteditable="true"]').nth(0).fill('Morning light reference');
    await link.locator('[contenteditable="true"]').nth(1).fill('https://example.test/morning');
    await expect(link.locator('a[data-link-open]')).toHaveAttribute('href', 'https://example.test/morning');
    await expect(link.locator('a[data-link-open]')).toHaveAttribute('rel', 'noopener noreferrer');

    await page.getByRole('button', { name: 'Add a reference' }).click();
    const reference = page.locator('[data-item-type="reference"]').last();
    await reference.locator('[contenteditable="true"]').nth(0).fill('Pinterest moodboard');
    await reference.locator('[contenteditable="true"]').nth(1).fill('https://pinterest.com/example/board');
    await expect(reference.locator('a[data-link-open]')).toHaveAttribute('href', 'https://pinterest.com/example/board');

    projectTitle = 'A renamed canvas idea';
    await page.getByRole('textbox', { name: 'Idea title' }).fill(projectTitle);
    await page.getByRole('textbox', { name: 'Idea title' }).press('Tab');
    await expect(page.locator('[data-continue-title]')).toHaveText(projectTitle);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add an image' }).click();
    await (await fileChooserPromise).setFiles({
        name: 'garden.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rqsAAAAASUVORK5CYII=', 'base64'),
    });
    await expect(page.locator('[data-item-type="image"] img')).toHaveAttribute('alt', 'garden.png');
    await expect(page.locator('[data-item-type="image"] input[type="file"]')).toHaveCount(0);
    await expect(page.locator('[data-item-count]')).toHaveText('6 pieces');

    await page.getByRole('button', { name: 'Select and move' }).click();
    await page.keyboard.press('v');
    await expect(page.locator('[data-tool="select"]')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('n');
    await expect(page.locator('[data-item-count]')).toHaveText('7 pieces');
    await page.locator('[data-item-type="shape"]').click();
    await page.keyboard.press('Delete');
    await expect(page.locator('[data-item-count]')).toHaveText('6 pieces');

    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect(page.locator('[data-zoom-level]')).toHaveText('110%');
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await page.getByRole('button', { name: 'Fit' }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    const viewportWidth = await page.locator('[data-canvas-viewport]').evaluate((viewport) => viewport.clientWidth);
    await expect.poll(async () => page.locator('[data-idea-board]').evaluate((board) => board.getBoundingClientRect().width)).toBeLessThanOrEqual(viewportWidth);
    await expect(page.getByRole('button', { name: 'Details' })).toBeVisible();
    await page.getByRole('button', { name: 'Details' }).click();
    await expect(page.locator('[data-details-panel]')).toBeVisible();
    await page.getByRole('button', { name: 'Hide idea details' }).click();
    await expect(page.locator('[data-details-panel]')).toBeHidden();

    await page.getByRole('button', { name: 'All ideas', exact: true }).click();
    const ideaCard = page.locator('[data-project-card]').filter({ hasText: projectTitle });
    await expect(ideaCard).toBeVisible();
    await ideaCard.hover();
    await page.getByRole('button', { name: 'Add to favorites' }).click();
    await expect(page.locator('[data-toggle-favorite]')).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Current workspace' }).click();
    await page.locator('[data-workspace-menu]').getByRole('button', { name: 'Favorites' }).click();
    await expect(page.locator('[data-project-card]')).toHaveCount(1);

    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.locator('[data-project-grid]')).toHaveClass(/is-list/);
    await page.getByRole('button', { name: 'Grid view' }).click();
    await expect(page.locator('[data-project-grid]')).not.toHaveClass(/is-list/);
    await page.getByRole('button', { name: 'Current workspace' }).click();
    await page.locator('[data-workspace-menu]').getByRole('button', { name: 'All ideas' }).click();
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[data-search]')).toBeFocused();
    await page.locator('[data-search]').fill(projectTitle);
    await expect(page.locator('[data-project-card]')).toHaveCount(1);
    await page.locator('[data-search]').fill('');

    await page.reload();
    const persistedCard = page.locator('[data-project-card]').filter({ hasText: projectTitle });
    await expect(persistedCard).toBeVisible();
    await persistedCard.click();
    await expect(page.locator('[data-idea-board]')).toContainText('Remember the morning light');
    await expect(page.locator('[data-idea-board]')).toContainText('A garden of ideas');
    await expect(page.locator('[data-idea-board]')).toContainText('Make room for the unexpected');
    await expect(page.locator('[data-item-count]')).toHaveText('6 pieces');
    await expect(page.locator('[data-item-type="reference"] a[data-link-open]')).toHaveAttribute('href', 'https://pinterest.com/example/board');

    await page.getByRole('button', { name: 'More idea options' }).click();
    await expect(page.locator('[data-canvas-actions-menu]')).toBeVisible();
    await expect(page.locator('[data-canvas-actions-menu]')).toContainText('Remove from favorites');
    page.once('dialog', (confirmation) => confirmation.accept());
    await page.getByRole('button', { name: 'Delete idea' }).click();
    await expect(page.locator('[data-project-card]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Current workspace' }).click();
    await expect(page.locator('[data-workspace-menu]').getByRole('button', { name: 'Favorites' })).toBeVisible();
});
