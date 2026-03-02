import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { RadarView } from './components/RadarView';
import { ObjectList } from './components/ObjectList';
import { RadarObject, SystemStatus } from './types';
import { Activity, Shield, Database, Cpu, Wifi, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [objects, setObjects] = useState<RadarObject[]>([]);
  const [status, setStatus] = useState<SystemStatus>({
    mqtt: false,
    activeObjects: 0,
    lastUpdate: Date.now()
  });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const socket: Socket = io();

    socket.on('connect', () => {
      addLog('System: Connected to App Engine');
    });

    socket.on('radar:raw', (data: RadarObject) => {
      setObjects(prev => {
        const filtered = prev.filter(o => Date.now() - o.timestamp < 10000);
        const index = filtered.findIndex(o => o.id === data.id);
        if (index > -1) {
          const updated = [...filtered];
          updated[index] = { ...updated[index], ...data, timestamp: Date.now() };
          return updated;
        }
        return [...filtered, { ...data, timestamp: Date.now() }];
      });
      setStatus(prev => ({ ...prev, lastUpdate: Date.now() }));
    });

    socket.on('radar:classification', (data: { id: string | number, classification: string, confidence: number }) => {
      setObjects(prev => prev.map(o => o.id === data.id ? { ...o, ...data } : o));
      addLog(`AI: Object #${String(data.id).slice(-4)} classified as ${data.classification}`);
    });

    // Mock data for demo if no real input
    const interval = setInterval(() => {
      if (objects.length < 3) {
        const mockObj: RadarObject = {
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * 100,
          y: Math.random() * 100,
          distance: Math.random() * 100,
          angle: Math.random() * 360,
          velocity: Math.random() * 500,
          timestamp: Date.now()
        };
        socket.emit('radar:raw', mockObj); // In real app, this comes from server
      }
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-6 font-sans radar-grid">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <Shield className="text-black w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              Bina AI <span className="text-green-500">Radar Engine</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
            Military-Grade Monitoring System v2.4.0-PRO
          </p>
        </div>

        <div className="flex gap-4">
          <StatusCard icon={<Wifi className="w-4 h-4" />} label="MQTT" value={status.mqtt ? "ONLINE" : "OFFLINE"} active={status.mqtt} />
          <StatusCard icon={<Cpu className="w-4 h-4" />} label="AI ENGINE" value="ACTIVE" active={true} />
          <StatusCard icon={<Database className="w-4 h-4" />} label="DATABASE" value="SQLITE" active={true} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Radar View */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
            <RadarView objects={objects} />
            
            <div className="mt-8 grid grid-cols-3 gap-4">
              <Metric label="Active Targets" value={objects.length} unit="objs" />
              <Metric label="Scan Range" value="100" unit="km" />
              <Metric label="Latency" value="12" unit="ms" />
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              System Logs
            </h3>
            <div className="font-mono text-[11px] space-y-1 h-32 overflow-y-auto">
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-zinc-500"
                  >
                    <span className="text-zinc-700">[{new Date().toLocaleTimeString()}]</span> {log}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Object List & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <ObjectList objects={objects} />
          
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              Integration Endpoints
            </h3>
            <div className="space-y-4">
              <EndpointInfo label="HTTP API" value="POST /api/ingest" />
              <EndpointInfo label="MQTT Topic" value="bina-ai/radar/data" />
              <EndpointInfo label="WebSocket" value="radar:raw" />
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <button className="w-full py-3 bg-zinc-100 text-black font-bold rounded-xl hover:bg-green-500 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase text-sm">
                <Activity className="w-4 h-4" />
                Initialize Full System Scan
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusCard({ icon, label, value, active }: { icon: React.ReactNode, label: string, value: string, active: boolean }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-3">
      <div className={active ? "text-green-500" : "text-zinc-600"}>{icon}</div>
      <div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter leading-none mb-1">{label}</div>
        <div className={`text-xs font-black ${active ? "text-zinc-100" : "text-zinc-600"}`}>{value}</div>
      </div>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string, value: string | number, unit: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-black tracking-tighter">
        {value}<span className="text-xs text-zinc-600 ml-1 font-normal">{unit}</span>
      </div>
    </div>
  );
}

function EndpointInfo({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-zinc-800/50">
      <span className="text-[10px] font-bold text-zinc-500 uppercase">{label}</span>
      <code className="text-[11px] text-green-500 font-mono">{value}</code>
    </div>
  );
}
