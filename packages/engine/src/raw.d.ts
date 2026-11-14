// Lets tests (and Vite) import fixture CSVs as text: `import csv from '../fixtures/x.csv?raw'`.
declare module '*.csv?raw' {
  const content: string;
  export default content;
}
