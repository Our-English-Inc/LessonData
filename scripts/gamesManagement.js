(() => {
  //#region ====== Variables ======

  let games = [];
  let pendingAction = null;
  let footer = null;

  //#endregion

  //#region ====== CSV ======

  async function loadGamesFromCSV() {
    const res = await fetch("csv/GameData.csv");
    const text = await res.text();

    const lines = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter(line => line.trim() !== "");
    
    const headers = lines[0].split(",").map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const raw = {};

      headers.forEach((h, i) => {
        raw[h] = values[i];
      });

      return {
        id: Number(raw.id),
        number: raw.number,
        title: raw.title,
        active: raw.active === "true",
        levels: Number(raw.levels),
        updatedAt: raw.updatedAt || "-",
        updatedBy: raw.updatedBy || "-"
      };
    });
  }

  //#endregion

  //#region ====== Header ======

  function updateGameCount() {
    const countEl = document.getElementById("item-count");
    countEl.textContent = `(${games.length})`;
  }

  //#endregion

  //#region ====== Table ======

  // Create row for each game
  function renderGamesRow(game, index){
    return `
      <td>${index + 1}</td>

      <!-- Actions -->
      <td>
        <div class="actions">
          <button class="action-btn edit" title="Edit">✏️</button>
          <button class="action-btn restore" title="Restore">🔄</button>
          <button class="action-btn delete" title="Delete">🗑️</button>
        </div>
      </td>

      <!-- Version -->
      <td>${game.number}</td>

      <!-- Title -->
      <td>${game.title}</td>

      <!-- Active -->
      <td>
        <label class="switch-yn">
          <input type="checkbox" ${game.active ? "checked" : ""}>
          <span class="switch-track">
            <span class="switch-label yes">YES</span>
            <span class="switch-label no">NO</span>
            <span class="switch-thumb"></span>
          </span>
        </label>
      </td>

      <!-- Levels -->
      <td>${game.levels}</td>

      <!-- Updated -->
      <td>${game.updatedAt}</td>
      <td>${game.updatedBy}</td>
    `;
  }

  // Bind actions with interactctive UI components
  function bindGamesInteractiveUI(row, game) {
    // "Edit" Button
    row.querySelector(".edit").onclick = () => {
      openActionModal({
        title: "Modify Game",
        desc: "You are about to modify this game. This change will take effect immediately.",
        onConfirm: () => {
          console.log("Edit", game.id);
        }
      });
    };

    // "Restore" Button
    row.querySelector(".restore").onclick = () => {
      openActionModal({
        title: "Restore Latest Safe Version",
        desc: "This will restore the game to the most recent safe version. Any unsaved changes will be lost. This action takes effect immediately.",
        onConfirm: () => {
          console.log("Restore latest safe version:", game.id);

          // TODO: Get file
          // restoreGameToLatestSafeVersion(game.id);
        }
      });
    };

    // "Delete" Button
    row.querySelector(".delete").onclick = () => {
      openActionModal({
        title: "Delete Game",
        desc: "This action cannot be undone. The deletion takes effect immediately.",
        onConfirm: () => {
          console.log("Delete", game.id);
        }
      });
    };

    // "Active" Switch
    const toggle = row.querySelector('.switch-yn input');
    if (toggle) {
      toggle.onchange = () => {
        game.active = toggle.checked;
        console.log("Game active changed:", game.id, game.active);
      };
    }
  }

  // Draw 
  function drawGames() {
    const tbody = document.getElementById("item-tbody");
    tbody.innerHTML = "";

    // Find game rows in current page
    const [start, end] = footer.getPageSlice();
    const pageItems = games.slice(start, end);

    // Create game rows
    pageItems.forEach((game, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = renderGamesRow(game, start + index);
      bindGamesInteractiveUI(tr, game);
      tbody.appendChild(tr); 
    })

    // Update UI
    updateGameCount();
  }

  //#endregion

  //#region ====== Action Confirmation Models ======

  // Open a popup window when click on action buttons
  function openActionModal({ title, desc, onConfirm }) {
    const modal = document.getElementById("action-modal");
    const passwordInput = document.getElementById("modal-password");
    const awareCheckbox = document.getElementById("modal-aware");
    const confirmBtn = document.getElementById("modal-confirm");
    const errorEl = document.getElementById("modal-password-error");
    const passwordText = document.getElementById("modal-password-text");
    
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-desc").textContent = desc;

    // Reset password zone
    passwordInput.value = "";
    passwordText.value = "";
    passwordInput.classList.remove("is-hidden");
    passwordText.classList.add("is-hidden");
    passwordInput.type = "password";
    const toggleBtn = document.getElementById("toggle-password");
    toggleBtn.setAttribute("data-visible", "false");

    awareCheckbox.checked = false;
    confirmBtn.disabled = true;

    modal.classList.remove("hidden");
    errorEl.classList.add("hidden");

    const updateConfirmState = () => {
      const hasPassword = passwordInput.value.length > 0;
      const awareOk = awareCheckbox.checked;
      confirmBtn.disabled = !(hasPassword && awareOk);
      errorEl.classList.add("hidden");
    };

    passwordInput.oninput = updateConfirmState;
    awareCheckbox.onchange = updateConfirmState;

    pendingAction = onConfirm;
  }

  document.getElementById("modal-cancel").onclick = () => {
    document.getElementById("action-modal").classList.add("hidden");
  };

  document.getElementById("modal-confirm").onclick = () => {
    const passwordInput = document.getElementById("modal-password");
    const errorEl = document.getElementById("modal-password-error");

    if (passwordInput.value !== ADMIN_PASSWORD) {
      errorEl.classList.remove("hidden");
      return;
    }

    document.getElementById("action-modal").classList.add("hidden");
    if (pendingAction) pendingAction();
  };

  document.getElementById("toggle-password").onclick = () => {
    const hidden = document.getElementById("modal-password");
    const text = document.getElementById("modal-password-text");
    const btn = document.getElementById("toggle-password");

    const showing = btn.getAttribute("data-visible") === "true";

    if (showing) {
      // switch to hidden (password)
      text.classList.add("is-hidden");
      hidden.classList.remove("is-hidden");
      hidden.focus();
      hidden.selectionStart = hidden.selectionEnd = hidden.value.length;
      btn.setAttribute("data-visible", "false");
    } else {
      // switch to visible (text)
      hidden.classList.add("is-hidden");
      text.classList.remove("is-hidden");
      text.focus();
      text.selectionStart = text.selectionEnd = text.value.length;
      btn.setAttribute("data-visible", "true");
    }
  };

  const pwHidden = document.getElementById("modal-password");
  const pwText = document.getElementById("modal-password-text");

  // Keep values in sync
  pwHidden.addEventListener("input", () => {
    pwText.value = pwHidden.value;
  });
  pwText.addEventListener("input", () => {
    pwHidden.value = pwText.value;
  });

  //#endregion

  // ====== Execution ======

  (() => {
    const panel = getPanel();

    if (panel !== PANEL.GAMES) return;

    async function initGamesPage() {
      games = await loadGamesFromCSV();
      setupIndexUI({ gamesCount: games.length });

      footer = createFooterController({
        onPageChange: drawGames
      });

      footer.setTotalItems(games.length);
    }

    initGamesPage();
  })();

})();