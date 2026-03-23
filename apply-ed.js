// jumpToChild bridge moved to aed-navigation.js (Module 4)

// CSS injection moved to aed-config.js (Module 1)

window.Webflow ||= [];
window.Webflow.push(function () {
  "use strict";

  // aed_nav bridge moved to aed-navigation.js (Module 4)

  /* =========================
      CONFIG — Aliases from aed-config.js (Module 1)
     ========================= */
  const MAKE_CREATE_CHECKOUT_URL    = window.AED.CONSTANTS.MAKE_CREATE_CHECKOUT_URL;
  const INTAKE_FORM_SELECTOR        = window.AED.SELECTORS.INTAKE_FORM;
  const PAY_CTA_SELECTOR            = window.AED.SELECTORS.PAY_CTA;
  const CONFIRMATIONS_WRAP_SELECTOR = window.AED.SELECTORS.CONFIRMATIONS_WRAP;
  const PAY_ERROR_ID                = window.AED.SELECTORS.PAY_ERROR_ID;
  const REQUEST_TIMEOUT_MS          = window.AED.CONSTANTS.REQUEST_TIMEOUT_MS;
  const CHILD_SUMMARY_SELECTOR      = window.AED.SELECTORS.CHILD_SUMMARY;

/* =========================
   CURRICULUM CONFIGURATION — Moved to aed-config.js (Module 1)
   CURRICULUM_CONFIG and SMART_DEFAULTS are available as window.AED.CURRICULUM_CONFIG
   and window.AED.SMART_DEFAULTS. Backward-compatible var aliases are set in aed-config.js.
   ========================= */

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

  /* =========================
     PRICING — Moved to aed-pricing.js (Module 2)
     DOM HELPERS — Moved to aed-config.js (Module 1, window.AED.helpers)
     ========================= */

  // Local aliases for helpers (used throughout this closure as bare function names)
  var centsToDollars = window.AED.helpers.centsToDollars;
  var aud            = window.AED.helpers.aud;
  var qs             = window.AED.helpers.qs;
  var setText        = window.AED.helpers.setText;
  var showEl         = window.AED.helpers.showEl;
  var showRow        = window.AED.helpers.showRow;
  var getElByName    = window.AED.helpers.getElByName;
  var isChecked      = window.AED.helpers.isChecked;
  var getSelectInt   = window.AED.helpers.getSelectInt;
  var writeHidden    = window.AED.helpers.writeHidden;
  var toInt          = window.AED.helpers.toInt;
  var safeParseJsonArray = window.AED.helpers.safeParseJsonArray;


// Pricing functions (initPricingFromConfig, buildOrderFromStep0, recalcOrderSummaryUIAndHidden,
// bindOrderSummarySync, toggleTravelFamilySection) moved to aed-pricing.js (Module 2)
// They are available as window.recalcOrderSummaryUIAndHidden, window.buildOrderFromStep0, etc.



 /* =========================
   STATE — Moved to aed-state.js (Module 3)
   STATE object, getStateField, readStateFieldInt, writeStateField,
   getChildIndex, setChildIndex, getChildrenCount, setChildrenCount,
   getChildStateSelect, captureFirstChildStateIfNeeded,
   applyStateDefaultForCurrentChild are now in aed-state.js.
   Local aliases below reference window.* exposures from Module 3.
   ========================= */
var getStateField                    = window.getStateField;
var readStateFieldInt                = window.readStateFieldInt;
var writeStateField                  = window.writeStateField;
var getChildIndex                    = window.getChildIndex;
var setChildIndex                    = window.setChildIndex;
var getChildrenCount                 = window.getChildrenCount;
var setChildrenCount                 = window.setChildrenCount;
var getChildStateSelect              = window.getChildStateSelect;
var captureFirstChildStateIfNeeded   = window.captureFirstChildStateIfNeeded;
var applyStateDefaultForCurrentChild = window.applyStateDefaultForCurrentChild;
var DEFAULT_STATE_VALUE              = window.AED.CONSTANTS.DEFAULT_STATE_VALUE;




  /* =========================
     STEP NAVIGATION + VALIDATION — Moved to aed-navigation.js (Module 4)
     Local aliases below reference window.* exposures from Module 4.
     ========================= */
  var STEP_FIRST_CHILD = window.STEP_FIRST_CHILD;
  var STEP_LAST_CHILD  = window.STEP_LAST_CHILD;
  var STEP_Y2          = window.STEP_Y2;
  var STEP_ENVIRONMENT = window.STEP_ENVIRONMENT;
  var STEP_PAYMENT     = window.STEP_PAYMENT;
  var getStepEl                             = window.getStepEl;
  var setActive                             = window.setActive;
  var validateStep                          = window.validateStep;
  var showStepError                         = window.showStepError;
  var clearStepError                        = window.clearStepError;
  var renderChildNavBar                     = window.renderChildNavBar;
  var updateProgressBar                     = window.updateProgressBar;
  var updateCurrentChildHeading             = window.updateCurrentChildHeading;
  var isElementActuallyFillable             = window.isElementActuallyFillable;
  var showStep4GoalInfo                     = window.showStep4GoalInfo;
  var hideStep4GoalInfo                     = window.hideStep4GoalInfo;
  var ensureDefaultProgramTypeForCurrentChild = window.ensureDefaultProgramTypeForCurrentChild;
  // getTotalChildrenFromStep0 moved to aed-state.js (Module 3)
  var getTotalChildrenFromStep0 = window.getTotalChildrenFromStep0;

  /* =========================
     DATA — Aliases from aed-data.js (Module 5)
     ========================= */
  var collectChildData              = window.collectChildData;
  var collectValueFromField         = window.collectValueFromField;
  var resetChildFields              = window.resetChildFields;
  var saveCurrentChildAndAdvance    = window.saveCurrentChildAndAdvance;
  var loadChildData                 = window.loadChildData;
  var renderChildSummary            = window.renderChildSummary;
  var syncPillsFromInput            = window.syncPillsFromInput;
  var applyCarryOverDataForCurrentChild = window.applyCarryOverDataForCurrentChild;
  var waitForCurriculumThenRestore  = window.waitForCurriculumThenRestore;
  var restoreDynamicPillsForStep    = window.restoreDynamicPillsForStep;
  var liveWriteToChildStore         = window.liveWriteToChildStore;
  var initLiveSave                  = window.initLiveSave;
  var setupLiveNameSync             = window.setupLiveNameSync;

  /* =========================
     MULTI-SELECT PILL LOGIC
     ========================= */

/* =========================
   REFINED MULTI-SELECT PILL LOGIC (WITH AUTO-SWAP & MANDATORY LOCKS v5)
   ========================= */
function syncGroup(groupEl) {
  const input = groupEl.querySelector(".ms-input");
  const options = Array.from(groupEl.querySelectorAll(".ms-option"));
  if (!input || !options.length) return;

  const maxLimit = parseInt(groupEl.getAttribute("data-max") || "0", 10);

  function writeToInput() {
    const selected = options
      .filter(o => o.classList.contains("is-selected"))
      .map(o => o.getAttribute("data-value"))
      .filter(Boolean);
    input.value = JSON.stringify(selected);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  options.forEach(option => {
    if (option.dataset.aedBound === "1") return;
    option.dataset.aedBound = "1";

    option.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();

      const clickedVal = this.getAttribute("data-value");
      const EXCLUSIVE = ["all_study_blocks", "timing_unsure"]; 
      const isExclusive = EXCLUSIVE.includes(clickedVal);

      if (isExclusive) {
        options.forEach(o => o.classList.remove("is-selected"));
        this.classList.add("is-selected");
      } else {
        const isCurrentlySelected = this.classList.contains("is-selected");
        const currentCount = options.filter(o => o.classList.contains("is-selected")).length;

        // --- TRYING TO SELECT A NEW PILL ---
        if (!isCurrentlySelected) {
          if (maxLimit > 0 && currentCount >= maxLimit) {
            // AUTO-SWAP: If the limit is exactly 1 (like Maths), swap them!
            if (maxLimit === 1) {
               options.forEach(o => o.classList.remove("is-selected"));
               this.classList.add("is-selected");
            } else {
               return; // Limit reached for multi-select (e.g. Science), stop click
            }
          } else {
            // Normal select
            options.forEach(o => {
              const v = o.getAttribute("data-value");
              if (EXCLUSIVE.includes(v)) o.classList.remove("is-selected");
            });
            this.classList.add("is-selected");
          }
        } 
        // --- TRYING TO DESELECT A PILL ---
        else {
          // Core Subjects that MUST have at least 1 pill selected
          const mandatoryGroups = ['y10-science-pills', 'y10-maths-pills', 'y9-science-pills', 'y9-maths-pills'];
          
          if (currentCount === 1 && mandatoryGroups.includes(groupEl.id)) {
             return; // Stop them from unclicking the very last pill!
          }

          this.classList.remove("is-selected");
        }
      }

      writeToInput();
    }, true);
  });
}

  function initAllMultiSelectGroups() {
    Array.from(document.querySelectorAll(".ms-group")).forEach(syncGroup);
  }

function resyncAllMultiSelectGroups(scopeEl) {
  const root = scopeEl || document;
  Array.from(root.querySelectorAll('.ms-group[data-scope="child"]')).forEach(group => {
    const input = group.querySelector(".ms-input");
    const options = Array.from(group.querySelectorAll(".ms-option"));
    if (!input || !options.length) return;
    options.forEach(o => o.classList.remove("is-selected"));
    input.value = "[]";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}


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

  /* =========================
     GROUP ID (client-side id only)
     ========================= */

  function setApplicationGroupId(scopeEl) {
    const root = scopeEl || document;

  const groupField =
  root.querySelector('input[name="application_group_id"]') ||
  root.querySelector('#application_group_id') ||
  root.querySelector('[data-state-key="application_group_id"]') ||
  root.querySelector('[name="application_group_id"]');


    if (!groupField) return;
    if (groupField.value && groupField.value.trim() !== "") return;

    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    groupField.value = `AED-${year}-${random}`;

    groupField.dispatchEvent(new Event("input", { bubbles: true }));
    groupField.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* =========================
     STEP 6: CONFIRMATIONS + CHECKOUT CREATE
     ========================= */

  function getConfirmationCheckboxes() {
    const wrap = document.querySelector(CONFIRMATIONS_WRAP_SELECTOR);
    if (!wrap) return [];
    return Array.from(wrap.querySelectorAll('input[type="checkbox"]'));
  }

  function allConfirmationsTicked() {
    const checkboxes = getConfirmationCheckboxes();
    if (!checkboxes.length) return false;
    return checkboxes.every(cb => cb.checked);
  }

  function getPayCta() { return document.querySelector(PAY_CTA_SELECTOR); }

  function ensurePayErrorEl() {
    let el = document.getElementById(PAY_ERROR_ID);
    if (el) return el;

    const btn = getPayCta();
    if (!btn) return null;

    el = document.createElement("div");
    el.id = PAY_ERROR_ID;
    el.style.display = "none";
    el.style.marginTop = "12px";
    el.style.fontSize = "14px";
    el.style.lineHeight = "1.4";
    el.style.color = "#b00020";

    // Insert directly after CTA for visibility
    btn.insertAdjacentElement("afterend", el);
    return el;
  }

  function setPayError(msg) {
    const el = ensurePayErrorEl();
    if (!el) return;
    el.textContent = msg || "";
    el.style.display = msg ? "block" : "none";
  }

  function setPayEnabled(enabled) {
    const btn = getPayCta();
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.6";
    btn.style.cursor = enabled ? "pointer" : "not-allowed";
  }

function bindConfirmationGating() {
  const wrap = document.querySelector(CONFIRMATIONS_WRAP_SELECTOR);
  if (!wrap) return;

  const checkboxes = Array.from(wrap.querySelectorAll('input[type="checkbox"]'));
  if (!checkboxes.length) {
    setPayEnabled(false);
    return;
  }

  const onChange = () => {
    const allTicked = checkboxes.every(c => c.checked);
    setPayEnabled(allTicked);

    if (allTicked) {
      // If you still need the 6 hidden fields set for Make/Airtable:
      writeHidden("confirm_accuracy", "true");
      writeHidden("confirm_oversight", "true");
      writeHidden("confirm_high_level", "true");
      writeHidden("confirm_authority", "true");
      writeHidden("confirm_ai_review", "true");
      writeHidden("confirm_privacy", "true");
    }
  };

  checkboxes.forEach(cb => cb.addEventListener("change", onChange));
  onChange(); // set initial state
}

  function formToObject(formEl) {
    const obj = {};

   
// 1. SURGICAL SCRAPING: Only grab inputs from Step 0 (family setup),
//    Step 6 (learning environment), and Step 7 (review & payment).
//    Child-specific data (Steps 1–5) is captured via collectChildData()
//    and lives inside obj.children[].data — NOT at the top level.
const targetSteps = [0, 6, 7];
// Fields that must never appear at the top level of the payload.
const TOP_LEVEL_BLOCKLIST = new Set([
      'block1_year_level',
      'block2_year_level',
      'block3_year_level',
      'block4_year_level',
      // Dynamic curriculum pill inputs — belong in child.data only
      'english_pathway',
      'mathematics_pathway',
      'science_pathway',
      'the_arts',
      'technologies',
      'hass',
      'english_pathway_y2',
      'mathematics_pathway_y2',
      'science_pathway_y2',
      'the_arts_y2',
      'technologies_y2',
      'hass_y2',
      // Academic tracking widget — belongs in child.data only
      'aed-tracking-needs_attention',
      'aed-tracking-excelling'
    ]);

    targetSteps.forEach(stepNum => {
      const stepEl = getStepEl(stepNum);
      if (!stepEl) return;

      const fields = stepEl.querySelectorAll("input[name], select[name], textarea[name]");
      fields.forEach(el => {
        const name = el.getAttribute("name");
        if (!name) return;
        if (TOP_LEVEL_BLOCKLIST.has(name)) return;
        
        const type = (el.getAttribute("type") || "").toLowerCase();

        // Skip hidden pill duplicates if they are visually hidden
        const group = el.closest(".ms-group");
        if (group && (group.offsetWidth === 0 || group.offsetHeight === 0)) {
          // Even if the group is hidden, still capture it if it has a value
          if (!el.classList.contains("ms-input") || !el.value || el.value === "[]") return;
        }

        // Skip unchecked radios/checkboxes
        if ((type === "radio" || type === "checkbox") && !el.checked) return;

        // Handle multi-select pills safely
        if (el.classList.contains("ms-input")) {
          try { obj[name] = JSON.parse(el.value || "[]"); }
          catch (e) { obj[name] = []; }
        } else {
          // Standard text, selects, and checkboxes
          if (type === "checkbox") {
             obj[name] = el.value || "on";
          } else {
            obj[name] = (el.value || "").trim();
          }
        }
      });
    });

// 2. GRAB HIDDEN FIELDS (Pricing, Confirmations, etc.)
    const hiddenFields = formEl.querySelectorAll('input[type="hidden"][name]');
    hiddenFields.forEach(el => {
      const name = el.getAttribute("name");
      if (name && !TOP_LEVEL_BLOCKLIST.has(name)) obj[name] = el.value;
    });

    // 3. ATTACH THE CLEAN CHILD DATA (Leaves the F-10 mess behind!)
    const childrenArr = Array.isArray(window.__aed_child_applications)
      ? window.__aed_child_applications
      : [];

    obj.children = childrenArr.map((data, i) => ({ 
      child_index: i, 
      data: sanitizeDataForMake(data) 
    }));

    // 4. ATTACH ORDER DETAILS
    obj.order = buildOrderFromStep0();


    // 6. METADATA
    obj.request_id = makeRequestId();
    obj.current_child_index = getChildIndex();
    obj.children_count = getChildrenCount();

    // 7. FALLBACKS (Just in case)
    obj.contact_first_name = obj.contact_first_name || "";
    obj.contact_email = obj.contact_email || "";
    obj.plan_start_date = obj.plan_start_date || "";
    obj.plan_end_date = obj.plan_end_date || "";

    // 7b. FORCE STATE INTO PAYLOAD
    // The DOM element is named "state-picker" but downstream expects "state".
    // Read from whichever picker has a value (static Step 0 or sticky navbar).
    if (!obj.state) {
      const statePicker = document.querySelector('select[name="state-picker"]');
      obj.state = (statePicker && statePicker.value) ? statePicker.value.trim() : "";
    }

    // 8. FORCE GROUP ID INTO PAYLOAD
    const agEl = formEl.querySelector('[name="application_group_id"], #application_group_id, [data-state-key="application_group_id"]');
    if (agEl && agEl.value) {
      obj.application_group_id = agEl.value.trim();
    }
    if (!obj.application_group_id) {
      const year = new Date().getFullYear();
      const random = Math.random().toString(36).slice(2, 10).toUpperCase();
      obj.application_group_id = `AED-${year}-${random}`;
    }

    return obj;
  }

  function makeRequestId() {
    return "req_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  let isSubmitting = false;

  async function postToMakeCreateCheckout(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(MAKE_CREATE_CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    let data = null;
    try { 
      data = await res.json(); 
    } catch (_) {
      console.error("Response was not valid JSON");
    }

    // 1. Check HTTP Status: 
    // If status is 200, res.ok is TRUE, so we SKIP this error block.
    if (!res.ok) {
      const msg = (data && data.error && data.error.message)
        ? data.error.message
        : "We couldn’t start payment. Please try again.";
      throw new Error(msg);
    }

    // 2. Check Data:
    // We removed 'data.ok' because Make isn't sending it. 
    // As long as we have the URL, we are good to go.
    if (!data || !data.checkout_url) {
      throw new Error("Payment link missing from server response.");
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

  async function handleContinueToPaymentClick(e) {
    e.preventDefault();
    setPayError("");

    if (isSubmitting) return;
    isSubmitting = true;

    try {
      if (!allConfirmationsTicked()) {
        setPayError("Please confirm the statements before continuing to payment.");
        isSubmitting = false;
        setPayEnabled(true);
        return;
      }

      if (!validatePlanDates(true)) {
  isSubmitting = false;
  setPayEnabled(true);
  return;
}

      
      if (!validateStep(STEP_PAYMENT)) {
        isSubmitting = false;
        setPayEnabled(true);
        return;
      }

      const btn = getPayCta();
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
      }

// Ensure up-to-date computed fields
recalcOrderSummaryUIAndHidden();

// MUST come first
const formEl = qs(INTAKE_FORM_SELECTOR);
if (!formEl) {
  throw new Error("Form setup error. Please refresh and try again.");
}

// Now safe to use
setApplicationGroupId(formEl);

const payload = formToObject(formEl);
console.log("=== APPLY-ED OUTGOING PAYLOAD ===", payload);

const result = await postToMakeCreateCheckout(payload);


      if (result.submission_id) {
        try { sessionStorage.setItem("aed_submission_id", result.submission_id); } catch (_) {}
      }

      window.location.href = result.checkout_url;
    } catch (err) {
      const msg =
        (err && err.name === "AbortError")
          ? "This is taking longer than expected. Please check your connection and try again."
          : (err && err.message ? err.message : "We couldn’t start payment. Please try again.");

      setPayError(msg);
      isSubmitting = false;
      setPayEnabled(allConfirmationsTicked());
    }
  }

  function bindPayCta() {
    const btn = getPayCta();
    if (!btn) return;

    // Guard against duplicate binding if Webflow re-inits
    if (btn.dataset.aedBound === "1") return;
    btn.dataset.aedBound = "1";

    btn.addEventListener("click", handleContinueToPaymentClick, { passive: false });
  }

  function preventNativeSubmitOnIntakeForm() {
    const formEl = qs(INTAKE_FORM_SELECTOR);
    if (!formEl) return;

    if (formEl.dataset.aedSubmitBound === "1") return;
    formEl.dataset.aedSubmitBound = "1";

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }
 
 /* =========================
     CLICK HANDLER (existing)
   ========================= */

function setupAutoExpandingTextareas() {
  const textareas = document.querySelectorAll('textarea.is-note-field');
  if (textareas.length === 0) return; // Exit if none found

  textareas.forEach(el => {
    el.style.overflowY = 'hidden';
    const adjustHeight = () => {
      el.style.height = 'auto'; 
      el.style.height = el.scrollHeight + 'px';
    };
    el.addEventListener('input', adjustHeight);
    adjustHeight();
  });
}

function initDatePickers() {
    const startEl = document.getElementById("start-picker");
    const endEl = document.getElementById("end-picker");

    if (startEl) {
      flatpickr("#start-picker", {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        minDate: "today",
        onChange: function(selectedDates, dateStr) {
  startEl.dispatchEvent(new Event("change", { bubbles: true }));
  validatePlanDates(false);
}

      });
    }

    if (endEl) {
      flatpickr("#end-picker", {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        minDate: "today",
onChange: function(selectedDates, dateStr) {
  endEl.dispatchEvent(new Event("change", { bubbles: true }));
  validatePlanDates(false);
}

      });
    }
  }

function validatePlanDates(showError = true) {
  const startEl = document.getElementById("start-picker");
  const endEl = document.getElementById("end-picker");

  if (!startEl || !endEl) return true;

  if (!startEl.value || !endEl.value) return true; // allow incomplete

  const startDate = new Date(startEl.value);
  const endDate = new Date(endEl.value);

  if (endDate < startDate) {
    if (showError) {
      setPayError("Program end date must be the same as or later than the start date.");
    }
    return false;
  }

  // Clear any previous date-related error
  setPayError("");
  return true;
}
/* =========================
   TOOLTIP BEHAVIOUR - FORCE VISIBLE FIX
   ========================= */

(function injectTooltipStyles() {
  if (document.getElementById("aed-tooltip-styles")) {
    document.getElementById("aed-tooltip-styles").remove();
  }
  
  const style = document.createElement("style");
  style.id = "aed-tooltip-styles";
  style.textContent = `
    .field-label-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: nowrap;
    }
    .tooltip-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
    }
    .help-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #799377;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      font-family: sans-serif;
      line-height: 1;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
    }
    .help-icon:hover {
      background: #5a6b5a;
    }
    
    /* Tooltip box - force all properties to override any conflicts */
    .tooltip-box {
      display: none !important;
      position: fixed !important;
      z-index: 9999999999 !important; /* Even higher */
      background: #ffffff !important;
      border: 2px solid #c8d0c8 !important;
      border-radius: 6px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
      padding: 12px 16px !important;
      font-size: 14px !important;
      font-family: font-family: 'Montserrat', sans-serif !important;
      line-height: 1.5 !important;
      color: #7a7f87 !important;
      white-space: normal !important;
      word-break: break-word !important;
      pointer-events: none !important;
      max-width: 320px !important;
      min-width: 180px !important;
      width: max-content !important;
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      margin: 0 !important;
      outline: none !important;
      text-decoration: none !important;

      font-weight: normal !important;
      text-align: left !important;
    }
    
    /* Force show when visible class is added */
    .tooltip-box.tooltip-visible {
      display: block !important;
    }
    
    /* Arrow - positioned dynamically via JavaScript */
    .tooltip-arrow {
      position: absolute !important;
      width: 0 !important;
      height: 0 !important;
      border-style: solid !important;
      z-index: 2147483647 !important;
    }
    
    .tooltip-arrow.arrow-up {
      bottom: 100% !important;
      border-width: 0 8px 8px 8px !important;
      border-color: transparent transparent #ffffff transparent !important;
    }
    
    .tooltip-arrow.arrow-up::before {
      content: "" !important;
      position: absolute !important;
      bottom: -10px !important;
      left: -9px !important;
      border-width: 0 9px 9px 9px !important;
      border-style: solid !important;
      border-color: transparent transparent #c8d0c8 transparent !important;
    }
    
    .tooltip-arrow.arrow-down {
      top: 100% !important;
      border-width: 8px 8px 0 8px !important;
      border-color: #ffffff transparent transparent transparent !important;
    }
    
    .tooltip-arrow.arrow-down::before {
      content: "" !important;
      position: absolute !important;
      top: -10px !important;
      left: -9px !important;
      border-width: 9px 9px 0 9px !important;
      border-style: solid !important;
      border-color: #c8d0c8 transparent transparent transparent !important;
    }
    
    /* Mobile responsive adjustments */
    @media (max-width: 768px) {
      .tooltip-box {
        max-width: calc(100vw - 32px) !important;
        font-size: 13px !important;
      }
    }
      /* Fix for multiselect pill tooltips */
    .ms-option,
    .ms-group,
    .ms-input {
      z-index: 1 !important;
      position: relative !important;
    }
    
    .ms-option .tooltip-wrapper,
    .ms-group .tooltip-wrapper {
      z-index: 2147483647 !important;
      position: relative !important;
    }
    
 .ms-group {
      isolation: auto !important;
    }

    select.aed-filled {
      color: #7a7f87 !important;
    }

    select:not(.aed-filled) {
      color: #cbd1d6 !important;
    }
  `;
  document.head.appendChild(style);
})();

function bindTooltips() {
  console.log("Binding tooltips with force-visible fix...");
  
  document.querySelectorAll(".tooltip-wrapper").forEach((wrapper, index) => {
    const icon = wrapper.querySelector(".help-icon");
    const tooltip = wrapper.querySelector(".tooltip-box");
    
    if (!icon || !tooltip) {
      console.warn(`Tooltip ${index + 1}: Missing icon or tooltip box`);
      return;
    }

    function positionTooltip() {
  try {
    // Get icon position relative to viewport
    const iconRect = icon.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Force the tooltip to be measurable
    tooltip.classList.add('tooltip-visible');
    tooltip.style.setProperty('display', 'block', 'important');
    tooltip.style.setProperty('position', 'fixed', 'important');
    tooltip.style.setProperty('z-index', '999999999999', 'important');
    
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // AGGRESSIVE POSITIONING: Always position ABOVE the pills
    let tooltipLeft = iconRect.left + (iconRect.width / 2) - (tooltipRect.width / 2);
    let tooltipTop = iconRect.top - tooltipRect.height - 15; // Force above, not below
    
    // Keep in viewport
    if (tooltipLeft < 20) tooltipLeft = 20;
    if (tooltipLeft + tooltipRect.width > viewportWidth - 20) {
      tooltipLeft = viewportWidth - tooltipRect.width - 20;
    }
    if (tooltipTop < 20) tooltipTop = iconRect.bottom + 15; // Fallback to below if no room above
    
    // Apply position with maximum force
    tooltip.style.setProperty('left', tooltipLeft + 'px', 'important');
    tooltip.style.setProperty('top', tooltipTop + 'px', 'important');
    tooltip.style.setProperty('background', '#fff', 'important');
    tooltip.style.setProperty('opacity', '1', 'important');
tooltip.style.setProperty('background-color', '#ffffff', 'important');
tooltip.style.setProperty('color', '#7a7f87', 'important');
tooltip.style.setProperty('border', '2px solid #c8d0c8', 'important');
tooltip.style.setProperty('box-shadow', '0 8px 24px rgba(0,0,0,0.15)', 'important');
tooltip.style.setProperty('filter', 'none', 'important');
tooltip.style.setProperty('transform', 'none', 'important');
    console.log(`Tooltip ${index + 1}: Aggressively positioned at (${tooltipLeft}, ${tooltipTop})`);
    
  } catch (error) {
    console.error(`Tooltip ${index + 1}: Positioning error:`, error);
  }
}

 function showTooltip() {
  console.log(`Force showing tooltip ${index + 1}`);
  
  try {
    // Hide all other tooltips
    document.querySelectorAll(".tooltip-box").forEach((box) => {
      if (box !== tooltip) {
        box.classList.remove('tooltip-visible');
        box.style.display = 'none';
      }
    });
    
    // NUCLEAR OPTION: Move tooltip to document body to avoid inheritance
    if (tooltip.parentNode !== document.body) {
      document.body.appendChild(tooltip);
    }
    
    // Force show with complete style reset
    tooltip.classList.add('tooltip-visible');
    tooltip.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: fixed !important;
      z-index: 999999999999 !important;
      background-color: #ffffff !important;
      color: #7a7f87 !important;
      border: 2px solid #c8d0c8 !important;
      border-radius: 6px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
      padding: 12px 16px !important;
      font-size: 14px !important;
      font-family: Montserrat, sans-serif !important;
      line-height: 1.5 !important;
      white-space: normal !important;
      word-break: break-word !important;
      pointer-events: none !important;
      max-width: 320px !important;
      min-width: 180px !important;
      width: max-content !important;
      filter: none !important;
      transform: none !important;
    `;
    
    // Position it correctly
    positionTooltip();
    
    console.log(`Tooltip ${index + 1}: Moved to body and force styled`);
    
  } catch (error) {
    console.error(`Tooltip ${index + 1}: Show error:`, error);
  }
}

    function hideTooltip() {
      console.log(`Force hiding tooltip ${index + 1}`);
      tooltip.classList.remove('tooltip-visible');
      tooltip.style.setProperty('display', 'none', 'important');
    }

    // Mouse events
    icon.addEventListener("mouseenter", showTooltip);
    icon.addEventListener("mouseleave", hideTooltip);

    // Click events for touch devices
    icon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`Tooltip ${index + 1}: Force clicked`);
      
      const isVisible = tooltip.classList.contains('tooltip-visible');
      
      // Hide all tooltips
      document.querySelectorAll(".tooltip-box").forEach((box) => {
        box.classList.remove('tooltip-visible');
        box.style.setProperty('display', 'none', 'important');
      });
      
      // Toggle this tooltip
      if (!isVisible) {
        showTooltip();
      }
    });
    
    console.log(`Tooltip ${index + 1}: Force event listeners attached`);
  });

  // Hide tooltips when clicking elsewhere
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".tooltip-wrapper")) {
      document.querySelectorAll(".tooltip-box").forEach((box) => {
        box.classList.remove('tooltip-visible');
        box.style.setProperty('display', 'none', 'important');
      });
    }
  });
  
  // Hide tooltips on scroll and resize
  const hideAllTooltips = () => {
    document.querySelectorAll(".tooltip-box").forEach((box) => {
      box.classList.remove('tooltip-visible');
      box.style.setProperty('display', 'none', 'important');
    });
  };
  
  window.addEventListener("scroll", hideAllTooltips);
  window.addEventListener("resize", hideAllTooltips);
  
  console.log("Force-visible tooltip system loaded");
}

console.log("Enhanced force-visible tooltip system ready");
function fixMultiSelectTooltipZIndex() {
  // Force all multiselect elements to lower z-index
  document.querySelectorAll('.ms-option, .ms-group, .ms-input').forEach(el => {
    el.style.setProperty('z-index', '1', 'important');
    el.style.setProperty('position', 'relative', 'important');
  });
  
  // Force tooltip wrappers inside multiselect to highest z-index
  document.querySelectorAll('.ms-option .tooltip-wrapper, .ms-group .tooltip-wrapper').forEach(el => {
    el.style.setProperty('z-index', '2147483647', 'important');
    el.style.setProperty('position', 'relative', 'important');
  });
  
  console.log('Multiselect z-index fix applied via JavaScript');
}
/* =========================
   PILL SELECTION + HIDDEN FIELD POPULATION
   ========================= */

function bindPillSelection() {
  var pillContainer = document.getElementById('year-level-pills');
  if (!pillContainer) return;

  function getYearLabels() {
    var yearDropdown = document.querySelector('select[name="student_year_level"]');
    var stateDropdown = document.querySelector('select[name="state-picker"]');
    var rawValue = yearDropdown ? yearDropdown.value : '';
    var stateValue = stateDropdown ? stateDropdown.value : 'QLD';

    var currentLabel, nextLabel;

    if (rawValue === 'FOUNDATION') {
      var foundationNames = { 'NSW': 'Kindergarten', 'WA': 'Kindy', 'SA': 'Reception', 'TAS': 'Reception', 'NT': 'Reception' };
      currentLabel = foundationNames[stateValue] || 'Prep';
      nextLabel = 'Year 1';
    } else {
      var match = rawValue.match(/\d+/);
      if (!match) return null;
      var currentYear = parseInt(match[0], 10);
      currentLabel = 'Year ' + currentYear;
      nextLabel = 'Year ' + (currentYear + 1);
    }

    return { current: currentLabel, next: nextLabel };
  }

  function updateBlockFields() {
    var selected = pillContainer.querySelector('.ms-option.is-selected');
    if (!selected) return;

    var pills = Array.from(pillContainer.querySelectorAll('.ms-option'));
    var index = pills.indexOf(selected);

    var splits = [
      { current: 4, next: 0 },
      { current: 3, next: 1 },
      { current: 2, next: 2 },
      { current: 1, next: 3 }
    ];

    var split = splits[index];
    if (!split) return;

    var labels = getYearLabels();
    if (!labels) return;

    var yearLevels = [];
    for (var i = 0; i < split.current; i++) yearLevels.push(labels.current);
    for (var j = 0; j < split.next; j++) yearLevels.push(labels.next);

    // Create or update hidden inputs on the form
    var form = document.querySelector('form[data-aed-form="intake"]');
    if (!form) return;

    for (var k = 1; k <= 4; k++) {
      var fieldName = 'block' + k + '_year_level';
      var existing = form.querySelector('input[name="' + fieldName + '"]');
      if (!existing) {
        existing = document.createElement('input');
        existing.type = 'hidden';
        existing.name = fieldName;
        form.appendChild(existing);
      }
      existing.value = yearLevels[k - 1] || '';
    }

    console.log('Block year levels:', yearLevels);
  }
// Force single selection — deselect others when one is clicked
  pillContainer.querySelectorAll('.ms-option').forEach(function(pill) {
    pill.addEventListener('mousedown', function() {
      pillContainer.querySelectorAll('.ms-option').forEach(function(other) {
        if (other !== pill) {
          other.classList.remove('is-selected');
        }
      });
    });
  });

  // Watch for is-selected class being added by Webflow's multiselect
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        updateBlockFields();
      }
    });
  });

  // Observe all ms-option elements for class changes
  pillContainer.querySelectorAll('.ms-option').forEach(function(pill) {
    observer.observe(pill, { attributes: true, attributeFilter: ['class'] });
  });
}
/* =========================
   CUSTOM FIELD VALIDATION
   ========================= */

function bindCustomValidation() {

  // Field definitions for each step
  var step0Fields = [
    { name: 'contact_first_name', label: 'Contact First Name' },
    { name: 'contact_email', label: 'Contact Email' },
      { name: 'plan_start_date', label: 'Program Start Date' }
  ];

// Step 1 now only has the child's name
  var step1Fields = [
    { name: 'student_first_name', label: 'Student First Name' }
  ];

// Step 2 now checks for Identity, Background, and Rhythm dropdowns
  var step2Fields = [
    { name: 'student_pronouns', label: 'Student Pronouns' },
    { name: 'student_year_level', label: 'Current Year Level' },
    { name: 'previous_schooling', label: 'Previous Schooling' },
    { name: 'time_home_educated', label: 'Time Home Educated' },
    { name: 'structured_hours_week', label: 'Structured Learning Time' },
    { name: 'daily_peak', label: 'Daily Energy Peak' },
    { name: 'attention_span', label: 'Attention Span' },
    { name: 'routine_preference', label: 'Routine Preference' }
  ];

// Create or update an error message below a field
  function showError(field, message) {
    var errorId = 'error-' + field.name;
    var errorEl = document.getElementById(errorId);

    if (!errorEl) {
      errorEl = document.createElement('div'); 
      errorEl.id = errorId;
      errorEl.style.cssText = 'color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 10px 12px; border-radius: 6px; margin-top: 8px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;';
      
      // THE FIX: Flatpickr hides the original input and generates new siblings. 
      // We append the error to the bottom of the field's wrapper instead!
      var wrapper = field.el.closest('.field-group') || field.el.parentElement;
      if (wrapper) {
         wrapper.appendChild(errorEl);
      } else {
         field.el.parentNode.insertBefore(errorEl, field.el.nextSibling);
      }
    }

    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  function hideError(fieldName) {
    var errorEl = document.getElementById('error-' + fieldName);
    if (errorEl) errorEl.style.display = 'none';
  }

  function validateField(field) {
    var el = document.querySelector(
      'input[name="' + field.name + '"], select[name="' + field.name + '"], textarea[name="' + field.name + '"]'
    );
    if (!el) return true;

    field.el = el;
    var value = (el.value || '').trim();

    if (!value) {
      showError(field, 'Please enter your ' + field.label.toLowerCase() + '.');
      return false;
    }

    // Extra check for email format
    if (field.name === 'contact_email') {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        showError(field, 'Please enter a valid email address.');
        return false;
      }
    }

    hideError(field.name);
    return true;
  }

// Suppress browser default validation on the form
  var forms = document.querySelectorAll('form');
  forms.forEach(function(f) {
    f.setAttribute('novalidate', 'true');
  });

  // Bind Step 0 continue button
  var step0Btn = document.querySelector('#btn-next-step0');
  if (step0Btn) {
    step0Btn.addEventListener('click', function(e) {
      var allValid = true;
      step0Fields.forEach(function(field) {
        if (!validateField(field)) allValid = false;
      });
      if (!allValid) {
        e.preventDefault();
        e.stopImmediatePropagation();
        // Scroll to first error
        var firstError = document.querySelector('[id^="error-"][style*="block"]');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Bind Step 1 next button
  var step1Btn = document.getElementById('btn-next-step1');
  if (step1Btn) {
    step1Btn.addEventListener('click', function(e) {
      var allValid = true;
      step1Fields.forEach(function(field) {
        if (!validateField(field)) allValid = false;
      });
      if (!allValid) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var firstError = document.querySelector('[id^="error-"][style*="block"]');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
// Bind Step 2 next button
  var step2Btn = document.getElementById('btn-next-step2');
  if (step2Btn) {
    step2Btn.addEventListener('click', function(e) {
      var allValid = true;
      step2Fields.forEach(function(field) {
        if (!validateField(field)) allValid = false;
      });
      if (!allValid) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var firstError = document.querySelector('[id^="error-"][style*="block"]');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  // Hide errors as user fills in fields
  document.addEventListener('input', function(e) {
    if (e.target && e.target.name) hideError(e.target.name);
  });

  document.addEventListener('change', function(e) {
    if (e.target && e.target.name) hideError(e.target.name);
  });
}

/* =========================
   STEP 2 NEXT BUTTON VALIDATION
   ========================= */

function bindStep1Validation() {
  var nextBtn = document.getElementById('btn-next-step2');
  if (!nextBtn) return;

  nextBtn.addEventListener('click', function(e) {
    // Only validate if pills are visible
    var pillSection = document.getElementById('year-level-pills');
    if (!pillSection || pillSection.style.display === 'none') return;

    // Check if a pill has been selected
    var selected = document.querySelector('#year-level-pills .ms-option.is-selected');
    if (!selected) {
      e.preventDefault();
      e.stopImmediatePropagation();

      // Show error message
      var errorEl = document.getElementById('pill-error-message');
if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'pill-error-message';
        // Applied the nice red box styling
        errorEl.style.cssText = 'color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 10px 12px; border-radius: 6px; margin-top: 12px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;';
        errorEl.textContent = 'Please select how you would like to structure your child\'s Study Blocks before continuing.';
        pillSection.parentNode.insertBefore(errorEl, pillSection.nextSibling);
      }

      errorEl.style.display = 'block';

      // Scroll to the error
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Hide error if previously shown
    var errorEl = document.getElementById('pill-error-message');
    if (errorEl) errorEl.style.display = 'none';
  });
}
/* =========================
   SHOW/HIDE YEAR LEVEL PILLS BASED ON START DATE + YEAR LEVEL
   ========================= */

function bindPillVisibility() {
  var startDateField = document.querySelector('input[name="plan_start_date"]');
  var yearDropdown = document.querySelector('select[name="student_year_level"]');
  var pillSection = document.getElementById('year-level-pills');
  if (!pillSection) return;

  // Hide by default on load
  pillSection.style.display = 'none';

  function checkVisibility() {
    // 🛡️ If we are loading saved data, do not hide/reset the pills section
    if (window.__aed_is_loading_data) return;

    // Condition 1: do we have a start date in March or later?
    var rawDate = startDateField ? startDateField.value : '';
    if (!rawDate) {
      pillSection.style.display = 'none';
      return;
    }
    var date = new Date(rawDate);
    var month = date.getMonth(); // 0 = Jan, 1 = Feb...
    if (month <= 1) {
      pillSection.style.display = 'none';
      return;
    }

    // Condition 2: has a year level been selected?
    var yearValue = yearDropdown ? yearDropdown.value : '';
    if (!yearValue) {
      pillSection.style.display = 'none';
      return;
    }

    // Both conditions met — show pills
    pillSection.style.display = '';
  }

  // Listen for date changes
  if (startDateField) {
    startDateField.addEventListener('change', checkVisibility);
  }

  // Listen for year level changes
  if (yearDropdown) {
    yearDropdown.addEventListener('change', checkVisibility);
  }

  // Run once on load
  checkVisibility();
}

/* =========================
   YEAR LEVEL PILL UPDATER
   ========================= */

function bindYearLevelPills() {
  var yearDropdown = document.querySelector('select[name="student_year_level"]');
  var stateDropdown = document.querySelector('select[name="state-picker"]');
  if (!yearDropdown) return;

  // Foundation year label varies by state
  function getFoundationLabel(stateValue) {
    switch (stateValue) {
      case 'NSW': return 'Kindergarten';
      case 'WA':  return 'Kindy';
      case 'SA':
      case 'TAS':
      case 'NT':  return 'Reception';
      default:    return 'Prep'; // QLD, VIC, ACT
    }
  }

  function updatePills() {
    var rawValue = yearDropdown.value;
    if (!rawValue) return;

    var stateValue = stateDropdown ? stateDropdown.value : 'QLD';
    var currentLabel, nextLabel;

    if (rawValue === 'FOUNDATION') {
      currentLabel = getFoundationLabel(stateValue);
      nextLabel = 'Year 1';
    } else {
      var match = rawValue.match(/\d+/);
      if (!match) return;
      var currentYear = parseInt(match[0], 10);
      currentLabel = 'Year ' + currentYear;
      nextLabel = 'Year ' + (currentYear + 1);
    }

    // Only target the four year level pills — not every ms-option on the page
    var pillContainer = document.getElementById('year-level-pills');
    if (!pillContainer) return;
    var pills = pillContainer.querySelectorAll('.ms-option');

    var labels = [
      'All 4 at ' + currentLabel,
      '3 at ' + currentLabel + ', 1 at ' + nextLabel,
      '2 at ' + currentLabel + ', 2 at ' + nextLabel,
      '1 at ' + currentLabel + ', 3 at ' + nextLabel
    ];

 pills.forEach(function(pill, index) {
      if (labels[index] !== undefined) {
        pill.textContent = labels[index];
      }
      
      // --- NEW LOGIC: YEAR 10 LOCKDOWN ---
      if (currentYear === 10) {
        if (index === 0) {
          // Keep the first pill visible and force it to be selected
          pill.style.display = '';
          pill.style.pointerEvents = 'none'; // <-- NEW: Locks the pill so it cannot be clicked
          
          if (!pill.classList.contains('is-selected')) {
            pill.classList.add('is-selected');
            var input = pillContainer.querySelector('.ms-input');
            if (input) {
              input.value = JSON.stringify([pill.getAttribute('data-value')]);
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        } else {
          // Hide all the split options so they can't be clicked
          pill.style.display = 'none';
          pill.classList.remove('is-selected');
        }
      } else {
        // Normal behavior for all other years
        pill.style.display = '';
        pill.style.pointerEvents = 'auto'; // <-- NEW: Unlocks the pill if they change back to Year 7-9
      }
      // ------------------------------------
    });
  } // <--- ADD THIS MISSING BRACKET HERE

  yearDropdown.addEventListener('change', updatePills);
  if (stateDropdown) stateDropdown.addEventListener('change', updatePills);
  updatePills();
}

// NEW: Bulletproof function to force History to be selected and locked
function forceSelectHistory(prefix, suffix) {
    suffix = suffix || '';
    var hassPills = document.getElementById(prefix + '-hass-pills' + suffix);
    if (!hassPills) return;
    
    // Find the pill by data-value or text content
    var historyPill = hassPills.querySelector('.ms-option[data-value="history"]') || hassPills.querySelector('.ms-option[data-value="History"]');
    if (!historyPill) {
       var allPills = hassPills.querySelectorAll('.ms-option');
       for (var i = 0; i < allPills.length; i++) {
          if (allPills[i].textContent.toLowerCase().includes('history')) {
             historyPill = allPills[i]; break;
          }
       }
    }
    
    if (!historyPill) return;

    if (!historyPill.classList.contains('is-selected')) {
      historyPill.classList.add('is-selected');
      var input = hassPills.querySelector('.ms-input');
      if (input) {
         var val = historyPill.getAttribute('data-value');
         var currentVals = [];
         try { currentVals = JSON.parse(input.value || "[]"); } catch(e){}
         if (!currentVals.includes(val)) currentVals.push(val);
         input.value = JSON.stringify(currentVals);
         input.dispatchEvent(new Event('change', {bubbles: true}));
      }
    }
    
    historyPill.style.pointerEvents = 'none';
    historyPill.style.opacity = '0.9';
    historyPill.style.boxShadow = '0 0 0 2px #799377 inset'; 
  }
/* =========================
   CURRICULUM VISIBILITY, LOCKING & BANNERS (F-10 Logic)
   ========================= */
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

/* =========================
   WORKLOAD TRACKER (Teleporting + Duplicate ID Immunity v9)
   ========================= */
function bindWorkloadTracker() {
  var yearDropdown = document.querySelector('select[name="student_year_level"]');
  var trackerWrap = document.getElementById('workload-tracker');
  var countText = document.getElementById('workload-count-text');
  var warningText = document.getElementById('workload-warning-text');

  if (!yearDropdown || !trackerWrap || !countText || !warningText) return;

  function calculateWorkload() {
    var rawValue = yearDropdown.value;
    if (!rawValue || rawValue === 'FOUNDATION') { trackerWrap.style.display = 'none'; return; }

    var yearNum = 0;
    var match = rawValue.match(/\d+/);
    if (match) yearNum = parseInt(match[0], 10);

    if (yearNum <= 6) { trackerWrap.style.display = 'none'; return; }

    trackerWrap.style.display = 'block';
    var total = 0;

    // 1. THE NEW TELEPORT FEATURE
    // This finds the active container and injects the tracker right at the top!
    var targetContainer = null;
    if (yearNum === 7 || yearNum === 8) targetContainer = document.getElementById('f6-curriculum-container');
    else if (yearNum === 9) targetContainer = document.getElementById('y9-curriculum-container');
    else if (yearNum === 10) targetContainer = document.getElementById('y10-curriculum-container');

    if (targetContainer && trackerWrap.parentNode !== targetContainer) {
        targetContainer.insertAdjacentElement('afterbegin', trackerWrap);
    }

    function countDynamicPills(learningArea, containerId) {
      var container = document.getElementById(containerId);
      if (!container) return 0;
      var section = container.querySelector('.aed-learning-area-section[data-learning-area="' + learningArea + '"]') ||
                    container.querySelector('[data-learning-area="' + learningArea + '"]');
      if (!section) return 0;
      return section.querySelectorAll('.aed-dynamic-pill.is-selected').length;
    }

    // Count only NON-LOCKED selected pills (excludes mandatory locked pills
    // like History in HASS/HSIE which are already in the base count of 5)
    function countElectivePills(learningArea, containerId) {
      var container = document.getElementById(containerId);
      if (!container) return 0;
      var section = container.querySelector('.aed-learning-area-section[data-learning-area="' + learningArea + '"]') ||
                    container.querySelector('[data-learning-area="' + learningArea + '"]');
      if (!section) return 0;
      return section.querySelectorAll('.aed-dynamic-pill.is-selected:not([data-locked="true"])').length;
    }

    function hasLanguage() {
      var langCbs = document.querySelectorAll('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]');
      var isChecked = false;
      // Change 4: Removed offsetParent check — Y1 containers may be hidden
      // when Y2 tab is active, but the checkbox state is still accurate.
      langCbs.forEach(function(cb) {
        if (cb.checked) isChecked = true;
      });
      return isChecked ? 1 : 0;
    }

    // 3. DO THE MATH
    if (yearNum === 7 || yearNum === 8) {
      var artsY78 = countDynamicPills('the_arts', 'f6-curriculum-container') +
                    countDynamicPills('creative_arts', 'f6-curriculum-container');
      total = 7 + artsY78;
    }
    else if (yearNum === 9) {
      total = 5 +
        countElectivePills('hsie',         'y9-curriculum-container') +
        countElectivePills('hass',         'y9-curriculum-container') +
        countElectivePills('humanities',   'y9-curriculum-container') +
        countElectivePills('technological_and_applied_studies', 'y9-curriculum-container') +
        countElectivePills('technologies', 'y9-curriculum-container') +
        countElectivePills('creative_arts','y9-curriculum-container') +
        countElectivePills('the_arts',     'y9-curriculum-container') +
        countElectivePills('pdhpe',        'y9-curriculum-container') +
        countElectivePills('hpe',          'y9-curriculum-container') +
        hasLanguage();
    }
    else if (yearNum === 10) {
      total = 5 +
        countElectivePills('hsie',         'y10-curriculum-container') +
        countElectivePills('hass',         'y10-curriculum-container') +
        countElectivePills('humanities',   'y10-curriculum-container') +
        countElectivePills('technological_and_applied_studies', 'y10-curriculum-container') +
        countElectivePills('technologies', 'y10-curriculum-container') +
        countElectivePills('creative_arts','y10-curriculum-container') +
        countElectivePills('the_arts',     'y10-curriculum-container') +
        countElectivePills('pdhpe',        'y10-curriculum-container') +
        countElectivePills('hpe',          'y10-curriculum-container') +
        hasLanguage();
    }

    // 4. APPLY MESSAGES & COLORS (Your custom rules!)
    countText.innerHTML = `<strong>Total subjects selected: ${total}</strong>`;
    trackerWrap.style.backgroundColor = '#f4f7f4'; 
    trackerWrap.style.border = '1px solid #c3d9c3';
    warningText.style.color = '#263358';

    if (yearNum === 7 || yearNum === 8) {
       warningText.textContent = "This is a highly manageable, standard workload for this year level.";
    } 
    else if (yearNum === 9) {
      if (total <= 6) {
        trackerWrap.style.backgroundColor = '#ffebee'; 
        trackerWrap.style.border = '1px solid #ffcdd2';
        warningText.style.color = '#c62828';
        warningText.innerHTML = "<strong>Warning:</strong> This is below the recommended number of learning areas and may impact your application approval.";
      } else if (total >= 9) { 
        trackerWrap.style.backgroundColor = '#fff8e1'; 
        trackerWrap.style.border = '1px solid #ffe082';
        warningText.style.color = '#8f6c00';
        warningText.innerHTML = "<strong>Advisory:</strong> 9 or more subjects is a heavy workload for Year 9. Please ensure this is manageable for your child.";
      } else {
        warningText.textContent = "This is a standard, balanced workload for Year 9.";
      }
    } 
    else if (yearNum === 10) {
      if (total <= 6) {
        trackerWrap.style.backgroundColor = '#ffebee'; 
        trackerWrap.style.border = '1px solid #ffcdd2';
        warningText.style.color = '#c62828';
        warningText.innerHTML = "<strong>Warning:</strong> This is under the recommended number of learning areas (core and elective) and may impact your application approval.";
      } else if (total >= 10) { 
        trackerWrap.style.backgroundColor = '#ffebee'; 
        trackerWrap.style.border = '1px solid #ffcdd2';
        warningText.style.color = '#c62828';
        warningText.innerHTML = "<strong>Intensive Workload:</strong> 10+ subjects is a very heavy senior workload. Please carefully consider your child's schedule before proceeding.";
      } else if (total === 9) { 
         trackerWrap.style.backgroundColor = '#fff8e1'; 
         trackerWrap.style.border = '1px solid #ffe082';
         warningText.style.color = '#8f6c00';
         warningText.innerHTML = "<strong>Advisory:</strong> 9 subjects is a robust workload. Ensure your child has adequate study time mapped out.";
      } else {
        warningText.textContent = "This is a standard, balanced workload for Year 10.";
      }
    }
  }

  document.addEventListener('click', function(e) {
    if(e.target.closest('.ms-option') || e.target.closest('input[type="checkbox"]') || e.target.closest('.w-checkbox')) {
      setTimeout(calculateWorkload, 50);
    }
  }, true);
  
  document.addEventListener('change', function(e) {
    if(e.target && e.target.classList.contains('ms-input')) {
      setTimeout(calculateWorkload, 50);
    } else {
      calculateWorkload();
    }
  }, true);

  setTimeout(calculateWorkload, 100);
}

/* =========================
   WORKLOAD TRACKER — STEP 4 (Y2)
   ========================= */
function bindY2WorkloadTracker() {
  var trackerWrap = document.getElementById('workload-tracker_y2');
  var countText = document.getElementById('workload-count-text_y2');
  var warningText = document.getElementById('workload-warning-text_y2');

  if (!trackerWrap || !countText || !warningText) return;

function getNextYearNum() {
    // Primary: read from saved child data (reliable when Step 4 becomes active
    // and the year dropdown in Step 2 may not reflect the current value).
    var raw = null;
    try {
      var idx = getChildIndex();
      var savedData = window.__aed_child_applications && window.__aed_child_applications[idx];
      if (savedData && savedData.student_year_level) raw = savedData.student_year_level;
    } catch (e) {}
    // Fallback: read from the year dropdown in the DOM
    if (!raw) {
      var yearDropdown = document.querySelector('select[name="student_year_level"]');
      if (yearDropdown && yearDropdown.value) raw = yearDropdown.value;
    }
    if (!raw) return 0;
    if (raw === 'Foundation Year' || raw === 'FOUNDATION') return 1;
    var match = raw.match(/\d+/);
    return match ? parseInt(match[0], 10) + 1 : 0;
  }

  function calculateY2Workload() {
    var yearNum = getNextYearNum();
    if (yearNum <= 6) { trackerWrap.style.display = 'none'; return; }

    trackerWrap.style.display = 'block';
    var total = 0;

    // Teleport tracker to the correct container
    var targetContainer = null;
    if (yearNum === 7 || yearNum === 8) targetContainer = document.getElementById('f6-curriculum-container_y2');
    else if (yearNum === 9) targetContainer = document.getElementById('y9-curriculum-container_y2');
    else if (yearNum === 10) targetContainer = document.getElementById('y10-curriculum-container_y2');

    if (targetContainer && trackerWrap.parentNode !== targetContainer) {
      targetContainer.insertAdjacentElement('afterbegin', trackerWrap);
    }

    function countDynamicPillsY2(learningArea, containerId) {
      var container = document.getElementById(containerId);
      if (!container) return 0;
      var section = container.querySelector('.aed-learning-area-section[data-learning-area="' + learningArea + '"]') ||
                    container.querySelector('[data-learning-area="' + learningArea + '"]');
      if (!section) return 0;
      return section.querySelectorAll('.aed-dynamic-pill.is-selected').length;
    }

    function countElectivePillsY2(learningArea, containerId) {
      var container = document.getElementById(containerId);
      if (!container) return 0;
      var section = container.querySelector('.aed-learning-area-section[data-learning-area="' + learningArea + '"]') ||
                    container.querySelector('[data-learning-area="' + learningArea + '"]');
      if (!section) return 0;
      return section.querySelectorAll('.aed-dynamic-pill.is-selected:not([data-locked="true"])').length;
    }

    function hasLanguageY2() {
      // Change 4: Y2 containers now live inside Step 3, not Step 4
      var y2Panel = document.getElementById('aed-y2-curriculum-panel') || document.querySelector('.step[data-step="3"]');
      if (!y2Panel) return 0;
      var langCbs = y2Panel.querySelectorAll('input.curriculum-checkbox[data-value="languages"], input[name="languages_y2"], input[id="languages_y2"]');
      var isChecked = false;
      langCbs.forEach(function(cb) {
        if (cb.checked) isChecked = true;
      });
      return isChecked ? 1 : 0;
    }

    if (yearNum === 7 || yearNum === 8) {
      var artsY78y2 = countDynamicPillsY2('the_arts', 'f6-curriculum-container_y2') +
                      countDynamicPillsY2('creative_arts', 'f6-curriculum-container_y2');
      total = 7 + artsY78y2;
    } else if (yearNum === 9) {
      total = 5 +
        countElectivePillsY2('hsie',         'y9-curriculum-container_y2') +
        countElectivePillsY2('hass',         'y9-curriculum-container_y2') +
        countElectivePillsY2('humanities',   'y9-curriculum-container_y2') +
        countElectivePillsY2('technological_and_applied_studies', 'y9-curriculum-container_y2') +
        countElectivePillsY2('technologies', 'y9-curriculum-container_y2') +
        countElectivePillsY2('creative_arts','y9-curriculum-container_y2') +
        countElectivePillsY2('the_arts',     'y9-curriculum-container_y2') +
        countElectivePillsY2('pdhpe',        'y9-curriculum-container_y2') +
        countElectivePillsY2('hpe',          'y9-curriculum-container_y2') +
        hasLanguageY2();
    } else if (yearNum === 10) {
      total = 5 +
        countElectivePillsY2('hsie',         'y10-curriculum-container_y2') +
        countElectivePillsY2('hass',         'y10-curriculum-container_y2') +
        countElectivePillsY2('humanities',   'y10-curriculum-container_y2') +
        countElectivePillsY2('technological_and_applied_studies', 'y10-curriculum-container_y2') +
        countElectivePillsY2('technologies', 'y10-curriculum-container_y2') +
        countElectivePillsY2('creative_arts','y10-curriculum-container_y2') +
        countElectivePillsY2('the_arts',     'y10-curriculum-container_y2') +
        countElectivePillsY2('pdhpe',        'y10-curriculum-container_y2') +
        countElectivePillsY2('hpe',          'y10-curriculum-container_y2') +
        hasLanguageY2();
    }

    countText.innerHTML = '<strong>Total subjects selected: ' + total + '</strong>';
    trackerWrap.style.backgroundColor = '#f4f7f4';
    trackerWrap.style.border = '1px solid #c3d9c3';
    warningText.style.color = '#263358';

    if (yearNum === 7 || yearNum === 8) {
      warningText.textContent = "This is a highly manageable, standard workload for this year level.";
    } else if (yearNum === 9) {
      if (total <= 6) {
        trackerWrap.style.backgroundColor = '#ffebee';
        trackerWrap.style.border = '1px solid #ffcdd2';
        warningText.style.color = '#c62828';
        warningText.innerHTML = "<strong>Warning:</strong> This is below the recommended number of learning areas and may impact your application approval.";
      } else if (total >= 9) {
        trackerWrap.style.backgroundColor = '#fff8e1';
        trackerWrap.style.border = '1px solid #ffe082';
        warningText.style.color = '#8f6c00';
        warningText.innerHTML = "<strong>Advisory:</strong> 9 or more subjects is a heavy workload for Year 9. Please ensure this is manageable for your child.";
      } else {
        warningText.textContent = "This is a standard, balanced workload for Year 9.";
      }
    } else if (yearNum === 10) {
      if (total <= 6) {
        trackerWrap.style.backgroundColor = '#ffebee';
        trackerWrap.style.border = '1px solid #ffcdd2';
        warningText.style.color = '#c62828';
        warningText.innerHTML = "<strong>Warning:</strong> This is under the recommended number of learning areas and may impact your application approval.";
      } else if (total >= 10) {
        trackerWrap.style.backgroundColor = '#ffebee';
        trackerWrap.style.border = '1px solid #ffcdd2';
        warningText.style.color = '#c62828';
        warningText.innerHTML = "<strong>Intensive Workload:</strong> 10+ subjects is a very heavy senior workload. Please carefully consider your child's schedule before proceeding.";
      } else if (total === 9) {
        trackerWrap.style.backgroundColor = '#fff8e1';
        trackerWrap.style.border = '1px solid #ffe082';
        warningText.style.color = '#8f6c00';
        warningText.innerHTML = "<strong>Advisory:</strong> 9 subjects is a robust workload. Ensure your child has adequate study time mapped out.";
      } else {
        warningText.textContent = "This is a standard, balanced workload for Year 10.";
      }
    }
    window.__calculateY2Workload = calculateY2Workload;
  }

  document.addEventListener('click', function(e) {
    if (e.target.closest('.ms-option') || e.target.closest('input[type="checkbox"]') || e.target.closest('.w-checkbox')) {
      setTimeout(calculateY2Workload, 50);
    }
  }, true);

  document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('ms-input')) {
      setTimeout(calculateY2Workload, 50);
    } else {
      calculateY2Workload();
    }
  }, true);

  // Change 3: MutationObserver REMOVED — calculateY2Workload is now called
  // from setActive() via centralised dispatch (already exposed as window.__calculateY2Workload)

  setTimeout(calculateY2Workload, 100);
}

/* =========================
   SMART CHECKBOX SYNC (Duplicate ID Immunity v12 + Locked Protection)
   ========================= */
function bindCheckboxSync() {
  console.log("✅ Smart Checkbox Sync v14 loaded!"); 

  var syncMap = [
    { pills: 'y10-science-pills', cb: 'y10-science-cb' },
    { pills: 'y10-hass-pills', cb: 'y10-hass-cb' },
    { pills: 'y10-tech-pills', cb: 'y10-tech-cb' },
    { pills: 'y10-arts-pills', cb: 'y10-arts-cb' },
    { pills: 'y9-hass-pills', cb: 'y9-hass-cb' },
    { pills: 'y9-tech-pills', cb: 'y9-tech-cb' },
    { pills: 'y9-arts-pills', cb: 'y9-arts-cb' },
    { pills: 'y78-arts-pills', cb: 'y78-arts-cb' }
  ];

  function updateCheckboxes() {
    var yearDropdown = document.querySelector('select[name="student_year_level"]');
    var rawYear = yearDropdown ? yearDropdown.value : '';
    var isF6 = false;
    
    if (rawYear === 'FOUNDATION') {
      isF6 = true;
    } else if (rawYear.match(/\d+/)) {
      if (parseInt(rawYear.match(/\d+/)[0], 10) <= 6) isF6 = true;
    }

    syncMap.forEach(function(item) {
      if (item.cb === 'y78-arts-cb' && isF6) return; 

      var pillWraps = document.querySelectorAll('#' + item.pills);
      var pillWrap = Array.from(pillWraps).find(el => el.offsetParent !== null) || pillWraps[0];
      
      var cbs = document.querySelectorAll('#' + item.cb);
      var element = Array.from(cbs).find(el => el.offsetParent !== null) || cbs[0];
      
      if (!pillWrap || !element) return;

      var wrapper = element.closest('label') || element.closest('.w-checkbox');
      if (!wrapper) return;

      var realInput = element.tagName === 'INPUT' ? element : wrapper.querySelector('input[type="checkbox"]');
      if (!realInput) return;

      // NEW CEASEFIRE: If the checkbox is locked (e.g., F-8 core subjects), leave it alone!
      if (realInput.classList.contains('locked-checkbox') || wrapper.classList.contains('locked-checkbox')) {
          return;
      }

      var selectedCount = pillWrap.querySelectorAll('.ms-option.is-selected').length;
      var shouldBeChecked = (selectedCount > 0);

      if (realInput.checked !== shouldBeChecked) {
         realInput.checked = shouldBeChecked;
         realInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      wrapper.style.pointerEvents = shouldBeChecked ? 'none' : '';
      wrapper.style.opacity = shouldBeChecked ? '0.6' : '1';
    });
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_updateCheckboxes = updateCheckboxes;

  document.addEventListener('click', function(e) {
    if(e.target.closest('.ms-option')) setTimeout(updateCheckboxes, 50); 
  }, true);
  
  document.addEventListener('change', function(e) {
    if(e.target && e.target.classList.contains('ms-input')) setTimeout(updateCheckboxes, 50);
  }, true);

  // Change 3: MutationObserver REMOVED — updateCheckboxes is now called from setActive()

  setTimeout(updateCheckboxes, 100);
}

/* =========================
   PERSONALISE HEADING
   ========================= */
function bindPersonalisedHeading() {
  var heading = document.getElementById('child-name-heading');
  // NOTE: Change 'student_first_name' to match whatever the actual name of your input field is in Step 1!
  var nameInput = document.querySelector('input[name="student_first_name"]'); 

  if (!heading || !nameInput) return;

  function updateHeading() {
    var childName = nameInput.value.trim();
    if (childName) {
      heading.textContent = "Personalising " + childName + "'s learning plan";
    } else {
      heading.textContent = "Personalising your child's learning plan";
    }
  }

  // Update when they type the name in Step 1
  nameInput.addEventListener('input', updateHeading);
  // Run on load in case it's already filled out
  setTimeout(updateHeading, 200);
}

/* =========================================
   CONTAINER 3A / 3B MASTER SWITCH
   ========================================= */
function bindGoalContainerSwapper() {
  const container3A = document.getElementById('container-3a-general'); 
  const container3B = document.getElementById('container-3b-goaldirected');
  
  function swapContainers() {
    const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;
    
    if (pType === 'goal_directed') {
      if (container3A) container3A.style.setProperty('display', 'none', 'important');
      if (container3B) container3B.style.setProperty('display', 'block', 'important'); 
    } else {
      if (container3A) container3A.style.setProperty('display', 'grid', 'important');
      if (container3B) container3B.style.setProperty('display', 'none', 'important');
    }
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_swapProgramContainers = swapContainers;

  document.addEventListener('change', function(e) {
    if (e.target && e.target.name === 'program_type') {
      setTimeout(swapContainers, 50);
    }
  });

  document.addEventListener('click', function(e) {
    const radioWrapper = e.target.closest('.w-radio');
    if (radioWrapper && radioWrapper.querySelector('input[name="program_type"]')) {
      setTimeout(swapContainers, 50);
    }
  }, true);
  
  // Change 3: MutationObserver REMOVED — swapContainers is now called from setActive()

  setTimeout(swapContainers, 100);
}
/* =========================
   DYNAMIC PROGRESS BAR
   ========================= */

/* =========================
   STEP 0 INFO BANNER UPGRADE
   ========================= */
function upgradeStep0Banner() {
  // Find all text elements on the page
  var elements = document.querySelectorAll('p, div, span, h4, h5, h6');
  
  elements.forEach(function(el) {
    // Look for the exact text currently sitting on the page
    if (el.textContent.trim() === "These details apply to the whole order." && el.children.length === 0) {
       
       // Replace the text with our new, supportive copy
       el.innerHTML = '<strong>Settings for your whole application</strong><br>The details entered on this page will apply to your entire family\'s home education program.';
       
       // Apply the exact same "Green Info Banner" styling we used in the Curriculum step!
       el.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 24px; margin-top: 8px; font-family: Montserrat, sans-serif; max-width: 1450px; width: 100%; box-sizing: border-box; display: block;';
    }
  });
}

/* =========================
   STEP 3: ACADEMIC TRACKING WIDGET
   ========================= */
function bindAcademicTrackingWidget() {
  var TRACKING_AREAS = [
    { id: "english",     label: "English" },
    { id: "mathematics", label: "Mathematics" },
    { id: "science",     label: "Science" },
    { id: "hass",        label: "Humanities & Social Sciences" },
    { id: "technologies",label: "Technologies" },
    { id: "the_arts",    label: "The Arts" },
    { id: "hpe",         label: "Health & Physical Education" },
    { id: "languages",   label: "Languages" }
  ];

  var WIDGET_ID = "aed-tracking-widget";
  var CONTAINER_ID = "aed-tracking-widget-wrap";

  // Inject styles
  if (!document.getElementById("aed-tracking-styles")) {
    var s = document.createElement("style");
    s.id = "aed-tracking-styles";
    s.textContent = [
      ".aed-tracking-widget { font-family: Montserrat, sans-serif; margin-bottom: 20px; }",
".aed-tracking-header { background: #f5f7f4; border-radius: 16px 16px 0 0; padding: 12px 16px; border: 1px solid #dde4dd; border-bottom: none; }",
      ".aed-tracking-title { font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #263358; }",
      ".aed-tracking-subtitle { font-size: 14px; color: #7a7f87; margin-top: 3px; }",
      ".aed-tracking-body { background: #ffffff; border: 1px solid #dde4dd; border-top: none; border-radius: 0 0 16px 16px; padding: 16px 18px; }",
      ".aed-tracking-helper { font-size: 14px; color: #7a7f87; margin-bottom: 16px; line-height: 1.5; }",
      ".aed-tracking-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }",
      "@media (max-width: 640px) { .aed-tracking-row { grid-template-columns: 1fr; } }",
      ".aed-tracking-col-label { font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #263358; margin-bottom: 8px; }",
     ".aed-tracking-pills { display: flex; flex-wrap: wrap; gap: 6px; }",
     ".aed-tracking-pill { display: inline-flex; align-items: center; padding: 7px; border-radius: 16px; font-size: 13px; line-height: 1.2em; font-weight: 400; cursor: pointer; user-select: none; transition: all 0.15s ease; color: #4f6a5a; background: #e7ece8; border: 1px solid #dde4dd; opacity: 0.8; }",
      ".aed-tracking-pill:hover { background: #dde5dd; border-color: #799377; }",
".aed-tracking-pill.needs-attention { background: #263358; color: #f6f7f5; border-color: #263358; }",
      ".aed-tracking-pill.excelling { background: #263358; color: #f6f7f5; border-color: #263358; }"
    ].join("\n");
    document.head.appendChild(s);
  }

  function renderWidget() {
    var step3 = document.querySelector('.step[data-step="3"]');
    if (!step3) return;

    // Don't render on Step 4
    if (document.querySelector('.step[data-step="4"]') && document.querySelector('.step[data-step="4"]').classList.contains("is-active")) return;

    // Find the first curriculum container in Step 3 to insert before
    var anchor = step3.querySelector('#f6-curriculum-container, #y9-curriculum-container, #y10-curriculum-container');
    if (!anchor) return;

    // Remove existing widget first
    var existing = document.getElementById(WIDGET_ID);
    if (existing) existing.remove();

    var widget = document.createElement("div");
    widget.id = WIDGET_ID;
    widget.className = "aed-tracking-widget";

    // Header
    var header = document.createElement("div");
    header.className = "aed-tracking-header";
    header.innerHTML = '<div class="aed-tracking-title">How is your child tracking?</div>';
    widget.appendChild(header);

    // Body
    var body = document.createElement("div");
    body.className = "aed-tracking-body";

    var helper = document.createElement("div");
    helper.className = "aed-tracking-helper";
    helper.textContent = "If your child is working below year level in a subject, select it under 'Studying below year level' — we'll pitch that area at a gentler pace with more scaffolding. If they're ready to push ahead, select it under 'Studying above year level' — we'll bring in more advanced content. Leave a subject unselected if they're on track.";
    body.appendChild(helper);

    var row = document.createElement("div");
    row.className = "aed-tracking-row";

    var state = { needs_attention: [], excelling: [] };

    // FIX: Seed state from __aed_child_applications (authoritative source).
    // Previously this read from hidden inputs inside the widget body — but
    // renderWidget() removes the old widget just above, so those inputs are
    // always gone by the time we read them. __aed_child_applications is
    // unaffected by DOM rebuilds.
    var _trackIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    var _trackData = (window.__aed_child_applications && window.__aed_child_applications[_trackIdx]) || {};
    if (_trackData["aed-tracking-needs_attention"] && _trackData["aed-tracking-needs_attention"].length) {
      state.needs_attention = _trackData["aed-tracking-needs_attention"].slice();
    }
    if (_trackData["aed-tracking-excelling"] && _trackData["aed-tracking-excelling"].length) {
      state.excelling = _trackData["aed-tracking-excelling"].slice();
    }
    // Change 4: Removed the hidden-input fallback. It caused data bleed
    // between children because the hidden inputs are global (not per-child)
    // and retain the previous child's selections when a new child loads.
    // __aed_child_applications is the single source of truth.

    function buildColumn(type, colLabel) {
      var col = document.createElement("div");
      var label = document.createElement("div");
      label.className = "aed-tracking-col-label";
      label.textContent = colLabel;
      col.appendChild(label);

      var pillsWrap = document.createElement("div");
      pillsWrap.className = "aed-tracking-pills";

      TRACKING_AREAS.forEach(function(area) {
        var pill = document.createElement("span");
        pill.className = "aed-tracking-pill";
        pill.textContent = area.label;
        pill.setAttribute("data-area", area.id);
        pill.setAttribute("data-type", type);

        if (state[type].indexOf(area.id) !== -1) {
          pill.classList.add(type === "needs_attention" ? "needs-attention" : "excelling");
        }

        pill.addEventListener("click", function() {
          var idx = state[type].indexOf(area.id);
          var otherType = type === "needs_attention" ? "excelling" : "needs_attention";

          if (idx !== -1) {
            // Deselect
            state[type].splice(idx, 1);
            pill.classList.remove(type === "needs_attention" ? "needs-attention" : "excelling");
          } else {
            // Select — also remove from the other column if present
            var otherIdx = state[otherType].indexOf(area.id);
            if (otherIdx !== -1) {
              state[otherType].splice(otherIdx, 1);
              var otherPill = row.querySelector('.aed-tracking-pill[data-area="' + area.id + '"][data-type="' + otherType + '"]');
              if (otherPill) otherPill.classList.remove("needs-attention", "excelling");
            }
            state[type].push(area.id);
            pill.classList.add(type === "needs_attention" ? "needs-attention" : "excelling");
          }

// Persist to hidden inputs — stored inside widget body so collectChildData() finds them
          ["needs_attention", "excelling"].forEach(function(t) {
            var inp = document.getElementById("aed-tracking-" + t);
            if (!inp) {
              inp = document.createElement("input");
              inp.type = "hidden";
              inp.id = "aed-tracking-" + t;
              inp.name = "aed-tracking-" + t;
              body.appendChild(inp);
            }
            inp.value = JSON.stringify(state[t]);
          });

          // FIX: Also write directly to __aed_child_applications so the data
          // survives renderWidget() rebuilding the DOM (which destroys the
          // hidden inputs above). Mirrors the same fix applied to curriculum pills.
          if (window.__aed_child_applications && typeof getChildIndex === 'function') {
            var _saveIdx = getChildIndex();
            if (window.__aed_child_applications[_saveIdx]) {
              window.__aed_child_applications[_saveIdx]["aed-tracking-needs_attention"] = state.needs_attention.slice();
              window.__aed_child_applications[_saveIdx]["aed-tracking-excelling"] = state.excelling.slice();
            }
          }
        });

        pillsWrap.appendChild(pill);
      });

      col.appendChild(pillsWrap);
      return col;
    }

    row.appendChild(buildColumn("needs_attention", "Studying below year level"));
    row.appendChild(buildColumn("excelling", "Studying above year level"));
    body.appendChild(row);
    widget.appendChild(body);

    anchor.parentNode.insertBefore(widget, anchor);
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_renderNeedsWidget = renderWidget;

  // Change 3: MutationObserver REMOVED — renderWidget is now called from setActive()

  setTimeout(renderWidget, 800);
}

/* =========================
   CROSS-MODULE EXPOSURES — for aed-navigation.js (Module 4) and aed-data.js (Module 5)
   ========================= */
window.bindConfirmationGating        = bindConfirmationGating;
window.refreshAllSelectColours       = refreshAllSelectColours;
window.getGoalDirectedProgramType    = getGoalDirectedProgramType;
window.resyncAllMultiSelectGroups    = resyncAllMultiSelectGroups;
window.applyDefaultCheckedGroups     = applyDefaultCheckedGroups;
window.updateFoundationOptionLabel   = updateFoundationOptionLabel;
window.setupAutoExpandingTextareas   = setupAutoExpandingTextareas;

/* =========================
   INIT
   ========================= */

setChildrenCount(getTotalChildrenFromStep0());
setChildIndex(getChildIndex());

initAllMultiSelectGroups();
bindCurriculumCheckboxes();
bindLanguageToggle();
bindFoundationLabelByState();
bindTooltips();
fixMultiSelectTooltipZIndex(); 
bindYearLevelPills();
bindPillVisibility();
bindPillSelection();
bindStep1Validation();
bindCustomValidation();
bindAcademicTrackingWidget();
bindCurriculumVisibility();
bindY1StepHeading();
bindWorkloadTracker();
bindY2WorkloadTracker();
bindCheckboxSync();
bindPersonalisedHeading();
upgradeStep0Banner();

// --- THE NEWLY RESCUED SCRIPTS ---
initInterestDeepDives();
initGoalDirectedDeepDives();
bindGoalCounter();
bindGoalContainerSwapper();
  
// Static per-child pricing — moved to aed-pricing.js (Module 2)
if (typeof window.AED.applyStaticPricingLabels === 'function') {
  window.AED.applyStaticPricingLabels();
}

function refreshAllSelectColours() {
  document.querySelectorAll('select').forEach(select => {
    if (select.value === "") {
      select.classList.remove("aed-filled");
    } else {
      select.classList.add("aed-filled");
    }
  });
}

document.querySelectorAll('select').forEach(select => {
  select.addEventListener('change', function() {
    this.value === "" ? this.classList.remove("aed-filled") : this.classList.add("aed-filled");
  });
  select.addEventListener('input', function() {
    this.value === "" ? this.classList.remove("aed-filled") : this.classList.add("aed-filled");
  });
});

refreshAllSelectColours();
  
  // --- ADD THIS LINE HERE ---
  setupAutoExpandingTextareas(); 
  // --------------------------
  initLiveSave();
  // --- ADD THESE TWO NEW LINES HERE ---
  initDatePickers(); 
  // ------------------------------------
  /* NEW: live update child name heading while typing */
  document.addEventListener("input", function (e) {
    if (e.target && e.target.name === "student_first_name") {
      updateCurrentChildHeading();
    }
  });
bindConfirmationGating();
bindPayCta();
preventNativeSubmitOnIntakeForm();
bindOrderSummarySync();
applyDefaultCheckedGroups();

/* =========================
   STRIPE CANCEL / PAYMENT FAILED HANDLING (Step 6)
   ========================= */

const urlParams = new URLSearchParams(window.location.search);
const paymentStatus = urlParams.get("payment");

if (paymentStatus === "failed") {
  // Force Step 6 (Payment / Review)
  setActive(STEP_PAYMENT);

  // Show the payment error banner (your Step 6 container)
  const payErrorBanner = document.querySelector(".payment-error");
  if (payErrorBanner) payErrorBanner.style.display = "block";

  // Optional: scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
} else {
  setActive(0);
}
/* =========================
   DYNAMIC STATE PICKER LOCK & VALIDATION (Sticky Navbar Fix v3)
   ========================= */
function bindStatePickerLock() {
  const pickers = document.querySelectorAll('select[name="state-picker"], [data-aed-state-picker="1"], select[name="state"]');

  // 1. Function to lock or unlock based on the current step
  function updateLock() {
    const shouldLock = (typeof window.currentStepNum !== 'undefined' && window.currentStepNum > 0);

    pickers.forEach(picker => {
      const wrapper = picker.closest('.w-select') || picker.parentElement;

      if (shouldLock) {
        picker.style.setProperty('pointer-events', 'none', 'important');
        picker.style.setProperty('opacity', '0.6', 'important');
        
        if (wrapper) {
            wrapper.style.setProperty('pointer-events', 'none', 'important');
            wrapper.style.setProperty('opacity', '0.6', 'important');
            wrapper.title = "State cannot be changed once you have started. Please return to Setup to change.";
        }
      } else {
        picker.style.setProperty('pointer-events', 'auto', 'important');
        picker.style.setProperty('opacity', '1', 'important');

        if (wrapper) {
            wrapper.style.setProperty('pointer-events', 'auto', 'important');
            wrapper.style.setProperty('opacity', '1', 'important');
            wrapper.title = "";
        }
      }
    });
  }

  // 2. Prevent leaving Step 0 if State is empty (Double Navbar Proofed)
  document.addEventListener('click', function(e) {
    const nextBtn = e.target.closest('#btn-next-step0, [data-step-action="next"]');
    if (nextBtn && typeof window.currentStepNum !== 'undefined' && window.currentStepNum === 0) {
      
      // Get all state pickers on the page (static and sticky navbars)
      const statePickers = Array.from(document.querySelectorAll('select[name="state-picker"]'));
      
      // Does ANY picker have a valid selection?
      const validPicker = statePickers.find(p => p.value && p.value.trim() !== '');

      // If none of them have a value, block submission
      if (!validPicker) {
         e.preventDefault();
         e.stopImmediatePropagation();
         
         // Find the sticky/visible picker to attach the error box to
         let visiblePicker = statePickers.reverse().find(p => p.offsetWidth > 0) || statePickers[0];
         
         if (visiblePicker) {
             let errEl = document.getElementById('state-picker-error');
             if (!errEl) {
               errEl = document.createElement('div');
               errEl.id = 'state-picker-error';
               errEl.style.cssText = 'color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 12px; border-radius: 6px; margin-top: 12px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;';
               
               const container = visiblePicker.closest('.field-group') || visiblePicker.parentElement;
               if (container) container.appendChild(errEl);
             }
             errEl.textContent = 'Please select your State from the dropdown before starting your application.';
             errEl.style.display = 'block';
             errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
      } else {
         const errEl = document.getElementById('state-picker-error');
         if (errEl) errEl.style.display = 'none';
         
         // SYNC FIX: If one has a value, silently update all the others
         statePickers.forEach(p => {
            if (p.value !== validPicker.value) {
               p.value = validPicker.value;
            }
         });
      }
    }
  }, true);

  // 3. Keep all pickers in sync when the user changes one manually
  document.addEventListener('change', function(e) {
     if (e.target && e.target.name === 'state-picker') {
        const errEl = document.getElementById('state-picker-error');
        if (errEl) errEl.style.display = 'none';
        
        // Auto-sync the sticky navbar with the static one (and vice versa)
        document.querySelectorAll('select[name="state-picker"]').forEach(p => {
            if (p !== e.target && p.value !== e.target.value) {
                p.value = e.target.value;
            }
        });

        // Notify curriculum system that state changed (Change 2 — replaces setInterval polling)
        document.dispatchEvent(new CustomEvent("aed:stateChanged", { detail: { state: e.target.value } }));
     }
  });

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_updateStateLock = updateLock;


  // 4. Change 3: MutationObserver REMOVED — updateLock is now called from setActive()

  setTimeout(updateLock, 100);
}

bindStatePickerLock();

// Run immediately, on load, and half a second later just in case Webflow loads slowly
/* =========================================
   GOAL STEP VALIDATION & SMART ERRORS
   ========================================= */
// 1. The Custom Error Display Function (Bulletproof Edition)
function showGoalError(msg, targetContainerId) {
  let errEl = document.getElementById('custom-goal-error-box');
  
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id = 'custom-goal-error-box';
    // Added position: relative and z-index to ensure nothing overlaps it
    errEl.style.cssText = 'position: relative; z-index: 9999; color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;';
  }
  
  if (!msg) {
    errEl.style.display = 'none';
    return;
  }

  errEl.textContent = msg;
  errEl.style.display = 'block';

  // Try to find the exact container by ID first, then by Class
  const targetContainer = document.getElementById(targetContainerId) || document.querySelector('.' + targetContainerId);

  if (targetContainer) {
    // Drop the error safely inside the very top of the container
    targetContainer.insertAdjacentElement('afterbegin', errEl);
    errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // ULTIMATE FALLBACK: If the container is hiding, drop the error at the top of the screen!
    const activeStep = document.querySelector('.step.is-active');
    if (activeStep) {
       activeStep.insertAdjacentElement('afterbegin', errEl);
       errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Connect it to the window so we can test it directly in the console!
window.showGoalError = showGoalError;

// 2. Interest-Led & Standard Validation
window.validateInterestLedStep4 = function() {
  showGoalError(null); 
  const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;

  if (pType === 'interest_led' || pType === 'curriculum_based' || pType === 'curriculum_aligned') {
    const primaryGrid = document.getElementById('primary-interests-grid');
    if (primaryGrid) {
      const count = primaryGrid.querySelectorAll('.ms-option.is-selected').length;
      if (count < 1) {
        showGoalError('Please select at least 1 area of interest so we can build investigations around your child’s passions.', 'step3-interests-container');
        return false;
      }
    }
  }

  if (pType !== 'goal_directed') {
    const container3A = document.getElementById('container-3a-general') || document.querySelector('.step3a-goal-container');
    if (container3A) {
      let count = container3A.querySelectorAll('.ms-option.is-selected').length;
      
      // NEW: Count custom text fields!
      ['other_goal_1', 'other_goal_2', 'other_goal_3'].forEach(name => {
        const el = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
        if (el && el.offsetParent !== null && el.value.trim() !== '') count++;
      });

      if (count < 3) {
        showGoalError(`Please select at least 3 goals in total. You currently have ${count} selected.`, 'container-3a-general');
        return false;
      }
    }
  }
  return true;
};

// 3. Goal-Directed Validation
window.validateGoalDirectedStep4 = function() {
  showGoalError(null); 
  const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;
  if (pType !== 'goal_directed') return true;

  // Enforce at least 1 Interest
  const primaryGrid = document.getElementById('primary-interests-grid');
  if (primaryGrid) {
    const interestCount = primaryGrid.querySelectorAll('.ms-option.is-selected').length;
    if (interestCount < 1) {
      showGoalError('Please select at least 1 area of interest so we can build investigations around your child’s passions.', 'step3-interests-container');
      return false;
    }
  }

  let shortCount = 0;
  let longCount = 0;
  let socialShortCount = 0;
  let coreShortCount = 0;

  document.querySelectorAll('.ms-option.is-selected').forEach(pill => {
    if (pill.offsetParent !== null) { 
      const type = pill.getAttribute('data-goal-type');
      const isSocial = pill.getAttribute('data-category') === 'social';

      if (type === 'short') {
         shortCount++;
         if (isSocial) socialShortCount++;
         else coreShortCount++;
      }
      if (type === 'long') longCount++;
    }
  });

  // NEW: Add custom text fields to the Goal-Directed validation count!
  ['other_goal_1', 'other_goal_2', 'other_goal_3', 'short_term_custom'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
      if (el && el.offsetParent !== null && el.value.trim() !== '') shortCount++;
  });
  
  ['long_term_custom'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
      if (el && el.offsetParent !== null && el.value.trim() !== '') longCount++;
  });

  if (shortCount < 4 || shortCount > 8) {
    showGoalError(`Please select between 4 and 8 short-term goals. You currently have ${shortCount} selected.`, 'container-3b-goaldirected');
    return false;
  }
  if (socialShortCount > coreShortCount) {
    showGoalError(`Please select mostly Academic or Independence goals. You currently have too many Social & Emotional goals selected.`, 'container-3b-goaldirected');
    return false;
  }
  if (longCount < 1 || longCount > 2) {
    showGoalError(`Please select 1 or 2 long-term goals. You currently have ${longCount} selected.`, 'container-3b-goaldirected');
    return false;
  }

  return true;
};

// 4. Sticky Counter
function bindGoalCounter() {
  let banner = document.getElementById('aed-goal-counter');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'aed-goal-counter';
    banner.style.cssText = `
      display: none; background: #fdfdfd; border: 1px solid #DDe4dd; padding: 12px 20px;
      border-radius: 8px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      justify-content: center; gap: 24px; font-family: Montserrat, sans-serif;
      font-size: 14px; color: #263358;
    `;
    
    const container3B = document.getElementById('container-3b-goaldirected') || document.querySelector('.step3b-goal-container');
    if (container3B) {
      container3B.insertAdjacentElement('afterbegin', banner);
    } else {
      document.body.appendChild(banner);
    }
  }

  function updateCounter() {
    const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;
    
    // Check if goal section is visible
    let hasVisibleGoals = false;
    document.querySelectorAll('.ms-option[data-goal-type="short"]').forEach(pill => {
       if (pill.offsetWidth > 0 || pill.offsetParent !== null) hasVisibleGoals = true;
    });

    if (pType !== 'goal_directed' || !hasVisibleGoals) {
      banner.style.setProperty('display', 'none', 'important');
      return;
    }

    banner.style.setProperty('display', 'flex', 'important');

    let shortCount = 0;
    let longCount = 0;

    // 1. Count clicked pills
    document.querySelectorAll('.ms-option.is-selected').forEach(pill => {
      if (pill.offsetParent !== null) { 
        if (pill.getAttribute('data-goal-type') === 'short') shortCount++;
        if (pill.getAttribute('data-goal-type') === 'long') longCount++;
      }
    });

    // 2. NEW: Count custom "Other" text inputs (Short-Term)
    ['other_goal_1', 'other_goal_2', 'other_goal_3', 'short_term_custom'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
      // If the field is visible and actually has text typed in it, count it!
      if (el && el.offsetParent !== null && el.value.trim() !== '') {
        shortCount++;
      }
    });

    // 3. NEW: Count custom "Other" text inputs (Long-Term)
    ['long_term_custom'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
      if (el && el.offsetParent !== null && el.value.trim() !== '') {
        longCount++;
      }
    });

    const shortColor = (shortCount >= 4 && shortCount <= 8) ? '#386641' : '#c62828';
    const longColor = (longCount >= 1 && longCount <= 2) ? '#386641' : '#c62828';

    banner.innerHTML = `
      <div><strong>Short-Term:</strong> <span style="color: ${shortColor}; font-weight: bold;">${shortCount}</span> (Target: 4-8)</div>
      <div><strong>Long-Term:</strong> <span style="color: ${longColor}; font-weight: bold;">${longCount}</span> (Target: 1-2)</div>
    `;
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_updateGoalCounter = updateCounter;

  // Listen for pill clicks
  document.addEventListener('click', function(e) {
    if (e.target.closest('.ms-option')) setTimeout(updateCounter, 50);
  }, true);

  // NEW: Listen for typing in the custom text fields
  document.addEventListener('input', function(e) {
    const n = e.target.name || "";
    if (n.includes('other_goal') || n.includes('custom')) {
      setTimeout(updateCounter, 50);
    }
  }, true);

  // Change 3: MutationObserver REMOVED — updateCounter is now called from setActive()

  setTimeout(updateCounter, 100);
}

setTimeout(bindGoalCounter, 500);
/* =========================================
   PROGRAM TYPE HELPER
   ========================================= */
function getGoalDirectedProgramType() {
  // 1. Check the live radio button on the screen first
  const checkedRadio = document.querySelector('input[type="radio"][name="program_type"]:checked');
  if (checkedRadio && checkedRadio.value) {
    return checkedRadio.value;
  }

  // 2. Fall back to saved memory state if no radio is currently selected
  const idx = typeof getChildIndex === 'function' ? getChildIndex() : 0;
  const saved = window.__aed_child_applications && window.__aed_child_applications[idx];
  if (saved && saved.program_type) {
    return saved.program_type;
  }

  return null;
}
/* =========================================
   CONTAINER 3A / 3B MASTER SWITCH & BANNERS
   ========================================= */
function bindGoalContainerSwapper() {
  const container3A = document.getElementById('container-3a-general'); 
  const container3B = document.getElementById('container-3b-goaldirected');
  
  // NEW: Inject the friendly green banner into Container 3A
  if (container3A && !document.getElementById('aed-3a-banner')) {
    const banner = document.createElement('div');
    banner.id = 'aed-3a-banner';
    banner.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1450px; width: 100%; box-sizing: border-box;';
    banner.innerHTML = '<strong>Program Goals</strong><br>Please select <strong>at least 3 goals in total</strong> across the categories below to help shape the overall direction of your child\'s learning.';
    container3A.insertAdjacentElement('afterbegin', banner);
  }

  function swapContainers() {
    const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;
    
    if (pType === 'goal_directed') {
      if (container3A) container3A.style.setProperty('display', 'none', 'important');
      if (container3B) container3B.style.setProperty('display', 'block', 'important');
    } else {
      if (container3A) container3A.style.setProperty('display', 'block', 'important');
      if (container3B) container3B.style.setProperty('display', 'none', 'important');
    }
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_swapGoalContainers = swapContainers;

  document.addEventListener('change', function(e) {
    if (e.target.name === 'program_type') setTimeout(swapContainers, 50);
  });
  
  // Change 3: MutationObserver REMOVED — swapContainers is now called from setActive()

  setTimeout(swapContainers, 100);
}
setTimeout(bindGoalContainerSwapper, 500);


// --- INDEPENDENT NAME UPDATE SCRIPT ---
// This runs separately to ensure the heading updates even if the main script is messy.
document.addEventListener('input', function(e) {
    // 1. Check if the element being typed in is the student name field
    if (e.target.name === 'student_first_name' || e.target.name === 'child_name' || e.target.getAttribute('data-name') === 'child_name') {
        const currentName = e.target.value.trim() || "Your child";

        // 2. Update the main heading (Personalising X's...)
        const personalHeading = document.querySelector('.personalising-heading');
        if (personalHeading) {
            personalHeading.textContent = `Personalising ${currentName}'s learning plan`;
        }

        // 3. Update the sidebar/ID display
        const idHeading = document.getElementById('child-id-display');
        if (idHeading) {
            idHeading.textContent = `Child: ${currentName}`;
        }

        // 4. NEW: Universal Name Injector (Updates Step 3B and anywhere else!)
        document.querySelectorAll('.insert-student-name').forEach(function(el) {
            el.textContent = currentName;
        });
    }
});
// --- IMPROVED CHECKBOX PROTECTION ---
document.addEventListener('change', function(e) {
  const checkbox = e.target;
  // This finds the section wrapper. 
  // Make sure your sections have the class 'learning-area-section' in Webflow!
  const section = checkbox.closest('.learning-area-section');
  
  if (!section || checkbox.type !== 'checkbox') return;

  // 1. Look for pills that have the 'is-active' class
  const activePills = section.querySelectorAll('.pill.is-active');
  
  // 2. Look for any hidden checkboxes inside those pills that are checked
  const checkedPillInputs = section.querySelectorAll('.pill input:checked');

  // If the user tries to uncheck the main category...
  if (!checkbox.checked) {
    // Check if there are active pills OR checked pill inputs
    if (activePills.length > 0 || checkedPillInputs.length > 0) {
      // Force it back to checked
      checkbox.checked = true;
      alert("Please deselect your specific subject pills before removing this learning area.");
    }
  }
});
/* =========================================
   STEP 3: SMART INTEREST DEEP DIVES (ALL 13 CATEGORIES)
   ========================================= */
function initInterestDeepDives() {
  const primaryGrid = document.getElementById('primary-interests-grid');
  if (!primaryGrid) return;

  function updateDeepDives() {
    let isInterestLed = false;
    
    // 1. Bulletproof Program Type Check
    const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;
    if (pType === 'interest_led') isInterestLed = true;

    const radioBtn = document.getElementById('interest_led');
    if (radioBtn && radioBtn.checked) {
        isInterestLed = true;
    }

    // 2. Toggle the subheadings based on program type
    const stdSub = document.getElementById('subheading-standard');
    const intSub = document.getElementById('subheading-interest-led');
    if (stdSub) stdSub.style.display = isInterestLed ? 'none' : 'block';
    if (intSub) intSub.style.display = isInterestLed ? 'block' : 'none';

    // 3. The COMPLETE "Map" - Links Tier 1 data-value to Tier 2 Div ID
    const deepDiveMap = {
      'animals_nature': 'deep-dive-animals-nature',
      'technology_digital_coding': 'deep-dive-technology-digital-coding', /* Check if your main pill is digital_coding or digital_design! */
      'art_creativity': 'deep-dive-art-creativity',
      'building_construction': 'deep-dive-building-construction',
      'creative_writing': 'deep-dive-creative-writing',
      'space_astronomy': 'deep-dive-space-astronomy',
      'strategic_games': 'deep-dive-strategic-games',
      'online_gaming': 'deep-dive-online-gaming',
      'history_culture': 'deep-dive-history-culture',
      'cooking_life_skills': 'deep-dive-cooking-life-skills',
      'science_experiments': 'deep-dive-science-experiments',
      'music': 'deep-dive-music',
      'sport': 'deep-dive-sport'
    };

    // 4. Get selected values safely from the hidden input
    const primaryInput = primaryGrid.querySelector('.ms-input');
    let selectedPills = [];
    if (primaryInput && primaryInput.value) {
      try { selectedPills = JSON.parse(primaryInput.value); } catch(e) {}
    }

    // 5. Show or Hide the Deep Dives
    for (const [pillValue, containerId] of Object.entries(deepDiveMap)) {
      const deepDiveDiv = document.getElementById(containerId);
      if (deepDiveDiv) {
        // Show if Interest-Led AND they clicked the matching pill
        if (isInterestLed && selectedPills.includes(pillValue)) {
          deepDiveDiv.style.display = 'block';
        } else {
          deepDiveDiv.style.display = 'none';
        }
      }
    }
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_updateDeepDives = updateDeepDives;

  // Listen for native hidden input changes
  const primaryInput = primaryGrid.querySelector('.ms-input');
  if (primaryInput) {
    primaryInput.addEventListener('change', updateDeepDives);
  }

  // Listen for clicks on the main grid
  primaryGrid.addEventListener('click', function(e) {
    if (e.target.closest('.ms-option')) {
      setTimeout(updateDeepDives, 50); 
    }
  }, true);

  // Change 3: MutationObserver REMOVED — updateDeepDives is now called from setActive()

  // Run once on load just in case
  setTimeout(updateDeepDives, 100);
}

// Start the watcher
setTimeout(initInterestDeepDives, 500);

/* =========================================
   STEP 3: GOAL-DIRECTED DEEP DIVES (CONTAINER 3B)
   ========================================= */
function initGoalDirectedDeepDives() {
  // 1. The Map: Links Tier 1 pill values to Tier 2 Deep Dive Box IDs
  const goalDeepDiveMap = {
    // Academic
    'gd_reading_writing': 'deep-dive-gd-reading',
    'gd_numeracy_maths': 'deep-dive-gd-numeracy',
    'gd_digital_tech': 'deep-dive-gd-digital',
    'gd_creative': 'deep-dive-gd-creative',
    // Social
    'gd_emotional': 'deep-dive-gd-emotional',
    'gd_social': 'deep-dive-gd-social',
    'gd_communication': 'deep-dive-gd-communication',
    'gd_resilience': 'deep-dive-gd-resilience',
    // Independence
    'gd_lifeskills': 'deep-dive-gd-lifeskills',
    'gd_organisation': 'deep-dive-gd-organisation',
    'gd_financial': 'deep-dive-gd-financial',
    'gd_pathways': 'deep-dive-gd-pathways'
  };

  function updateGoalDeepDives() {
    const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;
    if (pType !== 'goal_directed') return;

    // 2. NEW METHOD: Bypass the hidden inputs and read the live visible pills directly
    const selectedPills = Array.from(document.querySelectorAll('.ms-option.is-selected'))
                               .map(el => el.getAttribute('data-value'));

    // 3. Show or Hide the corresponding deep dive boxes with Webflow overrides
    for (const [pillValue, containerId] of Object.entries(goalDeepDiveMap)) {
      const deepDiveDiv = document.getElementById(containerId);
      if (deepDiveDiv) {
        if (selectedPills.includes(pillValue)) {
          deepDiveDiv.style.setProperty('display', 'block', 'important');
        } else {
          deepDiveDiv.style.setProperty('display', 'none', 'important');
        }
      }
    }
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_updateGoalDeepDives = updateGoalDeepDives;

  // 4. Listeners to trigger the reveal instantly
  document.addEventListener('click', function(e) {
    if (e.target.closest('.ms-option')) {
      setTimeout(updateGoalDeepDives, 50);
    }
  }, true);

  // Change 3: MutationObserver REMOVED — updateGoalDeepDives is now called from setActive()

  setTimeout(updateGoalDeepDives, 100);
}
/* =========================
   STEP 3: DYNAMIC HEADING (Y1)
   ========================= */
function bindY1StepHeading() {
  const heading = document.getElementById('y1-step-heading');
  if (!heading) return;

  function updateY1Heading() {
    const yearDropdown = document.querySelector('select[name="student_year_level"]');
    const nameInput = document.querySelector('input[name="student_first_name"]');

    const yearVal = yearDropdown ? yearDropdown.value : '';
    const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : null;

    let yearLabel = '';
    if (yearVal === 'FOUNDATION') {
      yearLabel = 'Prep';
    } else {
      const match = yearVal.match(/\d+/);
      yearLabel = match ? 'Year ' + match[0] : '';
    }

    if (name && yearLabel) {
      heading.textContent = "Select " + name + "'s " + yearLabel + " curriculum & electives";
    } else if (yearLabel) {
      heading.textContent = "Select " + yearLabel + " curriculum & electives";
    }
  }

  // Change 3: Expose for centralised dispatch from setActive()
  window.__aed_updateY1Heading = updateY1Heading;

  // Run when year level or name changes
  document.addEventListener('change', function(e) {
    if (e.target.name === 'student_year_level') setTimeout(updateY1Heading, 50);
  });
  document.addEventListener('input', function(e) {
    if (e.target.name === 'student_first_name') setTimeout(updateY1Heading, 50);
  });

  // Change 3: MutationObserver REMOVED — updateY1Heading is now called from setActive()

  setTimeout(updateY1Heading, 100);
}

/* =========================
   STEP 4: CURRICULUM YEAR 2 WIRING
   Change 4: bindY2CurriculumVisibility REMOVED.
   - Banner creation moved to initYearTabs()
   - Y2 heading updates handled by tab label system
   - checkY2YearLevel was just a wrapper around refreshY2CurriculumDisplay()
     which is now called directly from the tab system
   ========================= */

/* ==========================================================
   CHANGE 4: Y1/Y2 TAB SYSTEM
   Creates a tab bar inside Step 3 that toggles between
   Year 1 and Year 2 curriculum panels. Y2 containers from
   Step 4 are physically relocated into Step 3 at init time.
   ========================================================== */
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

// Init the tab system after everything else has loaded
setTimeout(initYearTabs, 600);

});