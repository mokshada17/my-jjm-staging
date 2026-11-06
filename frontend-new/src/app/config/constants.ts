import { z } from "zod";

export const EnvSchema = z.enum(["development", "staging", "production"]);

export const AppConfigSchema = z.object({
  name: z.string(),
  env: EnvSchema,
  logLevel: z.enum(["debug", "info", "warn", "error"]),
});

export const MqttConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  clientId: z.string(),
  tls: z.boolean().optional(),
  topics: z.object({
    sensorData: z.string(),
    deviceStatus: z.string(),
    alerts: z.string(),
  }).optional(),
  qos: z.number().int().min(0).max(2).optional(),
  reconnectInterval: z.number().int().positive().optional(),
});

export const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeout: z.number().int().positive(),
  endpoints: z.object({
    devices: z.string(),
    sensors: z.string(),
    analytics: z.string(),
  }).optional(),
  retryAttempts: z.number().int().positive().optional(),
  retryDelay: z.number().int().positive().optional(),
});

export const DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  name: z.string(),
  ssl: z.boolean().optional(),
});

export const FeatureFlagsSchema = z.object({
  enableTelemetry: z.boolean(),
  enableRealtimeUpdates: z.boolean(),
  enableExport: z.boolean(),
  enableBetaFeatures: z.boolean(),
});

export const FullConfigSchema = z.object({
  app: AppConfigSchema,
  mqtt: MqttConfigSchema,
  api: ApiConfigSchema,
  database: DatabaseConfigSchema,
  features: FeatureFlagsSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type MqttConfig = z.infer<typeof MqttConfigSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
export type FullConfig = z.infer<typeof FullConfigSchema>;