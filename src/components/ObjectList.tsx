import React from 'react';
import { RadarObject } from '../types';
import { Shield, Plane, Radio, AlertTriangle } from 'lucide-react';

interface ObjectListProps {
  objects: RadarObject[];
}

export const ObjectList: React.FC<ObjectListProps> = ({ objects }) => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-bottom border-zinc-800 flex items-center justify-between bg-zinc-900">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-500" />
          Detected Objects ({objects.length})
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 italic text-sm">
            No objects in range
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-500 sticky top-0">
              <tr>
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Dist (km)</th>
                <th className="p-3 font-medium">Conf</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {objects.map((obj) => (
                <tr key={obj.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-3 font-mono text-zinc-300">#{String(obj.id).slice(-4)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${
                      obj.classification === 'Aircraft' ? 'bg-red-500/10 text-red-500' :
                      obj.classification === 'Drone' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {obj.classification === 'Aircraft' ? <Plane className="w-3 h-3" /> : 
                       obj.classification === 'Drone' ? <Radio className="w-3 h-3" /> : 
                       <Shield className="w-3 h-3" />}
                      {obj.classification || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-zinc-400">{obj.distance.toFixed(1)}</td>
                  <td className="p-3 font-mono text-zinc-400">
                    {obj.confidence ? `${(obj.confidence * 100).toFixed(0)}%` : '--'}
                  </td>
                  <td className="p-3">
                    {obj.classification === 'Aircraft' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
