import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import mqtt from "mqtt";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const PORT = 3000;

// Gemini AI Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// MQTT Setup (Optional - user needs to provide broker)
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "bina-ai/radar/data";
let mqttClient: mqtt.MqttClient | null = null;

try {
  mqttClient = mqtt.connect(MQTT_BROKER);
  mqttClient.on("connect", () => {
    console.log(`Connected to MQTT Broker. Subscribing to: ${MQTT_TOPIC}`);
    mqttClient?.subscribe(MQTT_TOPIC);
  });

  mqttClient.on("message", (topic, message) => {
    if (topic === MQTT_TOPIC) {
      const rawMessage = message.toString().trim();
      
      // Basic validation: must start with { and end with } to be valid JSON for our app
      if (!rawMessage.startsWith("{") || !rawMessage.endsWith("}")) {
        // Silently ignore noise on public brokers, but log if it looks like a failed attempt
        if (rawMessage.length > 2) {
          console.warn(`Ignoring non-JSON message on topic ${topic}: ${rawMessage.substring(0, 50)}...`);
        }
        return;
      }

      try {
        const data = JSON.parse(rawMessage);
        processRadarData(data);
      } catch (e) {
        console.error(`Failed to parse MQTT message on topic ${topic}:`, e);
        console.error("Raw message content:", rawMessage);
      }
    }
  });
} catch (e) {
  console.error("MQTT Connection failed", e);
}

// Data Processing Logic
async function processRadarData(data: any) {
  // Emit raw data to frontend
  io.emit("radar:raw", data);

  // AI Classification (Throttle this in production)
  if (data.signal_pattern && Math.random() > 0.8) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this radar signal pattern and classify the object. 
        Pattern: ${JSON.stringify(data.signal_pattern)}. 
        Possible classes: Aircraft, Drone, Vehicle, Bird, Unknown.
        Return JSON format: { "classification": "string", "confidence": number, "reason": "string" }`,
        config: { responseMimeType: "application/json" }
      });
      
      let result = {};
      try {
        const text = response.text || "{}";
        // Remove markdown code blocks if present
        const cleanJson = text.replace(/```json|```/g, "").trim();
        result = JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse AI classification JSON:", e);
      }
      
      io.emit("radar:classification", { ...result, id: data.id || Date.now() });
    } catch (e) {
      console.error("AI Classification failed", e);
    }
  }
}

app.use(express.json());

// API Endpoints for MCUs (ESP32/STM32 can POST here)
app.post("/api/ingest", (req, res) => {
  const data = req.body;
  processRadarData(data);
  res.status(200).json({ status: "received" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mqtt: mqttClient?.connected });
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
