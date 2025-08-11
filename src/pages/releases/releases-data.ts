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
    version: '0.1.0',
    title: 'Inkdown beta',
    date: 'Ago 11, 2025',
    description: 'Primeira versão pública para download do inkdown, claro, possivelmente cheia de bugs.',
    platform: 'Desktop',
    changes: [
      { type: 'feat', description: 'Core do editor de markdown com preview.' },
      { type: 'feat', description: 'Sistemas de arquivos seguro feitos para organização.' },
      { type: 'feat', description: 'Tema escuro e claro padrões.' },
      { type: 'feat', description: 'Possibilidade de baixar temas feitos pela comunidade.' },
      { type: 'build', description: 'App leve e performatico.' },
      { type: 'ci', description: 'CI integrado para build em mutiplas plataformas.' },
    ],
  },
];
