import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { FullConfigSchema, type FullConfig } from "./constants.js";

function loadYaml<T>(filePath: string): T {
  const content = readFileSync(filePath, "utf-8");
  return parse(content) as T;
}

function loadConfig(env: string): FullConfig {
  const basePath = join(process.cwd(), "config");
  
  const appConfig = loadYaml<{ app: any; mqtt: any; api: any; database: any }>(
    join(basePath, "environments", `${env}.yaml`)
  );
  const features = loadYaml<{ features: any }>(join(basePath, "features", "flags.yaml"));
  const mqttService = loadYaml<{ mqtt: any }>(join(basePath, "services", "mqtt.yaml"));
  
  const config = {
    app: appConfig.app,
    mqtt: { ...appConfig.mqtt, ...mqttService.mqtt },
    api: appConfig.api,
    database: appConfig.database,
    features: features.features,
  };

  return FullConfigSchema.parse(config);
}

const env = process.env.NODE_ENV || "development";
const config = loadConfig(env);

export { config, loadConfig };
export type { FullConfig } from "./constants.js";