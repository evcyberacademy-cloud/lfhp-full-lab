import { CommandContext, CommandResult } from '@/types/terminal';
import { VFSEngine } from '@/lib/vfs/vfs-engine';
import { SIMULATED_HOSTS } from '@/lib/network/simulated-hosts';
import { DnsEngine } from '@/lib/network/dns-engine';
import { HttpSimulator } from '@/lib/network/http-simulator';
import { PortScannerEngine } from '@/lib/network/port-scanner';

export function handleNetworkSim(ctx: CommandContext, vfs: VFSEngine): CommandResult | null {
  const { args, flags, rawCommand } = ctx;
  const commandName = ctx.rawCommand.trim().split(/\s+/)[0];

  switch (commandName) {
    case 'ip': {
      const sub = args[0] || 'a';
      if (sub === 'a' || sub === 'addr' || sub === 'address') {
        const out = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:1a:2b:3c:4d:99 brd ff:ff:ff:ff:ff:ff
    inet 10.10.10.100/24 brd 10.10.10.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::21a:2bff:fe3c:4d99/64 scope link 
       valid_lft forever preferred_lft forever\n`;
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      if (sub === 'r' || sub === 'route') {
        const out = `default via 10.10.10.1 dev eth0 proto static 
10.10.10.0/24 dev eth0 proto kernel scope link src 10.10.10.100 \n`;
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      if (sub === 'link' || sub === 'l') {
        const out = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 00:1a:2b:3c:4d:99 brd ff:ff:ff:ff:ff:ff\n`;
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      return { stdout: `Usage: ip [link|addr|route]\n`, stderr: '', exitCode: 0 };
    }

    case 'ifconfig': {
      const out = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.10.10.100  netmask 255.255.255.0  broadcast 10.10.10.255
        inet6 fe80::21a:2bff:fe3c:4d99  prefixlen 64  scopeid 0x20<link>
        ether 00:1a:2b:3c:4d:99  txqueuelen 1000  (Ethernet)
        RX packets 24108  bytes 18293402 (18.2 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 19821  bytes 14210982 (14.2 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 420  bytes 34120 (34.1 KB)
        TX packets 420  bytes 34120 (34.1 KB)\n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'ping': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'ping: usage error: Destination address required\n', exitCode: 2 };
      }
      const target = args[0];
      const count = typeof flags['c'] === 'string' ? parseInt(flags['c'], 10) : 4;

      let targetIp = target;
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
        const resolved = DnsEngine.resolve(target, 'A');
        if (resolved.length === 0) {
          return { stdout: '', stderr: `ping: ${target}: Name or service not known\n`, exitCode: 2 };
        }
        targetIp = resolved[0].value;
      }

      const host = SIMULATED_HOSTS[targetIp];
      const isReachable = targetIp === '127.0.0.1' || (host && host.isReachable);

      let out = `PING ${target} (${targetIp}) 56(84) bytes of data.\n`;

      if (!isReachable) {
        for (let i = 1; i <= count; i++) {
          out += `From 10.10.10.100 icmp_seq=${i} Destination Host Unreachable\n`;
        }
        out += `\n--- ${target} ping statistics ---\n${count} packets transmitted, 0 received, +${count} errors, 100% packet loss, time ${count * 1000}ms\n`;
        return { stdout: out, stderr: '', exitCode: 1 };
      }

      const latency = host ? host.latencyMs : 0.08;
      for (let i = 1; i <= count; i++) {
        const jitter = (Math.random() * 0.4 - 0.2).toFixed(3);
        const seqLatency = (latency + parseFloat(jitter)).toFixed(3);
        out += `64 bytes from ${targetIp}: icmp_seq=${i} ttl=64 time=${seqLatency} ms\n`;
      }

      out += `\n--- ${target} ping statistics ---\n${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000}ms\nrtt min/avg/max/mdev = ${(latency * 0.9).toFixed(3)}/${latency.toFixed(3)}/${(latency * 1.2).toFixed(3)}/0.042 ms\n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'traceroute':
    case 'tracepath': {
      if (args.length === 0) return { stdout: '', stderr: 'traceroute: missing host operand\n', exitCode: 1 };
      const target = args[0];
      const out = `traceroute to ${target} (10.10.10.10), 30 hops max, 60 byte packets
 1  gateway.evcyber.local (10.10.10.1)  0.942 ms  0.812 ms  0.789 ms
 2  target-web.bank.local (10.10.10.10)  2.412 ms  2.380 ms  2.391 ms\n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'nslookup': {
      if (args.length === 0) return { stdout: '', stderr: 'nslookup: missing host\n', exitCode: 1 };
      const query = args[0];
      const records = DnsEngine.resolve(query, 'ANY');

      let out = `Server:\t\t10.10.10.53\nAddress:\t10.10.10.53#53\n\n`;
      if (records.length === 0) {
        out += `** server can't find ${query}: NXDOMAIN\n`;
        return { stdout: out, stderr: '', exitCode: 1 };
      }

      out += `Non-authoritative answer:\n`;
      records.forEach(r => {
        out += `Name:\t${r.domain}\nAddress:\t${r.value}\n`;
      });
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'dig': {
      if (args.length === 0) return { stdout: '', stderr: 'dig: missing query domain\n', exitCode: 1 };
      const domain = args.find(a => !a.startsWith('@') && !a.startsWith('-')) || 'bank.local';
      const recordType = (args.find(a => ['A', 'AAAA', 'TXT', 'MX', 'NS', 'ANY'].includes(a.toUpperCase())) || 'A').toUpperCase() as any;

      const records = DnsEngine.resolve(domain, recordType);

      let out = `; <<>> DiG 9.18.18-1-Debian <<>> ${domain} ${recordType}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: ${records.length > 0 ? 'NOERROR' : 'NXDOMAIN'}, id: 48921
;; flags: qr rd ra; QUERY: 1, ANSWER: ${records.length}, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;${domain}.\t\t\tIN\t${recordType}

`;

      if (records.length > 0) {
        out += `;; ANSWER SECTION:\n`;
        records.forEach(r => {
          out += `${r.domain}.\t\t${r.ttl}\tIN\t${r.type}\t${r.value}\n`;
        });
        out += `\n`;
      }

      out += `;; Query time: 2 msec
;; SERVER: 10.10.10.53#53(10.10.10.53) (UDP)
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 84\n`;

      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'host': {
      if (args.length === 0) return { stdout: '', stderr: 'host: missing operand\n', exitCode: 1 };
      const domain = args[0];
      const records = DnsEngine.resolve(domain, 'A');
      if (records.length === 0) {
        return { stdout: `Host ${domain} not found: 3(NXDOMAIN)\n`, stderr: '', exitCode: 1 };
      }
      let out = '';
      records.forEach(r => {
        out += `${r.domain} has address ${r.value}\n`;
      });
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'curl': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'curl: try \'curl --help\' or \'curl --manual\' for more information\n', exitCode: 2 };
      }

      const headersOnly = !!flags['I'] || !!flags['head'];
      const verbose = !!flags['v'] || !!flags['verbose'];
      const method = typeof flags['X'] === 'string' ? flags['X'] : 'GET';
      const url = args.find(a => !a.startsWith('-')) || '';

      const resp = HttpSimulator.request(url, { method });

      let out = '';
      if (verbose) {
        out += `*   Trying 10.10.10.10:80...\n* Connected to ${url} port 80\n> ${method} / HTTP/1.1\n> Host: bank.local\n> User-Agent: curl/7.88.1\n> Accept: */*\n>\n< HTTP/1.1 ${resp.status} ${resp.statusText}\n`;
        Object.entries(resp.headers).forEach(([k, v]) => {
          out += `< ${k}: ${v}\n`;
        });
        out += `<\n`;
      }

      if (headersOnly) {
        out += `HTTP/1.1 ${resp.status} ${resp.statusText}\n`;
        Object.entries(resp.headers).forEach(([k, v]) => {
          out += `${k}: ${v}\n`;
        });
        out += `\n`;
      } else {
        out += resp.body + '\n';
      }

      return {
        stdout: out,
        stderr: '',
        exitCode: resp.status >= 400 && resp.status !== 404 ? 1 : 0,
      };
    }

    case 'wget': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'wget: missing URL\n', exitCode: 1 };
      }
      const url = args[0];
      const resp = HttpSimulator.request(url);
      const fileName = url.substring(url.lastIndexOf('/') + 1) || 'index.html';
      vfs.writeFile(fileName, resp.body);

      const out = `--2026-09-10 10:48:12--  ${url}
Resolving ${url}... 10.10.10.10
Connecting to 10.10.10.10:80... connected.
HTTP request sent, awaiting response... ${resp.status} ${resp.statusText}
Length: ${resp.body.length} [text/html]
Saving to: ‘${fileName}’

${fileName}          100%[===================>]   ${resp.body.length}  --.-KB/s    in 0.001s  

2026-09-10 10:48:12 (2.41 MB/s) - ‘${fileName}’ saved [${resp.body.length}/${resp.body.length}]\n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'ss':
    case 'netstat': {
      const out = `State      Recv-Q Send-Q Local Address:Port               Peer Address:Port
LISTEN     0      128          0.0.0.0:22                      0.0.0.0:*    
LISTEN     0      511          0.0.0.0:80                      0.0.0.0:*    
ESTAB      0      0       10.10.10.100:51230              10.10.10.10:80   \n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'arp': {
      const out = `Address                  HWtype  HWaddress           Flags Mask            Iface
10.10.10.1               ether   00:1a:2b:3c:4d:01   C                     eth0
10.10.10.10              ether   00:1a:2b:3c:4d:10   C                     eth0
10.10.10.20              ether   00:1a:2b:3c:4d:20   C                     eth0
10.10.10.53              ether   00:1a:2b:3c:4d:53   C                     eth0\n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'route': {
      const out = `Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         10.10.10.1      0.0.0.0         UG    100    0        0 eth0
10.10.10.0      0.0.0.0         255.255.255.0   U     100    0        0 eth0\n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'nmap': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'Nmap: missing target\nUsage: nmap [Scan Type...] [Options] {target specification}\n', exitCode: 1 };
      }

      const target = args.find(a => !a.startsWith('-')) || '10.10.10.10';
      const serviceVersion = !!flags['sV'];
      const synScan = !!flags['sS'];
      const aggressive = !!flags['A'];
      const ports = typeof flags['p'] === 'string' ? flags['p'] : undefined;

      const scanRes = PortScannerEngine.scan({
        target,
        serviceVersion,
        synScan,
        aggressive,
        ports,
      });

      return {
        stdout: scanRes.output + '\n',
        stderr: '',
        exitCode: 0,
      };
    }

    default:
      return null;
  }
}
