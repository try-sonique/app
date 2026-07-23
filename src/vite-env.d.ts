/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THEME_MODE?: string
  readonly VITE_FLOW_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
