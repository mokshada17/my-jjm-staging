import {
  ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import mqtt, { MqttClient } from "mqtt";
import { useAppStore, type TelemetryReading } from "@/app/store";

interface MqttContextType {
  client: MqttClient | null;
  isConnected: boolean;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  publish: (topic: string, message: string) => void;
}

const MqttContext = createContext<MqttContextType | null>(null);

/** Payload the broker publishes per sensor tag. */
interface TelemetryPacket {
  tag?: string;
  value?: number;
  unit?: string;
  timestamp?: string | number;
}

export function MqttProvider({ children }: { children: ReactNode }) {
  // Held in state, not a ref: a ref assignment does not re-render, so consumers
  // would otherwise read `null` for the lifetime of the app.
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const upsertTelemetry = useAppStore((s) => s.upsertTelemetry);

  // Packets arrive far faster than React should render, so they are batched and
  // flushed once per frame.
  const pending = useRef<Record<string, TelemetryReading>>({});
  const frame = useRef<number | null>(null);

  const flush = useCallback(() => {
    frame.current = null;
    const batch = pending.current;
    pending.current = {};
    if (Object.keys(batch).length > 0) upsertTelemetry(batch);
  }, [upsertTelemetry]);

  const enqueue = useCallback(
    (topic: string, payload: Uint8Array) => {
      let packet: TelemetryPacket;
      try {
        packet = JSON.parse(new TextDecoder().decode(payload));
      } catch {
        return;
      }
      if (typeof packet.value !== "number") return;

      pending.current[packet.tag ?? topic] = {
        value: packet.value,
        unit: packet.unit ?? "",
        timestamp: packet.timestamp ? new Date(packet.timestamp).getTime() : Date.now(),
      };

      if (frame.current === null) {
        frame.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  useEffect(() => {
    const host = import.meta.env.VITE_MQTT_HOST;
    const port = import.meta.env.VITE_MQTT_PORT;
    if (!host || !port) return;

    const c = mqtt.connect(`ws://${host}:${port}`, {
      clientId: `jjm-frontend-${Math.random().toString(16).slice(2)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    c.on("connect", () => setIsConnected(true));
    c.on("close", () => setIsConnected(false));
    c.on("error", (err) => console.error("MQTT error:", err));
    c.on("message", enqueue);

    setClient(c);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      c.removeListener("message", enqueue);
      c.end(true);
      setClient(null);
      setIsConnected(false);
    };
  }, [enqueue]);

  const subscribe = useCallback(
    (topic: string) => {
      client?.subscribe(topic, (err) => {
        if (err) console.error("Subscribe error:", err);
      });
    },
    [client]
  );

  const unsubscribe = useCallback(
    (topic: string) => {
      client?.unsubscribe(topic);
    },
    [client]
  );

  const publish = useCallback(
    (topic: string, message: string) => {
      client?.publish(topic, message);
    },
    [client]
  );

  return (
    <MqttContext.Provider
      value={{ client, isConnected, subscribe, unsubscribe, publish }}
    >
      {children}
    </MqttContext.Provider>
  );
}

export function useMqtt() {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error("useMqtt must be used within MqttProvider");
  }
  return context;
}
