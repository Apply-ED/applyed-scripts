/* =========================================================
   Module 6 — aed-curriculum.js  (Apply-ED intake form)
   Curriculum rendering, year tabs, language dropdown,
   curriculum validation, pill system, visibility binding.
   Depends on: aed-config.js (Module 1), aed-state.js (Module 3),
               aed-navigation.js (Module 4), aed-data.js (Module 5)
   ========================================================= */
window.AED = window.AED || {};

// --- Curriculum helper functions (available before IIFE) ---

/* =========================
   CURRICULUM HELPER FUNCTIONS
   ========================= */

function getCurriculumPathway(stateCode) {
  if (!stateCode) return CURRICULUM_CONFIG.national_ac;
  const upperState = stateCode.toUpperCase().trim();
  for (const pathwayId in CURRICULUM_CONFIG) {
    const config = CURRICULUM_CONFIG[pathwayId];
    if (config.states && config.states.indexOf(upperState) !== -1) {
      console.log("📚 Curriculum pathway for " + upperState + ": " + pathwayId);
      return config;
    }
  }
  console.log("⚠️ No pathway found for " + upperState + ", defaulting to national_ac");
  return CURRICULUM_CONFIG.national_ac;
}

function getCurrentStateValue() {
  return (localStorage.getItem("aed_selected_state") || "").trim().toUpperCase() || null;
}

function getCurrentYearNum() {
  var yearDropdown = document.querySelector('select[name="student_year_level"]');
  if (!yearDropdown || !yearDropdown.value) return null;
  var rawValue = yearDropdown.value;
  if (rawValue === "FOUNDATION") return 0;
  var match = rawValue.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return null;
}

function getYearBand(yearNum) {
  if (yearNum === null || yearNum === undefined) return null;
  if (yearNum <= 6)  return "f6";
  if (yearNum <= 8)  return "y78";
  if (yearNum === 9) return "y9";
  if (yearNum === 10) return "y10";
  return null;
}

function getCurriculumContext() {
  var stateCode = getCurrentStateValue();
  var pathway   = getCurriculumPathway(stateCode);
  var yearNum   = getCurrentYearNum();
  var yearBand  = getYearBand(yearNum);
  return {
    stateCode : stateCode,
    pathway   : pathway,
    pathwayId : pathway.id,
    yearNum   : yearNum,
    yearBand  : yearBand,
    mandatory : yearBand ? (pathway.mandatory  && pathway.mandatory[yearBand])  || null : null,
    electives : yearBand ? (pathway.electives  && pathway.electives[yearBand])  || null : null
  };
}

window.__aed_getCurriculumContext  = getCurriculumContext;
window.__aed_getCurriculumPathway  = getCurriculumPathway;

console.log("✅ Curriculum helper functions loaded");

/* =========================
   CURRICULUM PILL RENDERING SYSTEM (v2)
   Accordion-style elective cards, mandatory pathway cards always open.
   Colours match existing form design language.
   ========================= */

