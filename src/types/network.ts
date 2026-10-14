export interface SimulatedPort {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered';
  service: string;
  version: string;
  banner?: string;
}

export interface SimulatedHost {
  ip: string;
  hostname: string;
  mac: string;
  role: 'gateway' | 'web-server' | 'database' | 'dns-server' | 'student-workstation' | 'target-server';
  os: string;
  description: string;
  ports: SimulatedPort[];
  latencyMs: number;
  isReachable: boolean;
}

export interface DnsRecord {
  domain: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  value: string;
  ttl: number;
}

export interface HttpResponseMock {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}
