'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile, AuthState } from '@/types/auth';
import { SoundEffects } from '@/lib/sounds/sound-effects';

interface AuthContextType {
  authState: AuthState;
  login: (studentName: string, accessCode: string) => boolean;
  logout: () => void;
  updateStudent: (student: Partial<StudentProfile>) => void;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = 'evcyber_auth_session_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    student: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const student = JSON.parse(stored) as StudentProfile;
        setAuthState({
          isAuthenticated: true,
          student,
        });
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (studentName: string, accessCode: string): boolean => {
    const trimmedName = studentName.trim();
    const trimmedCode = accessCode.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) return false;

    const student: StudentProfile = {
      studentName: trimmedName,
      accessCode: trimmedCode,
      linuxUsername: 'student',
      hostname: 'evcyber',
      homeDir: '/home/student',
      loginTimestamp: Date.now(),
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(student));
    } catch {
      // Ignore
    }

    setAuthState({
      isAuthenticated: true,
      student,
    });

    SoundEffects.playLoginFanfare();
    return true;
  };

  const updateStudent = (updatedFields: Partial<StudentProfile>) => {
    setAuthState(prev => {
      const currentStudent = prev.student || {
        studentName: 'Student',
        accessCode: 'LFHP-2026',
        linuxUsername: 'student',
        hostname: 'evcyber',
        homeDir: '/home/student',
        loginTimestamp: Date.now(),
      };
      const newStudent: StudentProfile = {
        ...currentStudent,
        ...updatedFields,
      };

      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newStudent));
      } catch {
        // Ignore
      }

      return {
        isAuthenticated: true,
        student: newStudent,
      };
    });
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setAuthState({
      isAuthenticated: false,
      student: null,
    });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, updateStudent, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
