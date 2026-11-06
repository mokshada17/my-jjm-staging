/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MQTT_HOST: string;
  readonly VITE_MQTT_PORT: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: string;
  export default content;
}