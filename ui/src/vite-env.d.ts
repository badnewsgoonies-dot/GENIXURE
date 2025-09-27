/// <reference types="vite/client" />

// Extend ImportMeta if needed (satisfy strict TS on CI)
interface ImportMetaEnv {
  readonly BASE_URL?: string;
  // add any other Vite envs you use here
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

