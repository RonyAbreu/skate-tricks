const TricksDB = (() => {
  const DB_NAME = "skate-tricks";
  const DB_VERSION = 1;
  const STORE = "tricks";
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("categoria", "categoria", { unique: false });
          store.createIndex("nome", "nome", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function tx(mode) {
    const db = await open();
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "t-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  async function getAll() {
    const store = await tx("readonly");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function add(trick) {
    const store = await tx("readwrite");
    const record = {
      id: trick.id || uuid(),
      nome: trick.nome.trim(),
      categoria: trick.categoria,
      notas: (trick.notas || "").trim(),
      criadoEm: trick.criadoEm || Date.now()
    };
    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  }

  async function update(trick) {
    return add(trick);
  }

  async function remove(id) {
    const store = await tx("readwrite");
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function bulkAdd(tricks) {
    const store = await tx("readwrite");
    return new Promise((resolve, reject) => {
      tricks.forEach(t => store.put(t));
      store.transaction.oncomplete = () => resolve();
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  }

  return { getAll, add, update, remove, bulkAdd, uuid };
})();
