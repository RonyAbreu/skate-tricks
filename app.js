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
  const trickCategoriasEl = document.getElementById("trickCategorias");
  const trickNotas = document.getElementById("trickNotas");
  const btnCancel = document.getElementById("btnCancel");
  const btnDelete = document.getElementById("btnDelete");
  const btnExport = document.getElementById("btnExport");
  const importInput = document.getElementById("importInput");
  const toast = document.getElementById("toast");
  const confirmModal = document.getElementById("confirmModal");
  const confirmMessage = document.getElementById("confirmMessage");
  const btnConfirmCancel = document.getElementById("btnConfirmCancel");
  const btnConfirmDelete = document.getElementById("btnConfirmDelete");
  const catCount = document.getElementById("catCount");

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
    const byCat = tricks.filter(t => activeCat === "todas" || (t.categorias || []).includes(activeCat));
    const filtered = byCat
      .filter(t => !term || t.nome.toLowerCase().includes(term))
      .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));

    listEl.innerHTML = "";
    emptyState.hidden = filtered.length !== 0;
    catCount.textContent = activeCat === "todas"
      ? tricks.reduce((sum, t) => sum + (t.categorias || []).length, 0)
      : byCat.length;

    filtered.forEach(t => {
      const card = document.createElement("button");
      card.className = "trick-card";
      card.type = "button";
      const cats = t.categorias && t.categorias.length ? t.categorias : ["-"];
      card.innerHTML = `
        <div class="trick-info">
          <span class="trick-nome"></span>
          ${t.notas ? '<span class="trick-notas"></span>' : ""}
        </div>
        <div class="badge-group"></div>
      `;
      card.querySelector(".trick-nome").textContent = t.nome;
      if (t.notas) card.querySelector(".trick-notas").textContent = t.notas;
      const badgeGroup = card.querySelector(".badge-group");
      cats.forEach(cat => {
        const badge = document.createElement("span");
        badge.className = `badge badge-${cat}`;
        badge.textContent = CAT_LABEL[cat] || cat;
        badgeGroup.appendChild(badge);
      });
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
    trickNotas.value = trick ? (trick.notas || "") : "";

    const preChecked = trick
      ? (trick.categorias || [])
      : (activeCat !== "todas" ? [activeCat] : []);
    trickCategoriasEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = preChecked.includes(cb.value);
    });

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
    const categorias = Array.from(
      trickCategoriasEl.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    if (!categorias.length) {
      showToast("Escolhe ao menos uma categoria");
      return;
    }
    await TricksDB.add({
      id: editingId || undefined,
      nome,
      categorias,
      notas: trickNotas.value
    });
    closeModal();
    await loadAll();
    showToast("Manobra salva");
  });

  function openConfirmModal() {
    const trick = tricks.find(t => t.id === editingId);
    confirmMessage.textContent = trick
      ? `Tem certeza que quer excluir "${trick.nome}"? Essa ação não pode ser desfeita.`
      : "Tem certeza que quer excluir essa manobra? Essa ação não pode ser desfeita.";
    confirmModal.hidden = false;
  }

  function closeConfirmModal() {
    confirmModal.hidden = true;
  }

  btnDelete.addEventListener("click", () => {
    if (!editingId) return;
    openConfirmModal();
  });

  btnConfirmCancel.addEventListener("click", closeConfirmModal);
  confirmModal.addEventListener("click", (e) => { if (e.target === confirmModal) closeConfirmModal(); });

  btnConfirmDelete.addEventListener("click", async () => {
    if (!editingId) return;
    const id = editingId;
    closeConfirmModal();
    closeModal();
    await TricksDB.remove(id);
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

      const keyOf = (nome, categorias) => nome.toLowerCase() + "|" + [...categorias].sort().join(",");
      const existingKeys = new Set(tricks.map(t => keyOf(t.nome, t.categorias || [])));
      const toAdd = [];
      incoming.forEach(t => {
        if (!t || !t.nome) return;
        const categorias = Array.isArray(t.categorias)
          ? t.categorias
          : (t.categoria ? [t.categoria] : []);
        if (!categorias.length) return;
        const key = keyOf(t.nome, categorias);
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        toAdd.push({
          id: TricksDB.uuid(),
          nome: String(t.nome).trim(),
          categorias,
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
