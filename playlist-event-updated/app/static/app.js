const state = {
  entries: [],
  stats: {
    totalEntries: 0,
    totalLikes: 0,
    totalCompanies: 0,
  },
  query: "",
  sort: "popular",
  page: 1,
  pageSize: 12,
  dialogEntryId: null,
  clientToken: null,
};

const els = {
  formDialog: document.getElementById("formDialog"),
  entryDialog: document.getElementById("entryDialog"),
  openSubmitButtons: Array.from(document.querySelectorAll(".open-submit")),
  closeDialogButtons: Array.from(document.querySelectorAll("[data-close-dialog]")),
  form: document.getElementById("entryForm"),
  formMessage: document.getElementById("formMessage"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  statEntries: document.getElementById("statEntries"),
  statLikes: document.getElementById("statLikes"),
  statCompanies: document.getElementById("statCompanies"),
  heroSongTitle: document.getElementById("heroSongTitle"),
  heroArtistName: document.getElementById("heroArtistName"),
  heroRecommendedBy: document.getElementById("heroRecommendedBy"),
  heroRecommendationMeta: document.getElementById("heroRecommendationMeta"),
  heroListenButton: document.getElementById("heroListenButton"),
  heroLikeButton: document.getElementById("heroLikeButton"),
  heroLikeCount: document.getElementById("heroLikeCount"),
  spotlightBoard: document.getElementById("spotlightBoard"),
  spotlightEmpty: document.getElementById("spotlightEmpty"),
  playlistGrid: document.getElementById("playlistGrid"),
  emptyState: document.getElementById("emptyState"),
  listSummaryText: document.getElementById("listSummaryText"),
  pageSummaryText: document.getElementById("pageSummaryText"),
  paginationRow: document.getElementById("paginationRow"),
  pagination: document.getElementById("pagination"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  spotlightTemplate: document.getElementById("spotlightTemplate"),
  playlistCardTemplate: document.getElementById("playlistCardTemplate"),
  dialogMeta: document.getElementById("dialogMeta"),
  dialogSongTitle: document.getElementById("dialogSongTitle"),
  dialogArtistName: document.getElementById("dialogArtistName"),
  dialogName: document.getElementById("dialogName"),
  dialogCompany: document.getElementById("dialogCompany"),
  dialogDepartment: document.getElementById("dialogDepartment"),
  dialogReason: document.getElementById("dialogReason"),
  dialogLikeButton: document.getElementById("dialogLikeButton"),
  dialogListenButton: document.getElementById("dialogListenButton"),
};

const accentPairs = [
  ["#34c2db", "#d8f2fb"],
  ["#0d4e86", "#dce8f7"],
  ["#b92e28", "#fae3de"],
  ["#8f5efc", "#eee5ff"],
  ["#ff8b3d", "#ffecd8"],
  ["#2aa06a", "#dbf5ea"],
];

const spotlightLayout = [
  { top: "8%", left: "3%", rotate: "-7deg" },
  { top: "6%", right: "4%", rotate: "6deg" },
  { top: "35%", left: "0.5%", rotate: "-3deg" },
  { top: "34%", right: "1.5%", rotate: "4deg" },
  { bottom: "8%", left: "9%", rotate: "-5deg" },
  { bottom: "10%", right: "8%", rotate: "5deg" },
];

function getClientToken() {
  const key = "playlistEventClientToken";
  let token = window.localStorage.getItem(key);
  if (!token) {
    token = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, token);
  }
  return token;
}

function hashNumber(value) {
  const str = String(value);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function sortEntries(items, sortType = state.sort) {
  return items.sort((a, b) => {
    if (sortType === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortType === "artist") {
      return a.artistName.localeCompare(b.artistName, "ko");
    }
    const likeGap = (b.likes ?? 0) - (a.likes ?? 0);
    if (likeGap !== 0) return likeGap;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getFilteredEntries() {
  const query = state.query.trim().toLowerCase();
  let items = [...state.entries];

  if (query) {
    items = items.filter((entry) => {
      const target = [
        entry.name,
        entry.company,
        entry.department,
        entry.songTitle,
        entry.artistName,
        entry.reason,
      ]
        .join(" ")
        .toLowerCase();
      return target.includes(query);
    });
  }

  return sortEntries(items, state.sort);
}

function getHeroEntry() {
  if (!state.entries.length) return null;
  return sortEntries([...state.entries], "popular")[0] || null;
}

function getSpotlightEntries() {
  const source = state.query.trim() ? getFilteredEntries() : [...state.entries];
  if (!source.length) return [];

  const popular = sortEntries([...source], "popular").slice(0, 3);
  const latest = sortEntries([...source], "latest").slice(0, 3);
  const mixed = [];
  const seen = new Set();

  for (const entry of [...popular, ...latest, ...source]) {
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    mixed.push(entry);
    if (mixed.length >= 6) break;
  }

  return mixed;
}

function getPageItems(items) {
  const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const start = (state.page - 1) * state.pageSize;
  return {
    totalPages,
    visibleCount: items.length,
    start,
    end: Math.min(start + state.pageSize, items.length),
    items: items.slice(start, start + state.pageSize),
  };
}

function decorateCard(node, entry, index) {
  const seed = hashNumber(entry.id);
  const [accent, accentSoft] = accentPairs[seed % accentPairs.length];
  node.style.setProperty("--accent", accent);
  node.style.setProperty("--accent-soft", accentSoft);
  node.style.setProperty("--float-duration", `${8 + (seed % 4)}s`);
  node.style.setProperty("--float-delay", `${-(seed % 6)}s`);
  node.style.setProperty("--rotate", `${-4 + (seed % 9)}deg`);

  if (typeof index === "number" && node.classList.contains("spotlight-card") && window.innerWidth > 860) {
    const layout = spotlightLayout[index % spotlightLayout.length];
    Object.entries(layout).forEach(([key, value]) => {
      node.style[key] = value;
    });
  }
}

function renderStats() {
  els.statEntries.textContent = formatNumber(state.stats.totalEntries);
  els.statLikes.textContent = formatNumber(state.stats.totalLikes);
  els.statCompanies.textContent = formatNumber(state.stats.totalCompanies);
}

function renderHero() {
  const entry = getHeroEntry();
  if (!entry) {
    els.heroSongTitle.textContent = "첫 번째 추천곡을 기다리는 중";
    els.heroArtistName.textContent = "추천곡이 등록되면 여기에서 가장 먼저 보여줄게요.";
    els.heroRecommendedBy.textContent = "아직 없음";
    els.heroRecommendationMeta.textContent = "Only One Playlist";
    els.heroLikeCount.textContent = "0";
    els.heroLikeButton.classList.add("hidden");
    els.heroListenButton.classList.add("disabled");
    els.heroListenButton.setAttribute("aria-disabled", "true");
    els.heroListenButton.href = "#";
    return;
  }

  els.heroSongTitle.textContent = entry.songTitle;
  els.heroArtistName.textContent = entry.artistName;
  els.heroRecommendedBy.textContent = entry.name;
  els.heroRecommendationMeta.textContent = `${entry.company} · ${entry.department}`;
  els.heroLikeCount.textContent = formatNumber(entry.likes);
  els.heroLikeButton.dataset.entryId = String(entry.id);
  els.heroLikeButton.classList.remove("hidden");
  els.heroListenButton.classList.remove("disabled");
  els.heroListenButton.removeAttribute("aria-disabled");
  els.heroListenButton.href = entry.youtubeSearchUrl;
}

function createSpotlightCard(entry, index) {
  const node = els.spotlightTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.entryId = String(entry.id);
  decorateCard(node, entry, index);

  node.querySelector(".spotlight-company").textContent = entry.company;
  node.querySelector(".spotlight-song").textContent = entry.songTitle;
  node.querySelector(".spotlight-artist").textContent = entry.artistName;
  node.querySelector(".spotlight-reason").textContent = entry.reason;
  node.querySelector(".spotlight-name").textContent = entry.name;
  node.querySelector(".spotlight-department").textContent = entry.department;

  const listenButton = node.querySelector(".listen-button");
  listenButton.href = entry.youtubeSearchUrl;
  listenButton.setAttribute("aria-label", `${entry.songTitle} 유튜브에서 듣기`);

  const likeButton = node.querySelector(".like-button");
  likeButton.dataset.entryId = String(entry.id);
  likeButton.querySelector("span").textContent = formatNumber(entry.likes);

  return node;
}

function createPlaylistCard(entry) {
  const node = els.playlistCardTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.entryId = String(entry.id);
  decorateCard(node, entry);

  node.querySelector(".card-company").textContent = entry.company;
  node.querySelector(".card-song").textContent = entry.songTitle;
  node.querySelector(".card-artist").textContent = entry.artistName;
  node.querySelector(".card-name").textContent = entry.name;
  node.querySelector(".card-department").textContent = entry.department;
  node.querySelector(".card-reason").textContent = entry.reason;

  const listenButton = node.querySelector(".listen-button");
  listenButton.href = entry.youtubeSearchUrl;
  listenButton.setAttribute("aria-label", `${entry.songTitle} 유튜브에서 듣기`);

  const likeButton = node.querySelector(".like-button");
  likeButton.dataset.entryId = String(entry.id);
  likeButton.querySelector("span").textContent = formatNumber(entry.likes);
  likeButton.setAttribute("aria-label", `${entry.songTitle} 좋아요 ${entry.likes}개`);

  return node;
}

function renderSpotlight() {
  const items = getSpotlightEntries();
  els.spotlightBoard.innerHTML = "";

  const hasAnyEntries = state.entries.length > 0;
  const hasSpotlightItems = items.length > 0;
  els.spotlightEmpty.classList.toggle("hidden", hasSpotlightItems);

  if (!hasAnyEntries) {
    els.spotlightEmpty.querySelector(".empty-badge").textContent = "첫 번째 추천곡을 기다리는 중";
    els.spotlightEmpty.querySelector("h3").textContent = "아직 하이라이트에 표시할 곡이 없어요";
    els.spotlightEmpty.querySelector("p").textContent = "추천곡이 등록되면 이 공간에 둥실 떠다니는 카드가 생성됩니다.";
    return;
  }

  if (!hasSpotlightItems) {
    els.spotlightEmpty.classList.remove("hidden");
    els.spotlightEmpty.querySelector(".empty-badge").textContent = "검색 결과 없음";
    els.spotlightEmpty.querySelector("h3").textContent = "조건에 맞는 추천곡이 없어요";
    els.spotlightEmpty.querySelector("p").textContent = "검색어를 바꾸면 하이라이트 영역도 함께 갱신됩니다.";
    return;
  }

  items.forEach((entry, index) => {
    els.spotlightBoard.appendChild(createSpotlightCard(entry, index));
  });
}

function renderPagination(totalPages) {
  els.pagination.innerHTML = "";
  els.paginationRow.classList.toggle("hidden", totalPages <= 1);
  els.prevPage.disabled = state.page <= 1;
  els.nextPage.disabled = state.page >= totalPages;

  if (totalPages <= 1) return;

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `pager-button${page === state.page ? " is-current" : ""}`;
    button.textContent = String(page);
    button.dataset.page = String(page);
    els.pagination.appendChild(button);
  }
}

function renderPlaylist() {
  const filteredItems = getFilteredEntries();
  const hasEntries = state.entries.length > 0;

  els.emptyState.classList.toggle("hidden", hasEntries && filteredItems.length > 0);
  els.playlistGrid.innerHTML = "";

  if (!hasEntries) {
    els.listSummaryText.textContent = "추천곡 0곡";
    els.pageSummaryText.textContent = "1 / 1 페이지";
    renderPagination(1);
    return;
  }

  if (!filteredItems.length) {
    els.emptyState.classList.remove("hidden");
    els.emptyState.querySelector(".empty-badge").textContent = "검색 결과 없음";
    els.emptyState.querySelector("h3").textContent = "조건에 맞는 추천곡이 없어요";
    els.emptyState.querySelector("p").textContent = "검색어를 바꾸거나 정렬 방식을 다시 선택해 보세요.";
    els.listSummaryText.textContent = `검색 결과 0곡 / 전체 ${formatNumber(state.entries.length)}곡`;
    els.pageSummaryText.textContent = "1 / 1 페이지";
    renderPagination(1);
    return;
  }

  const pageData = getPageItems(filteredItems);
  pageData.items.forEach((entry) => {
    els.playlistGrid.appendChild(createPlaylistCard(entry));
  });

  els.listSummaryText.textContent = `${formatNumber(pageData.visibleCount)}곡 중 ${formatNumber(pageData.start + 1)}-${formatNumber(pageData.end)}곡 표시`;
  els.pageSummaryText.textContent = `${state.page} / ${pageData.totalPages} 페이지`;
  renderPagination(pageData.totalPages);
}

function renderDialog(entryId) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return;

  state.dialogEntryId = entry.id;
  els.dialogMeta.textContent = `${entry.company} · ${entry.department}`;
  decorateCard(els.dialogMeta, entry);
  els.dialogSongTitle.textContent = entry.songTitle;
  els.dialogArtistName.textContent = entry.artistName;
  els.dialogName.textContent = entry.name;
  els.dialogCompany.textContent = entry.company;
  els.dialogDepartment.textContent = entry.department;
  els.dialogReason.textContent = entry.reason;
  els.dialogLikeButton.dataset.entryId = String(entry.id);
  els.dialogLikeButton.querySelector("span").textContent = formatNumber(entry.likes);
  els.dialogListenButton.href = entry.youtubeSearchUrl;

  openDialog(els.entryDialog);
}

function renderAll() {
  renderStats();
  renderHero();
  renderSpotlight();
  renderPlaylist();

  if (state.dialogEntryId != null && els.entryDialog.open) {
    renderDialog(state.dialogEntryId);
  }
}

function showFormMessage(message, type) {
  els.formMessage.textContent = message;
  els.formMessage.classList.remove("success", "error");
  if (type) {
    els.formMessage.classList.add(type);
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.classList.add("visible"), 10);
  window.setTimeout(() => {
    toast.classList.remove("visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 2200);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || "요청 처리 중 오류가 발생했습니다.");
  }
  return data;
}

async function loadEntries() {
  const data = await requestJson("/api/entries");
  state.entries = data.items || [];
  state.stats = data.stats || state.stats;
  renderAll();
}

async function handleSubmit(event) {
  event.preventDefault();
  showFormMessage("", null);

  const formData = new FormData(els.form);
  const payload = Object.fromEntries(formData.entries());

  const submitButton = els.form.querySelector(".submit-button");
  submitButton.disabled = true;
  submitButton.textContent = "등록 중...";

  try {
    const data = await requestJson("/api/entries", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.entries.unshift(data.item);
    state.stats = data.stats;
    state.page = 1;
    renderAll();
    els.form.reset();
    showFormMessage("추천곡이 등록되었습니다.", "success");
    showToast("추천곡이 플레이리스트에 추가됐어요.");

    window.setTimeout(() => {
      closeDialog(els.formDialog);
      document.getElementById("playlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
      showFormMessage("", null);
    }, 280);
  } catch (error) {
    showFormMessage(error.message || "등록 중 오류가 발생했습니다.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "추천곡 등록하기";
  }
}

async function handleLike(entryId) {
  try {
    const data = await requestJson(`/api/entries/${entryId}/like`, {
      method: "POST",
      body: JSON.stringify({ clientToken: state.clientToken }),
    });

    const target = state.entries.find((entry) => entry.id === entryId);
    if (target) {
      target.likes = data.likes;
    }

    state.stats = data.stats || state.stats;
    renderAll();

    if (data.alreadyLiked) {
      showToast("이 브라우저에서는 이미 좋아요를 눌렀어요.");
    } else {
      showToast("좋아요를 보냈어요 ❤");
    }
  } catch (error) {
    showToast(error.message || "좋아요 처리 중 오류가 발생했습니다.");
  }
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  }
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (dialog.open) dialog.close();
}

function handleCardInteraction(event, selector) {
  const listenButton = event.target.closest(".listen-button");
  if (listenButton) {
    event.stopPropagation();
    return;
  }

  const likeButton = event.target.closest(".like-button");
  if (likeButton && likeButton.dataset.entryId) {
    event.stopPropagation();
    handleLike(Number(likeButton.dataset.entryId));
    return;
  }

  const card = event.target.closest(selector);
  if (card?.dataset.entryId) {
    renderDialog(Number(card.dataset.entryId));
  }
}

function handleCardKeydown(event, selector) {
  const card = event.target.closest(selector);
  if (!card || !card.dataset.entryId) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    renderDialog(Number(card.dataset.entryId));
  }
}

function bindDialogEvents() {
  els.openSubmitButtons.forEach((button) => {
    button.addEventListener("click", () => openDialog(els.formDialog));
  });

  els.closeDialogButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const dialogId = button.dataset.closeDialog;
      closeDialog(document.getElementById(dialogId));
    });
  });

  [els.formDialog, els.entryDialog].forEach((dialog) => {
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog(dialog);
      }
    });
  });
}

