import { SimulatedHost } from '@/types/network';
import { SIMULATED_HOSTS } from './simulated-hosts';
import { DnsEngine } from './dns-engine';

export interface NmapScanOptions {
  target: string;
  ports?: string; // e.g. "80", "22,80,443", "1-100", "all"
  serviceVersion?: boolean; // -sV
  synScan?: boolean; // -sS
  aggressive?: boolean; // -A
  topPorts?: number;
}

export class PortScannerEngine {
  public static scan(options: NmapScanOptions): { output: string; rawHosts: SimulatedHost[] } {
    let target = options.target.trim();

    // Check if hostname needs resolution
    let targetIps: string[] = [];

    if (target.includes('/24') || target.includes('10.10.10.0')) {
      // Subnet scan
      targetIps = Object.keys(SIMULATED_HOSTS);
    } else {
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
        const records = DnsEngine.resolve(target, 'A');
        if (records.length > 0) {
          targetIps = [records[0].value];
        } else {
          return {
            output: `Failed to resolve "${target}".\nWARNING: No targets were specified, so 0 hosts scanned.\nNmap done: 0 IP addresses (0 hosts up) scanned in 0.08 seconds`,
            rawHosts: [],
          };
        }
      } else {
        targetIps = [target];
      }
    }

    const startTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let out = `Starting Nmap 7.94 ( https://nmap.org ) at ${startTime} UTC\n`;

    const matchedHosts: SimulatedHost[] = [];

    for (const ip of targetIps) {
      const host = SIMULATED_HOSTS[ip];
      if (!host) {
        out += `Note: Host ${ip} seems down. If it is really up, but blocking our ping probes, try -Pn\nNmap done: 1 IP address (0 hosts up) scanned in 2.01 seconds\n`;
        continue;
      }

      matchedHosts.push(host);

      out += `Nmap scan report for ${host.hostname} (${host.ip})\n`;
      out += `Host is up (${(host.latencyMs / 1000).toFixed(4)}s latency).\n`;

      if (options.aggressive) {
        out += `MAC Address: ${host.mac} (EV Cyber Virtual NIC)\n`;
        out += `Device type: general purpose\n`;
        out += `Running: ${host.os}\n`;
        out += `OS details: ${host.os} (LFHP Target Environment)\n`;
      }

      // Filter ports
      let filteredPorts = host.ports;
      if (options.ports) {
        if (options.ports !== 'all' && options.ports !== '-') {
          const requested = options.ports.split(',').map(p => parseInt(p.trim(), 10)).filter(Boolean);
          filteredPorts = host.ports.filter(p => requested.includes(p.port));
        }
      }

      if (filteredPorts.length === 0) {
        out += `All scanned ports on ${host.ip} are in ignored states.\n`;
      } else {
        out += `PORT     STATE SERVICE     VERSION\n`;
        for (const p of filteredPorts) {
          const portStr = `${p.port}/${p.protocol}`.padEnd(9);
          const stateStr = p.state.padEnd(6);
          const serviceStr = p.service.padEnd(12);
          const versionStr = options.serviceVersion || options.aggressive ? (p.version || '') : '';
          out += `${portStr}${stateStr}${serviceStr}${versionStr}\n`;
        }
      }

      out += `\n`;
    }

    out += `Nmap done: ${targetIps.length} IP address (${matchedHosts.length} host${matchedHosts.length === 1 ? '' : 's'} up) scanned in 1.42 seconds`;

    return {
      output: out,
      rawHosts: matchedHosts,
    };
  }
}
