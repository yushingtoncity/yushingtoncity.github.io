/* .tex files are compiled to KaTeX HTML strings by the plugin in vite.config.ts. */
declare module "*.tex" {
  const html: string;
  export default html;
}
