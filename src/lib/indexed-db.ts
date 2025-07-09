const DB_NAME = 'ByteChatDB';
const STORE_NAME = 'files';
const DB_VERSION = 2; // Incremented version to force upgrade

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('IndexedDB error:', (event.target as any).error);
                dbPromise = null; // Allow retrying
                reject('IndexedDB error');
            };

            request.onsuccess = (event) => {
                resolve((event.target as any).result as IDBDatabase);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as any).result as IDBDatabase;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }
    return dbPromise;
};


export const initDB = async (): Promise<boolean> => {
    try {
        await getDB();
        return true;
    } catch (e) {
        console.error("Failed to initialize DB", e);
        return false;
    }
};

export const saveFile = async (id: string, file: File): Promise<void> => {
    const dbInstance = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, file });

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject((event.target as any).error);
    });
};

export const getFile = async (id: string): Promise<File | null> => {
    const dbInstance = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result ? request.result.file : null);
        };
        request.onerror = (event) => reject((event.target as any).error);
    });
};
