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
  const trickEstiloEl = document.getElementById("trickEstilo");
  const estiloGroupEl = document.getElementById("estiloGroup");
  const btnCancel = document.getElementById("btnCancel");
  const btnDelete = document.getElementById("btnDelete");
  const importInput = document.getElementById("importInput");
  const toast = document.getElementById("toast");
  const confirmModal = document.getElementById("confirmModal");
  const confirmMessage = document.getElementById("confirmMessage");
  const btnConfirmCancel = document.getElementById("btnConfirmCancel");
  const btnConfirmDelete = document.getElementById("btnConfirmDelete");
  const catCount = document.getElementById("catCount");
  const nomeSkatistaEl = document.getElementById("nomeSkatista");
  const onboardModal = document.getElementById("onboardModal");
  const onboardNomeInput = document.getElementById("onboardNome");
  const btnOnboardContinuar = document.getElementById("btnOnboardContinuar");
  const importOnboardInput = document.getElementById("importOnboardInput");
  const tutorialModal = document.getElementById("tutorialModal");
  const btnTutorialOk = document.getElementById("btnTutorialOk");
  const screenTricks = document.getElementById("screenTricks");
  const screenAjustes = document.getElementById("screenAjustes");
  const bottomNav = document.getElementById("bottomNav");
  const rowTutorial = document.getElementById("rowTutorial");
  const rowExport = document.getElementById("rowExport");
  const rowImport = document.getElementById("rowImport");
  const rowShare = document.getElementById("rowShare");
  const rowStats = document.getElementById("rowStats");
  const shareModal = document.getElementById("shareModal");
  const shareEstiloEl = document.getElementById("shareEstilo");
  const shareCategoriaEl = document.getElementById("shareCategoria");
  const btnShareCancel = document.getElementById("btnShareCancel");
  const btnShareGerar = document.getElementById("btnShareGerar");
  const statsModal = document.getElementById("statsModal");
  const statsCardsEl = document.getElementById("statsCards");
  const statsRadarCategoriaEl = document.getElementById("statsRadarCategoria");
  const statsRadarEstiloEl = document.getElementById("statsRadarEstilo");
  const statsMatrixEl = document.getElementById("statsMatrix");
  const btnStatsClose = document.getElementById("btnStatsClose");

  let tricks = [];
  let activeCat = "todas";
  let activeEstilo = "solo";
  let searchTerm = "";
  let editingId = null;
  let editingNotas = "";
  let editingCriadoEm = null;

  const CAT_LABEL = { base: "Base", nollie: "Nollie", fakie: "Fakie", switch: "Switch" };
  const ESTILO_LABEL = { solo: "Solo", corrimao: "Corrimão", borda: "Borda" };
  const CATEGORIAS = ["base", "nollie", "fakie", "switch"];
  const ESTILOS = ["solo", "corrimao", "borda"];
  const LS_NOME = "skateTricksNome";
  const LS_ONBOARDED = "skateTricksOnboarded";

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function render() {
    const term = searchTerm.trim().toLowerCase();
    const byEstilo = tricks.filter(t => (t.estilo || "solo") === activeEstilo);
    const byCat = byEstilo.filter(t => activeCat === "todas" || (t.categorias || []).includes(activeCat));
    const filtered = byCat
      .filter(t => !term || t.nome.toLowerCase().includes(term))
      .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));

    listEl.innerHTML = "";
    emptyState.hidden = filtered.length !== 0;
    catCount.textContent = activeCat === "todas"
      ? byEstilo.reduce((sum, t) => sum + (t.categorias || []).length, 0)
      : byCat.length;

    filtered.forEach(t => {
      const card = document.createElement("button");
      card.className = "trick-card";
      card.type = "button";
      const allCats = t.categorias && t.categorias.length ? t.categorias : ["-"];
      const cats = activeCat === "todas" ? allCats : [activeCat];
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

  estiloGroupEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".estilo-btn");
    if (!btn) return;
    estiloGroupEl.querySelectorAll(".estilo-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeEstilo = btn.dataset.estilo;
    render();
  });

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });

  function openModal(trick) {
    editingId = trick ? trick.id : null;
    editingNotas = trick ? (trick.notas || "") : "";
    editingCriadoEm = trick ? (trick.criadoEm || null) : null;
    modalTitle.textContent = trick ? "Editar manobra" : "Nova manobra";
    trickNome.value = trick ? trick.nome : "";
    trickEstiloEl.value = trick ? (trick.estilo || "solo") : activeEstilo;

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
      estilo: trickEstiloEl.value,
      notas: editingNotas,
      criadoEm: editingCriadoEm || undefined
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

  function exportBackup() {
    const data = JSON.stringify({
      exportadoEm: new Date().toISOString(),
      skatista: localStorage.getItem(LS_NOME) || undefined,
      tricks
    }, null, 2);
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
  }

  rowExport.addEventListener("click", exportBackup);
  rowImport.addEventListener("click", () => importInput.click());

  async function importTricksFromFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const incoming = Array.isArray(parsed) ? parsed : parsed.tricks;
    if (!Array.isArray(incoming)) throw new Error("formato inválido");

    const keyOf = (nome, categorias, estilo) => nome.toLowerCase() + "|" + [...categorias].sort().join(",") + "|" + estilo;
    const existingKeys = new Set(tricks.map(t => keyOf(t.nome, t.categorias || [], t.estilo || "solo")));
    const toAdd = [];
    incoming.forEach(t => {
      if (!t || !t.nome) return;
      const categorias = Array.isArray(t.categorias)
        ? t.categorias
        : (t.categoria ? [t.categoria] : []);
      if (!categorias.length) return;
      const estilo = t.estilo || "solo";
      const key = keyOf(t.nome, categorias, estilo);
      if (existingKeys.has(key)) return;
      existingKeys.add(key);
      toAdd.push({
        id: TricksDB.uuid(),
        nome: String(t.nome).trim(),
        categorias,
        estilo,
        notas: t.notas || "",
        criadoEm: t.criadoEm || Date.now()
      });
    });

    if (toAdd.length) await TricksDB.bulkAdd(toAdd);
    await loadAll();
    return {
      added: toAdd.length,
      nome: parsed && parsed.skatista ? String(parsed.skatista).trim() : null
    };
  }

  importInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { added } = await importTricksFromFile(file);
      showToast(`${added} manobra(s) importada(s)`);
    } catch (err) {
      showToast("Erro ao importar arquivo");
    } finally {
      importInput.value = "";
    }
  });

  function renderNome() {
    const nome = localStorage.getItem(LS_NOME);
    if (nome) {
      nomeSkatistaEl.textContent = nome;
      nomeSkatistaEl.hidden = false;
    } else {
      nomeSkatistaEl.hidden = true;
    }
  }

  function openTutorial() {
    tutorialModal.hidden = false;
  }

  btnTutorialOk.addEventListener("click", () => {
    tutorialModal.hidden = true;
  });

  function finishOnboarding(nome) {
    localStorage.setItem(LS_ONBOARDED, "1");
    if (nome) localStorage.setItem(LS_NOME, nome);
    onboardModal.hidden = true;
    renderNome();
    openTutorial();
  }

  btnOnboardContinuar.addEventListener("click", () => {
    const nome = onboardNomeInput.value.trim();
    if (!nome) {
      showToast("Digita teu nome ou importa teus dados");
      return;
    }
    finishOnboarding(nome);
  });

  importOnboardInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { added, nome } = await importTricksFromFile(file);
      finishOnboarding(nome);
      showToast(`${added} manobra(s) importada(s)`);
    } catch (err) {
      showToast("Erro ao importar arquivo");
    } finally {
      importOnboardInput.value = "";
    }
  });

  function initOnboarding() {
    renderNome();
    if (localStorage.getItem(LS_ONBOARDED)) return;
    if (tricks.length > 0) {
      localStorage.setItem(LS_ONBOARDED, "1");
      return;
    }
    onboardModal.hidden = false;
  }

  rowTutorial.addEventListener("click", openTutorial);

  bottomNav.addEventListener("click", (e) => {
    const btn = e.target.closest(".bottom-nav-btn");
    if (!btn) return;
    bottomNav.querySelectorAll(".bottom-nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const screen = btn.dataset.screen;
    screenTricks.hidden = screen !== "tricks";
    screenAjustes.hidden = screen !== "ajustes";
  });

  function buildRadarSVG(labels, values) {
    const size = 240;
    const center = size / 2;
    const maxR = center - 46;
    const max = Math.max(1, ...values);
    const n = labels.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    const axisPoints = labels.map((_, i) => {
      const angle = startAngle + i * angleStep;
      return [center + maxR * Math.cos(angle), center + maxR * Math.sin(angle)];
    });
    const valuePoints = values.map((v, i) => {
      const r = (v / max) * maxR;
      const angle = startAngle + i * angleStep;
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    });
    const labelPoints = labels.map((_, i) => {
      const angle = startAngle + i * angleStep;
      return [center + (maxR + 26) * Math.cos(angle), center + (maxR + 26) * Math.sin(angle)];
    });

    const axesLines = axisPoints.map(p =>
      `<line x1="${center}" y1="${center}" x2="${p[0].toFixed(1)}" y2="${p[1].toFixed(1)}" stroke="#2d313b" stroke-width="1"/>`
    ).join("");
    const ring = axisPoints.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ");
    const polygon = valuePoints.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ");
    const dots = valuePoints.map(p =>
      `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#ff5c38"/>`
    ).join("");
    const labelEls = labels.map((l, i) => {
      const p = labelPoints[i];
      return `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" fill="#9aa0ab" font-size="13" font-weight="700" text-anchor="middle" dominant-baseline="middle">${l}</text>`;
    }).join("");
    const valueLabels = valuePoints.map((p, i) => {
      if (!values[i]) return "";
      return `<text x="${p[0].toFixed(1)}" y="${(p[1] - 10).toFixed(1)}" fill="#f0f1f3" font-size="11" text-anchor="middle">${values[i]}</text>`;
    }).join("");

    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="gráfico">
      <polygon points="${ring}" fill="none" stroke="#2d313b" stroke-width="1"/>
      ${axesLines}
      <polygon points="${polygon}" fill="rgba(255,92,56,0.25)" stroke="#ff5c38" stroke-width="2"/>
      ${dots}
      ${valueLabels}
      ${labelEls}
    </svg>`;
  }

  function renderStats() {
    const totalTricks = tricks.length;
    const estiloCounts = ESTILOS.map(es => tricks.filter(t => (t.estilo || "solo") === es).length);
    const catCounts = CATEGORIAS.map(cat => tricks.filter(t => (t.categorias || []).includes(cat)).length);

    statsCardsEl.innerHTML = "";
    const totalCard = document.createElement("div");
    totalCard.className = "stat-card";
    totalCard.innerHTML = `<strong>${totalTricks}</strong><span>Manobras no total</span>`;
    statsCardsEl.appendChild(totalCard);
    ESTILOS.forEach((es, i) => {
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `<strong>${estiloCounts[i]}</strong><span>${ESTILO_LABEL[es]}</span>`;
      statsCardsEl.appendChild(card);
    });
    CATEGORIAS.forEach((cat, i) => {
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `<strong>${catCounts[i]}</strong><span>${CAT_LABEL[cat]}</span>`;
      statsCardsEl.appendChild(card);
    });

    statsRadarCategoriaEl.innerHTML = buildRadarSVG(
      CATEGORIAS.map(c => CAT_LABEL[c]),
      catCounts
    );
    statsRadarEstiloEl.innerHTML = buildRadarSVG(
      ESTILOS.map(es => ESTILO_LABEL[es]),
      estiloCounts
    );

    let tableHtml = "<table><thead><tr><th></th>";
    CATEGORIAS.forEach(cat => { tableHtml += `<th>${CAT_LABEL[cat]}</th>`; });
    tableHtml += "</tr></thead><tbody>";
    ESTILOS.forEach(es => {
      tableHtml += `<tr><th>${ESTILO_LABEL[es]}</th>`;
      CATEGORIAS.forEach(cat => {
        const count = tricks.filter(t => (t.estilo || "solo") === es && (t.categorias || []).includes(cat)).length;
        tableHtml += `<td>${count}</td>`;
      });
      tableHtml += "</tr>";
    });
    tableHtml += "</tbody></table>";
    statsMatrixEl.innerHTML = tableHtml;
  }

  rowStats.addEventListener("click", () => {
    renderStats();
    statsModal.hidden = false;
  });

  btnStatsClose.addEventListener("click", () => { statsModal.hidden = true; });
  statsModal.addEventListener("click", (e) => { if (e.target === statsModal) statsModal.hidden = true; });

  rowShare.addEventListener("click", () => {
    shareEstiloEl.value = "todas";
    shareCategoriaEl.value = "todas";
    shareModal.hidden = false;
  });

  btnShareCancel.addEventListener("click", () => { shareModal.hidden = true; });
  shareModal.addEventListener("click", (e) => { if (e.target === shareModal) shareModal.hidden = true; });

  function buildShareCanvas(estiloFiltro, catFiltro) {
    const filtrados = tricks
      .filter(t => estiloFiltro === "todas" || (t.estilo || "solo") === estiloFiltro)
      .filter(t => catFiltro === "todas" || (t.categorias || []).includes(catFiltro))
      .sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));

    const width = 720;
    const lineHeight = 36;
    const headerHeight = 130;
    const height = headerHeight + Math.max(filtrados.length, 1) * lineHeight + 50;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0f1115";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#ff5c38";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("🛹 Skate Tricks", 24, 48);

    const nome = localStorage.getItem(LS_NOME);
    ctx.fillStyle = "#f0f1f3";
    ctx.font = "16px sans-serif";
    ctx.fillText(nome ? `Skatista: ${nome}` : "Minhas manobras", 24, 76);

    const estiloLabel = estiloFiltro === "todas" ? "Todos os estilos" : ESTILO_LABEL[estiloFiltro];
    const catLabel = catFiltro === "todas" ? "todas as categorias" : CAT_LABEL[catFiltro];
    ctx.fillStyle = "#9aa0ab";
    ctx.font = "14px sans-serif";
    ctx.fillText(`${estiloLabel} · ${catLabel} · ${filtrados.length} manobra(s)`, 24, 100);

    ctx.strokeStyle = "#2d313b";
    ctx.beginPath();
    ctx.moveTo(24, headerHeight - 16);
    ctx.lineTo(width - 24, headerHeight - 16);
    ctx.stroke();

    let y = headerHeight + 14;
    if (!filtrados.length) {
      ctx.fillStyle = "#9aa0ab";
      ctx.font = "16px sans-serif";
      ctx.fillText("Nenhuma manobra nesse filtro.", 24, y);
    } else {
      filtrados.forEach(t => {
        ctx.fillStyle = "#f0f1f3";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(t.nome, 24, y);
        ctx.fillStyle = "#9aa0ab";
        ctx.font = "13px sans-serif";
        const cats = (t.categorias || []).map(c => CAT_LABEL[c] || c).join(", ");
        ctx.fillText(cats, 24, y + 18);
        y += lineHeight;
      });
    }

    return canvas;
  }

  btnShareGerar.addEventListener("click", () => {
    const canvas = buildShareCanvas(shareEstiloEl.value, shareCategoriaEl.value);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast("Erro ao gerar imagem");
        return;
      }
      const file = new File([blob], "skate-tricks.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Minhas manobras de skate" });
          shareModal.hidden = true;
          return;
        } catch (err) {
          // usuário cancelou o compartilhamento ou falhou — cai pro download
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "skate-tricks.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      shareModal.hidden = true;
      showToast("Imagem salva");
    }, "image/png");
  });

  loadAll().then(initOnboarding);
})();
