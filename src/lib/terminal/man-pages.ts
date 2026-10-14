export const MAN_PAGES: Record<string, string> = {
  pwd: `NAME
       pwd - print name of current/working directory

SYNOPSIS
       pwd [OPTION]...

DESCRIPTION
       Print the full filename of the current working directory.

EXAMPLES
       pwd
              Display current directory path.`,

  ls: `NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List information about the FILEs (the current directory by default).
       Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

OPTIONS
       -a, --all
              do not ignore entries starting with .
       -l
              use a long listing format
       -h, --human-readable
              with -l and -s, print sizes like 1K 234M 2G etc.
       -R, --recursive
              list subdirectories recursively

EXAMPLES
       ls -la
              List all files with permissions, owner, and sizes.`,

  cd: `NAME
       cd - change the working directory

SYNOPSIS
       cd [dir]

DESCRIPTION
       Change the current directory to dir. The default DIR is the value of the HOME shell variable (/home/student).

EXAMPLES
       cd /var/log
       cd ..
       cd ~`,

  mkdir: `NAME
       mkdir - make directories

SYNOPSIS
       mkdir [OPTION]... DIRECTORY...

DESCRIPTION
       Create the DIRECTORY(ies), if they do not already exist.

OPTIONS
       -p, --parents
              no error if existing, make parent directories as needed

EXAMPLES
       mkdir -p /home/student/labs/recon`,

  rm: `NAME
       rm - remove files or directories

SYNOPSIS
       rm [OPTION]... [FILE]...

OPTIONS
       -r, -R, --recursive
              remove directories and their contents recursively
       -f, --force
              ignore nonexistent files and arguments, never prompt

EXAMPLES
       rm file.txt
       rm -rf old_folder`,

  cat: `NAME
       cat - concatenate files and print on the standard output

SYNOPSIS
       cat [OPTION]... [FILE]...

OPTIONS
       -n, --number
              number all output lines

EXAMPLES
       cat /etc/passwd
       cat /etc/hosts | grep bank`,

  grep: `NAME
       grep - print lines that match patterns

SYNOPSIS
       grep [OPTION]... PATTERNS [FILE]...

OPTIONS
       -i, --ignore-case
              ignore case distinctions in patterns and input data
       -v, --invert-match
              select non-matching lines
       -n, --line-number
              prefix each line of output with the 1-based line number
       -c, --count
              print only a count of selected lines

EXAMPLES
       grep "student" /etc/passwd
       cat /var/log/auth.log | grep -i "failed"`,

  chmod: `NAME
       chmod - change file mode bits

SYNOPSIS
       chmod [OPTION]... MODE[,MODE]... FILE...
       chmod [OPTION]... OCTAL-MODE FILE...

DESCRIPTION
       This manual page documents the GNU version of chmod. chmod changes the file mode bits of each given file.

OCTAL MODES
       755: rwxr-xr-x (User read/write/execute, Group/Others read/execute)
       644: rw-r--r-- (User read/write, Group/Others read only)
       700: rwx------ (User full access, others none)
       600: rw------- (User read/write only)

EXAMPLES
       chmod 755 script.sh
       chmod 600 secret.txt
       chmod +x tool.sh`,

  chown: `NAME
       chown - change file owner and group

SYNOPSIS
       chown [OPTION]... [OWNER][:[GROUP]] FILE...

EXAMPLES
       chown student:student file.txt
       sudo chown root:root /etc/config`,

  whoami: `NAME
       whoami - print effective userid

SYNOPSIS
       whoami

DESCRIPTION
       Print the user name associated with the current effective user ID.`,

  id: `NAME
       id - print real and effective user and group IDs

SYNOPSIS
       id [OPTION]... [USER]...`,

  ps: `NAME
       ps - report a snapshot of the current processes

SYNOPSIS
       ps [options]

EXAMPLES
       ps
       ps aux`,

  top: `NAME
       top - display Linux processes

SYNOPSIS
       top

DESCRIPTION
       The top program provides a dynamic real-time view of a running system.`,

  kill: `NAME
       kill - send a signal to a process

SYNOPSIS
       kill [-s sigspec | -n signum | -sigspec] pid | jobspec ...

EXAMPLES
       kill 1204
       kill -9 1840`,

  ip: `NAME
       ip - show / manipulate routing, network devices, interfaces and tunnels

SYNOPSIS
       ip [ OPTIONS ] OBJECT { COMMAND | help }
       where OBJECT := { link | address | addr | route | neigh }

EXAMPLES
       ip a
       ip addr show
       ip route show`,

  ifconfig: `NAME
       ifconfig - configure a network interface

SYNOPSIS
       ifconfig [-a] [-v] [-s] <interface> [[<AF>] <address>]`,

  ping: `NAME
       ping - send ICMP ECHO_REQUEST to network hosts

SYNOPSIS
       ping [-c count] destination

EXAMPLES
       ping 10.10.10.1
       ping -c 4 bank.local`,

  nmap: `NAME
       nmap - Network exploration tool and security / port scanner

SYNOPSIS
       nmap [Scan Type...] [Options] {target specification}

OPTIONS
       -sS (TCP SYN scan)
       -sV (Version detection)
       -p <port ranges> (Only scan specified ports e.g. -p 80,443 or -p-)
       -A (Enable OS detection, version detection, script scanning, and traceroute)

EXAMPLES
       nmap 10.10.10.10
       nmap -sV -p 80,443 bank.local
       nmap -A 10.10.10.0/24`,

  curl: `NAME
       curl - transfer a URL

SYNOPSIS
       curl [options / URLs]

OPTIONS
       -I, --head
              Fetch the headers only
       -v, --verbose
              Make the operation more talkative
       -s, --silent
              Silent or quiet mode
       -X, --request <command>
              Specify request command to use (GET, POST, etc.)

EXAMPLES
       curl http://bank.local
       curl -I http://bank.local/robots.txt
       curl http://10.10.10.10/api/v1/user`,

  dig: `NAME
       dig - DNS lookup utility

SYNOPSIS
       dig [@server] [-p port] [name] [type]

EXAMPLES
       dig bank.local
       dig evcyber.academy ANY`,

  nslookup: `NAME
       nslookup - query Internet name servers interactively

SYNOPSIS
       nslookup [host] [server]

EXAMPLES
       nslookup bank.local
       nslookup 10.10.10.10`,

  nano: `NAME
       nano - Nano's ANOther editor, an enhanced free Pico clone

SYNOPSIS
       nano [filename]

KEYBOARD SHORTCUTS
       Ctrl+O: WriteOut (Save file)
       Ctrl+X: Exit editor
       Arrow Keys: Navigate buffer`,
};
