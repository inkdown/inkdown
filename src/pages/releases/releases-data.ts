export interface Change {
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'chore' | 'revert';
  description: string;
}

export interface Release {
  version: string;
  title: string;
  date: string;
  description: string;
  platform: 'Desktop' | 'Mobile' | 'Cross-platform';
  changes: Change[];
}

export const releasesData: Release[] = [
  {
    version: 'v1.1.0',
    title: 'Momentum',
    date: 'August 08, 2025',
    description:
      'This release focuses on improving the user experience and adding key features for better workflow integration.',
    platform: 'Cross-platform',
    changes: [
      { type: 'feat', description: 'Added new export options: PDF and HTML.' },
      { type: 'feat', description: 'Integration with cloud storage providers.' },
      { type: 'perf', description: 'Improved performance on large documents.' },
      { type: 'docs', description: 'Added comprehensive API documentation.' },
      { type: 'chore', description: 'Updated internal dependencies to latest versions.' },
    ],
  },
  {
    version: 'v1.0.2',
    title: 'Stability Enhancements',
    date: 'July 21, 2025',
    description: 'A patch release to address critical bugs and improve the overall stability of the application.',
    platform: 'Desktop',
    changes: [
      { type: 'fix', description: 'Fixed a critical bug causing data loss during sync.' },
      { type: 'fix', description: 'Resolved UI glitches on smaller screen sizes.' },
      { type: 'style', description: 'Improved visual consistency across the interface.' },
      { type: 'test', description: 'Added comprehensive unit tests for core features.' },
      { type: 'refactor', description: 'Optimized asset loading times.' },
    ],
  },
  {
    version: 'v1.0.0',
    title: 'Genesis',
    date: 'July 01, 2025',
    description: 'The first public release of Inkdown! A new way to capture and organize your thoughts.',
    platform: 'Cross-platform',
    changes: [
      { type: 'feat', description: 'Core markdown editor with real-time preview.' },
      { type: 'feat', description: 'File system-based note organization.' },
      { type: 'feat', description: 'Light and Dark mode themes.' },
      { type: 'build', description: 'Configured build system and deployment pipeline.' },
      { type: 'ci', description: 'Set up continuous integration workflows.' },
      { type: 'chore', description: 'Initial project setup and deployment.' },
    ],
  },
];
