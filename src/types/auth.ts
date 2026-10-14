export interface StudentProfile {
  studentName: string;
  accessCode: string;
  linuxUsername: string; // always 'student'
  hostname: string; // 'evcyber'
  homeDir: string; // '/home/student'
  loginTimestamp: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  student: StudentProfile | null;
}
