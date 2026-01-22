/// <reference types="vite/client" />

declare module '*?script' {
  const content: string;
  export default content;
}

declare module '*?inline' {
  const content: string;
  export default content;
}

declare module '*?url' {
  const content: string;
  export default content;
}
