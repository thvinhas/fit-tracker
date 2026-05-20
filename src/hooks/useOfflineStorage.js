import { useState, useEffect } from 'react';

const DB_NAME = 'FitTrackerDB';
const DB_VERSION = 1;
const STORES = {
  workouts: 'workouts',
  exercises: 'exercises',
  history: 'history',
  syncQueue: 'syncQueue'
};

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores
        if (!db.objectStoreNames.contains(STORES.workouts)) {
          db.createObjectStore(STORES.workouts, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.exercises)) {
          db.createObjectStore(STORES.exercises, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.history)) {
          db.createObjectStore(STORES.history, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.syncQueue)) {
          const syncStore = db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async put(storeName, data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addToSyncQueue(action, data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.syncQueue], 'readwrite');
      const store = transaction.objectStore(STORES.syncQueue);
      const request = store.add({
        action,
        data,
        timestamp: Date.now(),
        synced: false
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.syncQueue], 'readonly');
      const store = transaction.objectStore(STORES.syncQueue);
      const index = store.index('timestamp');
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result.filter(item => !item.synced));
      request.onerror = () => reject(request.error);
    });
  }

  async markSynced(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.syncQueue], 'readwrite');
      const store = transaction.objectStore(STORES.syncQueue);
      const request = store.get(id);
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

const storage = new OfflineStorage();

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load sync queue on mount
    storage.getSyncQueue().then(setSyncQueue).catch(console.error);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveWorkout = async (workout) => {
    try {
      await storage.put(STORES.workouts, workout);
      if (!isOnline) {
        await storage.addToSyncQueue('saveWorkout', workout);
      }
      return true;
    } catch (error) {
      console.error('Error saving workout:', error);
      return false;
    }
  };

  const getWorkout = async (id) => {
    try {
      return await storage.get(STORES.workouts, id);
    } catch (error) {
      console.error('Error getting workout:', error);
      return null;
    }
  };

  const getAllWorkouts = async () => {
    try {
      return await storage.getAll(STORES.workouts);
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
    }
  };

  const saveExercise = async (exercise) => {
    try {
      await storage.put(STORES.exercises, exercise);
      if (!isOnline) {
        await storage.addToSyncQueue('saveExercise', exercise);
      }
      return true;
    } catch (error) {
      console.error('Error saving exercise:', error);
      return false;
    }
  };

  const getExercise = async (id) => {
    try {
      return await storage.get(STORES.exercises, id);
    } catch (error) {
      console.error('Error getting exercise:', error);
      return null;
    }
  };

  const syncPendingChanges = async () => {
    if (!isOnline) return;

    try {
      const queue = await storage.getSyncQueue();
      for (const item of queue) {
        try {
          // Here you would sync with your Firebase backend
          // For now, just mark as synced
          await storage.markSynced(item.id);
        } catch (error) {
          console.error('Error syncing item:', error);
        }
      }
      setSyncQueue([]);
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  };

  useEffect(() => {
    if (isOnline) {
      syncPendingChanges();
    }
  }, [isOnline]);

  return {
    isOnline,
    syncQueue,
    saveWorkout,
    getWorkout,
    getAllWorkouts,
    saveExercise,
    getExercise,
    syncPendingChanges
  };
}

export default storage;
