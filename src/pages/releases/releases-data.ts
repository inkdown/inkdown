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
    version: '0.2.0',
    title: 'Inkdown beta',
    date: 'Ago 13, 2025',
    description: 'Correções de bugs envolvendo o parser, novas features no editor, note pallete e na file tree.',
    platform: 'Desktop',
    changes: [
      { type: 'feat', description: 'Suporte ao GFM.' },
      { type: 'feat', description: 'Possiblidade de arrastar objetos na file tree.' },
      { type: 'feat', description: 'Note pallete e capaz de criar diretorios e notas que não existem.' },
      { type: 'feat', description: 'Modo dev para visualização do fps do app.' },
      { type: 'fix', description: 'Bugs envolvendo o parser.' },
      { type: 'fix', description: 'Corração do problema de reset do cache apos trocar o workspace.' },
      { type: 'fix', description: 'Melhoria na UX durante a criação / renomeação de notas.' },
      { type: 'fix', description: 'Note pallete muito lenta.' },
      { type: 'chore', description: 'Divisão dos chunks da pagina durante o build' }
    ],
  },
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
