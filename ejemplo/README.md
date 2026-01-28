# 🎭 Ejemplos de Stagehand

Proyecto de ejemplo para el workshop de Stagehand de Atenea Conocimientos.

## 📦 Instalación

```bash
npm install
```

## 🔑 Configuración

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con tus API keys:
   - `OPENAI_API_KEY` - Para usar modelos de OpenAI
   - `ANTHROPIC_API_KEY` - Para usar Claude

## 🚀 Ejecutar Ejemplos

### Demo Básico
Extrae posts de Hacker News usando `act()` y `extract()`:
```bash
npm run demo
```

### Web Scraper
Extrae repositorios trending de GitHub:
```bash
npm run scraper
```

### Automatización de Formularios
Llena un formulario automáticamente:
```bash
npm run form
```

## 🧪 Playwright + Stagehand

Ejemplo en `tests/todo.stagehand.spec.ts` usando una pagina local `public/todo.html`.
Incluye un flujo solo con Stagehand y otro mixto (Stagehand + Playwright).

```bash
# Instalar browsers de Playwright (una sola vez)
npx playwright install

# Ejecutar tests y generar reporte HTML
npm run test:pw

# Abrir reporte
npm run test:pw:report
```

Nota: las acciones de Stagehand requieren `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`.

## 📁 Estructura

```
ejemplo/
├── src/
│   ├── demo.ts              # Demo básico
│   ├── scraper.ts           # Web scraping
│   └── form-automation.ts   # Automatización de forms
├── output/                  # Archivos generados
├── package.json
├── .env.example
└── README.md
```

## 📝 Notas

- Los ejemplos usan `env: "LOCAL"` por defecto (navegador local)
- Cambia a `env: "BROWSERBASE"` para usar la nube
- `headless: false` abre el navegador visible para ver qué pasa
- `verbose: 1` muestra logs útiles

## 🔗 Links

- [Documentación de Stagehand](https://docs.stagehand.dev)
- [Atenea Conocimientos](https://ateneaconocimientos.com)
