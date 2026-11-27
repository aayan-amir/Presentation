# Index Works build architecture

27 November 2026

Build Index Works as a static Astro site with TypeScript for behavior, CSS for the page compositions and Three.js for the terminal. Use Blender to author the terminal and export a single, original GLB. Ship the first version with the terminal, Signal Field and Matter Studies. Each project gets its own page composition and interaction code.

## Existing design and assets

The shared Figma file is the reference for composition, typography, controls and transition intent. The 1440 × 860 and 390 × 844 frames are design checkpoints. The Python orbit prototype, frame sheets and GIFs demonstrate camera intent. The studio lighting proof demonstrates the two light treatments. The lighting plugin's playback in the shared file still needs review. The local inventory includes raster artwork and animation studies. The build requires editable terminal geometry, UVs, independently moving keys, a display surface and a calibrated camera.

Use the terminal render under **figma-archive** to match silhouette and details. The six decoded study images are 1100 × 840 each and total about 466 KB. Ship responsive derivatives with dimensions and alt text, and serve small CRT crops separately from page artwork. The orbit GIFs total about 13.9 MB and belong with the reference assets. Retain the photographed, tactile character of the flex cable, keycap joints, vent slots and curved bezel.

[Shared Figma review frames](https://www.figma.com/design/JQAMwv2lfzTGrGk2xr0ZgY/Index-Works?node-id=25-1394)

## Dependencies and deployment

| Layer | Decision |
|---|---|
| Pages | Astro static output, strict TypeScript and Astro components. Use Astro's built-in script bundling. Build real HTML at each project URL. |
| Runtime | Plain TypeScript modules with native DOM and Pointer Events. CSS handles editorial layout, state styling and simple local transitions. |
| 3D | Three.js WebGLRenderer, GLTFLoader, environment lighting and a single canvas on home. Load the scene dynamically after rendering the poster. |
| Tooling | Node 24 and npm with a committed lockfile. Pin stable compatible versions at setup. Development dependencies include TypeScript, Astro Check, matching Three.js types if needed, Playwright Test and the glTF validation tool. Use Node's test runner for pure state tests. |
| Art | Blender 5.2 LTS, glTF Export, Khronos glTF Validator, and glTF Transform CLI when measured size calls for optimization. Start with the standard GLB exporter. Add Meshopt or KTX2 with the corresponding Three.js decoder only after measuring the savings. Blender setup is a build prerequisite. The executable was absent from PATH and the standard installation directory in this workspace check. |
| Hosting | Deploy the generated static directory to a CDN-backed static host. Build one preview per change. Serve fingerprinted assets with long-lived caching and revalidate HTML. |

A Vite-only SPA would make shared runtime composition easy, while Astro gives all three destinations prerendered HTML, direct links and separate loading boundaries. React Three Fiber is a reasonable fit for a React codebase. Here one imperative scene owns the camera and rendering, and native HTML already covers the controls. The initial release needs a static build and has no application server or database dependency.

[Astro client scripts](https://docs.astro.build/en/guides/client-side-scripts/) · [Astro static routing](https://docs.astro.build/en/guides/routing/) · [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) · [Blender LTS](https://www.blender.org/download/lts/)

### Asset sourcing decision

Model the hero housing and three-key deck to the approved Index Works design. Existing terminal models can speed up a silhouette or pivot test, and a licensed set can supply generic internal details. Keep the final chassis, proportions and recognizable details in the editable source. The earlier Vinish CRT and Mophs terminal offer useful reference parts. Their listed licenses require credit, and their listings do not establish that the project-specific key or display topology is ready for this build. Treat each imported part, environment map, font and sound as an asset with a recorded author, source, license and modification note. Prefer a small authored softbox environment or a tested CC0 studio HDRI. Match its reflections before retaining it in the shipping build.

For the Blender handoff, deliver the source file, textures, the GLB, two neutral camera views and the front orbit poster. Review against neutral front, three-quarter, side and rear shots before approving. The first web export should use separate objects for parts that animate and a small material set shared by static parts. Inspect before and after optimization to make sure node identities, pivots and material settings survive. Quantize or compress geometry only after measuring bytes and decode time. Profile texture residency as well as transfer size, because compressed files can still expand considerably on the GPU.

[Vinish CRT collection](https://vinish.dev/free-3d-models/retro-computers) · [Mophs terminal listing](https://opengameart.org/content/retro-computer-terminal) · [Poly Haven studio HDRI](https://polyhaven.com/a/studio_small_01) · [glTF Transform](https://gltf-transform.dev/cli) · [glTF Validator](https://github.com/KhronosGroup/glTF-Validator)

## Routes, state and extension points

Home is `/`. Project routes are `/work/signal-field/` and `/work/matter-studies/`. A typed build-time registry holds a unique slug, display title, discipline, thumbnail or CRT artwork, poster, lighting preset, page component and entry motion. Its order defines terminal browsing. The build rejects duplicate slugs and missing required assets. Each destination supplies its own Astro view and optional interaction module. Shared layout provides metadata and the visible Back control.

The terminal controller owns the selected slug, opening phase, camera mode and motion preference. HTML controls dispatch previous, next, open, orbit and motion commands into that controller. The controller updates the visible selection and standalone project link. The renderer receives snapshots and effect cues. GPU objects, asset loading and per-frame values live inside the scene module. The artwork and ambient lighting always resolve from the same committed selection.

Home reads the project from a validated `?project=` parameter, falling back to the first registry entry. Browsing replaces the current history entry with that query value. Enter navigates to the actual project URL. Back on the destination explicitly links to home with that project's query value, so a direct visit and browser Back both have a defined selection. Restore selection on browser history traversal and restore focus to a usable terminal control on return. Direct project visits include their own titles, content, controls and navigation. The home HTML includes ordinary links to every project for visitors with JavaScript disabled. Scope arrow and Enter shortcuts to the terminal interaction context so keyboard users can operate other controls with normal browser behavior.

Press feedback begins on the next frame. Accumulate deliberate discrete direction presses during the roughly 85 ms key travel and commit the latest target at the end of travel. Ignore held-key repeat on the terminal. Restart an interrupted atmosphere blend from its current visual values, with the newest target winning. Use a generation token so an older asynchronous media load cannot replace the CRT preview. Enter latches the latest requested selection and triggers one navigation after feedback. A second Enter while opening does not start another transition. Browser Back and a new page visit clear transient motion state.

For the two destinations, local controls operate the Signal Field lamp or the Matter Studies plate. A third project adds a registry entry, its page, preview assets and a light preset. Additional effects subscribe to the existing selection and entry cues. Audio, if added, uses those same cues and an independent mute preference. Create or resume audio from an explicit sound toggle. Start silent and fade any sustained home ambience on route change. Project audio starts from that page's user interaction. A future continuous score across pages would justify a persistent audio owner and a separate navigation decision.

[Web Audio autoplay handling](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

## Terminal, camera and lighting

**Model contract.** Keep an editable .blend master with collection structure and source textures. Export upright in meters, origin at the floor beneath the chassis, front in +Z when loaded in Three.js. Agree on names before detailing: `TerminalRoot`, `Housing`, `CRT_Glass`, `CRT_Display`, `Key_Left`, `Key_Enter`, `Key_Right`. Place each key origin on its travel axis. Check exported bounds, orientation, material color, transparent surface sorting and node names automatically. A rear inspection must show coherent seams, vents, ports, feet and the loop attachment. Model the deck bevels and cap sockets early because the moving silhouette is visible in close views. Add smaller details with normal and roughness maps.

**Surface and light.** Light the painted housing with broad soft highlights, and use a rougher rubber material beneath it. Render the CRT preview on UV-mapped emissive geometry behind a separate glass highlight layer. Use a contact shadow fixed at the feet plus a softer light-dependent shadow. Render the studio as part of the scene with a pale floor, rear light and elongated, alpha-blended projection planes for desk reflections. Start with simple projected gradients and direction-dependent opacity. Calibrate cooler highlights and warmer refractions against the Figma compositions before considering bloom, dynamic shadows or more expensive glass. Validate material appearance in Three.js as well as Blender.

**Motion.** Start from a quiet, locked camera. Orbit PC runs a deliberate full arc that exposes the sides and rear, then returns to the original framing. Support drag using pointer capture and damped motion with bounded elevation. Only capture drags originating on the machine. Keep touch scrolling usable and provide a keyboard-accessible orbit button and cancellation. Cancel orbit on browse or open and ease the view toward the keys. Use responsive framing based on the model's bounds, with a separate phone framing check. Drive the key, camera, CRT and ambience from one timebase. Animate the cool bands on an eight-second loop and the warm bands on a twelve-second loop. Bring up the next light preset over roughly 650 ms after the CRT switches at the bottom of the keystroke.

**Enter and return.** On same-origin browsers with cross-document View Transitions, snapshot an ordinary DOM image over the CRT and match it to the destination opening artwork. Use the narrow reflection to lead into Signal Field's instrument and fold alignment to lead into Matter Studies. A browser without the API gets the same keyboard feedback and normal navigation followed by a brief destination-specific entrance. Keep the entry visible immediately on direct visits and in reduced motion. The Signal Field rail animates between pre-rendered reflection states around a fixed object. The folio animates the paper leaf about its gutter, keeping title and tabs visible. Use image sequences only if the state interpolation fails the visual review.

For the first home render, load only the selected poster at high priority and reserve its dimensions. Preload the alternate CRT crop after interaction or idle. Delay large project images until their route is requested or the visitor signals intent. Self-host the approved font families with local fallback stacks. Load the terminal's Space Grotesk and IBM Plex Mono weights on home, Barlow Condensed on Signal Field and Cormorant Garamond italic on Matter Studies. Keep page styles scoped to each route.

[Three.js renderer](https://threejs.org/docs/pages/WebGLRenderer.html) · [Khronos glTF resources](https://ecosystem.khronos.org/khronos-standard/gltf/) · [Cross-document transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) · [Astro responsive image pipeline](https://docs.astro.build/en/guides/images/)

## Performance, accessibility and verification

- Render an art-directed poster and HTML controls immediately. Import the scene after initial content renders. Switch to WebGL when the model, preview texture and first frame are ready. Keep the poster for missing WebGL 2, failed model loads, context loss and reduced motion. Use project-specific posters so both choices remain recognizable. Fallback supports all project links and browsing.
- Pause continuous motion when the scene is offscreen or the tab is hidden. Dispose geometry, textures, material resources and visibility listeners on teardown. Handle back/forward cache restoration, context loss and retry. The visible motion control pauses ambient and interaction motion. Respect the operating system setting by default. Canvas is presentation. HTML buttons and links carry meaningful actions, focus affordances, screen reader labels and at least 44 × 44 CSS pixel hit areas.
- Set initial working budgets of 350 KB transferred for the poster-first home experience and 2 MB for the deferred 3D payload, including model, textures and any decoder. Aim for 60 FPS on desktop and a steady 30 FPS on a representative phone, recording frame-time distribution and resolution. Start with device-pixel-ratio caps of 1.5 desktop and 1.25 phone. Reduce resolution and optional effects before compromising navigation responsiveness. Measure LCP, INP and CLS separately from scene throughput.
- Use Playwright in Chromium, Firefox and WebKit for keyboard, pointer, mobile emulation, rapid selection, direct URLs, both Back paths, reduced motion, blocked GLB and WebGL loss. Set fixed camera poses, time and viewport for screenshot comparisons. Review the entire orbit and both loops with recordings, which catch discontinuities a still misses. Check a physical iPhone and mid-range Android for GPU quality and power. Verify that the two atmospheres remain legible with the CRT and titles hidden.

For the home profile, record transfer, decode and first visible WebGL frame separately. Treat 2.5 s LCP, 200 ms INP and 0.1 CLS as field targets at the 75th percentile. Use pre-release lab checks to catch regressions while production has no field sample. Run a mobile throttled cold load and a sustained orbit. Test slow or failed preview texture fetches, GPU loss during an orbit, repeat visits to both projects and the renderer suspended while hidden. Watch for double activation and for stale CRT artwork during bursts of direction input.

[WCAG 2.2 pause and motion criteria](https://www.w3.org/TR/WCAG22/) · [Playwright emulation](https://playwright.dev/docs/emulation) · [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) · [Core Web Vitals](https://web.dev/articles/vitals)

## Build order and review gates

1. **Terminal modeling and static shell.** Block out the silhouette, check the neutral front pose against Figma and walk a camera around the whole object. In parallel, build the HTML terminal and direct project routes from the typed registry. Validate that someone can browse and open either project on the poster alone.
2. **Capture a production-quality vertical slice.** Export the first real GLB, connect the cap pivots and CRT, implement Signal Field's cooler atmosphere and wire its project page. Check entry, return, motion preference and a mid-range phone before detailing everything.
3. **Complete the second world.** Add Matter Studies, connect warm lighting and the hinged folio, then reconcile both with the shared appearance and controls. Review desktop and phone at the Figma sizes and at narrower and wider layouts.
4. **Measure and release.** Tune 3D and asset budgets, check history and fallbacks, run the production build and run the browser suite against the static preview. Publish only after the camera, lighting, key travel and route transitions pass visual review together.