(function() {

  // ─── INJECT STYLES ────────────────────────────────────────────────────────
  if (!document.getElementById("aed-curriculum-styles")) {
    var s = document.createElement("style");
    s.id = "aed-curriculum-styles";
    s.textContent = [

      // ── Wrapper injected into each container ──
      ".aed-dynamic-curriculum { font-family: Montserrat, sans-serif; }",

      // ── Mandatory subjects banner (soft header, no selection needed) ──
      ".aed-mandatory-banner {",
      "  background: #263358;",
      "  border: 1px solid #263358;",
      "  border-radius: 16px;",
      "  margin-bottom: 16px;",
      "  overflow: hidden;",
      "}",
      ".aed-mandatory-banner-header {",
      "  background: #263358;",
      "  padding: 10px 14px;",
      "  display: flex;",
      "  align-items: center;",
      "  gap: 8px;",
      "}",
      ".aed-mandatory-banner-title {",
      "  font-size: 14px;",
      "  font-weight: 700;",
      "  font-family: Montserrat, sans-serif;",
      "  letter-spacing: 0.08em;",
      "  text-transform: uppercase;",
      "  color: #f6f7f5;",
      "}",
      ".aed-mandatory-banner-body {",
      "  padding: 14px 16px;",
      "}",
      ".aed-mandatory-pills-row {",
      "  display: flex;",
      "  flex-wrap: wrap;",
      "  gap: 8px;",
      "}",
".aed-mandatory-pill {",
      "  display: inline-flex;",
      "  align-items: center;",
      "  gap: 6px;",
      "  padding: 7px;", 
      "  border-radius: 16px;",
      "  font-size: 13px;",
      "  line-height: 1.2em;", 
      "  font-weight: 400;", 
      "  font-family: Montserrat, sans-serif;",
      "  color: #4f6a5a;",
      "  background: #e7ece8;",
      "  border: 1px solid #dde4dd;",
      "  opacity: 0.8;", /* Add this new line here! */
      "}",
      ".aed-mandatory-pill::before {",
      "  content: '✓';",
      "  font-size: 13px;",
      "  color: #799377;",
      "  font-weight: 700;",
      "  font-family: Montserrat, sans-serif;",
      "}",

      // ── Pathway card (always open, #f5f7f4 header only, white body) ──
      ".aed-pathway-card {",
      "  background: #ffffff;",
      "  border: 1px solid #dde4dd;",
      "  border-radius: 16px;",
      "  margin-bottom: 12px;",
      "  overflow: hidden;",
      "}",
      ".aed-pathway-card-header {",
      "  background: #f5f7f4;",
      "  padding: 12px 16px;",
      "}",
      ".aed-pathway-card-title {",
      "  font-size: 14px;",
      "  font-weight: 700;",
      "  font-family: Montserrat, sans-serif;",
      "  letter-spacing: 0.08em;",
      "  text-transform: uppercase;",
      "  color: #263358;",
      "  line-height: 22px;",
      "}",
      ".aed-pathway-card-subtitle {",
      "  font-size: 13px;",
      "  color: #7a7f87;",
      "  margin-top: 0;",
      "  margin-bottom: 10px;",
      "}",
      ".aed-pathway-card-body {",
      "  background: #ffffff;",
      "  padding: 12px 16px 14px;",
      "}",

      // ── Elective accordion card (collapsed by default) ──
      ".aed-elective-card {",
      "  background: #ffffff;",
      "  border: 1px solid #dde4dd;",
      "  border-radius: 16px;",
      "  margin-bottom: 12px;",
      "  overflow: hidden;",
      "}",
      ".aed-elective-card-trigger {",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: space-between;",
      "  padding: 14px 16px;",
      "  cursor: pointer;",
      "  user-select: none;",
      "  background: #f5f7f4;",
      "  transition: background 0.15s ease;",
      "}",
      ".aed-elective-card-trigger:hover {",
      "  background: #e4ebe4;",
      "}",
      ".aed-elective-card-trigger-left {",
      "  display: flex;",
      "  flex-direction: column;",
      "  gap: 3px;",
      "}",
      ".aed-elective-card-name {",
      "  font-size: 14px;",
      "  font-weight: 700;",
      "  font-family: Montserrat, sans-serif;",
      "  letter-spacing: 0.08em;",
      "  text-transform: uppercase;",
      "  color: #263358;",
      "  line-height: 22px;",
      "}",
      ".aed-elective-card-hint {",
      "  font-size: 14px;",
      "  font-family: Montserrat, sans-serif;",
      "  color: #4f6a5a;",
      "}",
      ".aed-elective-card-right {",
      "  display: flex;",
      "  align-items: center;",
      "  gap: 10px;",
      "}",
      ".aed-elective-card-count {",
      "  font-size: 14px;",
      "  font-weight: 600;",
      "  font-family: Montserrat, sans-serif;",
      "  color: #799377;",
      "  min-width: 20px;",
      "  text-align: right;",
      "}",
      ".aed-elective-chevron {",
      "  width: 20px;",
      "  height: 20px;",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  color: #799377;",
      "  transition: transform 0.2s ease;",
      "  flex-shrink: 0;",
      "}",
      ".aed-elective-card.is-open .aed-elective-chevron {",
      "  transform: rotate(180deg);",
      "}",
      ".aed-elective-card-body {",
      "  max-height: 0;",
      "  overflow: hidden;",
      "  transition: max-height 0.25s ease, padding 0.2s ease;",
      "  padding: 0 16px;",
      "}",
      ".aed-elective-card.is-open .aed-elective-card-body {",
      "  max-height: 600px;",
      "  padding: 14px 16px 16px;",
      "}",
      ".aed-elective-help {",
      "  font-size: 14px;",
      "  font-weight: 400;",
      "  font-family: Montserrat, sans-serif;",
      "  line-height: 22px;",
      "  color: #7a7f87;",
      "  margin-bottom: 12px;",
      "}",

      // ── Pills ──
      ".aed-pills-row {",
      "  display: flex;",
      "  flex-wrap: wrap;",
      "  gap: 8px;",
      "}",
".aed-dynamic-pill {",
      "  display: inline-flex;",
      "  align-items: center;",
      "  padding: 7px;",
      "  border-radius: 16px;",
      "  font-size: 13px;",
      "  font-family: Montserrat, sans-serif;",
      "  line-height: 1.2em;",
      "  font-weight: 400;",
      "  cursor: pointer;",
      "  user-select: none;",
      "  transition: all 0.15s ease;",
      "  color: #4f6a5a;",
      "  background: #e7ece8;",
      "  border: 1px solid #dde4dd;",
      "  opacity: 0.8;", /* Add this new line here! */
      "}",
      ".aed-dynamic-pill:hover {",
      "  background: #dde5dd;",
      "  border-color: #799377;",
      "}",
      ".aed-dynamic-pill.is-selected {",
      "  background: #263358;",
      "  color: #ffffff;",
      "  border-color: #263358;",
      "}",
      ".aed-dynamic-pill.is-selected:hover {",
      "  background: #1d2744;",
      "  border-color: #1d2744;",
      "}",
      ".aed-dynamic-pill.is-locked {",
      "  background: #263358;",
      "  color: #ffffff;",
      "  border-color: #263358;",
      "  cursor: default;",
      "  opacity: 0.75;",
      "}",
      ".aed-dynamic-pill.is-locked:hover {",
      "  background: #263358;",
      "  border-color: #263358;",
      "}",

      // ── Hidden input ──
      ".aed-hidden-input { position:absolute; opacity:0; pointer-events:none; height:0; width:0; }",

      // ── Languages section ──
      ".aed-languages-card {",
      "  background: #ffffff;",
      "  border: 1px solid #dde4dd;",
      "  border-radius: 16px;",
      "  margin-bottom: 12px;",
      "  overflow: hidden;",
      "}",
      ".aed-languages-card-header {",
      "  background: #f5f7f4;",
      "  padding: 12px 16px;",
      "}",
      ".aed-languages-card-title {",
      "  font-size: 14px;",
      "  font-weight: 700;",
      "  font-family: Montserrat, sans-serif;",
      "  letter-spacing: 0.08em;",
      "  text-transform: uppercase;",
      "  color: #263358;",
      "  line-height: 22px;",
      "}",
      ".aed-languages-card-subtitle {",
      "  font-size: 14px;",
      "  color: #4f6a5a;",
      "  margin-top: 3px;",
      "}",
      ".aed-languages-card-body {",
      "  background: #ffffff;",
      "  padding: 12px 16px 14px;",
      "}",

      // ── Shake animation for max-hit ──
      "@keyframes aed-pill-shake {",
      "  0%,100%{transform:translateX(0)}",
      "  25%{transform:translateX(-4px)}",
      "  75%{transform:translateX(4px)}",
      "}"

    ].join("\n");
    document.head.appendChild(s);
  }

  // ─── CHEVRON SVG ──────────────────────────────────────────────────────────
  function chevronSVG() {
    return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 5L7 10L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // ─── UPDATE HIDDEN INPUT ──────────────────────────────────────────────────
 function updateHiddenInput(learningArea, section) {
    if (!section) return;
    var selectedPills = section.querySelectorAll(".aed-dynamic-pill.is-selected");
    var values = [];
    selectedPills.forEach(function(p) {
      values.push(p.getAttribute("data-submit-value"));
    });

    // Use _y2 suffix when this section lives inside a Step 4 (_y2) container
    var isY2 = false;
    var ancestor = section.parentElement;
    while (ancestor) {
      if (ancestor.id && ancestor.id.endsWith("_y2")) { isY2 = true; break; }
      ancestor = ancestor.parentElement;
    }
    var inputName = isY2 ? (learningArea + "_y2") : learningArea;

    var hiddenInput = section.querySelector(".aed-hidden-input");
    if (!hiddenInput) {
      hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.className = "aed-hidden-input ms-input";
      hiddenInput.name = inputName;
      section.appendChild(hiddenInput);
    } else {
      hiddenInput.name = inputName;
    }
    hiddenInput.value = JSON.stringify(values);
    hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));

    // FIX: Write pill selections directly into __aed_child_applications on
    // every click. Previously, pill state only reached __aed_child_applications
    // via collectChildData() → saveProgressSilently() on navigation. But
    // renderCurriculumOptions() wipes container.innerHTML (including hidden
    // inputs) and rebuilds fresh empty ones before saveProgressSilently runs —
    // so the data was lost before it was ever saved. Writing here, at the
    // moment the user clicks, means the data survives any subsequent re-render.
    if (window.__aed_child_applications && typeof getChildIndex === 'function') {
      var idx = getChildIndex();
      if (window.__aed_child_applications[idx]) {
        window.__aed_child_applications[idx][inputName] = values;
        console.log('💊 AED: Pill saved directly [child ' + idx + '] ' + inputName + ':', values);
      }
    }
  }

  // ─── UPDATE ELECTIVE COUNT BADGE ─────────────────────────────────────────
  function updateCountBadge(card) {
    var countEl = card.querySelector(".aed-elective-card-count");
    if (!countEl) return;
    var selected = card.querySelectorAll(".aed-dynamic-pill.is-selected").length;
    countEl.textContent = selected > 0 ? selected + " selected" : "";
  }

  // ─── CREATE PILL ─────────────────────────────────────────────────────────
  function createPill(option, learningArea, config, cardOrSection) {
    var pill = document.createElement("span");
    pill.className = "aed-dynamic-pill ms-option";
    pill.setAttribute("data-value", option.id);
    pill.setAttribute("data-submit-value", option.value);
    if (option.category) pill.setAttribute("data-category", option.category);
    if (option.locked) {
      pill.setAttribute("data-locked", "true");
      pill.classList.add("is-selected", "is-locked");
    }
    pill.textContent = option.label;

    pill.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Locked pills cannot be toggled
      if (this.getAttribute("data-locked") === "true") return;

      // Walk up to the card (has data-learning-area), skipping the pill itself
      var section = this.parentElement;
      while (section && !section.hasAttribute("data-learning-area")) {
        section = section.parentElement;
      }

if (this.classList.contains("is-selected")) {
        // Pathway cards (max:1) — always allow deselect so user can swap
        if (config.max === 1) {
          this.classList.remove("is-selected");
        } else {
          var allSelected = section.querySelectorAll(".aed-dynamic-pill.is-selected");
          var selectableSelected = Array.prototype.filter.call(allSelected, function(p) { return p.getAttribute("data-locked") !== "true"; });
          var minAllowed = config.min || 0;
          if (selectableSelected.length > minAllowed) {
            this.classList.remove("is-selected");
          }
        }
      } else {
        var allSelectedNow = section.querySelectorAll(".aed-dynamic-pill.is-selected");
        var selectableSelectedNow = Array.prototype.filter.call(allSelectedNow, function(p) { return p.getAttribute("data-locked") !== "true"; });
        var maxAllowed = config.max !== undefined ? config.max : 99;
        if (selectableSelectedNow.length >= maxAllowed) {
          var self = this;
          self.style.animation = "aed-pill-shake 0.3s ease";
          setTimeout(function() { self.style.animation = ""; }, 300);
          return;
        }
        // Pathway (max:1) — deselect others first (non-locked only)
        if (config.max === 1) {
          section.querySelectorAll(".aed-dynamic-pill.is-selected").forEach(function(o) {
            if (o.getAttribute("data-locked") !== "true") o.classList.remove("is-selected");
          });
        }
        this.classList.add("is-selected");
      }

      updateHiddenInput(learningArea, section);
      if (cardOrSection) updateCountBadge(cardOrSection);
      document.dispatchEvent(new CustomEvent("aed:pillsChanged", { detail: { learningArea: learningArea } }));
    });

    return pill;
  }

  // ─── RENDER MANDATORY BANNER ──────────────────────────────────────────────
  function renderMandatoryBanner(mandatoryConfig, parentEl) {
    if (!mandatoryConfig || !mandatoryConfig.display || !mandatoryConfig.display.length) return;

    var banner = document.createElement("div");
    banner.className = "aed-mandatory-banner";

    var header = document.createElement("div");
    header.className = "aed-mandatory-banner-header";

    var title = document.createElement("div");
    title.className = "aed-mandatory-banner-title";
    title.textContent = "✓ Mandatory subjects — included automatically";
    header.appendChild(title);
    banner.appendChild(header);

    var body = document.createElement("div");
    body.className = "aed-mandatory-banner-body";

    var row = document.createElement("div");
    row.className = "aed-mandatory-pills-row";

    mandatoryConfig.display.forEach(function(subject) {
      var pill = document.createElement("span");
      pill.className = "aed-mandatory-pill";
      pill.textContent = subject;
      row.appendChild(pill);
    });

    body.appendChild(row);
    banner.appendChild(body);
    parentEl.appendChild(banner);
  }

  // ─── RENDER PATHWAY CARD (always open, sage header) ──────────────────────
  function renderPathwayCard(learningArea, config, parentEl) {
    var card = document.createElement("div");
    card.className = "aed-pathway-card";
    card.setAttribute("data-learning-area", learningArea);

    // Header — title only, no subtitle (subtitle moves to body)
    var header = document.createElement("div");
    header.className = "aed-pathway-card-header";

    var title = document.createElement("div");
    title.className = "aed-pathway-card-title";
    title.textContent = config.label;
    header.appendChild(title);

    card.appendChild(header);

    // Body — helpText + pills
    var body = document.createElement("div");
    body.className = "aed-pathway-card-body";

    if (config.helpText) {
      var sub = document.createElement("div");
      sub.className = "aed-pathway-card-subtitle";
      sub.textContent = config.helpText;
      body.appendChild(sub);
    }

    var pillsRow = document.createElement("div");
    pillsRow.className = "aed-pills-row";

    config.options.forEach(function(opt) {
      pillsRow.appendChild(createPill(opt, learningArea, config, card));
    });

    body.appendChild(pillsRow);
    card.appendChild(body);

// Hidden input — use _y2 suffix if rendering inside a Y2 container
    var hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.className = "aed-hidden-input ms-input";
    hiddenInput.name = (parentEl.closest('[id$="_y2"]') || (parentEl.id && parentEl.id.endsWith('_y2')))
      ? learningArea + "_y2"
      : learningArea;
    hiddenInput.value = JSON.stringify([]);
    card.appendChild(hiddenInput);

    parentEl.appendChild(card);
  }

  // ─── RENDER ELECTIVE ACCORDION CARD ──────────────────────────────────────
  function renderElectiveCard(learningArea, config, parentEl) {
    var card = document.createElement("div");
    card.className = "aed-elective-card";
    card.setAttribute("data-learning-area", learningArea);

    // Trigger row
    var trigger = document.createElement("div");
    trigger.className = "aed-elective-card-trigger";

    var triggerLeft = document.createElement("div");
    triggerLeft.className = "aed-elective-card-trigger-left";

    var nameEl = document.createElement("div");
    nameEl.className = "aed-elective-card-name";
    nameEl.textContent = config.label;
    triggerLeft.appendChild(nameEl);

    // Hint text under the name — use helpText from config if available, else generate
    var hintText = config.helpText
      ? config.helpText
      : config.min > 0
        ? "Select at least " + config.min + (config.max && config.max !== 99 ? ", up to " + config.max : "")
        : config.max && config.max !== 99
          ? "Optional — up to " + config.max
          : "Optional";
    var hintEl = document.createElement("div");
    hintEl.className = "aed-elective-card-hint";
    hintEl.textContent = hintText;
    triggerLeft.appendChild(hintEl);

    trigger.appendChild(triggerLeft);

    var triggerRight = document.createElement("div");
    triggerRight.className = "aed-elective-card-right";

    var countEl = document.createElement("div");
    countEl.className = "aed-elective-card-count";
    countEl.textContent = "";
    triggerRight.appendChild(countEl);

    var chevron = document.createElement("div");
    chevron.className = "aed-elective-chevron";
    chevron.innerHTML = chevronSVG();
    triggerRight.appendChild(chevron);

    trigger.appendChild(triggerRight);
    card.appendChild(trigger);

    // Collapsible body
    var body = document.createElement("div");
    body.className = "aed-elective-card-body";

    var pillsRow = document.createElement("div");
    pillsRow.className = "aed-pills-row";

    config.options.forEach(function(opt) {
      pillsRow.appendChild(createPill(opt, learningArea, config, card));
    });

    body.appendChild(pillsRow);
    card.appendChild(body);

// Hidden input — use _y2 suffix if rendering inside a Y2 container
    var hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.className = "aed-hidden-input ms-input";
    hiddenInput.name = (parentEl.closest('[id$="_y2"]') || (parentEl.id && parentEl.id.endsWith('_y2')))
      ? learningArea + "_y2"
      : learningArea;
    hiddenInput.value = JSON.stringify([]);
    card.appendChild(hiddenInput);

    // Toggle behaviour
    trigger.addEventListener("click", function() {
      var isOpen = card.classList.contains("is-open");
      card.classList.toggle("is-open", !isOpen);
    });

    parentEl.appendChild(card);
  }

  // ─── RENDER LANGUAGES SECTION ────────────────────────────────────────────
 // Language options — built fresh, not cloned from hidden Webflow element
  var LANGUAGE_OPTIONS = [
    { value: "",               label: "— Select a language —" },
    { value: "Arabic",         label: "Arabic" },
    { value: "Auslan",         label: "Auslan" },
    { value: "Chinese",        label: "Chinese (Mandarin)" },
    { value: "Classical Greek 7-10",label: "Classical Greek" },
    { value: "Framework for Aboriginal Languages and Torres Strait Islander Languages",         label: "Aboriginal and Torres Strait Islander" },
    { value: "Framework for Classical Languages 7-10",         label: "Classical Languages" },
    { value: "French",         label: "French" },
    { value: "German",         label: "German" },
    { value: "Hindi",          label: "Hindi" },
    { value: "Indonesian",     label: "Indonesian" },
    { value: "Italian",        label: "Italian" },
    { value: "Japanese",       label: "Japanese" },
    { value: "Korean",         label: "Korean" },
    { value: "Latin 7-10",          label: "Latin" },
    { value: "Modern Greek",   label: "Modern Greek" },
    { value: "Spanish",        label: "Spanish" },
    { value: "Turkish",        label: "Turkish" },
    { value: "Vietnamese",     label: "Vietnamese" }
  ];

  function renderLanguagesSection(parentEl, yearBand) {
    var isMandatory = (yearBand === "f6" || yearBand === "y78");

    // NEW: Check if this is rendering inside a Year 2 container
    var isY2 = false;
    var ancestor = parentEl;
    while (ancestor) {
      if (ancestor.id && ancestor.id.endsWith("_y2")) { isY2 = true; break; }
      ancestor = ancestor.parentElement;
    }
    var realSelectName = isY2 ? 'language_of_study_y2' : 'language_of_study';

    var card = document.createElement("div");
    card.className = "aed-languages-card";

    var header = document.createElement("div");
    header.className = "aed-languages-card-header";

    var title = document.createElement("div");
    title.className = "aed-languages-card-title";
    title.textContent = "Languages";
    header.appendChild(title);

    var sub = document.createElement("div");
    sub.className = "aed-languages-card-subtitle";
    sub.textContent = isMandatory
      ? "Required — select a language of study"
      : "Optional — select a language of study";
    header.appendChild(sub);

    card.appendChild(header);

    var body = document.createElement("div");
    body.className = "aed-languages-card-body";

    var sel = document.createElement("select");
    sel.style.cssText = "width:100%; padding:9px 12px; border:1px solid #dde4dd; border-radius:6px; background:#ffffff; font-family:Montserrat,sans-serif; font-size:14px; color:#263358; cursor:pointer; outline:none;";

// Languages restricted to Year 7+ only — hide from F-6 students
var F6_EXCLUDED_LANGUAGES = [
  "Classical Greek 7-10",
  "Framework for Classical Languages 7-10",
  "Latin 7-10"
];

var isF6Band = (yearBand === "f6");

LANGUAGE_OPTIONS.forEach(function(opt) {
  // Suppress Y7-10-only languages when rendering for an F-6 student
  if (isF6Band && F6_EXCLUDED_LANGUAGES.indexOf(opt.value) !== -1) return;
  var o = document.createElement("option");
  o.value = opt.value;
  o.textContent = opt.label;
  sel.appendChild(o);
});

    // FIX: Seed the dynamic select from __aed_child_applications first.
    // Previously it only read from realSelect.value — but loadChildData()
    // restores the hidden select 150ms after the curriculum re-renders, so on
    // a child switch the hidden select still holds the previous child's value
    // at the time renderLanguagesSection runs. Reading from __aed_child_applications
    // gives us the correct value for the child being rendered immediately.
    var realSelect = document.querySelector('select[name="' + realSelectName + '"]');
    var _langIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var _langData = (window.__aed_child_applications && window.__aed_child_applications[_langIdx]) || {};
var _savedLang = _langData[realSelectName] || '';
var _fallbackLang = _langData['language_of_study'] || '';

// Helper: case-insensitive option match — stored values from Webflow intake
// may be lowercase (e.g. "french") while <option> values are capitalised ("French").
function _matchLangOption(selectEl, rawValue) {
  if (!rawValue) return '';
  // Try direct match first
  selectEl.value = rawValue;
  if (selectEl.value === rawValue) return rawValue;
  // Case-insensitive fallback
  var lower = rawValue.toLowerCase();
  for (var i = 0; i < selectEl.options.length; i++) {
    if (selectEl.options[i].value.toLowerCase() === lower) {
      return selectEl.options[i].value; // return the correctly-cased option value
    }
  }
  return ''; // no match
}

if (_savedLang) {
  var matched = _matchLangOption(sel, _savedLang);
  sel.value = matched;
  // Fix the stored value so future restores don't need case-insensitive lookup
  if (matched && matched !== _savedLang && window.__aed_child_applications && window.__aed_child_applications[_langIdx]) {
    window.__aed_child_applications[_langIdx][realSelectName] = matched;
  }
  // Sync back to hidden Webflow select so collectChildData picks it up
  if (matched && realSelect) realSelect.value = matched;
} else if (_fallbackLang && isY2) {
  // Y2 card has no saved value yet — seed from Y1 visually AND
  // write it into __aed_child_applications so it's captured on submit
  var matchedFallback = _matchLangOption(sel, _fallbackLang);
  sel.value = matchedFallback;
  if (matchedFallback && window.__aed_child_applications && window.__aed_child_applications[_langIdx]) {
    window.__aed_child_applications[_langIdx][realSelectName] = matchedFallback;
  }
  // Also sync the hidden Webflow select
  if (realSelect) {
    realSelect.value = matchedFallback;
  }
} else if (realSelect && realSelect.value) {
  var matchedReal = _matchLangOption(sel, realSelect.value);
  sel.value = matchedReal;
}

    sel.addEventListener("change", function() {
      if (realSelect) {
        realSelect.value = this.value;
        realSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }

      // FIX: Write directly to __aed_child_applications so the selection
      // survives curriculum re-renders and child switches.
      if (window.__aed_child_applications && typeof getChildIndex === 'function') {
        var _li = getChildIndex();
        if (window.__aed_child_applications[_li]) {
          window.__aed_child_applications[_li][realSelectName] = this.value;
        }
      }
      
      // NEW: Target the correct checkbox class/name based on Y1 vs Y2
      var langCbClass = isY2 ? 'languages_y2' : 'languages';
      var langCb = document.querySelector('input.curriculum-checkbox[data-value="' + langCbClass + '"], input[name="' + langCbClass + '"], input[id="' + langCbClass + '"], input[name="Languages_y2"], input[id="Languages_y2"]');
      
      if (langCb) {
        var realCb = langCb.tagName === "INPUT" ? langCb : langCb.querySelector("input[type='checkbox']");
        if (realCb) {
          realCb.checked = (this.value !== "");
          realCb.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });

    body.appendChild(sel);
    card.appendChild(body);
    parentEl.appendChild(card);
  }
  
  // ─── PATHWAY SECTION KEYS ─────────────────────────────────────────────────
  // These render as always-open pathway cards, everything else is accordion
  var PATHWAY_KEYS = ["english_pathway", "mathematics_pathway", "science_pathway"];

  // ─── PER-CHILD DOM CACHE (Change 2) ─────────────────────────────────────
  // Instead of destroying and rebuilding curriculum UI on every step
  // activation or child switch, we cache the rendered DOM subtree per
  // child per container. On revisit we detach the old wrapper, attach
  // the cached one, and restore pill selections from __aed_child_applications.
  // Rebuilds only happen when the curriculum context (pathway + yearBand)
  // genuinely changes for a given child.
  //
  // Structure: _curriculumDOMCache[containerId][childIdx] = {
  //   renderKey: "pathwayId|yearBand",
  //   wrapEl:    <div.aed-dynamic-curriculum> (detached or attached)
  // }
  var _curriculumDOMCache = {};

  window.__aed_clearCurriculumRenderCache = function() {
    _curriculumDOMCache = {};
    console.log("🧹 AED: Curriculum DOM cache cleared");
  };

  // Invalidate cache for a single child (e.g. when year level changes)
  window.__aed_clearCurriculumCacheForChild = function(childIdx) {
    for (var cid in _curriculumDOMCache) {
      if (_curriculumDOMCache[cid][childIdx]) {
        delete _curriculumDOMCache[cid][childIdx];
      }
    }
    console.log("🧹 AED: Curriculum cache cleared for child " + childIdx);
  };

  // ─── SYNC LANGUAGE DROPDOWN (dedicated helper) ─────────────────────────
  // Ensures the dynamic language <select> and the hidden Webflow <select>
  // both reflect the value stored in __aed_child_applications.
  // Called after every cache hit AND cache miss render.
  // Change 4: Moved to IIFE scope so both renderCurriculumOptions (Y1)
  // and renderCurriculumOptionsForYear (Y2) can call it.
  function syncLanguageDropdown(containerEl, isY2) {
    var childIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var childData = (window.__aed_child_applications && window.__aed_child_applications[childIdx]) || {};
    var langKey = isY2 ? 'language_of_study_y2' : 'language_of_study';
    var savedLang = childData[langKey];
    if (!savedLang && isY2) savedLang = childData['language_of_study'];

    // 1. Find and set the dynamic dropdown
    var langBody = containerEl.querySelector('.aed-languages-card-body');
    var resolvedLang = "";
    if (langBody) {
      var dynSel = langBody.querySelector('select');
      if (dynSel) {
        if (savedLang) {
          dynSel.value = savedLang;
          resolvedLang = dynSel.value;
          // Case-insensitive fallback
          if (!resolvedLang) {
            var lower = savedLang.toLowerCase();
            for (var i = 0; i < dynSel.options.length; i++) {
              if (dynSel.options[i].value.toLowerCase() === lower) {
                resolvedLang = dynSel.options[i].value;
                dynSel.value = resolvedLang;
                if (window.__aed_child_applications && window.__aed_child_applications[childIdx]) {
                  window.__aed_child_applications[childIdx][langKey] = resolvedLang;
                }
                break;
              }
            }
          }
        } else {
          dynSel.value = "";
        }
      }
    }

    // 2. Always sync to hidden Webflow select so collectChildData picks it up
    var hiddenSel = document.querySelector('select[name="' + langKey + '"]');
    if (hiddenSel) {
      hiddenSel.value = resolvedLang;
    }

    console.log("🌐 AED: Language sync for child " + childIdx + " [" + langKey + "] = " + (resolvedLang || "(empty)") + " (saved: " + (savedLang || "(none)") + ")");
  }

  function renderCurriculumOptions(targetContainerId) {
    var container = document.getElementById(targetContainerId);
    if (!container) {
      console.warn("⚠️ AED: Container not found: " + targetContainerId);
      return;
    }

    var context = getCurriculumContext();
    if (!context.yearBand) return;

    var childIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var renderKey = context.pathwayId + "|" + context.yearBand;

    // Ensure cache structure exists
    if (!_curriculumDOMCache[targetContainerId]) _curriculumDOMCache[targetContainerId] = {};
    var cached = _curriculumDOMCache[targetContainerId][childIdx];

    // Detach any currently visible wrapper (from any child) without destroying it
    var currentWrap = container.querySelector('.aed-dynamic-curriculum');
    if (currentWrap) {
      container.removeChild(currentWrap);
    }
    // Also clear any leftover static Webflow content on first render
    if (!currentWrap && container.innerHTML.trim()) {
      container.innerHTML = "";
    }

    // CACHE HIT: same pathway + yearBand for this child — reattach and restore pills
    if (cached && cached.renderKey === renderKey && cached.wrapEl) {
      console.log("⚡ AED: Cache hit for " + targetContainerId + " child " + childIdx + " — reattaching DOM");
      container.appendChild(cached.wrapEl);
      restoreSavedCurriculumPills(container, false);
      syncLanguageDropdown(container, false);
      document.dispatchEvent(new CustomEvent("aed:curriculumRendered", { detail: { step: 3 } }));
      return;
    }

    // CACHE MISS: build new DOM
    console.log("🎨 AED: Building curriculum for " + targetContainerId + " child " + childIdx + " (" + context.pathwayId + " / " + context.yearBand + ")");

    var wrap = document.createElement("div");
    wrap.className = "aed-dynamic-curriculum";

    // 1. Mandatory subjects banner
    if (context.mandatory) {
      renderMandatoryBanner(context.mandatory, wrap);
    }

    // 2. Elective/pathway sections
    if (context.electives) {
      var keys = Object.keys(context.electives);
      keys.forEach(function(areaKey) {
        var cfg = context.electives[areaKey];
        if (PATHWAY_KEYS.indexOf(areaKey) !== -1) {
          renderPathwayCard(areaKey, cfg, wrap);
        } else {
          renderElectiveCard(areaKey, cfg, wrap);
        }
      });
    }

    // 3. Languages section (uses existing Webflow dropdown, mirrored into card)
    renderLanguagesSection(wrap, context.yearBand);

    container.appendChild(wrap);

    // Store in cache
    _curriculumDOMCache[targetContainerId][childIdx] = {
      renderKey: renderKey,
      wrapEl: wrap
    };

    restoreSavedCurriculumPills(container, false);
    syncLanguageDropdown(container, false);
    console.log("✅ AED: Curriculum rendered + cached for " + targetContainerId + " child " + childIdx);
    // Signal that rendering + initial restore is complete
    document.dispatchEvent(new CustomEvent("aed:curriculumRendered", { detail: { step: 3 } }));
  }

  function refreshCurriculumDisplay() {
    // Change 4: Read year from __aed_child_applications first (reliable
    // source) because the DOM dropdown may not be updated yet during
    // step transitions and child switches.
    var yearNum = null;
    var childIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var savedData = (window.__aed_child_applications && window.__aed_child_applications[childIdx]) || {};
    if (savedData.student_year_level) {
      var raw = savedData.student_year_level;
      if (raw === 'FOUNDATION') { yearNum = 0; }
      else {
        var m = raw.match(/\d+/);
        if (m) yearNum = parseInt(m[0], 10);
      }
    }
    // Fallback to DOM dropdown
    if (yearNum === null) {
      yearNum = getCurrentYearNum();
    }
    if (yearNum === null) return;

    // Hide all containers first
    ["f6-curriculum-container", "y9-curriculum-container", "y10-curriculum-container"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    var containerId = null;
    if (yearNum === 0)                      containerId = "f6-curriculum-container"; // Foundation
    else if (yearNum <= 6)                  containerId = "f6-curriculum-container";
    else if (yearNum === 7 || yearNum === 8) containerId = "f6-curriculum-container";
    else if (yearNum === 9)                 containerId = "y9-curriculum-container";
    else if (yearNum === 10)                containerId = "y10-curriculum-container";

    if (containerId) {
      var el = document.getElementById(containerId);
      if (el) {
        // Change 4: Only show the Y1 container if the Y1 tab is active.
        // When Y2 tab is active, we still render (populate the cached DOM)
        // but leave the container hidden so it doesn't overlap Y2 content.
        // Note: window.__aed_activeYearTab is used because this function
        // lives in a separate IIFE from the window.__aed_activeYearTab variable.
        if (window.__aed_activeYearTab !== 'y2') {
          el.style.display = "block";
        }
        renderCurriculumOptions(containerId);
      }
    }
  }

  // ─── REFRESH STEP 4 (Y2) ────────────────────────────────────────────────
  function refreshY2CurriculumDisplay() {
    // Change 4: Read year from __aed_child_applications first (reliable
    // source) because the DOM dropdown may not be updated yet during
    // step transitions and child switches.
    var yearNum = null;
    var childIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var savedData = (window.__aed_child_applications && window.__aed_child_applications[childIdx]) || {};
    if (savedData.student_year_level) {
      var raw = savedData.student_year_level;
      if (raw === 'FOUNDATION') { yearNum = 0; }
      else {
        var m = raw.match(/\d+/);
        if (m) yearNum = parseInt(m[0], 10);
      }
    }
    // Fallback to DOM dropdown
    if (yearNum === null) {
      yearNum = getCurrentYearNum();
    }
    if (yearNum === null) return;

    // Step 4 shows the NEXT year level
    var nextYearNum = yearNum + 1;
    if (nextYearNum > 10) return; // No Year 11

    // Update the heading
    var heading = document.getElementById('y2-step-heading');
    if (heading) {
      var nameInput = document.querySelector('input[name="student_first_name"]');
      var name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : null;
      var nextLabel = nextYearNum === 0 ? 'Foundation Year' : 'Year ' + nextYearNum;
      heading.textContent = name
        ? "Select " + name + "'s " + nextLabel + " curriculum & electives"
        : "Select " + nextLabel + " curriculum & electives";
    }

    // Hide all _y2 containers first
    ["f6-curriculum-container_y2", "y9-curriculum-container_y2", "y10-curriculum-container_y2"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    var containerId = null;
    if (nextYearNum <= 8)       containerId = "f6-curriculum-container_y2";
    else if (nextYearNum === 9) containerId = "y9-curriculum-container_y2";
    else if (nextYearNum === 10) containerId = "y10-curriculum-container_y2";

    if (containerId) {
      var el = document.getElementById(containerId);
      if (el) {
        el.style.display = "block";
        // Temporarily override getCurriculumContext yearNum for the Y2 render
        var originalGetYearNum = window.__aed_getCurrentYearNum;
        window.__aed_getCurrentYearNum = function() { return nextYearNum; };
        var savedFn = getCurrentYearNum;
        // Patch locally for this render
        renderCurriculumOptionsForYear(containerId, nextYearNum);
        window.__aed_getCurrentYearNum = originalGetYearNum;
      }
    }
  }

  function renderCurriculumOptionsForYear(targetContainerId, yearNum) {
    var container = document.getElementById(targetContainerId);
    if (!container) return;

    var stateCode = getCurrentStateValue();
    var pathway   = getCurriculumPathway(stateCode);
    var yearBand  = getYearBand(yearNum);
    if (!yearBand) return;

    var context = {
      stateCode : stateCode,
      pathway   : pathway,
      pathwayId : pathway.id,
      yearNum   : yearNum,
      yearBand  : yearBand,
      mandatory : (pathway.mandatory  && pathway.mandatory[yearBand])  || null,
      electives : (pathway.electives  && pathway.electives[yearBand])  || null
    };

    var childIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var renderKey = context.pathwayId + "|" + context.yearBand;

    // Ensure cache structure exists
    if (!_curriculumDOMCache[targetContainerId]) _curriculumDOMCache[targetContainerId] = {};
    var cached = _curriculumDOMCache[targetContainerId][childIdx];

    // Detach any currently visible wrapper without destroying it
    var currentWrap = container.querySelector('.aed-dynamic-curriculum');
    if (currentWrap) {
      container.removeChild(currentWrap);
    }
    if (!currentWrap && container.innerHTML.trim()) {
      container.innerHTML = "";
    }

    // CACHE HIT: reattach and restore pills
    if (cached && cached.renderKey === renderKey && cached.wrapEl) {
      console.log("⚡ AED: Y2 cache hit for " + targetContainerId + " child " + childIdx + " — reattaching DOM");
      container.appendChild(cached.wrapEl);
      restoreSavedCurriculumPills(container, true);
      syncLanguageDropdown(container, true);
      document.dispatchEvent(new CustomEvent("aed:curriculumRendered", { detail: { step: 4 } }));
      return;
    }

    // CACHE MISS: build new DOM
    console.log("🎨 AED: Building Y2 curriculum for " + targetContainerId + " child " + childIdx + " (" + context.pathwayId + " / " + context.yearBand + ")");

    var wrap = document.createElement("div");
    wrap.className = "aed-dynamic-curriculum";

    if (context.mandatory) renderMandatoryBanner(context.mandatory, wrap);

    if (context.electives) {
      Object.keys(context.electives).forEach(function(areaKey) {
        var cfg = context.electives[areaKey];
        if (PATHWAY_KEYS.indexOf(areaKey) !== -1) {
          renderPathwayCard(areaKey, cfg, wrap);
        } else {
          renderElectiveCard(areaKey, cfg, wrap);
        }
      });
    }

    renderLanguagesSection(wrap, yearBand);
    container.appendChild(wrap);

    // Store in cache
    _curriculumDOMCache[targetContainerId][childIdx] = {
      renderKey: renderKey,
      wrapEl: wrap
    };

    restoreSavedCurriculumPills(container, true);
    syncLanguageDropdown(container, true);
    console.log("✅ AED: Y2 curriculum rendered + cached for " + targetContainerId + " child " + childIdx);
    // Signal that rendering + initial restore is complete
    document.dispatchEvent(new CustomEvent("aed:curriculumRendered", { detail: { step: 4 } }));
  }

  window.__aed_refreshY2CurriculumDisplay = refreshY2CurriculumDisplay;

  // ─── INITIALISE ───────────────────────────────────────────────────────────
  function initCurriculumIntegration() {
    console.log("🔌 AED: Initialising curriculum integration (v3 — cached DOM)...");

    // Year level change — invalidate this child's cache since context changed
    var yearSelect = document.querySelector('select[name="student_year_level"]');
    if (yearSelect) {
      yearSelect.addEventListener("change", function() {
        // Skip cache invalidation during loadChildData — the year level is just
        // being restored from saved data, not genuinely changing. Clearing the
        // cache here would force a rebuild that races with other restore logic
        // and can cause the language dropdown to lose its value.
        if (window.__aed_is_loading_data) return;

        var childIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
        if (window.__aed_clearCurriculumCacheForChild) {
          window.__aed_clearCurriculumCacheForChild(childIdx);
        }
        setTimeout(refreshCurriculumDisplay, 100);
      });
    }

    // State change — listen for the custom event dispatched by the state picker.
    // Replaces the old 500ms setInterval polling which caused unnecessary
    // re-renders and potential timing conflicts.
    document.addEventListener("aed:stateChanged", function() {
      // State change affects all children — clear the whole cache
      _curriculumDOMCache = {};
      setTimeout(refreshCurriculumDisplay, 100);
    });

    // Change 3: Step 3/4 MutationObservers REMOVED.
    // refreshCurriculumDisplay() and refreshY2CurriculumDisplay() are now
    // called directly from setActive() via the centralised dispatch block.

    // Initial render — year level may already be set from saved data
    setTimeout(refreshCurriculumDisplay, 200);

    // Wire into existing events
    document.addEventListener("aed:pillsChanged", function() {
      if (typeof calculateWorkload === "function") setTimeout(calculateWorkload, 50);
      if (typeof updateCheckboxes  === "function") setTimeout(updateCheckboxes,  50);
    });

    console.log("✅ AED: Curriculum integration initialised (v3 — cached DOM)");
  }

  // Expose for debugging
// ─── RESTORE SAVED PILL SELECTIONS ───────────────────────────────────────
  // Called at the end of every render pass to re-apply saved selections.
  function restoreSavedCurriculumPills(containerEl, isY2) {
    var idx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var data = (window.__aed_child_applications && window.__aed_child_applications[idx]) || {};

var fields = isY2
      ? ["english_pathway_y2","mathematics_pathway_y2","science_pathway_y2","the_arts_y2","technologies_y2","hass_y2", "creative_arts_y2", "technological_and_applied_studies_y2", "hsie_y2", "pdhpe_y2", "humanities_y2", "hpe_y2"]
      : ["english_pathway","mathematics_pathway","science_pathway","the_arts","technologies","hass", "creative_arts", "technological_and_applied_studies", "hsie", "pdhpe", "humanities", "hpe"];

    fields.forEach(function(fieldName) {
      var saved = data[fieldName];

      // Find the hidden input for this field inside this container
      var hiddenInput = containerEl.querySelector('input.aed-hidden-input[name="' + fieldName + '"]');
      if (!hiddenInput) return;

      var card = hiddenInput.closest('[data-learning-area]');
      if (!card) return;

      // With cached DOM (Change 2), we must explicitly deselect all non-locked
      // pills when there's no saved data, otherwise stale selections from a
      // previous render persist visually.
      if (!saved || !saved.length) {
        card.querySelectorAll('.aed-dynamic-pill').forEach(function(pill) {
          if (pill.getAttribute('data-locked') === 'true') return;
          pill.classList.remove('is-selected');
        });
        hiddenInput.value = JSON.stringify([]);
        var countEl = card.querySelector('.aed-elective-card-count');
        if (countEl) countEl.textContent = '';
        return;
      }

card.querySelectorAll('.aed-dynamic-pill').forEach(function(pill) {
      if (pill.getAttribute('data-locked') === 'true') return;
      var submitVal = pill.getAttribute('data-submit-value');
      var dataVal   = pill.getAttribute('data-value');
      pill.classList.toggle('is-selected',
        saved.indexOf(submitVal) !== -1 || saved.indexOf(dataVal) !== -1
      );
    });

      hiddenInput.value = JSON.stringify(saved);

      // Update count badge on accordion cards
      var countEl = card.querySelector('.aed-elective-card-count');
      if (countEl) {
        var n = card.querySelectorAll('.aed-dynamic-pill.is-selected').length;
        countEl.textContent = n > 0 ? n + ' selected' : '';
      }
    });

    // Restore language dropdown
// FIX — only fall back to Y1 when actually rendering Y1 card:
var langKey = isY2 ? 'language_of_study_y2' : 'language_of_study';
var savedLang = data[langKey];
// For Y2 card: if no Y2-specific value saved yet, default to Y1 language
if (!savedLang && isY2) savedLang = data['language_of_study'];
    var langBody = containerEl.querySelector('.aed-languages-card-body');
    if (langBody) {
      var dynSel = langBody.querySelector('select');
      if (dynSel) {
        var resolvedLang = "";
        // With cached DOM, always set the value — even to empty — so stale
        // selections from a previous child don't persist.
        if (savedLang) {
          // Direct match first (handles values already in correct case)
          dynSel.value = savedLang;
          resolvedLang = dynSel.value;
          // If direct match failed (e.g. "french" vs "French"), try case-insensitive
          if (!resolvedLang || resolvedLang === "") {
            var lowerSaved = savedLang.toLowerCase();
            for (var oi = 0; oi < dynSel.options.length; oi++) {
              if (dynSel.options[oi].value.toLowerCase() === lowerSaved) {
                dynSel.value = dynSel.options[oi].value;
                resolvedLang = dynSel.options[oi].value;
                // Also fix the stored value so future restores are instant
                if (window.__aed_child_applications) {
                  var fixIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
                  if (window.__aed_child_applications[fixIdx]) {
                    window.__aed_child_applications[fixIdx][langKey] = resolvedLang;
                  }
                }
                break;
              }
            }
          }
        } else {
          dynSel.value = "";
        }

        // Sync back to the hidden Webflow select so collectChildData() picks it up.
        // The dynamic dropdown has no name attribute, so DOM scraping misses it.
        var hiddenLangSelect = document.querySelector('select[name="' + langKey + '"]');
        if (hiddenLangSelect) {
          hiddenLangSelect.value = resolvedLang;
        }
      }
    }
  }

  // Expose for debugging
  window.__aed_renderCurriculumOptions  = renderCurriculumOptions;
  window.__aed_refreshCurriculumDisplay = refreshCurriculumDisplay;
  window.__aed_restoreSavedCurriculumPills = restoreSavedCurriculumPills;

  // Boot after existing code has run
  setTimeout(initCurriculumIntegration, 600);

  console.log("✅ AED: Curriculum pill rendering system loaded (v3 — cached DOM)");

})();

// --- Curriculum coverage (inside Webflow.push for closure-scoped functions) ---

window.Webflow ||= [];
window.Webflow.push(function () {
  "use strict";

  /* =========================
     CURRICULUM COVERAGE
     ========================= */

  const CURRICULUM_CHECKBOX_SELECTOR = 'input.curriculum-checkbox[type="checkbox"]';
  const CURRICULUM_OUTPUT_FIELD_SELECTOR =
    '#curriculum_coverage[name="curriculum_coverage"], input[name="curriculum_coverage"], #curriculum_coverage';

  function getCurriculumSelections(scopeEl) {
    const root = scopeEl || document;
    return Array.from(root.querySelectorAll(CURRICULUM_CHECKBOX_SELECTOR))
      .filter(cb => cb.checked)
.map(cb => (cb.getAttribute("data-value") || "").trim()) 
  .filter(Boolean);
  }

  function writeCurriculumCoverage(scopeEl) {
    const root = scopeEl || document;
    const outField = root.querySelector(CURRICULUM_OUTPUT_FIELD_SELECTOR);
    if (!outField) return false;

    outField.value = JSON.stringify(getCurriculumSelections(root));
    outField.dispatchEvent(new Event("input", { bubbles: true }));
    outField.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function bindCurriculumCheckboxes() {
    const checkboxes = Array.from(document.querySelectorAll(CURRICULUM_CHECKBOX_SELECTOR));
    if (!checkboxes.length) return;

    checkboxes.forEach(cb => cb.addEventListener("change", function () {
      writeCurriculumCoverage(document);
    }));

    writeCurriculumCoverage(document);

    document.addEventListener("submit", function (ev) {
      writeCurriculumCoverage(ev.target || document);
    }, true);
  }

  function applyDefaultCheckedGroups() {
    Array.from(document.querySelectorAll('[data-default-checked-group="curriculum"]'))
      .forEach(group => {
        Array.from(group.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
          cb.checked = true;
          cb.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });

    writeCurriculumCoverage(document);
  }

  /* =========================
     Expose closure-scoped functions
     ========================= */
  window.bindCurriculumCheckboxes  = bindCurriculumCheckboxes;
  window.applyDefaultCheckedGroups = applyDefaultCheckedGroups;
  window.writeCurriculumCoverage   = writeCurriculumCoverage;
});

// --- Top-level curriculum functions (outside Webflow.push) ---

/* =========================
   LANGUAGE DROPDOWN TOGGLE (Ultimate Fix v6 + Shield)
   ========================= */
function bindLanguageToggle() {
  function syncAll() {
    const langCbs = document.querySelectorAll([
      'input[data-value="languages"]',
      'input[data-value="Languages"]',
      'input[name="languages"]',
      'input[id="languages"]',
      'input[name="languages_y2"]',
      'input[id="languages_y2"]',
      'input[id="Languages_y2"]',
      'input[name="Languages_y2"]'
    ].join(', '));
    langCbs.forEach(function(cb) {
      // First try searching upward through parents (Step 3 behaviour)
      let wrap = null;
      let parent = cb.parentElement;
      while (parent && parent !== document.body) {
        wrap = parent.querySelector('.language-of-study-wrap');
        if (wrap) break;
        parent = parent.parentElement;
      }

      // If not found upward, try finding the wrap inside the same step panel (Step 4 behaviour)
      if (!wrap) {
        const stepPanel = cb.closest('.step');
        if (stepPanel) wrap = stepPanel.querySelector('.language-of-study-wrap');
      }

      if (!wrap) return;
      const select = wrap.querySelector("select");

      if (cb.checked) {
        wrap.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; height: auto !important; margin-top: 12px;';
        if (select) {
          select.style.cssText = 'display: block !important; width: 100%;';
          select.required = true;
        }
      } else {
        wrap.style.cssText = 'display: none !important;';
        if (select) {
          select.required = false;
          if (!window.__aed_is_loading_data) {
            select.value = "";
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    });
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_syncLanguageToggle = syncAll;

  document.addEventListener("change", function(e) {
    if (e.target && e.target.type === 'checkbox') setTimeout(syncAll, 50);
  }, true);
  
  document.addEventListener("click", function(e) {
    if (e.target && e.target.closest('.w-checkbox')) setTimeout(syncAll, 50);
  }, true);

  // Change 3: MutationObserver REMOVED — syncAll is now called from setActive()

  setTimeout(syncAll, 100); 
}

/* =========================
   FOUNDATION LABEL BY STATE — Moved to aed-config.js (Module 1)
   ========================= */

// getSelectedStateValue moved to aed-state.js (Module 3)
var getSelectedStateValue = window.getSelectedStateValue;
var getChildStateSelect   = window.getChildStateSelect;

function updateFoundationOptionLabel() {
  const yearLevelSelect = document.querySelector('select[name="student_year_level"]');
  if (!yearLevelSelect) return;

  const state = getSelectedStateValue();
  const label = FOUNDATION_LABEL_BY_STATE[state] || "Foundation";

  // Find the FOUNDATION option (stable internal value)
  const foundationOpt = yearLevelSelect.querySelector('option[value="FOUNDATION"]');
  if (!foundationOpt) return;

  // Update what the user sees
  foundationOpt.textContent = label;

  // (Optional but nice) if currently selected, ensure UI redraw
  // Webflow usually updates automatically, but this keeps it consistent.
  yearLevelSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function bindFoundationLabelByState() {
  const stateSelect = getChildStateSelect();
  if (!stateSelect) return;

  // Run once on load
  updateFoundationOptionLabel();

  // Update whenever State changes
  if (stateSelect.dataset.aedFoundationBound === "1") return;
  stateSelect.dataset.aedFoundationBound = "1";

  stateSelect.addEventListener("change", () => {
    updateFoundationOptionLabel();
  });
}

function bindCurriculumVisibility() {
  var yearDropdown = document.querySelector('select[name="student_year_level"]');
  
  var coreF8Container = document.getElementById('f6-curriculum-container'); 
  var artsPillsY78 = document.getElementById('y78-arts-pills');
  var y9Container = document.getElementById('y9-curriculum-container');
  var y10Container = document.getElementById('y10-curriculum-container');

  if (!yearDropdown) return;

  var bannerContainer = document.getElementById('aed-curriculum-banner');
  if (!bannerContainer) {
    bannerContainer = document.createElement('div');
    bannerContainer.id = 'aed-curriculum-banner';
    bannerContainer.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1450px; width: 100%; box-sizing: border-box; display: none;';
    var parentWrap = coreF8Container ? coreF8Container.parentNode : null;
    if (parentWrap) parentWrap.insertBefore(bannerContainer, coreF8Container);
  }

  function lockSpecificElements(container) {
    if (!container) return;
    var lockedItems = container.querySelectorAll('.locked-checkbox');
    lockedItems.forEach(function(item) {
      if (item.type === 'checkbox') {
        item.checked = true;
        item.dispatchEvent(new Event('change', { bubbles: true })); 
      }
      var wrapper = item.closest('.w-checkbox') || item;
      if (wrapper) {
        wrapper.style.pointerEvents = 'none'; 
        wrapper.style.opacity = '0.7'; 
      }
    });
  }

function setCheckboxLock(selector, lockAndCheck) {
    var cbs = document.querySelectorAll(selector);
    cbs.forEach(function(cb) {
      var wrapper = cb.closest('.w-checkbox') || cb.parentElement;
      var realInput = cb.tagName === 'INPUT' ? cb : (wrapper ? wrapper.querySelector('input[type="checkbox"]') : null);
      
      if (lockAndCheck) {
        if (realInput) {
          realInput.checked = true;
          realInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (wrapper) {
          wrapper.style.pointerEvents = 'none';
          wrapper.style.opacity = '0.7';
        }
      } else {
        // 🛡️ THE FIX: Do not auto-uncheck if the shield is active!
        if (!window.__aed_is_loading_data && realInput && realInput.checked) {
          realInput.checked = false;
          realInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (wrapper) {
          wrapper.style.pointerEvents = 'auto';
          wrapper.style.opacity = '1';
        }
      }
    });
  }

  

  function checkYearLevel() {
     if (window.__aed_is_loading_data) return;
    var rawValue = yearDropdown.value;
    
    if (coreF8Container) coreF8Container.style.display = 'none';
    if (artsPillsY78) artsPillsY78.style.display = 'none';
    if (y9Container) y9Container.style.display = 'none';
    if (y10Container) y10Container.style.display = 'none';
    if (bannerContainer) bannerContainer.style.display = 'none';

    if (!rawValue) return;

    var isF6 = false, isY78 = false, isY9 = false, isY10 = false;

    if (rawValue === 'FOUNDATION') {
      isF6 = true;
    } else {
      var match = rawValue.match(/\d+/);
      if (match) {
        var yearNum = parseInt(match[0], 10);
        if (yearNum <= 6) isF6 = true; 
        if (yearNum === 7 || yearNum === 8) isY78 = true; 
        if (yearNum === 9) isY9 = true; 
        if (yearNum === 10) isY10 = true;
      }
    }

    if (isF6 || isY78) {
      if (coreF8Container) {
        coreF8Container.style.display = 'block';
        lockSpecificElements(coreF8Container); 
        setCheckboxLock('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]', true);
        
        var artsCb = document.getElementById('y78-arts-cb');
        if (artsCb) {
           var artsWrap = artsCb.closest('.w-checkbox') || artsCb.parentElement;
           var realInput = artsCb.tagName === 'INPUT' ? artsCb : artsWrap.querySelector('input[type="checkbox"]');
           
           if (isF6) {
             if (realInput) {
               realInput.checked = true;
               realInput.dispatchEvent(new Event('change', { bubbles: true }));
             }
             artsWrap.style.pointerEvents = 'none';
             artsWrap.style.opacity = '0.7';
             bannerContainer.innerHTML = '<strong>Curriculum Requirements (F-6)</strong><br>To meet standard home education requirements, your child will explore all 8 Key Learning Areas. This ensures a broad, foundational education.';
             bannerContainer.style.display = 'block';

           } else if (isY78) {
             if (realInput) {
               realInput.checked = true;
               realInput.dispatchEvent(new Event('change', { bubbles: true }));
             }
             artsWrap.style.pointerEvents = 'none';
             artsWrap.style.opacity = '0.7';
             bannerContainer.innerHTML = '<strong>Curriculum Requirements (Years 7-8)</strong><br>All 8 core areas are still required, but your child can now choose their specific focus within The Arts (select at least 1).';
             bannerContainer.style.display = 'block';
           }
        }
      }
    }

    if (isY78 && artsPillsY78) artsPillsY78.style.display = 'block';
    
    if (isY9 && y9Container) {
      // Y9 container is owned by the dynamic rendering system — do not show old static content.
      // Dynamic system handles visibility via refreshCurriculumDisplay.
      setCheckboxLock('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]', false);
    }
    
    if (isY10 && y10Container) {
      // Y10 container is owned by the dynamic rendering system — do not show old static content.
      setCheckboxLock('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]', false);
    }
  }

  yearDropdown.addEventListener('change', checkYearLevel);
  checkYearLevel();

  // Expose so loadChildData can re-trigger after __aed_is_loading_data clears
  window.__aed_checkYearLevel = checkYearLevel;
}

/* =========================
   CURRICULUM VALIDATION (Checks Rules on "Next" Click)
   ========================= */
window.validateCurriculum = function() {
  var existingErr = document.getElementById("curriculum-error-msg");
  if (existingErr) existingErr.style.display = "none";

  function showCurrError(msg, targetContainerId) {
    var errEl = document.getElementById("curriculum-error-msg");
    if (!errEl) {
      errEl = document.createElement("div");
      errEl.id = "curriculum-error-msg";
      errEl.style.cssText = "color:#c62828;background-color:#ffebee;border:1px solid #ffcdd2;padding:12px;border-radius:6px;margin-bottom:16px;font-family:Montserrat,sans-serif;font-size:14px;font-weight:500;";
    }
    errEl.textContent = msg;
    errEl.style.display = "block";
    var container = document.getElementById(targetContainerId);
    if (container) {
      container.insertAdjacentElement("afterbegin", errEl);
      errEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  var yearDropdown = document.querySelector("select[name=\"student_year_level\"]");
  if (!yearDropdown) return true;
  var rawValue = yearDropdown.value;
  if (!rawValue || rawValue === "FOUNDATION") return true;
  var match = rawValue.match(/\d+/);
  if (!match) return true;
  var yearNum = parseInt(match[0], 10);

  // Helper: count selected pills in a dynamic section
function countDynamic(learningArea, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return 0;
    var section = container.querySelector("[data-learning-area=\"" + learningArea + "\"]");
    if (!section) return 0;
    return section.querySelectorAll(".aed-dynamic-pill.is-selected").length;
  }

  // Helper: count selected pills in a static (original) pill container
  function countStatic(wrapperId) {
    var wraps = document.querySelectorAll("#" + wrapperId);
    var wrap  = Array.from(wraps).find(function(el) { return el.offsetParent !== null; }) || wraps[0];
    if (!wrap || wrap.offsetParent === null) return 0;
    return wrap.querySelectorAll(".ms-option.is-selected").length;
  }

  // ─────────────────────────────────────────────────────
  // RULE 0: F–Y8 — Languages is mandatory; a language must be selected
  // ─────────────────────────────────────────────────────
  if (yearNum <= 8) {
    var langContainerId = (yearNum <= 6) ? "f6-curriculum-container"
                        : (yearNum <= 8) ? "f6-curriculum-container"
                        : null;
    // For Y7-8 the container is still f6-curriculum-container
    var langContainer = document.getElementById("f6-curriculum-container");
    var langVal = "";
    if (langContainer) {
      var dynSel = langContainer.querySelector("select");
      if (dynSel) langVal = dynSel.value;
    }
    // Fallback: real Webflow select
    if (!langVal) {
      var realLangSel = document.querySelector('select[name="language_of_study"]');
      if (realLangSel) langVal = realLangSel.value;
    }
    if (!langVal) {
      showCurrError("Languages is required for this year level. Please select a language of study.", "f6-curriculum-container");
      return false;
    }
  }

  // ─────────────────────────────────────────────────────
  // RULE 1: Years 7-8 — pathway selectors must each have 1 selected
  // ─────────────────────────────────────────────────────
  if (yearNum === 7 || yearNum === 8) {
    var containerId78 = "f6-curriculum-container";

    if (countDynamic("english_pathway", containerId78) < 1) {
      showCurrError("Please select an English pathway.", containerId78);
      return false;
    }
    if (countDynamic("mathematics_pathway", containerId78) < 1) {
      showCurrError("Please select a Mathematics pathway.", containerId78);
      return false;
    }
    if (countDynamic("science_pathway", containerId78) < 1) {
      showCurrError("Please select a Science pathway.", containerId78);
      return false;
    }

    // Arts — check dynamic first, fall back to static
    var artsSelectedY78 = countDynamic("the_arts", containerId78) +
                          countDynamic("creative_arts", containerId78) +
                          countStatic("y78-arts-pills");
    if (artsSelectedY78 < 1) {
      showCurrError("Please select at least 1 Arts subject.", containerId78);
      return false;
    }

    // Victoria: must have 1 performing + 1 visual
    var context78 = getCurriculumContext();
    if (context78.pathwayId === "vic_vcaa") {
      var artsSection78 = document.querySelector("#" + containerId78 + " .aed-learning-area-section[data-learning-area=\"the_arts\"]");
      if (artsSection78) {
        var performing = artsSection78.querySelectorAll(".aed-dynamic-pill.is-selected[data-category=\"performing\"]").length;
        var visual     = artsSection78.querySelectorAll(".aed-dynamic-pill.is-selected[data-category=\"visual\"]").length;
        if (performing < 1 || visual < 1) {
          showCurrError("Victorian curriculum requires at least 1 Performing Arts and 1 Visual Arts subject.", containerId78);
          return false;
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────
  // RULE 2: Years 9-10 — pathways + 2 electives from different areas
  // ─────────────────────────────────────────────────────
  if (yearNum === 9 || yearNum === 10) {
    var prefix      = yearNum === 9 ? "y9" : "y10";
    var containerId = prefix + "-curriculum-container";

    // Pathway checks
    if (countDynamic("english_pathway", containerId) < 1) {
      showCurrError("Please select an English pathway.", containerId);
      return false;
    }
    if (countDynamic("mathematics_pathway", containerId) < 1) {
      showCurrError("Please select a Mathematics pathway.", containerId);
      return false;
    }
    if (countDynamic("science_pathway", containerId) < 1) {
      showCurrError("Please select a Science pathway.", containerId);
      return false;
    }

    // Elective area counting
    var selectedAreas    = [];
    var totalElectives   = 0;

    // Technologies — dynamic or static
    var techCount = countDynamic("technologies", containerId) +
                    countDynamic("technological_and_applied_studies", containerId) +
                    countStatic(prefix + "-tech-pills");
    if (techCount > 0) { selectedAreas.push("Technologies"); totalElectives += techCount; }

    // The Arts — dynamic or static
    var artsCount = countDynamic("the_arts", containerId) +
                    countDynamic("creative_arts", containerId) +
                    countStatic(prefix + "-arts-pills");
    if (artsCount > 0) { selectedAreas.push("The Arts"); totalElectives += artsCount; }

    // HASS electives — dynamic or static (static counts above 1 since History is locked)
    var hassCount        = countDynamic("hass", containerId) + countDynamic("hsie", containerId) + countDynamic("humanities", containerId);
    var hassStaticCount  = countStatic(prefix + "-hass-pills");
    var hassElectives    = hassCount + (hassStaticCount > 1 ? hassStaticCount - 1 : 0);
    if (hassElectives > 0) { selectedAreas.push("Humanities and Social Sciences"); totalElectives += hassElectives; }

    // Languages checkbox (existing)
    var hasLang = false;
    document.querySelectorAll("input.curriculum-checkbox[data-value=\"languages\"], input[name=\"languages\"], input[id=\"languages\"]").forEach(function(cb) {
      if (cb.checked && cb.offsetParent !== null) hasLang = true;
    });
    if (hasLang) { selectedAreas.push("Languages"); totalElectives += 1; }

    // PDHPE electives (NSW only)
    var hpeCount = countDynamic("pdhpe", containerId);
    if (hpeCount > 0) { selectedAreas.push("PDHPE"); totalElectives += hpeCount; }

    // HPE electives (national)
    var hpeNatCount = countDynamic("hpe", containerId);
    if (hpeNatCount > 0) { selectedAreas.push("Health and Physical Education"); totalElectives += hpeNatCount; }

    if (selectedAreas.length < 2) {
      var areasText = selectedAreas.length === 1 ? selectedAreas[0] : "none";
      showCurrError("Please select electives from at least 2 different learning areas. Currently you only have electives from: " + areasText + ".", containerId);
      return false;
    }

    if (totalElectives < 2) {
      showCurrError("Please select at least 2 electives in total.", containerId);
      return false;
    }

    // Victoria Y9: must have at least 1 Arts
    var context910 = getCurriculumContext();
    if (context910.pathwayId === "vic_vcaa" && yearNum === 9) {
      if (artsCount < 1) {
        showCurrError("Victorian Year 9 requires at least 1 Arts subject.", containerId);
        return false;
      }
    }
  }

  return true;
};

/* =========================
   VALIDATE Y2 CURRICULUM (Step 4)
   ========================= */
window.validateY2Curriculum = function() {
  var existingErr = document.getElementById("curriculum-y2-error-msg");
  if (existingErr) existingErr.style.display = "none";

  function showY2Error(msg, targetContainerId) {
    var errEl = document.getElementById("curriculum-y2-error-msg");
    if (!errEl) {
      errEl = document.createElement("div");
      errEl.id = "curriculum-y2-error-msg";
      errEl.style.cssText = "color:#c62828;background-color:#ffebee;border:1px solid #ffcdd2;padding:12px;border-radius:6px;margin-bottom:16px;font-family:Montserrat,sans-serif;font-size:14px;font-weight:500;";
    }
    errEl.textContent = msg;
    errEl.style.display = "block";
    var container = document.getElementById(targetContainerId);
    if (container) {
      container.insertAdjacentElement("afterbegin", errEl);
      errEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Find active Y2 container and derive the actual Y2 year from saved child data.
  // The f6-curriculum-container_y2 covers F through Y8, so we cannot assume the
  // year from the container ID alone — a Year 5 child's Y2 is Year 6 (F-6 band,
  // no pathways), not Year 8.
  var y2Containers = ["f6-curriculum-container_y2","y9-curriculum-container_y2","y10-curriculum-container_y2"];
  var activeY2Container = null;
  y2Containers.forEach(function(cid) {
    var el = document.getElementById(cid);
    if (el && el.offsetParent !== null) {
      activeY2Container = cid;
    }
  });
  if (!activeY2Container) return true; // Y2 panel not shown — skip

  // Derive actual Y2 year number from saved data (Y1 year + 1)
  var y2YearNum = null;
  try {
    var cidx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var cdata = window.__aed_child_applications && window.__aed_child_applications[cidx];
    if (cdata && cdata.student_year_level) {
      var rawYL = cdata.student_year_level;
      if (rawYL === 'Foundation Year' || rawYL === 'FOUNDATION') { y2YearNum = 1; }
      else {
        var ym = rawYL.match(/\d+/);
        if (ym) y2YearNum = parseInt(ym[0], 10) + 1;
      }
    }
  } catch (e) {}
  // Fallback to DOM dropdown
  if (y2YearNum === null) {
    var ylDrop = document.querySelector('select[name="student_year_level"]');
    if (ylDrop && ylDrop.value) {
      var rawDom = ylDrop.value;
      if (rawDom === 'FOUNDATION') { y2YearNum = 1; }
      else {
        var dm = rawDom.match(/\d+/);
        if (dm) y2YearNum = parseInt(dm[0], 10) + 1;
      }
    }
  }
  if (y2YearNum === null) return true; // Can't determine year — skip validation

  function countDynamic2(learningArea, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return 0;
    var section = container.querySelector("[data-learning-area=\"" + learningArea + "\"]");
    if (!section) return 0;
    return section.querySelectorAll(".aed-dynamic-pill.is-selected").length;
  }

  var cid = activeY2Container;

  // Language: mandatory for F-Y8 band
  if (y2YearNum !== null && y2YearNum <= 8) {
    var langContainer = document.getElementById(cid);
    var langVal = "";
    if (langContainer) {
      var dynSel = langContainer.querySelector("select");
      if (dynSel) langVal = dynSel.value;
    }
    if (!langVal) {
      var realLangSel2 = document.querySelector('select[name="language_of_study_y2"]');
      if (realLangSel2) langVal = realLangSel2.value;
    }
    if (!langVal) {
      showY2Error("Languages is required for this year level. Please select a language of study.", cid);
      return false;
    }
  }

  // Y7-8: pathway + arts required
  if (y2YearNum !== null && (y2YearNum === 7 || y2YearNum === 8)) {
    if (countDynamic2("english_pathway", cid) < 1)    { showY2Error("Please select an English pathway.", cid); return false; }
    if (countDynamic2("mathematics_pathway", cid) < 1){ showY2Error("Please select a Mathematics pathway.", cid); return false; }
    if (countDynamic2("science_pathway", cid) < 1)    { showY2Error("Please select a Science pathway.", cid); return false; }
    var artsY2 = countDynamic2("the_arts", cid) + countDynamic2("creative_arts", cid);
    if (artsY2 < 1) { showY2Error("Please select at least 1 Arts subject.", cid); return false; }
  }

  // Y9-10: pathways + 2 electives from 2 areas
  if (y2YearNum !== null && (y2YearNum === 9 || y2YearNum === 10)) {
    if (countDynamic2("english_pathway", cid) < 1)    { showY2Error("Please select an English pathway.", cid); return false; }
    if (countDynamic2("mathematics_pathway", cid) < 1){ showY2Error("Please select a Mathematics pathway.", cid); return false; }
    if (countDynamic2("science_pathway", cid) < 1)    { showY2Error("Please select a Science pathway.", cid); return false; }
    var selectedAreas2 = [];
    var totalElectives2 = 0;
    var techCount2 = countDynamic2("technologies", cid) + countDynamic2("technological_and_applied_studies", cid);
    if (techCount2 > 0) { selectedAreas2.push("Technologies"); totalElectives2 += techCount2; }
    var artsCount2 = countDynamic2("the_arts", cid) + countDynamic2("creative_arts", cid);
    if (artsCount2 > 0) { selectedAreas2.push("The Arts"); totalElectives2 += artsCount2; }
    var hassCount2 = countDynamic2("hass", cid) + countDynamic2("hsie", cid) + countDynamic2("humanities", cid);
    if (hassCount2 > 0) { selectedAreas2.push("Humanities and Social Sciences"); totalElectives2 += hassCount2; }
    var hpeCount2 = countDynamic2("hpe", cid) + countDynamic2("pdhpe", cid);
    if (hpeCount2 > 0) { selectedAreas2.push("Health and Physical Education"); totalElectives2 += hpeCount2; }
    if (selectedAreas2.length < 2) { showY2Error("Please select electives from at least 2 different learning areas.", cid); return false; }
    if (totalElectives2 < 2)       { showY2Error("Please select at least 2 electives in total.", cid); return false; }
  }

  return true;
};

function initYearTabs() {
  var step3 = document.querySelector('.step[data-step="3"]');
  var step4 = document.querySelector('.step[data-step="4"]');
  if (!step3) return;

  // ── 1. Create the tab bar ──────────────────────────────────────────────
  var tabBar = document.createElement('div');
  tabBar.id = 'aed-year-tabs';
  // Hidden by default; syncYearTabs() will show it when split-year

  var tabY1 = document.createElement('button');
  tabY1.type = 'button';
  tabY1.className = 'aed-year-tab is-active';
  tabY1.id = 'aed-tab-y1';
  tabY1.textContent = 'Year 1 Curriculum';

  var tabY2 = document.createElement('button');
  tabY2.type = 'button';
  tabY2.className = 'aed-year-tab';
  tabY2.id = 'aed-tab-y2';
  tabY2.textContent = 'Year 2 Curriculum';

  tabBar.appendChild(tabY1);
  tabBar.appendChild(tabY2);

  // Insert the tab bar at the top of Step 3, right before the curriculum area
  // Look for the Y1 heading as an anchor, otherwise prepend
  var y1Heading = document.getElementById('y1-step-heading');
  if (y1Heading) {
    y1Heading.parentNode.insertBefore(tabBar, y1Heading);
  } else {
    step3.insertBefore(tabBar, step3.firstChild);
  }

  // ── 2. Create Y1/Y2 wrapper panels ────────────────────────────────────
  // Wrap the existing Y1 curriculum content in a panel div.
  // The Y1 containers are: f6-curriculum-container, y9-curriculum-container, y10-curriculum-container
  // Plus the workload tracker, curriculum banner, etc.
  // We'll wrap them by creating a panel and moving key elements into it.

  // Create Y2 panel wrapper
  var y2Panel = document.createElement('div');
  y2Panel.className = 'aed-y2-panel';
  y2Panel.id = 'aed-y2-curriculum-panel';
  y2Panel.style.cssText = 'width: 1450px; box-sizing: border-box;';

  // ── 3. Relocate Y2 containers from Step 4 into Step 3 ─────────────────
  // Change 4: Also create the Y2 banner if it doesn't exist yet
  // (previously created by bindY2CurriculumVisibility, now handled here)
  var f6Y2 = document.getElementById('f6-curriculum-container_y2');
  if (!document.getElementById('aed-curriculum-banner_y2')) {
    var bannerY2 = document.createElement('div');
    bannerY2.id = 'aed-curriculum-banner_y2';
    bannerY2.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1450px; width: 100%; box-sizing: border-box; display: none;';
    if (f6Y2 && f6Y2.parentNode) {
      f6Y2.parentNode.insertBefore(bannerY2, f6Y2);
    }
  }

  if (step4) {
    var y2ContainerIds = ['aed-curriculum-banner_y2', 'f6-curriculum-container_y2', 'y9-curriculum-container_y2', 'y10-curriculum-container_y2'];
    y2ContainerIds.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.style.width = '100%';
        el.style.boxSizing = 'border-box';
        y2Panel.appendChild(el);
      }
    });

    // Also move the Y2 heading into the panel
    var y2Heading = document.getElementById('y2-step-heading');
    if (y2Heading) {
      y2Panel.insertBefore(y2Heading, y2Panel.firstChild);
    }
  }

  // Insert Y2 panel at the end of Step 3's curriculum area
  // (after the last Y1 curriculum container)
  var lastY1Container = document.getElementById('y10-curriculum-container') ||
                         document.getElementById('y9-curriculum-container') ||
                         document.getElementById('f6-curriculum-container');

  if (lastY1Container && lastY1Container.parentNode) {
    // Insert after the last Y1 container
    if (lastY1Container.nextSibling) {
      lastY1Container.parentNode.insertBefore(y2Panel, lastY1Container.nextSibling);
    } else {
      lastY1Container.parentNode.appendChild(y2Panel);
    }
  } else {
    // Fallback: just append to Step 3
    step3.appendChild(y2Panel);
  }

  // ── 4. Tab click handlers ──────────────────────────────────────────────
  tabY1.addEventListener('click', function() {
    if (typeof window.__aed_switchYearTab === 'function') {
      window.__aed_switchYearTab('y1');
    }
  });

  tabY2.addEventListener('click', function() {
    if (typeof window.__aed_switchYearTab === 'function') {
      window.__aed_switchYearTab('y2');
    }
  });

  // ── 5. Expose the tab switching function ───────────────────────────────
  window.__aed_switchYearTab = function(tab) {
    // Save current tab's data before switching
    if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently();

    window.__aed_activeYearTab = tab;

    // Sync all visual state (tab buttons, panels, Y1 container visibility)
    if (typeof window.__aed_syncYearTabs === 'function') {
      window.__aed_syncYearTabs();
    }

    // When switching to Y2, trigger a curriculum render for Y2
    if (tab === 'y2') {
      if (typeof window.__aed_refreshY2CurriculumDisplay === 'function') {
        window.__aed_refreshY2CurriculumDisplay();
      }
      // Restore Y2 pills after render completes
      if (typeof restoreDynamicPillsForStep === 'function') {
        setTimeout(function() {
          restoreDynamicPillsForStep(STEP_Y2);
        }, 100);
      }
      // Recalculate Y2 workload
      if (typeof window.__calculateY2Workload === 'function') {
        setTimeout(window.__calculateY2Workload, 150);
      }
    }

    // When switching to Y1, clear the !important hide first, then refresh
    if (tab === 'y1') {
      ['f6-curriculum-container', 'y9-curriculum-container', 'y10-curriculum-container'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.removeProperty('display');
      });
      if (typeof window.__aed_refreshCurriculumDisplay === 'function') {
        window.__aed_refreshCurriculumDisplay();
      }
    }

    // Update progress bar to reflect tab position
    if (typeof updateProgressBar === 'function') {
      setTimeout(updateProgressBar, 50);
    }

    console.log('📑 AED: Switched to ' + tab.toUpperCase() + ' tab');
  };

  // ── 6. Sync tab bar visibility (called from setActive and child switch) ──
  function getStudySpanForCurrentChild() {
    var childIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var childData = (window.__aed_child_applications && window.__aed_child_applications[childIdx]) || {};
    var studySpan = Array.isArray(childData.study_span)
      ? childData.study_span[0]
      : childData.study_span;

    // Also check the DOM if no saved data yet
    if (!studySpan) {
      var spanInput = document.querySelector('.ms-input[name="study_span"]');
      if (spanInput && spanInput.value) {
        try {
          var parsed = JSON.parse(spanInput.value);
          if (Array.isArray(parsed) && parsed.length > 0) studySpan = parsed[0];
        } catch (e) {}
      }
    }
    return studySpan;
  }

  function updateTabLabels() {
    var yearDropdown = document.querySelector('select[name="student_year_level"]');
    if (!yearDropdown || !yearDropdown.value) return;

    var rawVal = yearDropdown.value;
    var y1Label = '';
    var y2Label = '';

    if (rawVal === 'FOUNDATION') {
      y1Label = 'Prep';
      y2Label = 'Year 1';
    } else {
      var match = rawVal.match(/\d+/);
      if (match) {
        var y = parseInt(match[0], 10);
        y1Label = 'Year ' + y;
        y2Label = 'Year ' + (y + 1);
      }
    }

    if (y1Label) tabY1.textContent = y1Label + ' Curriculum';
    if (y2Label) tabY2.textContent = y2Label + ' Curriculum';
  }

  window.__aed_syncYearTabs = function() {
    var studySpan = getStudySpanForCurrentChild();
    var isSplit = studySpan && studySpan !== 'all_one_year';

    // Show/hide the tab bar
    if (isSplit) {
      tabBar.classList.add('is-visible');
    } else {
      tabBar.classList.remove('is-visible');
      // Force Y1 tab active when not split-year
      window.__aed_activeYearTab = 'y1';
    }

    // Sync tab button and panel states
    tabY1.classList.toggle('is-active', window.__aed_activeYearTab === 'y1');
    tabY2.classList.toggle('is-active', window.__aed_activeYearTab === 'y2');
    y2Panel.classList.toggle('is-active', window.__aed_activeYearTab === 'y2');

    // Hide Y1 elements when Y2 tab is active
    var y1HeadingEl = document.getElementById('y1-step-heading');
    if (y1HeadingEl) y1HeadingEl.style.display = (window.__aed_activeYearTab === 'y2') ? 'none' : '';

    var y1Banner = document.getElementById('aed-curriculum-banner');
    if (y1Banner) y1Banner.style.display = (window.__aed_activeYearTab === 'y2') ? 'none' : '';

    // Change 4: Hide the tracking widget (Y1 only) when Y2 tab is active
    var trackingWidget = document.getElementById('aed-tracking-widget');
    if (trackingWidget) trackingWidget.style.display = (window.__aed_activeYearTab === 'y2') ? 'none' : '';

    // Hide Y1 curriculum containers when Y2 tab is active.
    // When Y1: do NOT touch display — refreshCurriculumDisplay manages it.
    // removeProperty was reverting to Webflow CSS default of display:none.
    ['f6-curriculum-container', 'y9-curriculum-container', 'y10-curriculum-container'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (window.__aed_activeYearTab === 'y2') {
        el.style.setProperty('display', 'none', 'important');
      }
      // When Y1: intentionally do nothing
    });

    // Update tab labels with correct year names
    updateTabLabels();

    console.log('📑 AED: Tab bar synced — ' + (window.__aed_activeYearTab === 'y2' ? 'Y2' : 'Y1') + ' active, split=' + isSplit);
  };

  // ── 7. Initial sync ───────────────────────────────────────────────────
  setTimeout(function() {
    if (typeof window.__aed_syncYearTabs === 'function') {
      window.__aed_syncYearTabs();
    }
  }, 700);

  console.log('✅ AED: Y1/Y2 tab system initialised (Change 4)');
}

/* =========================
   Backward-compatible window.* aliases (top-level functions)
   ========================= */
window.bindLanguageToggle         = bindLanguageToggle;
window.bindFoundationLabelByState = bindFoundationLabelByState;
window.bindCurriculumVisibility   = bindCurriculumVisibility;
window.initYearTabs               = initYearTabs;
window.updateFoundationOptionLabel = updateFoundationOptionLabel;

/* =========================
   Expose on window.AED (clean namespace)
   ========================= */
window.AED.curriculum = {
  bindCurriculumCheckboxes: window.bindCurriculumCheckboxes,
  bindLanguageToggle: bindLanguageToggle,
  bindFoundationLabelByState: bindFoundationLabelByState,
  bindCurriculumVisibility: bindCurriculumVisibility,
  initYearTabs: initYearTabs,
  applyDefaultCheckedGroups: window.applyDefaultCheckedGroups,
  writeCurriculumCoverage: window.writeCurriculumCoverage,
  updateFoundationOptionLabel: updateFoundationOptionLabel
};

console.log("✅ aed-curriculum.js (Module 6) loaded");

// Init the tab system after everything else has loaded
setTimeout(initYearTabs, 600);
