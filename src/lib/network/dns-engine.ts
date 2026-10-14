import { DnsRecord } from '@/types/network';
import { SIMULATED_DNS_RECORDS, SIMULATED_HOSTS } from './simulated-hosts';

export class DnsEngine {
  public static resolve(domain: string, recordType: 'A' | 'AAAA' | 'TXT' | 'MX' | 'NS' | 'ANY' = 'A'): DnsRecord[] {
    const cleanDomain = domain.toLowerCase().trim().replace(/\.$/, '');

    // Check direct DNS records
    const matches = SIMULATED_DNS_RECORDS.filter(r => {
      const domainMatch = r.domain.toLowerCase() === cleanDomain;
      if (!domainMatch) return false;
      if (recordType === 'ANY') return true;
      return r.type === recordType;
    });

    if (matches.length > 0) return matches;

    // Check hosts by hostname lookup
    const host = Object.values(SIMULATED_HOSTS).find(h => h.hostname.toLowerCase() === cleanDomain);
    if (host && (recordType === 'A' || recordType === 'ANY')) {
      return [{
        domain: cleanDomain,
        type: 'A',
        value: host.ip,
        ttl: 300,
      }];
    }

    return [];
  }

  public static reverseResolve(ip: string): string | null {
    const host = SIMULATED_HOSTS[ip];
    return host ? host.hostname : null;
  }
}
