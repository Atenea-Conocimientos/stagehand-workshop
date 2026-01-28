/**
 * Ejemplo de Web Scraping con Stagehand
 * Atenea Conocimientos - Intro a Stagehand
 * 
 * Este ejemplo muestra cómo extraer información estructurada
 * de un sitio web usando extract() con schemas de Zod.
 */

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import "dotenv/config";

// Schema para los repositorios de GitHub
const RepoSchema = z.object({
  repositorios: z.array(
    z.object({
      nombre: z.string().describe("Nombre del repositorio"),
      descripcion: z.string().optional().describe("Descripción del repo"),
      estrellas: z.number().describe("Cantidad de estrellas"),
      lenguaje: z.string().optional().describe("Lenguaje principal"),
      url: z.string().describe("URL del repositorio"),
    })
  ),
});

async function main() {
  console.log("🕷️  Web Scraper con Stagehand\n");

  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    headless: false,
  });

  await stagehand.init();
  const page = stagehand.context.pages()[0];

  // Scraping de repos trending de GitHub
  console.log("📍 Navegando a GitHub Trending...");
  await page.goto("https://github.com/trending");

  // Esperar que cargue
  await new Promise((r) => setTimeout(r, 2000));

  console.log("📊 Extrayendo repositorios trending...\n");

  const resultado = await stagehand.extract(
    "Extraer los primeros 10 repositorios trending con nombre, descripción, estrellas, lenguaje y URL",
    RepoSchema
  );

  // Mostrar resultados en formato tabla
  console.log("🔥 Top Repositorios Trending de GitHub:");
  console.log("═".repeat(60));

  resultado.repositorios.slice(0, 10).forEach((repo, i) => {
    console.log(`\n${i + 1}. ${repo.nombre}`);
    console.log(`   📝 ${repo.descripcion || "Sin descripción"}`);
    console.log(`   ⭐ ${repo.estrellas} estrellas | 💻 ${repo.lenguaje || "N/A"}`);
    console.log(`   🔗 ${repo.url}`);
  });

  console.log("\n" + "═".repeat(60));

  // Guardar como JSON
  const fs = await import("fs/promises");
  const outputPath = "./output/trending.json";
  await fs.mkdir("./output", { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(resultado, null, 2));
  console.log(`\n💾 Datos guardados en ${outputPath}`);

  await stagehand.close();
  console.log("\n✨ Scraping completado!");
}

main().catch(console.error);
