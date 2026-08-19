/** Lightweight IndexedDB blob store for asset files (avoid base64 in zustand). */

const DB_NAME = 'chirp-assets'
const STORE = 'files'
const DB_VER = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
  })
}

export async function putAssetBlob(nodeId: string, file: Blob, meta: { name: string; type: string }) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ blob: file, name: meta.name, type: meta.type, updatedAt: Date.now() }, nodeId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAssetBlob(nodeId: string): Promise<{ blob: Blob; name: string; type: string } | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(nodeId)
    req.onsuccess = () => {
      const v = req.result as { blob: Blob; name: string; type: string } | undefined
      resolve(v?.blob ? v : null)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteAssetBlob(nodeId: string) {
  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(nodeId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Soft caps — warn/refuse only extreme sizes that freeze the tab */
export const ASSET_MAX_IMAGE = 20 * 1024 * 1024
export const ASSET_MAX_VIDEO = 80 * 1024 * 1024
