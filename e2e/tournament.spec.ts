import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test.describe('Torneo vs máquina', () => {
  test('la página principal carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Convierte elegir destino/i })).toBeVisible({ timeout: 10000 });
  });

  test('flujo hasta el cuadro: crear torneo → sorteo → bracket', async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto('/');

    // 1. Setup: Modo vs máquina
    await expect(page.getByRole('heading', { name: /Convierte elegir destino/i })).toBeVisible();
    await page.getByRole('tab', { name: /Jugar solo/i }).click();

    await page.getByPlaceholder(/Ej: Joaco/i).fill('TestE2E');
    await page.getByRole('button', { name: /Seleccionar 2 participantes/i }).click();
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

test.describe('Torneo multijugador', () => {
  test('flujo crear torneo + unirse + sorteo + bracket', async ({ browser }) => {
    test.setTimeout(90_000);
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    try {
      // 1. Creador: Crear torneo 2 participantes
      await page1.goto(BASE_URL + '/');
      await expect(page1.getByRole('heading', { name: /Convierte elegir destino/i })).toBeVisible({ timeout: 10000 });
      await page1.getByRole('tab', { name: /Crear torneo/i }).click();
      await page1.getByRole('button', { name: /Seleccionar 2 participantes/i }).click();
      await page1.getByPlaceholder(/Participante 1/i).fill('TestA');
      await page1.getByPlaceholder(/Participante 2/i).fill('TestB');
      await page1.getByRole('button', { name: /Crear sala de espera/i }).click();

      // 2. Creador: identificar como TestA
      await expect(page1.getByRole('heading', { name: /¿Quién eres tú?/i })).toBeVisible({ timeout: 8000 });
      await page1.getByRole('button', { name: /Seleccionar TestA/i }).click();

      // 3. Obtener ID del torneo
      const hash = await page1.evaluate(() => window.location.hash);
      const tournamentId = hash.startsWith('#') ? hash.slice(1) : hash;
      expect(tournamentId.length).toBeGreaterThan(10);

      // 4. Segundo jugador: unirse
      await page2.goto(BASE_URL + '/');
      await expect(page2.getByRole('heading', { name: /Convierte elegir destino/i })).toBeVisible({ timeout: 10000 });
      await page2.getByRole('tab', { name: /Unirme/i }).click();
      await page2.getByPlaceholder(/Pega aquí el código/i).fill(tournamentId);
      await page2.getByRole('button', { name: /Unirme al torneo/i }).click();

      // 5. Segundo jugador: identificar como TestB
      await expect(page2.getByRole('heading', { name: /¿Quién eres tú?/i })).toBeVisible({ timeout: 8000 });
      await page2.getByRole('button', { name: /Seleccionar TestB/i }).click();

      // 6. Ambos en lobby - esperar presencia Realtime y que el botón se active
      await expect(page1.getByRole('heading', { name: /Sala de espera/i })).toBeVisible({ timeout: 5000 });
      await expect(page2.getByRole('heading', { name: /Sala de espera/i })).toBeVisible({ timeout: 5000 });
      const startBtn = page1.locator('button:has-text("¡Comenzar sorteo!")');
      await expect(startBtn).toBeVisible({ timeout: 15000 });
      await startBtn.click();

      // 7. Bracket visible en ambos (page2 puede tardar más por Realtime)
      await expect(page1.getByRole('heading', { name: /Cuadro del Torneo/i })).toBeVisible({ timeout: 25000 });
      await expect(page2.getByRole('heading', { name: /Cuadro del Torneo/i })).toBeVisible({ timeout: 30000 });
      await expect(page1.getByText(/TestA/).first()).toBeVisible({ timeout: 5000 });
      await expect(page1.getByText(/TestB/).first()).toBeVisible({ timeout: 5000 });
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});
