import { HttpResponseMock } from '@/types/network';
import { DnsEngine } from './dns-engine';

export class HttpSimulator {
  public static request(urlStr: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): HttpResponseMock {
    let url: URL;
    try {
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        urlStr = 'http://' + urlStr;
      }
      url = new URL(urlStr);
    } catch {
      return {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Server': 'EV-Gateway/1.0' },
        body: 'curl: (3) URL using bad/illegal format or missing URL',
      };
    }

    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    const method = (options.method || 'GET').toUpperCase();

    // Check if host resolves
    let targetIp = hostname;
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const records = DnsEngine.resolve(hostname, 'A');
      if (records.length === 0) {
        return {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Server': 'EV-Gateway/1.0', 'Content-Type': 'text/plain' },
          body: `curl: (6) Could not resolve host: ${hostname}`,
        };
      }
      targetIp = records[0].value;
    }

    const defaultHeaders = {
      'Date': new Date().toUTCString(),
      'Server': 'Apache/2.4.52 (Ubuntu)',
      'Content-Type': 'text/html; charset=UTF-8',
      'Connection': 'keep-alive',
      'X-Powered-By': 'EV-Cyber-Lab-Engine/2026',
    };

    // 1. Bank.local / 10.10.10.10
    if (hostname === 'bank.local' || targetIp === '10.10.10.10') {
      if (pathname === '/robots.txt') {
        return {
          status: 200,
          statusText: 'OK',
          headers: { ...defaultHeaders, 'Content-Type': 'text/plain' },
          body: `User-agent: *\nDisallow: /admin\nDisallow: /api/internal\nDisallow: /backup.sql\n# Flag Hint: Inspect /admin for LFHP web recon lab!\n`,
        };
      }

      if (pathname === '/admin' || pathname === '/admin/') {
        return {
          status: 200,
          statusText: 'OK',
          headers: { ...defaultHeaders, 'X-Admin-Level': 'Restricted', 'X-Lab-Token': 'LFHP{web_recon_admin_portal_uncovered}' },
          body: `<!DOCTYPE html>
<html>
<head><title>EV Bank - Admin Portal</title><style>body{background:#0a0f1d;color:#00f0ff;font-family:sans-serif;padding:2rem;} h1{color:#f43f5e;}</style></head>
<body>
  <h1>[RESTRICTED AREA] EV Cyber Bank Admin Console</h1>
  <p>Status: System Online | Authentication: Active</p>
  <div style="background:#131c31;padding:1.5rem;border-radius:8px;border:1px solid #1e293b;margin-top:1rem;">
    <h3>Internal Diagnostics</h3>
    <p>Flag: <code>LFHP{web_recon_admin_portal_uncovered}</code></p>
    <p>Database Node: 10.10.10.20:3306</p>
  </div>
</body>
</html>`,
        };
      }

      if (pathname === '/api/v1/user') {
        return {
          status: 200,
          statusText: 'OK',
          headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'success',
            data: {
              account: 'ACC-8921-99',
              owner: 'John Doe (Cyber VIP)',
              balance: 142500.00,
              currency: 'USD',
              tier: 'Platinum',
            }
          }, null, 2),
        };
      }

      // Default Bank Home
      return {
        status: 200,
        statusText: 'OK',
        headers: defaultHeaders,
        body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EV Cyber Bank - Secure Online Banking</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080c14; color: #f8fafc; margin: 0; padding: 2rem; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 2rem; max-width: 600px; margin: 2rem auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #00f0ff; font-size: 1.8rem; margin-top: 0; }
    .btn { background: #00f0ff; color: #080c14; font-weight: bold; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block; }
    .badge { background: #10b981; color: #04070d; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">SECURE ENCRYPTED</span>
    <h1>EV Cyber Bank Portal</h1>
    <p>Welcome to EV Cyber Academy's simulated banking infrastructure for LFHP web security training.</p>
    <p>Available endpoints: <code>/robots.txt</code>, <code>/api/v1/user</code>, <code>/admin</code></p>
    <hr style="border-color: #1e293b; margin: 1.5rem 0;" />
    <a href="/api/v1/user" class="btn">View User API JSON</a>
  </div>
</body>
</html>`,
      };
    }

    // 2. Database Server 10.10.10.20:8080 (Adminer)
    if (targetIp === '10.10.10.20') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { ...defaultHeaders, 'Server': 'PHP/8.2.0 Development Server' },
        body: `<!DOCTYPE html><html><head><title>Adminer 4.8.1 - Database Web Management</title></head><body style="background:#111827;color:#e5e7eb;font-family:sans-serif;padding:2rem;"><h2>Database Management UI (Adminer)</h2><p>Host: 10.10.10.20:3306</p><p>Database: <code>lfhp_production</code></p></body></html>`,
      };
    }

    // 3. Official EV Cyber Academy Domain
    if (hostname === 'evcyber.academy') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { ...defaultHeaders, 'Server': 'Cloudflare' },
        body: `<!DOCTYPE html><html><head><title>EV Cyber Academy</title></head><body style="background:#090d16;color:#e2e8f0;font-family:sans-serif;padding:2rem;"><h1 style="color:#00f0ff;">EV CYBER ACADEMY</h1><p>Premier Cybersecurity Training & LFHP (Learn the Fundamentals of Hacking Program).</p></body></html>`,
      };
    }

    // Fallback 404
    return {
      status: 404,
      statusText: 'Not Found',
      headers: defaultHeaders,
      body: `<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="background:#0b101b;color:#f87171;font-family:sans-serif;padding:2rem;"><h1>404 Not Found</h1><p>The requested URL was not found on this server.</p></body></html>`,
    };
  }
}
