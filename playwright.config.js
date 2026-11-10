import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    reporter: 'line',
    use: {
        baseURL: process.env.HANGER_URL ?? 'http://hanger.test',
        browserName: 'chromium',
        headless: true,
    },
});
