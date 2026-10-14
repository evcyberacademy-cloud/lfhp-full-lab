import { VFSEngine } from '../src/lib/vfs/vfs-engine';
import { createInitialVFS } from '../src/lib/vfs/vfs-init';
import { CommandExecutor } from '../src/lib/terminal/executor';

async function runTests() {
  console.log('--- Starting Virtual Bash Engine Tests ---');
  const vfs = new VFSEngine(createInitialVFS(), 'student');
  const exec = new CommandExecutor(vfs);

  // 1. Basic echo and pwd
  let res = await exec.execute('pwd');
  console.log('1. pwd ->', res.stdout.trim());
  if (res.stdout.trim() !== '/home/student') throw new Error('pwd failed');

  res = await exec.execute('echo "Hello EV Cyber Academy"');
  console.log('2. echo string ->', res.stdout.trim());
  if (res.stdout.trim() !== 'Hello EV Cyber Academy') throw new Error('echo failed');

  // 2. Variable assignments & expansions
  res = await exec.execute('NAME=Antigravity; echo "Hello $NAME"');
  console.log('3. variable assignment ->', res.stdout.trim());
  if (res.stdout.trim() !== 'Hello Antigravity') throw new Error('var assignment failed');

  // 3. Network commands: ip and ifconfig
  res = await exec.execute('ip a');
  console.log('4. ip a has eth0 ->', res.stdout.includes('eth0'));
  if (!res.stdout.includes('10.10.10.100')) throw new Error('ip a failed');

  res = await exec.execute('ifconfig');
  console.log('5. ifconfig has eth0 ->', res.stdout.includes('eth0'));
  if (!res.stdout.includes('255.255.255.0')) throw new Error('ifconfig failed');

  // 4. Arithmetic expansion
  res = await exec.execute('echo $(( 10 + 25 * 2 ))');
  console.log('6. arithmetic expansion ->', res.stdout.trim());
  if (res.stdout.trim() !== '60') throw new Error('arithmetic failed');

  // 5. Command substitution
  res = await exec.execute('echo "Current directory is $(pwd)"');
  console.log('7. command substitution ->', res.stdout.trim());
  if (res.stdout.trim() !== 'Current directory is /home/student') throw new Error('cmd substitution failed');

  // 6. Creating and running a bash script
  const scriptContent = `#!/bin/bash
# Test Script
TITLE="Cyber Lab"
echo "Starting $TITLE..."
for port in 21 22 80 443; do
  echo "Scanning port $port..."
done

if [ "$TITLE" = "Cyber Lab" ]; then
  echo "Status: Active"
else
  echo "Status: Inactive"
fi
`;
  vfs.writeFile('/home/student/scan.sh', scriptContent, 'student');
  vfs.chmod('/home/student/scan.sh', '755');

  res = await exec.execute('bash /home/student/scan.sh');
  console.log('8. bash script output:\n' + res.stdout);
  if (!res.stdout.includes('Scanning port 443') || !res.stdout.includes('Status: Active')) {
    throw new Error('Script execution failed');
  }

  // 7. Interactive read test
  const interactiveScript = `#!/bin/bash
read -p "Enter target IP: " TARGET_IP
echo "Pinging target $TARGET_IP"
read -s -p "Enter auth token: " TOKEN
echo "Token received: $TOKEN"
`;
  vfs.writeFile('/home/student/interactive.sh', interactiveScript, 'student');
  res = await exec.execute('bash /home/student/interactive.sh');
  console.log('9. interactive read pause 1 -> prompt:', res.interactivePrompt?.prompt);
  if (!res.interactivePrompt || res.interactivePrompt.prompt !== 'Enter target IP: ') {
    throw new Error('Interactive read prompt 1 failed');
  }

  // Resume with target IP
  res = await exec.resumeScript('10.10.10.50', res.interactivePrompt);
  console.log('10. interactive read pause 2 (silent) -> prompt:', res.interactivePrompt?.prompt, 'silent:', res.interactivePrompt?.isSilent);
  if (!res.interactivePrompt || res.interactivePrompt.isSilent !== true) {
    throw new Error('Interactive read prompt 2 failed');
  }

  // Resume with token
  res = await exec.resumeScript('SECRET_PASS_999', res.interactivePrompt);
  console.log('11. script final output:\n' + res.stdout);
  if (!res.stdout.includes('Pinging target 10.10.10.50') || !res.stdout.includes('Token received: SECRET_PASS_999')) {
    throw new Error('Script resumption failed');
  }

  console.log('--- ALL VIRTUAL BASH ENGINE TESTS PASSED! ---');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
