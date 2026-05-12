import { test, expect } from '@playwright/test';

async function waitForScene(page, sceneKey) {
  await page.waitForFunction((key) => {
    const game = window.__PHASER_GAME__;
    if (!game?.scene?.scenes) {
      return false;
    }

    return game.scene.scenes.some((scene) => {
      return scene?.scene?.key === key && (scene?.sys?.isActive?.() || scene?.scene?.settings?.active === true);
    });
  }, sceneKey);
}

test('app boots to menu and can start gameplay', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__PHASER_GAME__));
  await waitForScene(page, 'MainMenuScene');

  await page.locator('canvas').click({ position: { x: 640, y: 324 } });
  await waitForScene(page, 'LevelSelectScene');

  await page.locator('canvas').click({ position: { x: 640, y: 200 } });
  await waitForScene(page, 'GameScene');

  await page.waitForFunction(() => {
    const game = window.__PHASER_GAME__;
    const scene = game?.scene?.scenes?.find((entry) => entry?.scene?.key === 'GameScene');
    return scene?.gameState === 'COUNTDOWN' || scene?.gameState === 'PLAYING';
  });

  await page.keyboard.press('Q');
  await page.waitForFunction(() => {
    const game = window.__PHASER_GAME__;
    const scene = game?.scene?.scenes?.find((entry) => entry?.scene?.key === 'GameScene');
    return scene?.gameState === 'PAUSED';
  });
});
