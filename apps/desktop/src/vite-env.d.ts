/// <reference types="vite/client" />

declare module '*.css' {
    const content: string;
    export default content;
}

declare module 'katex/dist/katex.min.css' {
    const content: string;
    export default content;
}

declare module 'highlight.js/styles/github-dark.css' {
    const content: string;
    export default content;
}
