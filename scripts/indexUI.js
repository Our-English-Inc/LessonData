//#region ====== Variables ======

const PANEL = {
  GAMES: "games",
  ADMINS: "admins"
};
const ADMIN_PASSWORD = "admin123";

let currentPanel = null;

//#endregion

//#region ====== Panel Switch ======

// Detect current panel
function getPanel() {
  return new URLSearchParams(location.search).get("panel") || PANEL.GAMES;
}

// Update content according to selected panel
function setupIndexUI({ gamesCount = 0, adminsCount = 0 }) {
  const panel = getPanel();

  const toggleBtn = document.getElementById("panel-toggle-btn");
  const titleText = document.getElementById("header-title-text");
  const itemCount = document.getElementById("item-count");
  const theadGames = document.getElementById("thead-games");
  const theadAdmins = document.getElementById("thead-admins");

  if (panel === PANEL.GAMES) {
    // Header
    document.title = "Our English - Games Management";
    titleText.textContent = "Games";
    itemCount.textContent = `(${gamesCount})`;

    // Toggle button
    toggleBtn.textContent = "Admins Management";
    toggleBtn.onclick = () => {
      location.href = "index.html?panel=admins";
    };

    // Table head
    theadGames.classList.remove("hidden");
    theadAdmins.classList.add("hidden");
  } else {
    // Header
    document.title = "Our English - Admins Management";
    titleText.textContent = "Admins";
    itemCount.textContent = `(${adminsCount})`;

    // Toggle button
    toggleBtn.textContent = "Games Management";
    toggleBtn.onclick = () => {
      location.href = "index.html?panel=games";
    };

    // Table head
    theadGames.classList.add("hidden");
    theadAdmins.classList.remove("hidden");
  }

  return panel;
}

//#endregion

//#region ====== Footer ======

function createFooterController({ onPageChange }) {
  let currentPage = 1;
  let rowsPerPage = 10;
  let totalItems = 0;

  const rowsSelect = document.getElementById("rows-per-page");
  const rowRange = document.getElementById("row-range");

  const btnFirst = document.getElementById("first-page");
  const btnPrev = document.getElementById("prev-page");
  const btnNext = document.getElementById("next-page");
  const btnLast = document.getElementById("last-page");

  function getTotalPages() {
    return Math.max(1, Math.ceil(totalItems / rowsPerPage));
  }

  function updateRowRange() {
    if (totalItems === 0) {
      rowRange.textContent = "0–0 of 0";
      return;
    }

    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(start + rowsPerPage - 1, totalItems);
    rowRange.textContent = `${start}–${end} of ${totalItems}`;
  }

  function updateButtons() {
    const totalPages = getTotalPages();
    btnFirst.disabled = currentPage === 1;
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
    btnLast.disabled = currentPage === totalPages;
  }

  function goToPage(page) {
    const totalPages = getTotalPages();
    currentPage = Math.min(Math.max(1, page), totalPages);
    onPageChange(currentPage, rowsPerPage);
    updateRowRange();
    updateButtons();
  }

  rowsSelect.onchange = () => {
    rowsPerPage = Number(rowsSelect.value);
    currentPage = 1;
    goToPage(currentPage);
  };

  btnFirst.onclick = () => goToPage(1);
  btnPrev.onclick = () => goToPage(currentPage - 1);
  btnNext.onclick = () => goToPage(currentPage + 1);
  btnLast.onclick = () => goToPage(getTotalPages());

  return {
    setTotalItems(count) {
      totalItems = count;
      currentPage = 1;
      goToPage(1);
    },
    getPageSlice() {
      const start = (currentPage - 1) * rowsPerPage;
      return [start, start + rowsPerPage];
    }
  };
}

//#endregion