function bindEvents() {
  bindDialogEvents();

  els.form.addEventListener("submit", handleSubmit);
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.page = 1;
    renderSpotlight();
    renderPlaylist();
  });
  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.page = 1;
    renderAll();
  });

  els.spotlightBoard.addEventListener("click", (event) => handleCardInteraction(event, ".spotlight-card"));
  els.playlistGrid.addEventListener("click", (event) => handleCardInteraction(event, ".playlist-card"));
  els.spotlightBoard.addEventListener("keydown", (event) => handleCardKeydown(event, ".spotlight-card"));
  els.playlistGrid.addEventListener("keydown", (event) => handleCardKeydown(event, ".playlist-card"));

  els.heroLikeButton.addEventListener("click", () => {
    const entryId = Number(els.heroLikeButton.dataset.entryId);
    if (entryId) handleLike(entryId);
  });
  els.dialogLikeButton.addEventListener("click", () => {
    const entryId = Number(els.dialogLikeButton.dataset.entryId);
    if (entryId) handleLike(entryId);
  });

  els.prevPage.addEventListener("click", () => {
    state.page -= 1;
    renderPlaylist();
    document.getElementById("playlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.nextPage.addEventListener("click", () => {
    state.page += 1;
    renderPlaylist();
    document.getElementById("playlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button) return;
    state.page = Number(button.dataset.page) || 1;
    renderPlaylist();
    document.getElementById("playlist")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  window.addEventListener("resize", () => {
    renderSpotlight();
  });
}

async function init() {
  state.clientToken = getClientToken();
  bindEvents();

  try {
    await loadEntries();
  } catch (error) {
    showFormMessage(error.message || "데이터를 불러오지 못했습니다.", "error");
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
