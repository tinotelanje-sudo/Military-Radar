export interface RadarObject {
  id: string | number;
  x: number;
  y: number;
  distance: number;
  angle: number;
  velocity: number;
  classification?: string;
  confidence?: number;
  timestamp: number;
}

export interface SystemStatus {
  mqtt: boolean;
  activeObjects: number;
  lastUpdate: number;
}
