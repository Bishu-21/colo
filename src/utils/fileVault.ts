/**
 * Local Offline sandbox IndexedDB File Vault
 */

export interface VaultFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
  timestamp: number;
}

const DB_NAME = "ColoFileVault";
const STORE_NAME = "files";
const DB_VERSION = 1;

export function initDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IDB only available in browser"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveFileToVault(file: File): Promise<VaultFile> {
  const db = await initDb();
  const arrayBuffer = await file.arrayBuffer();
  const vaultFile: VaultFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    type: file.type,
    size: file.size,
    data: arrayBuffer,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(vaultFile);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("morpee_vault_changed"));
      }
      resolve(vaultFile);
    };
  });
}

export async function getFilesFromVault(): Promise<VaultFile[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const files = request.result as VaultFile[];
      // Sort by timestamp desc
      files.sort((a, b) => b.timestamp - a.timestamp);
      resolve(files);
    };
  });
}

export async function getFileFromVault(id: string): Promise<VaultFile | null> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function deleteFileFromVault(id: string): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("morpee_vault_changed"));
      }
      resolve();
    };
  });
}
