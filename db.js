const TricksDB = (() => {
  const DB_NAME = "skate-tricks";
  const DB_VERSION = 2;
  const STORE = "tricks";
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = req.result;
        const store = db.objectStoreNames.contains(STORE)
          ? req.transaction.objectStore(STORE)
          : db.createObjectStore(STORE, { keyPath: "id" });

        if (!store.indexNames.contains("nome")) {
          store.createIndex("nome", "nome", { unique: false });
        }
        if (store.indexNames.contains("categoria")) {
          store.deleteIndex("categoria");
        }
        if (!store.indexNames.contains("categorias")) {
          store.createIndex("categorias", "categorias", { unique: false, multiEntry: true });
        }

        if (event.oldVersion < 2) {
          store.openCursor().onsuccess = (e) => {
            const cursor = e.target.result;
            if (!cursor) return;
            const record = cursor.value;
            if (!Array.isArray(record.categorias)) {
              record.categorias = record.categoria ? [record.categoria] : [];
              delete record.categoria;
              cursor.update(record);
            }
            cursor.continue();
          };
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
      categorias: Array.isArray(trick.categorias) ? trick.categorias : [],
      estilo: trick.estilo || "solo",
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
