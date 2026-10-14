import { VFSNode, VFSState } from '@/types/vfs';

export function createInitialVFS(): VFSState {
  const nodes: Record<string, VFSNode> = {};
  const now = Date.now();

  function addDir(id: string, name: string, parentId: string | null, path: string, mode = 0o755, owner = 'root', group = 'root'): VFSNode {
    const node: VFSNode = {
      id,
      name,
      type: 'directory',
      parentId,
      path,
      content: '',
      size: 4096,
      mode,
      owner,
      group,
      createdAt: now,
      modifiedAt: now,
    };
    nodes[id] = node;
    return node;
  }

  function addFile(id: string, name: string, parentId: string, path: string, content: string, mode = 0o644, owner = 'root', group = 'root', isLocked = false, isProc = false): VFSNode {
    const node: VFSNode = {
      id,
      name,
      type: 'file',
      parentId,
      path,
      content,
      size: content.length,
      mode,
      owner,
      group,
      createdAt: now,
      modifiedAt: now,
      isLocked,
      isProc,
    };
    nodes[id] = node;
    return node;
  }

  // Root Directory
  addDir('root_dir', '/', null, '/', 0o755, 'root', 'root');

  // Standard POSIX Top-Level Directories
  addDir('bin_dir', 'bin', 'root_dir', '/bin', 0o755, 'root', 'root');
  addDir('boot_dir', 'boot', 'root_dir', '/boot', 0o755, 'root', 'root');
  addDir('dev_dir', 'dev', 'root_dir', '/dev', 0o755, 'root', 'root');
  addDir('etc_dir', 'etc', 'root_dir', '/etc', 0o755, 'root', 'root');
  addDir('home_dir', 'home', 'root_dir', '/home', 0o755, 'root', 'root');
  addDir('lib_dir', 'lib', 'root_dir', '/lib', 0o755, 'root', 'root');
  addDir('media_dir', 'media', 'root_dir', '/media', 0o755, 'root', 'root');
  addDir('mnt_dir', 'mnt', 'root_dir', '/mnt', 0o755, 'root', 'root');
  addDir('opt_dir', 'opt', 'root_dir', '/opt', 0o755, 'root', 'root');
  addDir('proc_dir', 'proc', 'root_dir', '/proc', 0o555, 'root', 'root');
  addDir('root_user_dir', 'root', 'root_dir', '/root', 0o700, 'root', 'root');
  addDir('tmp_dir', 'tmp', 'root_dir', '/tmp', 0o777, 'root', 'root');
  addDir('usr_dir', 'usr', 'root_dir', '/usr', 0o755, 'root', 'root');
  addDir('var_dir', 'var', 'root_dir', '/var', 0o755, 'root', 'root');

  // Subdirectories
  addDir('student_home', 'student', 'home_dir', '/home/student', 0o755, 'student', 'student');
  addDir('desktop_dir', 'Desktop', 'student_home', '/home/student/Desktop', 0o755, 'student', 'student');
  addDir('documents_dir', 'Documents', 'student_home', '/home/student/Documents', 0o755, 'student', 'student');
  addDir('downloads_dir', 'Downloads', 'student_home', '/home/student/Downloads', 0o755, 'student', 'student');
  addDir('labs_dir', 'labs', 'student_home', '/home/student/labs', 0o755, 'student', 'student');

  addDir('etc_network_dir', 'network', 'etc_dir', '/etc/network', 0o755, 'root', 'root');
  addDir('usr_bin_dir', 'bin', 'usr_dir', '/usr/bin', 0o755, 'root', 'root');
  addDir('usr_share_dir', 'share', 'usr_dir', '/usr/share', 0o755, 'root', 'root');
  addDir('var_log_dir', 'log', 'var_dir', '/var/log', 0o755, 'root', 'root');
  addDir('var_www_dir', 'www', 'var_dir', '/var/www', 0o755, 'root', 'root');
  addDir('var_www_html_dir', 'html', 'var_www_dir', '/var/www/html', 0o755, 'www-data', 'www-data');

  // Realistic System Files in /etc
  addFile(
    'etc_passwd',
    'passwd',
    'etc_dir',
    '/etc/passwd',
    `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nsync:x:4:65534:sync:/bin:/bin/sync\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nsyslog:x:104:110::/home/syslog:/usr/sbin/nologin\nstudent:x:1000:1000:LFHP Student:/home/student:/bin/bash\nadmin:x:1001:1001:Cyber Admin:/home/admin:/bin/bash\nservice_bot:x:1002:1002:Internal Service:/opt/bot:/bin/sh\n`,
    0o644,
    'root',
    'root'
  );

  addFile(
    'etc_shadow',
    'shadow',
    'etc_dir',
    '/etc/shadow',
    `root:$6$Xk82$9Lq9Xf7q.xV5K91kE8yM1...:19500:0:99999:7:::\nstudent:$6$EV2026$8Jk2sK...:19500:0:99999:7:::\nadmin:$6$AdM1n$9K2bV...:19500:0:99999:7:::\n`,
    0o600,
    'root',
    'shadow'
  );

  addFile(
    'etc_group',
    'group',
    'etc_dir',
    '/etc/group',
    `root:x:0:\ndaemon:x:1:\nadm:x:4:syslog,student\nsudo:x:27:student\nwww-data:x:33:\nstudent:x:1000:\nadmin:x:1001:\n`,
    0o644,
    'root',
    'root'
  );

  addFile(
    'etc_hosts',
    'hosts',
    'etc_dir',
    '/etc/hosts',
    `127.0.0.1\tlocalhost evcyber\n127.0.1.1\tevcyber.local\n10.10.10.1\tgateway.evcyber.local router\n10.10.10.10\tbank.local target-web\n10.10.10.20\tdatabase.evcyber.internal\n10.10.10.53\tdns.evcyber.local\n`,
    0o644,
    'root',
    'root'
  );

  addFile(
    'etc_resolv_conf',
    'resolv.conf',
    'etc_dir',
    '/etc/resolv.conf',
    `# Dynamic resolv.conf managed by EV-Cyber NetworkManager\nnameserver 10.10.10.53\nnameserver 1.1.1.1\nsearch evcyber.internal\n`,
    0o644,
    'root',
    'root'
  );

  addFile(
    'etc_os_release',
    'os-release',
    'etc_dir',
    '/etc/os-release',
    `NAME="EV Cyber Linux"\nVERSION="2026.1 (LFHP Edition)"\nID=evcyber\nID_LIKE=debian\nPRETTY_NAME="EV Cyber Academy Linux v2026 (LFHP)"\nVERSION_ID="2026.1"\nHOME_URL="https://evcyber.academy"\nSUPPORT_URL="https://evcyber.academy/lfhp"\n`,
    0o644,
    'root',
    'root'
  );

  addFile(
    'etc_motd',
    'motd',
    'etc_dir',
    '/etc/motd',
    `======================================================\n   WELCOME TO EV CYBER-LABS - LFHP EDITION\n       EV CYBER ACADEMY LEARNING ENVIRONMENT\n======================================================\n* Learn the Fundamentals of Hacking Program\n* Virtual Terminal & Network Sandbox\n* Type 'man' or open Lab Center to get started.\n`,
    0o644,
    'root',
    'root'
  );

  addFile(
    'etc_sudoers',
    'sudoers',
    'etc_dir',
    '/etc/sudoers',
    `# /etc/sudoers\nroot\tALL=(ALL:ALL) ALL\n%admin\tALL=(ALL:ALL) ALL\n%sudo\tALL=(ALL:ALL) ALL\nstudent\tALL=(ALL:ALL) ALL\n`,
    0o440,
    'root',
    'root'
  );

  addFile(
    'etc_network_interfaces',
    'interfaces',
    'etc_network_dir',
    '/etc/network/interfaces',
    `auto lo\niface lo inet loopback\n\nauto eth0\niface eth0 inet static\n    address 10.10.10.100\n    netmask 255.255.255.0\n    gateway 10.10.10.1\n`,
    0o644,
    'root',
    'root'
  );

  // Dynamic /proc files
  addFile(
    'proc_cpuinfo',
    'cpuinfo',
    'proc_dir',
    '/proc/cpuinfo',
    `processor\t: 0\nvendor_id\t: EVCyberSilicon\ncpu family\t: 6\nmodel name\t: EV Virtual Cyber Processor v4 @ 3.80GHz\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss ht syscall nx lm constant_tsc rep_good nopl xtopology cpuid aes xsave avx hypervisor\n`,
    0o444,
    'root',
    'root',
    false,
    true
  );

  addFile(
    'proc_meminfo',
    'meminfo',
    'proc_dir',
    '/proc/meminfo',
    `MemTotal:        8192000 kB\nMemFree:         4892400 kB\nMemAvailable:    5981200 kB\nBuffers:          210400 kB\nCached:          1876000 kB\nSwapTotal:       2097148 kB\nSwapFree:        2097148 kB\n`,
    0o444,
    'root',
    'root',
    false,
    true
  );

  addFile(
    'proc_version',
    'version',
    'proc_dir',
    '/proc/version',
    `Linux version 6.8.0-evcyber-lfhp (build@evcyber.academy) (gcc version 13.2.0) #1 SMP PREEMPT_DYNAMIC EV Cyber Labs 2026\n`,
    0o444,
    'root',
    'root',
    false,
    true
  );

  addFile(
    'proc_uptime',
    'uptime',
    'proc_dir',
    '/proc/uptime',
    `3642.12 7210.45\n`,
    0o444,
    'root',
    'root',
    false,
    true
  );

  // Files in /var/log for text-processing and cyber investigation labs
  addFile(
    'var_log_syslog',
    'syslog',
    'var_log_dir',
    '/var/log/syslog',
    `Sep 10 10:00:01 evcyber systemd[1]: Starting Daily apt download activities...\nSep 10 10:00:05 evcyber systemd[1]: apt-daily.service: Deactivated successfully.\nSep 10 10:14:22 evcyber kernel: [    0.000000] Linux version 6.8.0-evcyber-lfhp\nSep 10 10:14:23 evcyber systemd[1]: Mounted /var/log.\nSep 10 10:15:00 evcyber cron[420]: (CRON) STARTUP (fork ok)\nSep 10 10:20:11 evcyber sshd[1204]: Server listening on 0.0.0.0 port 22.\nSep 10 10:20:11 evcyber sshd[1204]: Server listening on :: port 22.\nSep 10 10:35:19 evcyber nginx[1410]: [notice] 1410#1410: start worker processes\nSep 10 10:42:01 evcyber systemd[1]: Started EV Cyber Lab Environment Services.\n`,
    0o644,
    'root',
    'adm'
  );

  addFile(
    'var_log_auth',
    'auth.log',
    'var_log_dir',
    '/var/log/auth.log',
    `Sep 10 10:22:01 evcyber sshd[1840]: Failed password for invalid user admin from 192.168.1.45 port 49210 ssh2\nSep 10 10:22:04 evcyber sshd[1842]: Failed password for invalid user root from 192.168.1.45 port 49214 ssh2\nSep 10 10:22:07 evcyber sshd[1845]: Failed password for invalid user oracle from 192.168.1.45 port 49218 ssh2\nSep 10 10:22:10 evcyber sshd[1848]: Failed password for invalid user guest from 192.168.1.45 port 49222 ssh2\nSep 10 10:22:15 evcyber sshd[1850]: Failed password for student from 192.168.1.45 port 49226 ssh2\nSep 10 10:23:01 evcyber sshd[1860]: Accepted password for student from 10.10.10.100 port 51230 ssh2\nSep 10 10:23:01 evcyber sshd[1860]: pam_unix(sshd:session): session opened for user student by (uid=0)\nSep 10 10:24:12 evcyber sudo: student : TTY=pts/0 ; PWD=/home/student ; USER=root ; COMMAND=/bin/cat /etc/shadow\n`,
    0o640,
    'root',
    'adm'
  );

  // Web server mock files
  addFile(
    'var_www_html_index',
    'index.html',
    'var_www_html_dir',
    '/var/www/html/index.html',
    `<!DOCTYPE html>\n<html>\n<head><title>EV Cyber Academy Internal Web Portal</title></head>\n<body style="font-family: sans-serif; background: #0b101b; color: #00f0ff; padding: 2rem;">\n  <h1>EV CYBER-LABS Local Gateway</h1>\n  <p>Learn the Fundamentals of Hacking Program (LFHP)</p>\n  <p>Simulated web server running on port 80.</p>\n</body>\n</html>\n`,
    0o644,
    'www-data',
    'www-data'
  );

  // Student Home Directory Files
  addFile(
    'student_bashrc',
    '.bashrc',
    'student_home',
    '/home/student/.bashrc',
    `# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PS1='\\[\\033[01;32m\\]student@evcyber\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '\nalias ll='ls -la'\nalias la='ls -A'\nalias l='ls -CF'\nalias grep='grep --color=auto'\n`,
    0o644,
    'student',
    'student'
  );

  addFile(
    'student_bash_history',
    '.bash_history',
    'student_home',
    '/home/student/.bash_history',
    `whoami\npwd\nls -la\ncat /etc/os-release\n`,
    0o600,
    'student',
    'student'
  );

  addFile(
    'student_notes',
    'notes.txt',
    'student_home',
    '/home/student/notes.txt',
    `EV CYBER ACADEMY - LFHP Student Quick Guide:\n\n1. Use the 'man' command (e.g. 'man ls' or 'man grep') for command syntax.\n2. Open the 'Lab Center' app from the dock or launcher to view interactive tasks.\n3. All your terminal changes, created files, and lab progress are saved automatically in your browser.\n4. Type 'nano <filename>' to open the in-terminal text editor.\n`,
    0o644,
    'student',
    'student'
  );

  addFile(
    'student_flag',
    'flag.txt',
    'student_home',
    '/home/student/flag.txt',
    `LFHP{ev_cyber_linux_fundamentals_mastery_2026}\n`,
    0o640,
    'student',
    'student'
  );

  addFile(
    'desktop_readme',
    'WELCOME_STUDENT.txt',
    'desktop_dir',
    '/home/student/Desktop/WELCOME_STUDENT.txt',
    `Welcome to EV Cyber-Labs!\n\nThis is your personal Linux workspace for the LFHP course.\nFeel free to explore the filesystem, run networking commands, and solve the interactive labs.\n`,
    0o644,
    'student',
    'student'
  );

  // Mock binaries in /bin to make which/whereis work authentically
  const binCommands = [
    'pwd', 'ls', 'cd', 'mkdir', 'rmdir', 'touch', 'cat', 'head', 'tail', 'cp', 'mv', 'rm',
    'clear', 'echo', 'printf', 'grep', 'find', 'which', 'whereis', 'file', 'stat', 'wc',
    'sort', 'uniq', 'cut', 'awk', 'sed', 'less', 'more', 'nano', 'chmod', 'chown', 'whoami',
    'id', 'ps', 'top', 'kill', 'uname', 'hostname', 'env', 'export', 'history', 'man',
    'ip', 'ifconfig', 'ping', 'traceroute', 'tracepath', 'nslookup', 'dig', 'host', 'curl',
    'wget', 'ss', 'netstat', 'arp', 'route', 'nmap', 'bash', 'sh', 'date', 'uptime', 'su', 'sudo'
  ];

  binCommands.forEach(cmd => {
    addFile(
      `bin_${cmd}`,
      cmd,
      'bin_dir',
      `/bin/${cmd}`,
      `#!/bin/sh\n# EV Cyber Virtual Binary for ${cmd}\n`,
      0o755,
      'root',
      'root',
      true
    );
  });

  return {
    nodes,
    rootId: 'root_dir',
    currentDirectory: '/home/student',
    version: 1,
  };
}
