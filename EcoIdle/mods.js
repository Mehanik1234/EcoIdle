(() => {
  const MOD_STATE_KEY = "ecoIdleModState";
  const CUSTOM_MODS_KEY = "ecoIdleCustomMods";

  const BUILTIN_MODS = [
    {
      id: "shader-pack",
      name: "Shader Pack",
      description: "Adds a light shader overlay to the UI.",
      effects: { shader: true }
    },
    {
      id: "performance-optimizer",
      name: "Performance Optimizer",
      description: "Disables smoke particles for better FPS.",
      effects: { disableParticles: true }
    },
    {
      id: "visual-upgrade",
      name: "Visual Upgrade",
      description: "Stronger UI glow and contrast.",
      effects: { uiGlow: true }
    },
    {
      id: "renewable-expansion",
      name: "Renewable Expansion",
      description: "Unlocks Solar, Wind, and Recycling buildings.",
      effects: { unlockSolar: true, unlockWind: true, unlockRecycler: true }
    },
    {
      id: "industrial-expansion",
      name: "Industrial Expansion",
      description: "Unlocks Steel Foundry and Mega Plant.",
      effects: { unlockFoundry: true, unlockMega: true }
    },
    {
      id: "eco-hardcore",
      name: "Eco Hardcore",
      description: "Hard mode: +50% taxes, +35% pollution, more events.",
      effects: { taxMultiplier: 0.5, pollutionMultiplier: 0.35, eventRisk: 0.05 }
    },
    {
      id: "scarcity-mode",
      name: "Scarcity Mode",
      description: "Lower income, higher taxes.",
      effects: { incomeMultiplier: -0.15, taxMultiplier: 0.25 }
    }
  ];

  function loadState() {
    let state = {};
    try {
      state = JSON.parse(localStorage.getItem(MOD_STATE_KEY) || "{}");
    } catch {
      state = {};
    }
    if (!state || typeof state !== "object") state = {};
    return state;
  }

  function saveState(state) {
    localStorage.setItem(MOD_STATE_KEY, JSON.stringify(state));
  }

  function normalizeEffects(effects) {
    if (!effects || typeof effects !== "object") return {};
    const out = {};
    Object.keys(effects).forEach((key) => {
      const value = effects[key];
      if (typeof value === "boolean") out[key] = value;
      if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    });
    return out;
  }

  function normalizeMod(input, isCustom) {
    if (!input || typeof input !== "object") return null;
    const rawId = typeof input.id === "string" ? input.id.trim() : "";
    const name =
      typeof input.name === "string" && input.name.trim()
        ? input.name.trim()
        : isCustom
        ? "Custom Mod"
        : "Mod";
    const description =
      typeof input.description === "string" ? input.description.trim() : "";
    const effects = normalizeEffects(input.effects);
    return {
      id: rawId || null,
      name,
      description,
      effects,
      custom: Boolean(isCustom)
    };
  }

  function loadCustomMods() {
    let mods = [];
    try {
      mods = JSON.parse(localStorage.getItem(CUSTOM_MODS_KEY) || "[]");
    } catch {
      mods = [];
    }
    if (!Array.isArray(mods)) mods = [];
    return mods
      .map((mod) => normalizeMod(mod, true))
      .filter(Boolean)
      .map((mod) => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        effects: mod.effects,
        custom: true
      }));
  }

  function saveCustomMods(mods) {
    const cleaned = mods.map((mod) => ({
      id: mod.id,
      name: mod.name,
      description: mod.description,
      effects: mod.effects
    }));
    localStorage.setItem(CUSTOM_MODS_KEY, JSON.stringify(cleaned));
  }

  function getAllMods() {
    const list = [];
    const ids = new Set();
    BUILTIN_MODS.forEach((mod) => {
      list.push({ ...mod, custom: false });
      ids.add(mod.id);
    });
    loadCustomMods().forEach((mod) => {
      if (ids.has(mod.id)) return;
      list.push({ ...mod, custom: true });
      ids.add(mod.id);
    });
    return list;
  }

  function getModsWithState() {
    const state = loadState();
    return getAllMods().map((mod) => {
      const st = state[mod.id] || {};
      return {
        ...mod,
        installed: Boolean(st.installed),
        enabled: Boolean(st.enabled)
      };
    });
  }

  function updateModState(id, patch) {
    const state = loadState();
    const current = state[id] || {};
    state[id] = { ...current, ...patch };
    saveState(state);
    return state[id];
  }

  function addCustomMod(rawMod) {
    const normalized = normalizeMod(rawMod, true);
    if (!normalized) return null;
    const customMods = loadCustomMods();
    let id = normalized.id;
    if (!id) {
      id = `custom-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
    }
    const existingIds = new Set([
      ...BUILTIN_MODS.map((mod) => mod.id),
      ...customMods.map((mod) => mod.id)
    ]);
    if (existingIds.has(id)) {
      id = `${id}-${Date.now().toString(36).slice(-4)}`;
    }
    const newMod = {
      id,
      name: normalized.name,
      description: normalized.description,
      effects: normalized.effects,
      custom: true
    };
    customMods.push(newMod);
    saveCustomMods(customMods);
    return newMod;
  }

  function removeCustomMod(id) {
    const mods = loadCustomMods();
    const next = mods.filter((mod) => mod.id !== id);
    saveCustomMods(next);
    const state = loadState();
    if (state[id]) {
      delete state[id];
      saveState(state);
    }
  }

  window.getEcoModLibrary = getAllMods;
  window.getEcoModState = loadState;
  window.setEcoModState = saveState;
  window.getEcoModsWithState = getModsWithState;
  window.updateEcoModState = updateModState;
  window.addEcoCustomMod = addCustomMod;
  window.removeEcoCustomMod = removeCustomMod;
})();
