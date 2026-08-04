/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THEME_MODE?: string
  readonly VITE_FLOW_MODE?: string
  readonly VITE_LOCALE?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
