/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  VITE_API_BASE?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
