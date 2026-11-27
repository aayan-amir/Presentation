import type { Chapter } from './chapters';

export const claims: Record<Chapter['slug'],string> = {
  'what-is-a-framework':'Frameworks organize how a site is built, how it loads data, and what code runs in the browser.',
  languages:'Learn the browser first, then add a language that fits the work.',
  'next-js':'Build React applications where server data and interactive UI share a route.',
  astro:'Build pages people come to read, with JavaScript for the parts they come to use.',
  'remix-3':'Explore a full-stack framework designed around requests, handlers, and responses.',
  'two-to-watch':'Try two different approaches to building a full-stack web app.',
  'usage-and-satisfaction':'A framework can lead in usage while another leads in satisfaction.',
  'pick-a-stack':'Choose a framework by what your site spends most of its time doing.',
};
