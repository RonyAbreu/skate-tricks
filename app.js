(() => {
  const listEl = document.getElementById("list");
  const emptyState = document.getElementById("emptyState");
  const tabsEl = document.getElementById("tabs");
  const searchInput = document.getElementById("searchInput");
  const fabAdd = document.getElementById("fabAdd");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const trickForm = document.getElementById("trickForm");
  const trickNome = document.getElementById("trickNome");
  const trickCategoria = document.getElementById("trickCategoria");
  const trickNotas = document.getElementById("trickNotas");
  const btnCancel = document.getElementById("btnCancel");
  const btnDelete = document.getElementById("btnDelete");
  const btnExport = document.getElementById("btnExport");
  const importInput = document.getElementById("importInput");
  const toast = document.getElementById("toast");

  let tricks = [];
  let activeCat = "todas";
  let searchTerm = "";
  let editingId = null;

  const CAT_LABEL = { base: "Base", nollie: "Nollie", fakie: "Fakie", switch: "Switch" };

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function render() {
    const term = searchTerm.trim().toLowerCase();
    const filtered = tricks
      .filter(t => activeCat === "todas" || t.categoria === activeCat)
      .filter(t => !term || t.nome.toLowerCase().includes(term))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    listEl.innerHTML = "";
    emptyState.hidden = filtered.length !== 0;

    filtered.forEach(t => {
      const card = document.createElement("button");
      card.className = "trick-card";
      card.type = "button";
      card.innerHTML = `
        <div class="trick-info">
          <span class="trick-nome"></span>
          ${t.notas ? '<span class="trick-notas"></span>' : ""}
        </div>
        <span class="badge badge-${t.categoria}"></span>
      `;
      card.querySelector(".trick-nome").textContent = t.nome;
      if (t.notas) card.querySelector(".trick-notas").textContent = t.notas;
      card.querySelector(".badge").textContent = CAT_LABEL[t.categoria] || t.categoria;
      card.addEventListener("click", () => openModal(t));
      listEl.appendChild(card);
    });
  }

  async function loadAll() {
    tricks = await TricksDB.getAll();
    render();
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    tabsEl.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.cat;
    render();
  });

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });

  function openModal(trick) {
    editingId = trick ? trick.id : null;
    modalTitle.textContent = trick ? "Editar manobra" : "Nova manobra";
    trickNome.value = trick ? trick.nome : "";
    trickCategoria.value = trick ? trick.categoria : (activeCat !== "todas" ? activeCat : "base");
    trickNotas.value = trick ? (trick.notas || "") : "";
    btnDelete.hidden = !trick;
    modal.hidden = false;
    setTimeout(() => trickNome.focus(), 50);
  }

  function closeModal() {
    modal.hidden = true;
    editingId = null;
    trickForm.reset();
  }

  fabAdd.addEventListener("click", () => openModal(null));
  btnCancel.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  trickForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = trickNome.value.trim();
    if (!nome) return;
    await TricksDB.add({
      id: editingId || undefined,
      nome,
      categoria: trickCategoria.value,
      notas: trickNotas.value
    });
    closeModal();
    await loadAll();
    showToast("Manobra salva");
  });

  btnDelete.addEventListener("click", async () => {
    if (!editingId) return;
    if (!confirm("Excluir essa manobra?")) return;
    await TricksDB.remove(editingId);
    closeModal();
    await loadAll();
    showToast("Manobra excluída");
  });

  btnExport.addEventListener("click", () => {
    const data = JSON.stringify({ exportadoEm: new Date().toISOString(), tricks }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skate-tricks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Exportado");
  });

  importInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed : parsed.tricks;
      if (!Array.isArray(incoming)) throw new Error("formato inválido");

      const existingKeys = new Set(tricks.map(t => (t.nome.toLowerCase() + "|" + t.categoria)));
      const toAdd = [];
      incoming.forEach(t => {
        if (!t || !t.nome || !t.categoria) return;
        const key = t.nome.toLowerCase() + "|" + t.categoria;
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        toAdd.push({
          id: TricksDB.uuid(),
          nome: String(t.nome).trim(),
          categoria: t.categoria,
          notas: t.notas || "",
          criadoEm: t.criadoEm || Date.now()
        });
      });

      if (toAdd.length) await TricksDB.bulkAdd(toAdd);
      await loadAll();
      showToast(`${toAdd.length} manobra(s) importada(s)`);
    } catch (err) {
      showToast("Erro ao importar arquivo");
    } finally {
      importInput.value = "";
    }
  });

  loadAll();
})();
