# Odama machine review

Source: https://www.odama.io/

## Observations

- The desktop stage centers the machine on a pale field. A small masthead and mode switch sit at the top, and the headline lives near the lower edge. The machine remains the visual focus.
- The screen, chassis, and raised controls share a single perspective. The bezel, shell seams, highlights, and broad shadow make it read as a physical object.
- In the interactive browser, Full experience initially fell back to Quick mode. The mode switch allowed a return to Full experience. Right changed the selected project from Mimikry to Karwa. Enter opened the work index with Karwa selected.
- Playwright captured desktop loading and mobile arrival. The full desktop scene did not settle consistently in that run. On mobile the canvas advertised Three.js r186 and covered the DOM button’s hit area, so the automated touch attempt did not verify the onscreen key. The screenshots document arrival states only.
- This is a review of representative hero states. The precise animation timings and authoring tools remain unverified.

## Presentation mapping

| Source interaction | Presentation behavior |
|---|---|
| Home machine | Home route with the framework selector |
| Previous and next project | Previous and next framework on the instrument’s display |
| Enter opens selected work | Fullscreen chapter for the selected framework |
| Return to the selector | B and an explicit Back control, restoring selection |
| Quick mode | A locally bundled render of the same instrument with matching HTML controls |

## Proposed production order

1. Figma. Compose one 16:9 stage and define an original instrument silhouette, material palette, typography, screen and control placement. Judge the silhouette and type at presentation size.
2. Motion study. Lay out idle, key down, display update, reveal, and return. Start with roughly 100 ms key travel, 250 ms display change, and 450 ms chapter reveal. These are proposed timings.
3. Browser prototype. Use one original model with independently movable keys and an addressable display. Keep controls and readable chapter text in HTML. First prototype Next.js and Astro with the same product-page example.
4. Browser review. Use Playwright to record keydown, screen update, and settled states. Check desktop and 16:9 presentation sizes, touch, keyboard focus, rapid input, fullscreen, reduced motion, and offline playback. Expand to Remix 3, TanStack Start, and SvelteKit after the first two chapters demonstrate the interaction.
