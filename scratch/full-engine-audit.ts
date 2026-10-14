import { VFSEngine } from '../src/lib/vfs/vfs-engine';
import { createInitialVFS } from '../src/lib/vfs/vfs-init';
import { CommandExecutor } from '../src/lib/terminal/executor';
import { DnsEngine } from '../src/lib/network/dns-engine';
import { HttpSimulator } from '../src/lib/network/http-simulator';
import { PortScannerEngine } from '../src/lib/network/port-scanner';
import { FRONTEND_QA_DATABASE } from '../src/lib/ai-bot/frontend-qa-database';
import { LFHP_CURRICULUM } from '../src/lib/labs/curriculum';
import * as fs from 'fs';
import * as path from 'path';

async function performFullEngineAudit() {
  console.log('================================================================');
  console.log('       EV CYBER ACADEMY - LFHP LABS FULL ENGINE AUDIT');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${testName}`);
    } else {
      console.error(`  ✗ [FAIL] ${testName}${detail ? ' -> ' + detail : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // -------------------------------------------------------------
  // 1. POSIX Virtual File System (VFS) Engine
  // -------------------------------------------------------------
  console.log('--- 1. Testing POSIX Virtual File System (VFS) Engine ---');
  const vfs = new VFSEngine(createInitialVFS(), 'student');
  const exec = new CommandExecutor(vfs);

  assert(vfs.getCwd() === '/home/student', 'VFS initial CWD is /home/student');
  
  const mkRes = vfs.createDirectory('/home/student/workspace/pentest', 'student', true);
  assert(mkRes.success, 'VFS recursive directory creation (/home/student/workspace/pentest)');

  const writeRes = vfs.writeFile('/home/student/workspace/pentest/notes.txt', 'Target: 10.10.10.50\n', 'student');
  assert(writeRes.success, 'VFS write file');

  const appendRes = vfs.writeFile('/home/student/workspace/pentest/notes.txt', 'Port: 80,443\n', 'student', true);
  assert(appendRes.success, 'VFS append file');

  const readRes = vfs.readFile('/home/student/workspace/pentest/notes.txt');
  assert(!!(readRes.success && readRes.data?.includes('Port: 80,443')), 'VFS read and verify appended content');

  const chmodRes = vfs.chmod('/home/student/workspace/pentest/notes.txt', '600');
  assert(chmodRes.success, 'VFS chmod octal mode 600');

  const procUptime = vfs.readFile('/proc/uptime');
  assert(!!(procUptime.success && procUptime.data), 'VFS dynamic /proc/uptime generation');

  const procCpu = vfs.readFile('/proc/cpuinfo');
  assert(!!(procCpu.success && procCpu.data?.includes('EV Virtual Cyber Processor')), 'VFS dynamic /proc/cpuinfo');

  // -------------------------------------------------------------
  // 2. Terminal Commands & Text Manipulation Tools
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Terminal Text Tools (grep, awk, sed, cut, sort, uniq, wc) ---');
  vfs.writeFile('/home/student/data.txt', 'apple 10 red\nbanana 5 yellow\ncherry 20 red\napple 10 red\n', 'student');

  let cmdRes = await exec.execute('grep "red" /home/student/data.txt');
  assert(cmdRes.stdout.includes('cherry'), 'grep search for pattern');

  cmdRes = await exec.execute('awk \'{print $1, $3}\' /home/student/data.txt');
  assert(cmdRes.stdout.includes('banana yellow'), 'awk column extraction ($1, $3)');

  cmdRes = await exec.execute('sed \'s/apple/orange/g\' /home/student/data.txt');
  assert(cmdRes.stdout.includes('orange 10 red'), 'sed stream substitution (s/apple/orange/g)');

  cmdRes = await exec.execute('cut -d " " -f 1 /home/student/data.txt');
  assert(cmdRes.stdout.includes('banana'), 'cut delimiter slicing (-d " " -f 1)');

  cmdRes = await exec.execute('sort /home/student/data.txt');
  assert(cmdRes.stdout.startsWith('apple'), 'sort alphabetical ordering');

  cmdRes = await exec.execute('wc -l /home/student/data.txt');
  assert(cmdRes.stdout.trim().startsWith('4'), 'wc line counting');

  // -------------------------------------------------------------
  // 3. Sysadmin & Process Simulation
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing SysAdmin & Process Commands ---');
  cmdRes = await exec.execute('whoami');
  assert(cmdRes.stdout.trim() === 'student', 'whoami returns current user');

  cmdRes = await exec.execute('id');
  assert(cmdRes.stdout.includes('uid=1000(student)'), 'id command details');

  cmdRes = await exec.execute('uname -a');
  assert(cmdRes.stdout.includes('Linux evcyber 6.8.0-evcyber-lfhp'), 'uname kernel details');

  cmdRes = await exec.execute('ps aux');
  assert(cmdRes.stdout.includes('bash') && cmdRes.stdout.includes('/sbin/init'), 'ps aux simulated processes');

  // -------------------------------------------------------------
  // 4. Cyber Networking Engine
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Cyber Network Simulator (ip, ifconfig, DNS, HTTP, Port Scanner, Ping) ---');
  cmdRes = await exec.execute('ip a');
  assert(cmdRes.stdout.includes('10.10.10.100/24') && cmdRes.stdout.includes('eth0'), 'ip a network interface');

  cmdRes = await exec.execute('ifconfig');
  assert(cmdRes.stdout.includes('255.255.255.0') && cmdRes.stdout.includes('RX packets'), 'ifconfig interface statistics');

  // DNS Engine
  const dnsA = DnsEngine.resolve('bank.local', 'A');
  assert(dnsA.length > 0 && dnsA[0].value === '10.10.10.10', 'DnsEngine resolves bank.local to 10.10.10.10');

  const dnsMx = DnsEngine.resolve('evcyber.academy', 'MX');
  assert(dnsMx.length > 0 && dnsMx[0].value.includes('mail'), 'DnsEngine resolves MX records for evcyber.academy');

  // HTTP Simulator
  const httpRes = HttpSimulator.request('http://bank.local/robots.txt', { method: 'GET' });
  assert(httpRes.status === 200 && httpRes.body.includes('Disallow'), 'HttpSimulator GET /robots.txt returns 200 OK');

  const httpPost = HttpSimulator.request('http://bank.local/api/transfer', { 
    method: 'POST', 
    body: JSON.stringify({ to: 'attacker', amount: '1000' }) 
  });
  assert(httpPost.status === 200, 'HttpSimulator POST /api/transfer returns 200');

  // Port Scanner
  const scanRes = PortScannerEngine.scan({ target: '10.10.10.10', ports: '22,80,443' });
  assert(scanRes.output.includes('80/tcp') && scanRes.output.includes('open'), 'PortScannerEngine detects open ports 80 & 443');

  // Ping Command
  cmdRes = await exec.execute('ping -c 2 10.10.10.10');
  assert(cmdRes.stdout.includes('bytes from 10.10.10.10') && cmdRes.stdout.includes('0% packet loss'), 'ping simulation with latency stats');

  // Nmap Command
  cmdRes = await exec.execute('nmap -p 80,443 10.10.10.10');
  assert(cmdRes.stdout.includes('80/tcp') && cmdRes.stdout.includes('open') && cmdRes.stdout.includes('443/tcp'), 'nmap port reconnaissance');

  // -------------------------------------------------------------
  // 5. Virtual Bash Scripting Engine & Interactive I/O
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Virtual Bash Scripting Engine & Interactive I/O ---');
  
  // Arithmetic Expansion
  cmdRes = await exec.execute('echo $(( (15 + 5) * 3 ))');
  assert(cmdRes.stdout.trim() === '60', 'Arithmetic expansion with parentheses $(( (15 + 5) * 3 ))');

  // Command Substitution
  cmdRes = await exec.execute('echo "Today is $(pwd)"');
  assert(cmdRes.stdout.trim() === 'Today is /home/student', 'Command substitution $(pwd)');

  // Compound pipeline & variable assignment
  cmdRes = await exec.execute('SERVER=vulnlab.local; PORT=8080; echo "Connecting to $SERVER on $PORT"');
  assert(cmdRes.stdout.trim() === 'Connecting to vulnlab.local on 8080', 'Compound variable assignments & expansions');

  // Full bash script with loop and conditionals
  const complexScript = `#!/bin/bash
TOTAL=0
for val in 10 20 30; do
  (( TOTAL = TOTAL + val ))
done

if [ $TOTAL -eq 60 ]; then
  echo "AUDIT_RESULT: SUCCESS (Total = $TOTAL)"
else
  echo "AUDIT_RESULT: FAIL"
fi
`;
  vfs.writeFile('/home/student/audit_calc.sh', complexScript, 'student');
  vfs.chmod('/home/student/audit_calc.sh', '755');

  cmdRes = await exec.execute('bash /home/student/audit_calc.sh');
  assert(cmdRes.stdout.includes('AUDIT_RESULT: SUCCESS (Total = 60)'), 'Script execution: loops, arithmetic commands & conditionals');

  // Interactive Read & Resumption
  const interactiveScript = `#!/bin/bash
read -p "Enter Secret Code: " CODE
echo "Code received: $CODE"
read -s -p "Enter Passkey: " PASS
echo "Passkey processed: $PASS"
`;
  vfs.writeFile('/home/student/interactive_auth.sh', interactiveScript, 'student');
  let intRes = await exec.execute('bash /home/student/interactive_auth.sh');
  assert(intRes.interactivePrompt?.prompt === 'Enter Secret Code: ', 'Interactive read pause 1 captured');

  intRes = await exec.resumeScript('ALPHA-77', intRes.interactivePrompt);
  assert(intRes.interactivePrompt?.isSilent === true, 'Interactive silent password prompt captured');

  intRes = await exec.resumeScript('PASS_SECRET_999', intRes.interactivePrompt);
  assert(intRes.stdout.includes('Code received: ALPHA-77') && intRes.stdout.includes('Passkey processed: PASS_SECRET_999'), 'Interactive read complete script resumption');

  // -------------------------------------------------------------
  // 6. AI Mentor Chatbot Q&A Database Audit
  // -------------------------------------------------------------
  console.log('\n--- 6. Auditing AI Cyber Mentor Q&A Database ---');
  assert(FRONTEND_QA_DATABASE.length >= 100, `Chatbot database contains ${FRONTEND_QA_DATABASE.length} questions (>= 100 required)`);
  
  const categories = new Set(FRONTEND_QA_DATABASE.map(q => q.category));
  assert(categories.has('LFHP Linux Commands') && categories.has('LFHP Networking & Recon') && categories.has('Frontend Security'), 'Chatbot covers core LFHP & Cyber categories');

  const validEntries = FRONTEND_QA_DATABASE.every(q => q.id && q.question && q.shortAnswer && q.detailedAnswer && q.tags?.length > 0);
  assert(validEntries, 'All 100+ Chatbot entries have valid ID, question, short/detailed answers, and tags');

  // -------------------------------------------------------------
  // 7. LFHP Lab Curriculum Audit
  // -------------------------------------------------------------
  console.log('\n--- 7. Auditing LFHP Interactive Lab Curriculum ---');
  assert(LFHP_CURRICULUM.length === 12, `Lab curriculum contains ${LFHP_CURRICULUM.length} complete modules`);
  
  let totalTasks = 0;
  LFHP_CURRICULUM.forEach(mod => { totalTasks += mod.tasks.length; });
  assert(totalTasks >= 30, `Total interactive lab tasks: ${totalTasks} across 12 modules`);

  // -------------------------------------------------------------
  // 8. Brand & Logo Assets Verification
  // -------------------------------------------------------------
  console.log('\n--- 8. Verifying Brand Logo Assets on Disk ---');
  const publicDir = path.join(__dirname, '../public');
  const companyLogoExists = fs.existsSync(path.join(publicDir, 'company-logo.jpg'));
  const lfhpLogoExists = fs.existsSync(path.join(publicDir, 'lfhp-logo.png'));
  const legacyLogoExists = fs.existsSync(path.join(publicDir, 'logo.png'));

  assert(companyLogoExists, 'EV Cyber Academy company logo exists (public/company-logo.jpg)');
  assert(lfhpLogoExists, 'LFHP Course logo exists (public/lfhp-logo.png)');
  assert(legacyLogoExists, 'Universal fallback logo exists (public/logo.png)');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` AUDIT COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log(' ALL CORE ENGINES & FEATURES ARE OPERATIONAL AND FULLY VERIFIED!');
  console.log('================================================================\n');
}

performFullEngineAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
