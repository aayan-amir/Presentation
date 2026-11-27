# Modern Web Dev Frameworks

An interactive introduction to frameworks, web languages, and how to choose a stack. The 3D archive terminal opens eight chapters. The Frameworks menu provides direct links to Next.js, Astro, Remix, TanStack Start, and SvelteKit.

## Preview

```text
npm ci
npm run dev
```

Use Left and Right on the terminal to browse and Enter to open. Use the footer or N and P to move between chapters. Expand Presenter notes for the speaking cues and sources.

## Verify

```text
npm run check
npm run build
node art/validate_model.mjs
npx playwright install chromium firefox webkit
npm test
```

Deploy the static `dist/` directory. Home and the chapters are ordinary HTML. Home loads Three.js after its poster and controls are available.

## Art and project additions

The editable model lives at `art/terminal.blend`. The Blender script in the same directory regenerates the GLB from the model recipe and produces transparent poster renders in `review/`. The packaged WebP posters use those source renders. The selected CRT artwork and the three frames for each exhibit come from the approved media archive.

Register lesson entries in `src/chapters.ts`. `art/lesson_previews.py` regenerates the CRT previews and poster variants. The local survey snapshot includes the publisher’s chart-data URL.

