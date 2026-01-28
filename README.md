# 🎭 Intro a Stagehand

> Browser Automation con IA - Workshop de Atenea Conocimientos

## ¿Qué es Stagehand?

[Stagehand](https://stagehand.dev) es un framework de automatización de navegadores que combina el poder de la IA con la precisión del código. Desarrollado por [Browserbase](https://browserbase.com).

### ¿Por qué Stagehand?

- 🎯 **Elige cuándo usar código vs lenguaje natural**: usa IA para navegar páginas desconocidas, código cuando sabés exactamente qué hacer
- 🔄 **De IA a workflows repetibles**: previsualiza acciones de IA antes de ejecutarlas, cachea acciones repetibles
- ♾️ **Escribe una vez, corre siempre**: auto-caching + self-healing que recuerda acciones previas

## 📂 Estructura del Repo

```
├── presentacion/      # Slides HTML (abrir index.html)
│   └── index.html
├── ejemplo/           # Proyecto de ejemplo con Stagehand
│   ├── package.json
│   ├── src/
│   └── README.md
└── README.md          # Este archivo
```

## 🚀 Quick Start

### Ver la Presentación

```bash
# Abrir en el navegador
open presentacion/index.html
# o servir con cualquier servidor local
npx serve presentacion
```

### Correr el Ejemplo

```bash
cd ejemplo
npm install
# Configurar las API keys en .env
cp .env.example .env
npm run demo
```

## 🔗 Links Útiles

- [Documentación oficial](https://docs.stagehand.dev)
- [GitHub de Stagehand](https://github.com/browserbase/stagehand)
- [Discord de Stagehand](https://stagehand.dev/discord)
- [Browserbase](https://browserbase.com)

## 📝 Licencia

MIT - [Atenea Conocimientos](https://ateneaconocimientos.com)
