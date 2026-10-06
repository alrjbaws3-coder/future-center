/**
 * Dedicated IndexedDB Storage for PDF files
 * Prevents LocalStorage QuotaExceededError by storing large PDF binaries in IndexedDB
 */

const DB_NAME = 'future_center_pdf_db';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_files';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Convert Base64 Data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const header = parts[0];
    const base64 = parts[1] || '';
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch (err) {
    console.warn('Failed to parse data URL to blob', err);
    return new Blob([dataUrl], { type: 'application/pdf' });
  }
}

/**
 * Save a PDF file (Blob or string) into IndexedDB
 */
export async function savePdfToIndexedDb(fileId: string, data: Blob | string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const payload = {
        id: fileId,
        data: typeof data === 'string' && data.startsWith('data:') ? dataUrlToBlob(data) : data,
        updatedAt: Date.now()
      };

      const request = store.put(payload);
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.warn('Failed to put PDF into IndexedDB', request.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('IndexedDB savePdf error', err);
    return false;
  }
}

/**
 * Retrieve a PDF file from IndexedDB by fileId
 */
export async function getPdfFromIndexedDb(fileId: string): Promise<Blob | string | null> {
  try {
    const db = await openDatabase();
    const localResult = await new Promise<Blob | string | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(fileId);

      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });

    if (localResult) return localResult;
  } catch {
    // Fallback to server SQLite table below
  }

  try {
    const res = await fetch(`/api/files/${encodeURIComponent(fileId)}`);
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        return blob;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Delete a PDF file from IndexedDB
 */
export async function deletePdfFromIndexedDb(fileId: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(fileId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
