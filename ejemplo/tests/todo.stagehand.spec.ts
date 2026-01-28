import { test, expect, type TestInfo } from "@playwright/test";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { generateReport } from "../src/report.js";

const todoUrl = pathToFileURL(path.resolve("public/todo.html")).toString();

async function attachStagehandReport(testInfo: TestInfo) {
  try {
    const reportPath = await generateReport();
    await testInfo.attach("stagehand-report", {
      path: reportPath,
      contentType: "text/html",
    });
  } catch (err) {
    await testInfo.attach("stagehand-report-error", {
      body: String(err),
      contentType: "text/plain",
    });
  }
}

test.describe("todo demo", () => {
  test.describe.configure({ mode: "serial" });

  test("todo flow with stagehand only", async ({}, testInfo) => {
    const stagehand = new Stagehand({
      env: "LOCAL",
      verbose: 0,
      logInferenceToFile: true,
      localBrowserLaunchOptions: { headless: true },
    });

    try {
      await stagehand.init();
      const page = stagehand.page;

      await page.goto(todoUrl);
      await page.act("escribe 'Comprar leche' en el campo Nueva tarea");
      await page.act("haz click en el boton Agregar");
      await page.act("escribe 'Estudiar Stagehand' en el campo Nueva tarea");
      await page.act("haz click en el boton Agregar");
      await page.act("marca como completada la tarea 'Comprar leche'");

      const schema = z.object({
        todos: z.array(
          z.object({
            texto: z.string().describe("Texto de la tarea"),
            completa: z.boolean().describe("Si la tarea esta completa"),
          })
        ),
      });

      const result = await page.extract({
        instruction:
          "Devuelve las tareas visibles con texto y si estan completas.",
        schema,
      });

      expect(result.todos.length).toBeGreaterThan(0);
      const milk = result.todos.find((todo) =>
        todo.texto.toLowerCase().includes("comprar leche")
      );
      expect(milk?.completa).toBe(true);
    } finally {
      await stagehand.close().catch(() => undefined);
      await attachStagehandReport(testInfo);
    }
  });

  test("hybrid flow with stagehand + playwright", async ({}, testInfo) => {
    const stagehand = new Stagehand({
      env: "LOCAL",
      verbose: 0,
      logInferenceToFile: true,
      localBrowserLaunchOptions: { headless: true },
    });

    try {
      await stagehand.init();
      const page = stagehand.page;

      await page.goto(todoUrl);

      // Playwright-style deterministic steps.
      await page.fill("#todo-input", "Pagar cuentas");
      await page.click("#add-btn");
      await page.fill("#todo-input", "Lavar auto");
      await page.click("#add-btn");

      // Stagehand for a natural-language action.
      await page.act("marca como completada la tarea 'Lavar auto'");
      await page.act("filtra para ver solo completadas");

      const completed = page.locator("li.todo-item.done");
      await expect(completed).toHaveCount(1);
      await expect(completed.first()).toContainText("Lavar auto");
    } finally {
      await stagehand.close().catch(() => undefined);
      await attachStagehandReport(testInfo);
    }
  });
});
