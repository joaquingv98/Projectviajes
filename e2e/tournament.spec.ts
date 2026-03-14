import { test, expect } from '@playwright/test';

test.describe('Torneo vs máquina', () => {
  test('la página principal carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Torneo de Viajes/i })).toBeVisible({ timeout: 10000 });
  });

  test('flujo hasta el cuadro: crear torneo → sorteo → bracket', async ({ page }) => {
    await page.goto('/');

    // 1. Setup: Modo vs máquina
    await expect(page.getByRole('heading', { name: /Torneo de Viajes/i })).toBeVisible();
    await page.getByRole('button', { name: /Jugar vs máquina/i }).click();

    await page.getByPlaceholder(/Ej: Joaco/i).fill('TestE2E');
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: /Jugar contra la máquina/i }).click();

    // 2. Lobby
    await expect(page.getByRole('heading', { name: /Sala de espera/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: /Comenzar sorteo/i }).click();

    // 3. Draw animation (~5.5 s) + Bracket
    await expect(page.getByRole('heading', { name: /Cuadro del Torneo/i })).toBeVisible({ timeout: 20000 });

    // 4. Verificar que el cuadro muestra el partido (TestE2E vs Oponente)
    await expect(page.getByText(/TestE2E/).first()).toBeVisible({ timeout: 5000 });
  });
});
