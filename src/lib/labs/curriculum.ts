import { LabModule } from '@/types/labs';

export const LFHP_CURRICULUM: LabModule[] = [
  {
    id: 'lab-01-basics',
    number: 1,
    title: 'Linux Terminal Basics',
    category: 'linux-basics',
    summary: 'Master fundamental terminal navigation and identity verification in the Linux shell.',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    learningObjectives: [
      'Identify current user and effective privileges',
      'Determine system architecture and Linux kernel release',
      'Verify the current working directory'
    ],
    tasks: [
      {
        id: 't01-01',
        title: 'Check Current User Identity',
        description: 'Before executing operations in a Linux terminal, identify your current username.',
        objective: 'Execute the command to print your effective username.',
        expectedOutcome: 'Command output displays "student"',
        hints: [
          'The command asks "who am I" in a single word without spaces.',
          'Type `whoami` and press Enter.'
        ],
        solutionExplanation: 'The `whoami` command prints the effective user ID of the current shell session.',
        validationType: 'command_execution',
        points: 10,
        validator: (ctx) => {
          return ctx.lastCommand?.trim().startsWith('whoami') || ctx.commandHistory.some(c => c.trim().startsWith('whoami'));
        },
      },
      {
        id: 't01-02',
        title: 'Print Current Working Directory',
        description: 'Verify where you are currently located in the virtual filesystem hierarchy.',
        objective: 'Print the absolute path of your current directory.',
        expectedOutcome: 'Command displays "/home/student"',
        hints: [
          'PWD stands for "Print Working Directory".',
          'Run `pwd` in the terminal.'
        ],
        solutionExplanation: 'The `pwd` utility outputs the full path of the working directory from the root `/`.',
        validationType: 'command_execution',
        points: 10,
        validator: (ctx) => {
          return ctx.lastCommand?.trim() === 'pwd' || ctx.commandHistory.includes('pwd');
        },
      },
      {
        id: 't01-03',
        title: 'Inspect Kernel & OS Release',
        description: 'Query kernel and system details to understand your environment architecture.',
        objective: 'Execute uname with the all-information flag.',
        expectedOutcome: 'Displays Linux kernel release, hostname, and architecture.',
        hints: [
          'The flag for all system information is `-a`.',
          'Run `uname -a`.'
        ],
        solutionExplanation: '`uname -a` prints all system information including kernel name, network node hostname, release, version, and hardware platform.',
        validationType: 'command_execution',
        points: 10,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.trim() === 'uname -a' || c.trim() === 'uname --all');
        },
      },
    ],
  },
  {
    id: 'lab-02-filesystem',
    number: 2,
    title: 'Filesystem Hierarchy & Navigation',
    category: 'filesystem',
    summary: 'Explore Linux standard directories (/etc, /var/log, /proc) and understand absolute vs relative paths.',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    learningObjectives: [
      'Navigate to system configuration directories',
      'List all files including hidden dotfiles',
      'Understand absolute vs relative path notation'
    ],
    tasks: [
      {
        id: 't02-01',
        title: 'List All Files with Detailed Attributes',
        description: 'List all files in your home directory including hidden configuration dotfiles like `.bashrc`.',
        objective: 'Run a long listing command showing hidden files.',
        expectedOutcome: 'Files displayed with permissions, size, owner, and timestamp.',
        hints: [
          'Combine the long listing flag `-l` and all files flag `-a`.',
          'Run `ls -la` or `ls -l -a`.'
        ],
        solutionExplanation: '`ls -la` combines `-l` (long listing format) and `-a` (do not ignore entries starting with `.`).',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => /ls\s+.*-(la|al|a.*l|l.*a)/.test(c) || c.trim() === 'ls -la' || c.trim() === 'll');
        },
      },
      {
        id: 't02-02',
        title: 'Navigate to System Configuration (/etc)',
        description: 'Change your working directory to the system configuration folder `/etc`.',
        objective: 'Change directory to `/etc`.',
        expectedOutcome: 'Current working directory becomes `/etc`.',
        hints: [
          'Use the `cd` command with the absolute path `/etc`.',
          'Run `cd /etc`.'
        ],
        solutionExplanation: '`/etc` contains core system configuration files such as `hosts`, `passwd`, and `resolv.conf`.',
        validationType: 'vfs_state',
        points: 15,
        validator: (ctx) => {
          return ctx.cwd === '/etc';
        },
      },
      {
        id: 't02-03',
        title: 'Inspect OS Version Release File',
        description: 'View the contents of `/etc/os-release` to verify the operating system details.',
        objective: 'Read `/etc/os-release` using `cat`.',
        expectedOutcome: 'Outputs EV Cyber Linux release information.',
        hints: [
          'Use `cat /etc/os-release` or `cat os-release` if currently in `/etc`.',
          'Run `cat /etc/os-release`.'
        ],
        solutionExplanation: '`/etc/os-release` contains operating system identification data in standard key-value pairs.',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('cat') && c.includes('os-release'));
        },
      },
    ],
  },
  {
    id: 'lab-03-file-management',
    number: 3,
    title: 'File & Directory Manipulation',
    category: 'filesystem',
    summary: 'Master directory creation, file generation, copying, moving, and deletion.',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    learningObjectives: [
      'Create nested directories with the parent flag',
      'Create new files using touch and redirection',
      'Safely copy and move files across the filesystem'
    ],
    tasks: [
      {
        id: 't03-01',
        title: 'Create Nested Lab Recon Directory',
        description: 'Create a nested directory structure `/home/student/labs/recon/targets` using a single command.',
        objective: 'Create `/home/student/labs/recon/targets`.',
        expectedOutcome: 'Directory `/home/student/labs/recon/targets` exists.',
        hints: [
          'The `-p` (parents) flag creates all necessary parent directories.',
          'Run `mkdir -p /home/student/labs/recon/targets` (or `mkdir -p ~/labs/recon/targets`).'
        ],
        solutionExplanation: '`mkdir -p` automatically creates missing parent directories without throwing errors.',
        validationType: 'vfs_state',
        points: 15,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/labs/recon/targets');
          return !!node && node.type === 'directory';
        },
      },
      {
        id: 't03-02',
        title: 'Create Target IP List File',
        description: 'Create a new file named `targets.txt` inside `/home/student/labs/recon/targets`.',
        objective: 'Create `/home/student/labs/recon/targets/targets.txt`.',
        expectedOutcome: 'The file `targets.txt` exists.',
        hints: [
          'Use the `touch` command.',
          'Run `touch /home/student/labs/recon/targets/targets.txt`.'
        ],
        solutionExplanation: '`touch` creates an empty file if it does not already exist or updates its timestamp if it does.',
        validationType: 'vfs_state',
        points: 15,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/labs/recon/targets/targets.txt');
          return !!node && node.type === 'file';
        },
      },
      {
        id: 't03-03',
        title: 'Copy Notes to Labs Directory',
        description: 'Copy the student `notes.txt` from `/home/student/notes.txt` into `/home/student/labs/notes_backup.txt`.',
        objective: 'Copy `notes.txt` to `labs/notes_backup.txt`.',
        expectedOutcome: 'File `/home/student/labs/notes_backup.txt` exists with content.',
        hints: [
          'Use the `cp` command: `cp <source> <destination>`.',
          'Run `cp /home/student/notes.txt /home/student/labs/notes_backup.txt`.'
        ],
        solutionExplanation: '`cp` creates an exact duplicate of a file at the target destination.',
        validationType: 'vfs_state',
        points: 15,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/labs/notes_backup.txt');
          return !!node && node.type === 'file' && node.size > 0;
        },
      },
    ],
  },
  {
    id: 'lab-04-permissions',
    number: 4,
    title: 'Permissions & Security Hardening',
    category: 'permissions',
    summary: 'Understand Linux file modes (rwx), octal representation (755, 644, 700), and chmod.',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    learningObjectives: [
      'Decode octal permission bits for User, Group, and Other',
      'Restrict sensitive files to owner-only read/write (600)',
      'Make penetration testing scripts executable (755 / +x)'
    ],
    tasks: [
      {
        id: 't04-01',
        title: 'Create a Recon Script',
        description: 'Create a shell script named `/home/student/scan.sh`.',
        objective: 'Create `/home/student/scan.sh` with content `echo "Scanning target..."`.',
        expectedOutcome: 'File exists with shell script content.',
        hints: [
          'Use echo redirection: `echo \'echo "Scanning target..."\' > /home/student/scan.sh`.',
          'Or run `touch /home/student/scan.sh`.'
        ],
        solutionExplanation: 'Standard shell scripts begin with commands to automate tasks.',
        validationType: 'vfs_state',
        points: 15,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/scan.sh');
          return !!node && node.type === 'file';
        },
      },
      {
        id: 't04-02',
        title: 'Grant Execute Permissions (755)',
        description: 'Change permissions on `/home/student/scan.sh` so the owner can read, write, and execute (rwx), while group and others can read and execute (r-x).',
        objective: 'Set mode 755 (or +x) on `/home/student/scan.sh`.',
        expectedOutcome: 'File permissions show `-rwxr-xr-x`.',
        hints: [
          'Use octal mode: `chmod 755 /home/student/scan.sh` or `chmod +x /home/student/scan.sh`.',
          'Run `chmod 755 /home/student/scan.sh`.'
        ],
        solutionExplanation: 'Octal 755 corresponds to rwxr-xr-x (User: 4+2+1=7, Group: 4+0+1=5, Other: 4+0+1=5).',
        validationType: 'vfs_state',
        points: 20,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/scan.sh');
          return !!node && (node.mode === 0o755 || (node.mode & 0o100) !== 0);
        },
      },
      {
        id: 't04-03',
        title: 'Secure Sensitive Flag File (600)',
        description: 'Harden `/home/student/flag.txt` so ONLY the owner (student) can read and write, removing all access from group and others.',
        objective: 'Set permissions of `/home/student/flag.txt` to `600` (`rw-------`).',
        expectedOutcome: 'File permissions show `-rw-------`.',
        hints: [
          '600 gives 4+2=6 (rw) to user, and 0 to group and other.',
          'Run `chmod 600 /home/student/flag.txt`.'
        ],
        solutionExplanation: 'Mode 600 ensures private cryptographic keys, passwords, and sensitive flags cannot be read by other local users.',
        validationType: 'vfs_state',
        points: 20,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/flag.txt');
          return !!node && node.mode === 0o600;
        },
      },
    ],
  },
  {
    id: 'lab-05-users-processes',
    number: 5,
    title: 'Users, Groups & Process Control',
    category: 'users-processes',
    summary: 'Analyze /etc/passwd user accounts, verify group memberships, and manage system processes.',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    learningObjectives: [
      'Parse account entries in /etc/passwd',
      'Inspect running processes with ps aux and top',
      'Understand user privilege tiers and group memberships'
    ],
    tasks: [
      {
        id: 't05-01',
        title: 'Inspect User Account Database',
        description: 'Read the contents of `/etc/passwd` to view all system and local user accounts.',
        objective: 'Display `/etc/passwd`.',
        expectedOutcome: 'Outputs account records showing username, UID, GID, home directory, and default shell.',
        hints: [
          'Use the `cat` command.',
          'Run `cat /etc/passwd`.'
        ],
        solutionExplanation: '`/etc/passwd` stores user account attributes in colon-separated format (username:password:UID:GID:gecos:home:shell).',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('cat') && c.includes('/etc/passwd'));
        },
      },
      {
        id: 't05-02',
        title: 'Inspect User ID and Group Memberships',
        description: 'Display your numeric user ID (UID), primary group ID (GID), and all supplementary groups.',
        objective: 'Execute the `id` command.',
        expectedOutcome: 'Shows `uid=1000(student) gid=1000(student) groups=...`',
        hints: [
          'Run the `id` command with no arguments.',
          'Type `id` and press Enter.'
        ],
        solutionExplanation: '`id` prints real and effective user and group identities for security auditing.',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.trim() === 'id' || c.trim().startsWith('id '));
        },
      },
      {
        id: 't05-03',
        title: 'List All Active System Processes',
        description: 'Generate a snapshot of all active processes across all users on the system.',
        objective: 'Run `ps aux`.',
        expectedOutcome: 'Displays PID, USER, CPU, MEMORY, and COMMAND for all processes.',
        hints: [
          'Use `ps` with `aux` flags.',
          'Run `ps aux`.'
        ],
        solutionExplanation: '`ps aux` (a=all with tty, u=user-oriented format, x=processes without tty) displays a comprehensive process table.',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.trim() === 'ps aux' || c.trim() === 'ps -aux');
        },
      },
    ],
  },
  {
    id: 'lab-06-redirection-pipes',
    number: 6,
    title: 'Shell Redirection & Pipelines',
    category: 'shell-scripting',
    summary: 'Harness standard output redirection (> and >>) and connect programs with pipelines (|).',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    learningObjectives: [
      'Redirect command output to overwrite files (>))',
      'Append data to existing logs without overwriting (>>))',
      'Chain multiple command outputs through pipes (|)'
    ],
    tasks: [
      {
        id: 't06-01',
        title: 'Redirect Hostname into Host File',
        description: 'Execute `hostname` and redirect its output to overwrite `/home/student/my_host.txt`.',
        objective: 'Create `/home/student/my_host.txt` containing the system hostname.',
        expectedOutcome: 'File contains `evcyber`.',
        hints: [
          'Use single greater-than `>` for overwrite redirection.',
          'Run `hostname > /home/student/my_host.txt` (or `hostname > my_host.txt`).'
        ],
        solutionExplanation: '`>` redirects standard output (stdout) to a file, creating it or overwriting existing content.',
        validationType: 'vfs_state',
        points: 20,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/my_host.txt');
          return !!node && node.content.trim() === 'evcyber';
        },
      },
      {
        id: 't06-02',
        title: 'Append Kernel Info to File',
        description: 'Append the kernel release (`uname -r`) to `/home/student/my_host.txt` without deleting the hostname.',
        objective: 'Append `uname -r` to `/home/student/my_host.txt`.',
        expectedOutcome: 'File contains both hostname and kernel version.',
        hints: [
          'Use double greater-than `>>` for append redirection.',
          'Run `uname -r >> /home/student/my_host.txt`.'
        ],
        solutionExplanation: '`>>` appends stdout to the end of a file without truncating existing content.',
        validationType: 'vfs_state',
        points: 20,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/my_host.txt');
          return !!node && node.content.includes('evcyber') && node.content.includes('6.8.0-evcyber-lfhp');
        },
      },
      {
        id: 't06-03',
        title: 'Filter User Accounts with a Pipe',
        description: 'Use a pipeline to send `/etc/passwd` into `grep` to extract only lines containing `student`.',
        objective: 'Run `cat /etc/passwd | grep student`.',
        expectedOutcome: 'Outputs the student user entry line.',
        hints: [
          'Use the pipe character `|` between `cat /etc/passwd` and `grep student`.',
          'Run `cat /etc/passwd | grep student`.'
        ],
        solutionExplanation: 'The pipe `|` redirects stdout from the left program into stdin of the right program.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('|') && c.includes('grep') && c.includes('student'));
        },
      },
    ],
  },
  {
    id: 'lab-07-text-processing',
    number: 7,
    title: 'Text Processing & Log Analysis',
    category: 'text-processing',
    summary: 'Investigate cyber attack logs in /var/log/auth.log using grep, cut, sort, and uniq.',
    difficulty: 'Advanced',
    estimatedMinutes: 25,
    learningObjectives: [
      'Extract security event records using grep filter expressions',
      'Isolate specific log fields with cut',
      'Aggregate attack frequency counts with sort and uniq -c'
    ],
    tasks: [
      {
        id: 't07-01',
        title: 'Search Authentication Log for Failed Logins',
        description: 'Analyze `/var/log/auth.log` and search for all occurrences of "Failed password".',
        objective: 'Run `grep -i "failed" /var/log/auth.log` or `cat /var/log/auth.log | grep Failed`.',
        expectedOutcome: 'Displays brute force SSH login attempt records.',
        hints: [
          'Use `grep "Failed" /var/log/auth.log` or `cat /var/log/auth.log | grep -i failed`.',
          'Run `grep "Failed" /var/log/auth.log`.'
        ],
        solutionExplanation: 'Searching auth logs for "Failed" reveals unauthorized login attempts and potential brute force attacks.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('grep') && (c.includes('Failed') || c.includes('failed')) && c.includes('auth.log'));
        },
      },
      {
        id: 't07-02',
        title: 'Extract Usernames from /etc/passwd',
        description: 'Extract only the 1st field (usernames) from `/etc/passwd` using the colon delimiter `:` and save the output to `/home/student/usernames.txt`.',
        objective: 'Create `/home/student/usernames.txt` containing usernames.',
        expectedOutcome: 'File contains list of system usernames (root, daemon, student, admin, etc.).',
        hints: [
          'Use `cut -d: -f1 /etc/passwd > /home/student/usernames.txt`.',
          'Run `cut -d: -f1 /etc/passwd > /home/student/usernames.txt`.'
        ],
        solutionExplanation: '`cut -d: -f1` splits each line by colon delimiter `:` and extracts the 1st field.',
        validationType: 'vfs_state',
        points: 25,
        validator: (ctx) => {
          const node = Object.values(ctx.vfs.nodes).find(n => n.path === '/home/student/usernames.txt');
          return !!node && node.content.includes('root') && node.content.includes('student');
        },
      },
    ],
  },
  {
    id: 'lab-08-networking',
    number: 8,
    title: 'Networking Fundamentals & Interfaces',
    category: 'networking',
    summary: 'Inspect network interfaces, IP addressing, default gateways, and test connectivity with ping.',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    learningObjectives: [
      'Inspect IP address configuration with ip addr and ifconfig',
      'Verify routing tables and default gateway routes',
      'Test ICMP connectivity to subnet targets'
    ],
    tasks: [
      {
        id: 't08-01',
        title: 'Inspect Network Interface Addresses',
        description: 'Display all network interfaces and assigned IPv4/IPv6 addresses.',
        objective: 'Run `ip a` (or `ip addr` / `ifconfig`).',
        expectedOutcome: 'Shows `eth0` with IP `10.10.10.100/24` and `lo` loopback interface.',
        hints: [
          'Run `ip a` or `ifconfig`.',
          'Type `ip a` and press Enter.'
        ],
        solutionExplanation: '`ip a` displays link status, MTU, MAC addresses, and assigned IP addresses for all network interfaces.',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.trim() === 'ip a' || c.trim() === 'ip addr' || c.trim() === 'ifconfig');
        },
      },
      {
        id: 't08-02',
        title: 'Ping the Default Gateway',
        description: 'Send 4 ICMP echo requests to the LFHP subnet gateway at `10.10.10.1`.',
        objective: 'Execute `ping -c 4 10.10.10.1`.',
        expectedOutcome: '4 packets transmitted, 4 received, 0% packet loss.',
        hints: [
          'Use `-c 4` to limit ping to 4 packets.',
          'Run `ping -c 4 10.10.10.1`.'
        ],
        solutionExplanation: '`ping -c 4` sends exactly 4 ICMP echo requests to test round-trip connectivity to the gateway.',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('ping') && c.includes('10.10.10.1'));
        },
      },
    ],
  },
  {
    id: 'lab-09-dns-recon',
    number: 9,
    title: 'DNS Reconnaissance & Resolution',
    category: 'dns-http',
    summary: 'Inspect /etc/hosts, /etc/resolv.conf, and perform DNS record queries with dig and nslookup.',
    difficulty: 'Intermediate',
    estimatedMinutes: 20,
    learningObjectives: [
      'Understand local static name resolution in /etc/hosts',
      'Query authoritative nameservers with dig',
      'Resolve A records and reverse lookups with nslookup'
    ],
    tasks: [
      {
        id: 't09-01',
        title: 'Inspect Static Hosts Mapping',
        description: 'View `/etc/hosts` to see statically mapped internal hostnames and IP addresses.',
        objective: 'Display `/etc/hosts`.',
        expectedOutcome: 'Shows mappings for `localhost`, `bank.local`, `database.evcyber.internal`.',
        hints: [
          'Use `cat /etc/hosts`.',
          'Run `cat /etc/hosts`.'
        ],
        solutionExplanation: '`/etc/hosts` provides local hostname-to-IP mappings before external DNS queries are made.',
        validationType: 'command_execution',
        points: 15,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('cat') && c.includes('/etc/hosts'));
        },
      },
      {
        id: 't09-02',
        title: 'Query DNS Records using Dig',
        description: 'Perform a DNS lookup for `bank.local` using the `dig` tool.',
        objective: 'Execute `dig bank.local`.',
        expectedOutcome: 'Displays DNS answer section pointing `bank.local` to `10.10.10.10`.',
        hints: [
          'Run `dig bank.local`.',
          'Type `dig bank.local` and press Enter.'
        ],
        solutionExplanation: '`dig` (Domain Information Groper) queries DNS name servers and returns detailed response sections.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('dig') && c.includes('bank.local'));
        },
      },
    ],
  },
  {
    id: 'lab-10-web-recon',
    number: 10,
    title: 'HTTP & Web Reconnaissance',
    category: 'dns-http',
    summary: 'Inspect HTTP response headers, status codes, and discover hidden endpoints using curl.',
    difficulty: 'Advanced',
    estimatedMinutes: 25,
    learningObjectives: [
      'Inspect HTTP response headers with curl -I',
      'Analyze robots.txt for hidden sensitive directories',
      'Uncover admin portal tokens and flags'
    ],
    tasks: [
      {
        id: 't10-01',
        title: 'Inspect Web Server HTTP Headers',
        description: 'Send an HTTP HEAD request to `http://bank.local` to inspect web server software headers.',
        objective: 'Run `curl -I http://bank.local`.',
        expectedOutcome: 'Displays `HTTP/1.1 200 OK`, `Server: Apache/2.4.52`, and header metadata.',
        hints: [
          'The `-I` or `--head` flag instructs curl to fetch headers only.',
          'Run `curl -I http://bank.local`.'
        ],
        solutionExplanation: '`curl -I` issues an HTTP HEAD request to reveal web server versions, cookies, and security headers.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('curl') && c.includes('-I') && c.includes('bank.local'));
        },
      },
      {
        id: 't10-02',
        title: 'Inspect Robots Exclusion File',
        description: 'Fetch `http://bank.local/robots.txt` using curl to uncover disallowed paths.',
        objective: 'Run `curl http://bank.local/robots.txt`.',
        expectedOutcome: 'Shows `Disallow: /admin` and internal paths.',
        hints: [
          'Use `curl http://bank.local/robots.txt`.',
          'Run `curl http://bank.local/robots.txt`.'
        ],
        solutionExplanation: '`robots.txt` frequently exposes hidden administrative endpoints and sensitive folders to security analysts.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('curl') && c.includes('robots.txt'));
        },
      },
      {
        id: 't10-03',
        title: 'Access Restricted Admin Portal',
        description: 'Fetch the hidden `/admin` endpoint identified from robots.txt.',
        objective: 'Run `curl http://bank.local/admin`.',
        expectedOutcome: 'Displays the Admin Console and uncovers flag `LFHP{web_recon_admin_portal_uncovered}`.',
        hints: [
          'Use `curl http://bank.local/admin`.',
          'Run `curl http://bank.local/admin`.'
        ],
        solutionExplanation: 'Unrestricted access to administrative consoles represents a critical access control vulnerability.',
        validationType: 'command_execution',
        points: 25,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('curl') && c.includes('bank.local/admin'));
        },
      },
    ],
  },
  {
    id: 'lab-11-port-scanning',
    number: 11,
    title: 'Port Scanning & Recon with Nmap',
    category: 'port-scanning',
    summary: 'Discover open ports, running services, and service versions across the target subnet using Nmap.',
    difficulty: 'Advanced',
    estimatedMinutes: 25,
    learningObjectives: [
      'Perform rapid port scans against target servers',
      'Enable service version detection (-sV)',
      'Scan entire subnets to map active network hosts'
    ],
    tasks: [
      {
        id: 't11-01',
        title: 'Scan Target Web Server with Nmap',
        description: 'Perform a port scan on target web server `10.10.10.10` to discover all open listening ports.',
        objective: 'Execute `nmap 10.10.10.10`.',
        expectedOutcome: 'Displays open ports: 22/tcp (ssh), 80/tcp (http), 443/tcp (ssl), 8080/tcp.',
        hints: [
          'Run `nmap 10.10.10.10` or `nmap bank.local`.',
          'Type `nmap 10.10.10.10` and press Enter.'
        ],
        solutionExplanation: '`nmap` probes target ports to determine if services are accepting connections.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('nmap') && (c.includes('10.10.10.10') || c.includes('bank.local')));
        },
      },
      {
        id: 't11-02',
        title: 'Detect Service Versions (-sV)',
        description: 'Scan `10.10.10.10` with service version detection enabled to identify exact software banners.',
        objective: 'Execute `nmap -sV 10.10.10.10`.',
        expectedOutcome: 'Displays exact software versions (e.g. Apache/2.4.52, OpenSSH 8.9p1).',
        hints: [
          'The `-sV` flag enables service version detection.',
          'Run `nmap -sV 10.10.10.10`.'
        ],
        solutionExplanation: '`-sV` probes open ports to determine service and application version numbers for vulnerability assessment.',
        validationType: 'command_execution',
        points: 25,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('nmap') && c.includes('-sV') && c.includes('10.10.10.10'));
        },
      },
      {
        id: 't11-03',
        title: 'Scan Database Target Node',
        description: 'Scan database server `10.10.10.20` with version detection to discover database services.',
        objective: 'Execute `nmap -sV 10.10.10.20`.',
        expectedOutcome: 'Discovers MySQL 8.0.35 on port 3306 and Redis on port 6379.',
        hints: [
          'Run `nmap -sV 10.10.10.20`.',
          'Type `nmap -sV 10.10.10.20` and press Enter.'
        ],
        solutionExplanation: 'Identifying exposed database ports like MySQL (3306) is a critical step in penetration testing reconnaissance.',
        validationType: 'command_execution',
        points: 25,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('nmap') && c.includes('10.10.10.20'));
        },
      },
    ],
  },
  {
    id: 'lab-12-bash-scripting',
    number: 12,
    title: 'Bash Shell Scripting & Automation',
    category: 'shell-scripting',
    summary: 'Write and execute shell scripts with loops, conditional logic, arithmetic, and interactive standard input.',
    difficulty: 'Advanced',
    estimatedMinutes: 25,
    learningObjectives: [
      'Write executable .sh bash script files',
      'Use variables, arithmetic expansions $((...)), and loops',
      'Capture interactive user input with read -p'
    ],
    tasks: [
      {
        id: 't12-01',
        title: 'Execute a Bash Shell Script',
        description: 'Run a bash script file using the `bash` interpreter or `./` syntax.',
        objective: 'Execute a script with `bash scan.sh` or create and run any `.sh` script.',
        expectedOutcome: 'Script executes and outputs results to terminal.',
        hints: [
          'Run `bash script.sh` or `sh script.sh`.',
          'Type `bash myscript.sh` and press Enter.'
        ],
        solutionExplanation: 'Bash scripts automate complex multistep Linux administrative and penetration testing tasks.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.startsWith('bash ') || c.startsWith('sh ') || c.startsWith('./') || c.endsWith('.sh'));
        },
      },
      {
        id: 't12-02',
        title: 'Evaluate Arithmetic in Bash',
        description: 'Use the `$(( ... ))` arithmetic expansion syntax to calculate values directly in the shell.',
        objective: 'Execute `echo $(( 10 + 20 ))` or any arithmetic expression.',
        expectedOutcome: 'Displays evaluated arithmetic result.',
        hints: [
          'Use `echo $(( 10 + 20 ))`.',
          'Run `echo $(( 100 * 2 ))`.'
        ],
        solutionExplanation: 'Arithmetic expansion `$(( expression ))` performs integer math operations in bash without external utilities.',
        validationType: 'command_execution',
        points: 20,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.includes('$((') || c.includes('expr '));
        },
      },
      {
        id: 't12-03',
        title: 'Interactive User Input with read',
        description: 'Prompt for interactive standard input from the student terminal using `read -p`.',
        objective: 'Execute `read -p "Enter Target: " TARGET` in the shell or within a script.',
        expectedOutcome: 'Terminal prompts for user input and sets variable.',
        hints: [
          'Use `read -p "Prompt: " VAR`.',
          'Run `read -p "Target IP: " ip`.'
        ],
        solutionExplanation: 'The `read` command pauses execution to accept interactive terminal input from the operator.',
        validationType: 'command_execution',
        points: 25,
        validator: (ctx) => {
          return ctx.commandHistory.some(c => c.startsWith('read ') || c.includes('read -p'));
        },
      },
    ],
  },
];
