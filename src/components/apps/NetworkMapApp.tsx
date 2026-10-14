'use client';

import React, { useState } from 'react';
import { SIMULATED_HOSTS } from '@/lib/network/simulated-hosts';
import { SimulatedHost } from '@/types/network';
import { useDesktop } from '@/context/DesktopContext';
import { 
  Network, 
  Server, 
  Shield, 
  Laptop, 
  Database, 
  Radio, 
  Activity, 
  CheckCircle2, 
  Terminal 
} from 'lucide-react';

export const NetworkMapApp: React.FC = () => {
  const { openApp } = useDesktop();
  const [selectedHost, setSelectedHost] = useState<SimulatedHost>(SIMULATED_HOSTS['10.10.10.10']);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingLog, setPingLog] = useState<string[]>([]);

  const hostsList = Object.values(SIMULATED_HOSTS);

  const getHostIcon = (role: string) => {
    switch (role) {
      case 'gateway': return <Radio className="w-6 h-6 text-amber-400" />;
      case 'web-server': return <Server className="w-6 h-6 text-cyan-400" />;
      case 'database': return <Database className="w-6 h-6 text-purple-400" />;
      case 'dns-server': return <Activity className="w-6 h-6 text-blue-400" />;
      case 'student-workstation': return <Laptop className="w-6 h-6 text-emerald-400" />;
      default: return <Server className="w-6 h-6 text-slate-400" />;
    }
  };

  const runPingTest = (host: SimulatedHost) => {
    setIsPinging(true);
    setPingLog([`Initiating ICMP probe to ${host.ip} (${host.hostname})...`]);

    setTimeout(() => {
      setPingLog(prev => [...prev, `Reply from ${host.ip}: bytes=64 time=${host.latencyMs}ms TTL=64`]);
    }, 400);

    setTimeout(() => {
      setPingLog(prev => [...prev, `Reply from ${host.ip}: bytes=64 time=${(host.latencyMs * 1.1).toFixed(2)}ms TTL=64`]);
    }, 800);

    setTimeout(() => {
      setPingLog(prev => [...prev, `4 packets transmitted, 4 received, 0% packet loss (latency ${host.latencyMs}ms)`]);
      setIsPinging(false);
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* Network Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-400 font-bold">
          <Network className="w-4 h-4" />
          <span>LFHP VIRTUAL SUBNET TOPOLOGY: 10.10.10.0/24</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400">
          5 ACTIVE HOSTS ONLINE
        </span>
      </div>

      {/* Main Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Network Hosts Grid */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Discovered Nodes on Subnet
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hostsList.map(h => (
              <button
                key={h.ip}
                onClick={() => setSelectedHost(h)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedHost.ip === h.ip
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-400 shadow-cyber-glow'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                      {getHostIcon(h.role)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 font-mono">{h.hostname}</div>
                      <div className="text-xs text-cyan-400 font-mono">{h.ip}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{h.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Host Inspector Panel */}
        <div className="w-80 bg-slate-900/80 border-l border-slate-800 p-4 overflow-y-auto flex flex-col gap-4 text-xs">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Node Inspector</span>
            <h2 className="text-base font-bold text-slate-100 font-mono mt-0.5">{selectedHost.hostname}</h2>
            <p className="text-cyan-400 font-mono text-xs">{selectedHost.ip} ({selectedHost.mac})</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px] font-mono">
            <div><span className="text-slate-500">OS:</span> {selectedHost.os}</div>
            <div><span className="text-slate-500">Role:</span> {selectedHost.role}</div>
            <div><span className="text-slate-500">Base Latency:</span> {selectedHost.latencyMs} ms</div>
          </div>

          {/* Open Ports List */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Exposed Services & Ports ({selectedHost.ports.length})
            </h4>
            <div className="space-y-1.5">
              {selectedHost.ports.map(p => (
                <div key={p.port} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">{p.port}/{p.protocol}</span>
                    <span className="text-slate-300">({p.service})</span>
                  </div>
                  <span className="text-slate-500 text-[10px] truncate max-w-[110px]">{p.version}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ping Simulator Button */}
          <div className="mt-auto space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => runPingTest(selectedHost)}
              disabled={isPinging}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{isPinging ? 'Pinging Node...' : `Send Ping Probe to ${selectedHost.ip}`}</span>
            </button>

            {pingLog.length > 0 && (
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-cyan-300 space-y-1">
                {pingLog.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
