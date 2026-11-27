export interface Project {
  readonly slug: string;
  readonly title: string;
  readonly discipline: string;
  readonly atmosphere: 'cool' | 'warm';
  readonly entry: number;
  readonly exhibit: 'tuning-chamber' | 'fold-book';
}

export const projects = [
  {slug:'signal-field', title:'Signal Field', discipline:'Optical studies', atmosphere:'cool', entry:2, exhibit:'tuning-chamber'},
  {slug:'matter-studies', title:'Matter Studies', discipline:'Material experiments', atmosphere:'warm', entry:3, exhibit:'fold-book'},
] as const satisfies readonly Project[];

export const asset = (project: Project, variant: string | number) => `/works/${project.slug}-${variant}.webp`;
export const route = (project: Project) => `/work/${project.slug}/`;
export const home = (project: Project) => `/?project=${project.slug}`;
