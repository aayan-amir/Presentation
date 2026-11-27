import notes from './talk-notes.json';

const entries = [
  ['what-is-a-framework', 'What is a web framework?', 'Anatomy of the modern web', 'WEB FRAMEWORKS', 'warm', 45],
  ['languages', 'Languages now and next', 'JavaScript, TypeScript, Python, Go and Rust', 'LANGUAGES', 'cool', 55],
  ['next-js', 'Next.js', 'Full-stack React', 'NEXT.JS', 'cool', 50],
  ['astro', 'Astro', 'Content-first sites and islands', 'ASTRO', 'warm', 50],
  ['remix-3', 'Remix 3', 'Web APIs and full-stack composition', 'REMIX 3', 'cool', 45],
  ['two-to-watch', 'Two frameworks to watch', 'TanStack Start · SvelteKit', 'TWO TO WATCH', 'warm', 55],
  ['usage-and-satisfaction', 'Usage and satisfaction', 'State of JavaScript 2025', 'USAGE ≠ SATISFACTION', 'cool', 40],
  ['pick-a-stack', 'Pick a stack', 'Match the architecture to the project', 'PICK A STACK', 'warm', 40],
] as const;

export const chapters = entries.map(([slug,title,discipline,screen,atmosphere,seconds],index) =>
  ({slug,title,discipline,screen,atmosphere,seconds,index}));
export type Chapter = (typeof chapters)[number];
export const presenterNotes = notes;
export const route = (chapter:Chapter) => `/chapters/${chapter.slug}/`;
export const home = (chapter:Chapter) => `/?chapter=${chapter.slug}`;
export const asset = (chapter:Chapter, kind:'poster'|'crt') => `/lesson/${chapter.slug}-${kind}.webp`;
export const frameworkLinks = [
  ['Next.js',route(chapters[2])],['Astro',route(chapters[3])],['Remix 3',route(chapters[4])],
  ['TanStack Start',route(chapters[5])+'#tanstack-start'],['SvelteKit',route(chapters[5])+'#sveltekit'],
] as const;
