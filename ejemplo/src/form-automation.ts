/**
 * Ejemplo de Automatización de Formularios con Stagehand
 * Atenea Conocimientos - Intro a Stagehand
 * 
 * Este ejemplo muestra cómo usar act() para interactuar
 * con formularios de forma natural.
 */

import { Stagehand } from "@browserbasehq/stagehand";
import "dotenv/config";

async function main() {
  console.log("📝 Automatización de Formularios con Stagehand\n");

  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    headless: false,
  });

  await stagehand.init();
  const page = stagehand.context.pages()[0];

  // Usamos una página de prueba con formularios
  console.log("📍 Navegando a formulario de prueba...");
  await page.goto("https://www.w3schools.com/html/html_forms.asp");

  // Esperar que cargue
  await new Promise((r) => setTimeout(r, 2000));

  // Interactuar con el formulario usando lenguaje natural
  console.log("\n🖊️  Llenando el formulario...\n");

  // Escribir en el campo de nombre
  await stagehand.act("escribir 'Juan Testing' en el campo First name");
  console.log("✅ Nombre ingresado");

  await new Promise((r) => setTimeout(r, 1000));

  // Escribir en el campo de apellido  
  await stagehand.act("escribir 'Atenea' en el campo Last name");
  console.log("✅ Apellido ingresado");

  await new Promise((r) => setTimeout(r, 1000));

  // Ver el resultado
  console.log("\n📸 Formulario completado!");
  console.log("   Verifica la ventana del navegador para ver el resultado.\n");

  // Esperar antes de cerrar para que puedas ver
  console.log("⏳ Esperando 5 segundos antes de cerrar...");
  await new Promise((r) => setTimeout(r, 5000));

  await stagehand.close();
  console.log("\n✨ Demo de formularios completado!");
}

main().catch(console.error);
