/**
 * Demo básico de Stagehand
 * Atenea Conocimientos - Intro a Stagehand
 */

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import "dotenv/config";

async function main() {
  console.log("🎭 Iniciando Stagehand...\n");

  // Crear instancia de Stagehand
  // env: "LOCAL" usa tu navegador local
  // env: "BROWSERBASE" usa la nube de Browserbase
  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1, // 0 = silencioso, 1 = info, 2 = debug
    headless: false, // true para correr sin ventana visible
    logInferenceToFile: true,
  });

  await stagehand.init();
  console.log("✅ Stagehand iniciado\n");

  // Obtener la página del navegador (v2 expone métodos act/extract en stagehand.page)
  const page = stagehand.page;

  // 1️⃣ Navegar a una página
  console.log("📍 Navegando a Hacker News...");
  await page.goto("https://news.ycombinator.com");

  // 2️⃣ Usar act() para hacer click
  console.log("🖱️  Haciendo click en 'new'...");
  await page.act("click en el link 'new' en la navegación");

  // Esperar un momento para ver el resultado
  await new Promise((r) => setTimeout(r, 2000));

  // 3️⃣ Usar extract() para obtener datos
  console.log("📊 Extrayendo posts...\n");

  const schema = z.object({
    posts: z.array(
      z.object({
        titulo: z.string().describe("El título del post"),
        url: z.string().optional().describe("La URL del post si existe"),
        puntos: z.number().optional().describe("Los puntos/score del post"),
        autor: z.string().optional().describe("El nombre del autor"),
      })
    ),
  });

  const resultado = await page.extract({
    instruction: "Extraer los primeros 5 posts con su título, URL, puntos y autor",
    schema,
  });

  console.log("📝 Posts extraídos:");
  console.log("─".repeat(50));

  resultado.posts.slice(0, 5).forEach((post, i) => {
    console.log(`\n${i + 1}. ${post.titulo}`);
    if (post.url) console.log(`   🔗 ${post.url}`);
    if (post.puntos) console.log(`   ⭐ ${post.puntos} puntos`);
    if (post.autor) console.log(`   👤 ${post.autor}`);
  });

  console.log("\n" + "─".repeat(50));
  console.log("\n✨ Demo completado!");

  // Cerrar el navegador
  await stagehand.close();
}

main().catch(console.error);
