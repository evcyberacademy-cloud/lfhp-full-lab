import { VFSState } from '@/types/vfs';
import { createInitialVFS } from './vfs-init';

const DB_NAME = 'EVCyberLabsDB';
const DB_VERSION = 1;
const STORE_NAME = 'filesystem_state';
const STATE_KEY = 'current_vfs';
const LOCAL_STORAGE_BACKUP_KEY = 'evcyber_vfs_backup_v1';

export class VFSStorageManager {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not available in SSR'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('IndexedDB failed to open, falling back to localStorage');
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  public static async saveVFS(state: VFSState): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(state, STATE_KEY);

        request.onsuccess = () => {
          // Also update lightweight localStorage backup
          try {
            localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(state));
          } catch {
            // Ignore quota errors on localStorage
          }
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch {
      // Fallback
      try {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save to localStorage fallback:', e);
      }
    }
  }

  public static async loadVFS(): Promise<VFSState> {
    if (typeof window === 'undefined') {
      return createInitialVFS();
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(STATE_KEY);

        request.onsuccess = () => {
          if (request.result && request.result.nodes) {
            resolve(request.result as VFSState);
          } else {
            const fallback = this.loadFromLocalStorage();
            resolve(fallback || createInitialVFS());
          }
        };

        request.onerror = () => {
          const fallback = this.loadFromLocalStorage();
          resolve(fallback || createInitialVFS());
        };
      });
    } catch {
      const fallback = this.loadFromLocalStorage();
      return fallback || createInitialVFS();
    }
  }

  private static loadFromLocalStorage(): VFSState | null {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      if (data) {
        return JSON.parse(data) as VFSState;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  public static async resetVFS(): Promise<VFSState> {
    const initial = createInitialVFS();
    await this.saveVFS(initial);
    return initial;
  }
}
