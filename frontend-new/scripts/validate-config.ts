import { loadConfig } from "../src/app/config/env.js";

try {
  const env = process.env.NODE_ENV || "development";
  console.log(`Validating config for: ${env}`);
  
  const config = loadConfig(env);
  
  console.log("✓ Config validation passed");
  console.log("App:", config.app.name, "-", config.app.env);
  console.log("MQTT:", config.mqtt.host, ":", config.mqtt.port);
  console.log("API:", config.api.baseUrl);
  console.log("Features:", Object.entries(config.features)
    .filter(([, v]) => v)
    .map(([k]) => k).join(", ") || "none enabled");
    
  process.exit(0);
} catch (error) {
  console.error("✗ Config validation failed:", error);
  process.exit(1);
}