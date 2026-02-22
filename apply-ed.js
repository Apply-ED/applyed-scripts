
// 1. THE GLOBAL BRIDGE (Must be at the very top)
window.jumpToChild = function(targetIdx) {
    if (window.aed_nav) {
        window.aed_nav.jump(targetIdx);
    } else {
        console.error("Navigation bridge not ready.");
    }
};

window.Webflow ||= [];
window.Webflow.push(function () {
  "use strict";

  // 2. THE NAVIGATION REGISTER (Connects the bridge to your private functions)
  window.aed_nav = {
      jump: function(idx) {
          setChildIndex(idx);
          loadChildData(idx);
          setActive(1); // Physically moves the screen back to Step 1
          renderChildNavBar();
      }
  };

  /* =========================
      CONFIG (EDIT THESE)
     ========================= */


  const MAKE_CREATE_CHECKOUT_URL = "https://hook.eu1.make.com/9yolafl9n5m9z5osn9vnwxm8w100rse9";
  

  // Add this attribute to the intake form:
  // <form data-aed-form="intake"> ... </form>
  const INTAKE_FORM_SELECTOR = 'form[data-aed-form="intake"]';

  // Step 6 CTA button
  const PAY_CTA_SELECTOR = "#pay-button";

  // Confirmation wrapper (Step 6)
  const CONFIRMATIONS_WRAP_SELECTOR = ".confirmations-wrap";

  // Error element id (will be created if missing)
  const PAY_ERROR_ID = "pay-error";

  const REQUEST_TIMEOUT_MS = 20000;

	const CHILD_SUMMARY_SELECTOR = "#child-summary-display";

  /* =========================
     PRICING (single source of truth)
     ========================= */

function getCfgAmountCents(path) {
  const cfg = window.APPLYED_PRICING_CONFIG;
  if (!cfg) return null;

  const node = path.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), cfg);
  const cents = node && typeof node.amount_cents === "number" ? node.amount_cents : null;

  return cents;
}


  function centsToDollars(cents) { return (Number(cents || 0) / 100); }

  function aud(amountDollars) {
    try {
      return Number(amountDollars).toLocaleString("en-AU", { style: "currency", currency: "AUD" });
    } catch (_) {
      return "$" + String(amountDollars);
    }
  }

  /* =========================
     DOM HELPERS
     ========================= */

  function qs(sel, root) { return (root || document).querySelector(sel); }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showEl(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = show ? "" : "none";
  }

  function showRow(labelId, priceId, show) {
    showEl(labelId, show);
    showEl(priceId, show);
  }

  function getElByName(name) { return document.querySelector('[name="' + name + '"]'); }

  function isChecked(name) {
    const el = getElByName(name);
    return !!(el && el.checked);
  }
function setTextAll(selector, text) {
  document.querySelectorAll(selector).forEach(el => { el.textContent = text; });
}

function showAll(selector, show) {
  document.querySelectorAll(selector).forEach(el => { el.style.display = show ? "" : "none"; });
}


/* =========================
   TRAVEL (family-level) SECTION TOGGLE (Step 0)
   ========================= */

function toggleTravelFamilySection() {
  const section = document.getElementById("travel-family-section");
  if (!section) return;

  const show = isChecked("add_on_travel");
  section.style.display = show ? "" : "none";

  // Do NOT clear values on uncheck.
}

  function getSelectInt(name, fallback) {
    const el = getElByName(name);
    if (!el) return fallback;
    const n = parseInt(String(el.value || "").trim(), 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function writeHidden(name, value) {
    const el = getElByName(name);
    if (!el) return;
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function toInt(val, fallback) {
    const n = parseInt(String(val || "").trim(), 10);
    return Number.isFinite(n) ? n : fallback;
  }

	function safeParseJsonArray(raw) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch (_) {
    return [];
  }
}

let PRICING = null;

function initPricingFromConfig() {
  if (PRICING) return PRICING;

  const cfg = window.APPLYED_PRICING_CONFIG;
  if (!cfg) throw new Error("APPLYED_PRICING_CONFIG not found (load order issue).");

  const get = (path) => {
    const node = path.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), cfg);
    const cents = node && typeof node.amount_cents === "number" ? node.amount_cents : null;
    if (cents == null) throw new Error("Missing pricing config for: " + path);
    return cents;
  };

  const getOptional = (path) => {
    const node = path.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), cfg);
    return node && typeof node.amount_cents === "number" ? node.amount_cents : null;
  };

  const expeditedBase = get("add_ons.expedited_delivery");
  const expeditedWithWeekly = getOptional("add_ons.expedited_delivery_with_weekly") ?? expeditedBase;

  PRICING = {
    first_child_cents: get("products.base_program"),
    additional_child_cents: get("products.additional_child"),
    weekly_addon_cents_per_child: get("add_ons.detailed_weekly_planning"),
    travel_addon_cents_per_child: get("add_ons.travel_program"),

    expedited_addon_cents_per_child: expeditedBase,
    expedited_addon_with_weekly_cents_per_child: expeditedWithWeekly
  };

  return PRICING;
}



  /* =========================
     ORDER SUMMARY (Step 0 UI) + HIDDEN FIELDS
     ========================= */
function buildOrderFromStep0() {
  const P = initPricingFromConfig();

  const totalChildren = Math.max(1, getSelectInt("total_children", 1));
  const additionalChildren = Math.max(0, totalChildren - 1);

  const addTravel = isChecked("add_on_travel");
  const addExpedited = isChecked("add_on_expedited");
  const addWeekly = isChecked("add_on_weekly");

  const baseCents = P.first_child_cents + additionalChildren * P.additional_child_cents;
  const additionalCents = additionalChildren * P.additional_child_cents;

  const travelCents = addTravel ? totalChildren * P.travel_addon_cents_per_child : 0;
  const expeditedUnitCents = addWeekly
  ? P.expedited_addon_with_weekly_cents_per_child
  : P.expedited_addon_cents_per_child;

const expeditedCents = addExpedited ? totalChildren * expeditedUnitCents : 0;

  const weeklyCents = addWeekly ? totalChildren * P.weekly_addon_cents_per_child : 0;

  const totalCents = baseCents + travelCents + expeditedCents + weeklyCents;

  const lineItems = [];

  // First child base program (always $169)
  lineItems.push({
    id: "base_program_first_child",
    label: "Individual Home Education Program (first child)",
    quantity: 1,
    unit_amount_cents: P.first_child_cents,
    amount_cents: P.first_child_cents
  });

  // Additional children line item (if any)
  if (additionalChildren > 0) {
    lineItems.push({
      id: "additional_child",
      label: `Additional child (×${additionalChildren})`,
      quantity: additionalChildren,
      unit_amount_cents: P.additional_child_cents,
      amount_cents: additionalCents
    });
  }

  // Travel
  if (addTravel) {
    lineItems.push({
      id: "travel_program_addon",
      label: "Travel program add-on (per child)",
      quantity: totalChildren,
      unit_amount_cents: P.travel_addon_cents_per_child,
      amount_cents: travelCents
    });
  }

  // Expedited
// Expedited (single line item, price depends on weekly selection)
if (addExpedited) {
  lineItems.push({
    id: "expedited_delivery_addon",
    label: addWeekly ? "Expedited delivery (with weekly planning)" : "Expedited delivery",
    quantity: totalChildren,
    unit_amount_cents: expeditedUnitCents,
    amount_cents: expeditedCents
  });
}


  // Weekly planning
  if (addWeekly) {
    lineItems.push({
      id: "detailed_weekly_planning_addon",
      label: "Detailed weekly planning (per child)",
      quantity: totalChildren,
      unit_amount_cents: P.weekly_addon_cents_per_child,
      amount_cents: weeklyCents
    });
  }

  return {
    totalChildren,
    additionalChildren,
    add_ons: { travel: addTravel, expedited: addExpedited, weekly: addWeekly },
    cents: {
      first_child: P.first_child_cents,
      base: baseCents,
      additional: additionalCents,
      travel: travelCents,
      expedited: expeditedCents,
      weekly: weeklyCents,
      total: totalCents
    },
    lineItems
  };
}

function recalcOrderSummaryUIAndHidden() {
  const order = buildOrderFromStep0();

  setTextAll(".aed-price-base", aud(centsToDollars(order.cents.first_child)));
  setTextAll(".aed-price-additional", aud(centsToDollars(order.cents.additional)));
  setTextAll(".aed-price-travel", aud(centsToDollars(order.cents.travel)));
  setTextAll(".aed-price-expedited", aud(centsToDollars(order.cents.expedited)));
  setTextAll(".aed-price-weekly", aud(centsToDollars(order.cents.weekly)));
  setTextAll(".aed-price-total", aud(centsToDollars(order.cents.total)));

// Update label text for additional child row
  const additionalCount = Math.max(0, order.totalChildren - 1);
  document.querySelectorAll(".aed-label-additional").forEach(el => {
    el.textContent = additionalCount > 0 ? `Additional child (×${additionalCount})` : "Additional child";
  });

  // Update label text for per-child add-on rows
  const tc = order.totalChildren;
  document.querySelectorAll(".aed-label-weekly").forEach(el => {
    el.textContent = tc > 1 ? `Detailed Weekly Plan Add-On (×${tc})` : "Detailed Weekly Plan Add-On";
  });
  document.querySelectorAll(".aed-label-travel").forEach(el => {
    el.textContent = tc > 1 ? `Travel Program Add-On (×${tc})` : "Travel Program Add-On";
  });
  document.querySelectorAll(".aed-label-expedited").forEach(el => {
    el.textContent = tc > 1 ? `Expedited Delivery Add-On (×${tc})` : "Expedited Delivery Add-On";
  });

  // Show/hide summary rows
  showAll(".aed-row-additional", order.cents.additional > 0);
  showAll(".aed-row-travel", order.cents.travel > 0);
  showAll(".aed-row-expedited", order.cents.expedited > 0);
  showAll(".aed-row-weekly", order.cents.weekly > 0);

  // Hidden fields
  writeHidden("order_currency", "AUD");
  writeHidden("order_total_cents", order.cents.total);
  writeHidden("order_add_ons_json", JSON.stringify(order.add_ons));
  writeHidden("order_line_items_json", JSON.stringify(order.lineItems));


}

function bindOrderSummarySync() {
  recalcOrderSummaryUIAndHidden();

  const childrenEl = getElByName("total_children");
  const travelEl = getElByName("add_on_travel");
  const expeditedEl = getElByName("add_on_expedited");
  const weeklyEl = getElByName("add_on_weekly");

  function getSelectedState() {
    return (localStorage.getItem("aed_selected_state") || "").trim().toUpperCase();
  }

  // --- Existing listeners ---
  if (childrenEl) {
    childrenEl.addEventListener("change", function () {
      recalcOrderSummaryUIAndHidden();
      setChildrenCount(getTotalChildrenFromStep0());
      setChildIndex(0);
      window.__aed_child_applications = [];
    });
  }

  if (travelEl) {
    travelEl.addEventListener("change", function () {
      recalcOrderSummaryUIAndHidden();
      toggleTravelFamilySection();
    });
  }

  if (expeditedEl) {
    expeditedEl.addEventListener("change", recalcOrderSummaryUIAndHidden);
  }

  // Keep travel section state correct on load
  toggleTravelFamilySection();

  // --- Weekly NSW warning UI (single implementation) ---
  const warningPanel = document.querySelector(".aed-weekly-warning");
  const keepBtn = document.querySelector(".aed-weekly-keep");
  const removeBtn = document.querySelector(".aed-weekly-remove");

  function hideWeeklyWarning() {
    if (warningPanel) warningPanel.style.display = "none";
  }

  function showWeeklyWarning() {
    if (warningPanel) warningPanel.style.display = "block";
  }

  // Hide on load
  hideWeeklyWarning();

  // Auto-select weekly for NSW on load
  if (weeklyEl && getSelectedState() === "NSW" && !weeklyEl.checked) {
    weeklyEl.checked = true;
    recalcOrderSummaryUIAndHidden();
  }

  // Weekly checkbox change
  if (weeklyEl) {
    weeklyEl.addEventListener("change", () => {
      const st = getSelectedState();

      // NSW user trying to untick: show warning and pause recalc
      if (st === "NSW" && !weeklyEl.checked) {
        showWeeklyWarning();
        return;
      }

      hideWeeklyWarning();
      recalcOrderSummaryUIAndHidden();
    });
  }

  // Keep weekly planning
  if (keepBtn) {
    keepBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const el = getElByName("add_on_weekly");
      if (el) el.checked = true;
      hideWeeklyWarning();
      recalcOrderSummaryUIAndHidden();
    });
  }

  // Remove anyway
  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hideWeeklyWarning();
      recalcOrderSummaryUIAndHidden();
    });
  }
}



 /* =========================
   STATE (IN MEMORY + MIRROR TO HIDDEN FIELDS)
   + Persist "state" across children
   ========================= */

const STATE = {
  childrenCount: null,
  currentChildIndex: 0,

  // NEW: shared values that should persist across children
  firstChildStateValue: null
};

// Set this to match the actual <option value="..."> for Queensland in Webflow
const DEFAULT_STATE_VALUE = "QLD";

function getStateField(key) {
  return (
    document.querySelector('[data-state-key="' + key + '"]') ||
    document.querySelector("#" + key) ||
    document.querySelector('input[name="' + key + '"], select[name="' + key + '"], textarea[name="' + key + '"]')
  );
}

function readStateFieldInt(key) {
  const el = getStateField(key);
  if (!el) return null;
  const n = toInt(el.value, NaN);
  return Number.isFinite(n) ? n : null;
}

function writeStateField(key, val) {
  const el = getStateField(key);
  if (!el) return;
  el.value = String(val);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function getChildIndex() {
  const fieldVal = readStateFieldInt("current_child_index");
  if (fieldVal !== null) STATE.currentChildIndex = fieldVal;
  return toInt(STATE.currentChildIndex, 0);
}

function setChildIndex(n) {
  STATE.currentChildIndex = toInt(n, 0);
  writeStateField("current_child_index", STATE.currentChildIndex);
}

function getChildrenCount() {
  const fieldVal = readStateFieldInt("children_count");
  if (fieldVal !== null) STATE.childrenCount = fieldVal;
  return toInt(STATE.childrenCount, 1);
}

function setChildrenCount(n) {
  STATE.childrenCount = Math.max(1, toInt(n, 1));
  writeStateField("children_count", STATE.childrenCount);
}

/* =========================
   NEW: Persist "state" selection across children
   ========================= */

function getChildStateSelect() {
  return document.querySelector('select[name="state"]');
}

// Capture the first child's chosen state so we can reuse it
function captureFirstChildStateIfNeeded() {
  // Only capture for child 0
  if (getChildIndex() !== 0) return;

  const el = getChildStateSelect();
  if (!el) return;

  const v = (el.value || "").trim();
  if (v) STATE.firstChildStateValue = v;
}

// Apply state to the current child step (defaults to QLD if nothing captured)
function applyStateDefaultForCurrentChild() {
  const el = getChildStateSelect();
  if (!el) return;

  const desired = STATE.firstChildStateValue || DEFAULT_STATE_VALUE;

  // Only set if empty/unset (prevents overwriting if user already changed it)
  const current = (el.value || "").trim();
  if (!current) {
    el.value = desired;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}




  /* =========================
     STEP NAVIGATION + VALIDATION
     ========================= */

  const steps = Array.from(document.querySelectorAll('.step[data-step]'))
    .sort((a, b) => toInt(a.getAttribute("data-step"), 0) - toInt(b.getAttribute("data-step"), 0));

  const sideSteps = Array.from(document.querySelectorAll(".side-step"));

  if (!steps.length) {
    console.warn("[Apply-ED] No .step[data-step] found.");
    return;
  }

  const STEP_FIRST_CHILD = 1;
  const STEP_LAST_CHILD = 5;
  const STEP_PAYMENT = 6;

  let currentStepNum = 0;

  function getStepEl(stepNum) {
    return steps.find(s => toInt(s.getAttribute("data-step"), -1) === stepNum) || null;
  }

/* =========================
   CHILD HEADING (Student name & Number)
   ========================= */

function updateCurrentChildHeading() {
  // 1. Identify the active step or current step element
  const activeStep = document.querySelector(".step.is-active") || getStepEl(currentStepNum) || document;

  // 2. Locate the heading element (ensure this attribute is on your H3/H4 in Webflow)
  const heading = activeStep.querySelector('[data-child-heading="true"]');
  if (!heading) return;

  // 3. Get the Child Index and convert to 1-based "Human" number (e.g., Index 0 = Child 1)
  const childIdx = getChildIndex(); 
  const displayNum = childIdx + 1;

  // 4. Try to find the name input (checks active step first, then Step 1 as fallback)
  let nameEl = activeStep.querySelector('input[name="student_first_name"]');
  if (!nameEl) {
    const step1 = getStepEl(STEP_FIRST_CHILD);
    if (step1) nameEl = step1.querySelector('input[name="student_first_name"]');
  }

  const name = (nameEl && nameEl.value) ? nameEl.value.trim() : "";

  // 5. Update heading text: "Child 1: Alice" or just "Child 1"
  if (name) {
    heading.textContent = `Child ${displayNum}: ${name}`;
  } else {
    heading.textContent = `Child ${displayNum}`;
  }

  // Ensure it is visible
  heading.style.display = "";
}

function setActive(stepNum) {
  steps.forEach(stepEl => {
    const n = toInt(stepEl.getAttribute("data-step"), -1);
    stepEl.classList.toggle("is-active", n === stepNum);
  });

  if (sideSteps.length) {
    sideSteps.forEach((panel, idx) => panel.classList.toggle("is-active", idx === stepNum));
  }

  currentStepNum = stepNum;
  window.scrollTo({ top: 0, behavior: "smooth" });
  
  if (stepNum === STEP_PAYMENT) {
    renderChildSummary();
    bindConfirmationGating();
     recalcOrderSummaryUIAndHidden();
  }
  
  // Refresh all UI components for the new step
updateCurrentChildHeading();
  toggleTravelFamilySection();
  renderChildNavBar();
  refreshAllSelectColours();
  if (stepNum === STEP_FIRST_CHILD) {
  // Let the DOM "settle" for a beat, then enforce default if needed
  setTimeout(ensureDefaultProgramTypeForCurrentChild, 0);
}

  // Show/hide the Step 4 goal-directed info banner
  if (stepNum === 4) {
    setTimeout(showStep4GoalInfo, 0);
  } else {
    hideStep4GoalInfo();
  }
}

/* -------------------------------------------------------
   STEP 4: INFO BANNER
   Shown at top of Step 4 for goal_directed and interest_led programs.
   ------------------------------------------------------- */
const STEP4_INFO_ID = 'step4-goal-info';

const STEP4_BANNER_CONTENT = {
  goal_directed: {
    title: 'Goal-Directed Program',
    body:
      'Please select <strong>4\u20138 short-term goals</strong> (across Academic, Social, and Independence) ' +
      'and <strong>1\u20132 long-term goals</strong> to help us build a focused, achievable program for your child.'
  },
  interest_led: {
    title: 'Interest-Led Program',
    body:
      'Select your child\u2019s curiosities below \u2014 even <strong>one strong interest is enough</strong>. ' +
      'We\u2019ll build 4 unique investigations around what your child loves, each tied to curriculum.'
  }
};

function showStep4GoalInfo() {
  const programType = getGoalDirectedProgramType();
  const content = STEP4_BANNER_CONTENT[programType];

  let el = document.getElementById(STEP4_INFO_ID);

  if (!el) {
    const step4El = getStepEl(4);
    if (!step4El) return;

    el = document.createElement('div');
    el.id = STEP4_INFO_ID;
    el.style.cssText = [
      'color:#263358',
      'background:#eef4ee',
      'border:1px solid #c3d9c3',
      'border-radius:8px',
      'padding:12px 16px',
      'font-size:14px',
      'line-height:1.6',
      'margin-bottom:16px',
      'font-family:Montserrat,sans-serif'
    ].join(';');

    // Insert as the very first child of Step 4
    step4El.insertAdjacentElement('afterbegin', el);
  }

  if (content) {
    el.innerHTML = '<strong>' + content.title + '</strong><br>' + content.body;
    el.style.setProperty('display', 'block', 'important');
  } else {
    el.style.setProperty('display', 'none', 'important');
  }
}

function hideStep4GoalInfo() {
  const el = document.getElementById(STEP4_INFO_ID);
  if (el) el.style.setProperty('display', 'none', 'important');
}

function ensureDefaultProgramTypeForCurrentChild() {
  const step1 = getStepEl(STEP_FIRST_CHILD);
  if (!step1) return;

  // If this child already has saved data, do NOT override it
  const idx = getChildIndex();
  const saved = window.__aed_child_applications && window.__aed_child_applications[idx];
  if (saved && saved.program_type) return;

  const desired = "curriculum_based";

  const radios = Array.from(step1.querySelectorAll('input[type="radio"][name="program_type"]'));
  if (!radios.length) return;

  // If something is already checked, leave it alone
  const alreadyChecked = radios.find(r => r.checked);
  if (alreadyChecked) return;

  // Otherwise set the default
  const target = radios.find(r => r.value === desired) || radios[0];
  target.checked = true;

  // Trigger Webflow visual updates
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));

  // Some Webflow radio styles only update on label click
  if (target.id) {
    const label = step1.querySelector(`label[for="${CSS.escape(target.id)}"]`);
    if (label) label.click();
  }
}


  function getTotalChildrenFromStep0() {
    const el =
      document.querySelector('#total_children') ||
      document.querySelector('select[name="total_children"]') ||
      document.querySelector('input[name="total_children"]');
    return el ? toInt(el.value, 1) : 1;
  }

  function showStepError(stepNum, msg) {
    const stepEl = getStepEl(stepNum);
    if (!stepEl) return;
    const err = stepEl.querySelector(".step-error");
    if (!err) return;
    err.textContent = msg || "";
    err.style.display = msg ? "block" : "none";
  }

  function clearStepError(stepNum) { showStepError(stepNum, ""); }

  function isElementActuallyFillable(el) {
    if (!el) return false;
    if (el.disabled) return false;
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "hidden") return false;
    if (el.hasAttribute("data-state-key")) return false;
    return true;
  }

  function validateStep(stepNum) {
    const stepEl = getStepEl(stepNum);
    if (!stepEl) return true;

    const requiredFlag = (stepEl.getAttribute("data-step-required") || "").toLowerCase();
    if (requiredFlag !== "true") return true;

    clearStepError(stepNum);

    const fields = Array.from(stepEl.querySelectorAll("input, select, textarea"))
      .filter(isElementActuallyFillable);

    for (const field of fields) {
      const isMsInput = field.classList && field.classList.contains("ms-input");
      if (isMsInput && field.hasAttribute("required")) {
        const raw = (field.value || "").trim();
        const ok = raw && raw !== "[]" && raw !== "{}" && raw !== '""';
        if (!ok) {
          showStepError(stepNum, "Please complete the required fields before continuing.");
          field.focus();
          return false;
        }
      }

      if (field.hasAttribute("required") && !field.checkValidity()) {
        showStepError(stepNum, "Please complete the required fields before continuing.");
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  /* =========================
     MULTI-SELECT PILL LOGIC
     ========================= */

/* =========================
   REFINED MULTI-SELECT PILL LOGIC
   ========================= */
function syncGroup(groupEl) {
  const input = groupEl.querySelector(".ms-input");
  const options = Array.from(groupEl.querySelectorAll(".ms-option"));
  if (!input || !options.length) return;

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

      
      // Force the toggle manually
option.addEventListener("click", function (ev) {
  ev.preventDefault();
  ev.stopPropagation();

  const clickedVal = this.getAttribute("data-value");

  const EXCLUSIVE = ["all_study_blocks", "timing_unsure"]; // <-- match your data-values exactly

  const isExclusive = EXCLUSIVE.includes(clickedVal);

  if (isExclusive) {
    // Selecting an exclusive option clears everything else
    options.forEach(o => o.classList.remove("is-selected"));
    this.classList.add("is-selected");
  } else {
    // Selecting a normal option clears exclusive options
    options.forEach(o => {
      const v = o.getAttribute("data-value");
      if (EXCLUSIVE.includes(v)) o.classList.remove("is-selected");
    });

    // Normal toggle behaviour
    this.classList.toggle("is-selected");
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
   LANGUAGE DROPDOWN TOGGLE
   ========================= */

function bindLanguageToggle() {
  const languageCheckbox = document.querySelector('input.curriculum-checkbox[data-value="languages"]');
  const wrapper = document.querySelector('.language-of-study-wrap');
  const select = wrapper ? wrapper.querySelector("select") : null;

  if (!languageCheckbox || !wrapper) return;

  function toggle() {
    if (languageCheckbox.checked) {
      wrapper.style.display = "block";
      if (select) select.required = true;
    } else {
      wrapper.style.display = "none";
      if (select) {
        select.required = false;
        select.value = "";
      }
    }
  }

  languageCheckbox.addEventListener("change", toggle);
  toggle(); // run on load
}
/* =========================
   FOUNDATION LABEL BY STATE (Year Level display)
   ========================= */

const FOUNDATION_LABEL_BY_STATE = {
  QLD: "Prep",
  TAS: "Prep",
  WA: "Prep",
  NSW: "Kindergarten",
  ACT: "Kindergarten",
  VIC: "Foundation",
  SA: "Reception",
  NT: "Transition",
};

function getSelectedStateValue() {
  const el = getChildStateSelect(); // you already have this helper
  return (el && el.value ? String(el.value).trim().toUpperCase() : "");
}

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
   CHILD SAVE + RESET + LOOP
   ========================= */
/* =========================
   NEW: CARRY OVER SPECIFIC FIELDS (ENVIRONMENT & RESOURCES)
   ========================= */
const CARRY_OVER_FIELDS = [
  // UPDATE THESE to match the exact "Name" attributes of the fields in Webflow
  "study_spaces",
  "physical_conditions",
  "resources_physical",
  "resources_digital",
  "resources_management"
  
  // You can also add the "Other" textareas here if you want them to carry over!
  // e.g., "study_spaces_other", "digital_tools_other"
];

/* =========================
   NEW: CARRY OVER SPECIFIC FIELDS (ENVIRONMENT & RESOURCES)
   ========================= */
function applyCarryOverDataForCurrentChild() {
  const idx = getChildIndex();
  if (idx === 0) return; // Child 1 has no previous child to copy from

  // Grab the data from the IMMEDIATELY PRECEDING child
  const prevData = window.__aed_child_applications[idx - 1];
  if (!prevData) return;

  console.log("➡️ RUNNING CARRY-OVER. Child 1's saved data looks like this:", prevData);

  // PUT YOUR EXACT WEBFLOW FIELD NAMES IN THIS ARRAY:
  const CARRY_OVER_FIELDS = [
    "study_spaces",
    "physical_conditions",
    "resources_physical",
    "resources_digital",
    "resources_management"
  ];

  let pillsNeedSync = false;

  CARRY_OVER_FIELDS.forEach(fieldName => {
    let val = prevData[fieldName];
    console.log(`Checking field [${fieldName}]...`);

    // If the previous child left it blank, ignore it
    if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
       console.log(`   ❌ Skipped: Child 1 left [${fieldName}] blank, or the field name is spelled wrong in the code.`);
       return;
    }

    const el = document.querySelector(`[name="${fieldName}"]`);
    if (!el) {
       console.warn(`   ⚠️ WARNING: Could not find an input named "${fieldName}" on the page. Check Webflow settings!`);
       return;
    }

    // Handle Pill Groups (JSON arrays)
    if (el.classList.contains("ms-input")) {
      el.value = typeof val === "string" ? val : JSON.stringify(val);
      pillsNeedSync = true;
      console.log(`   ✅ Successfully copied pills for [${fieldName}]`);
    } 
    // Handle Normal Inputs / Textareas
    else {
      el.value = val;
      console.log(`   ✅ Successfully copied text for [${fieldName}]`);
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Visually highlight the pills that were just carried over
  if (pillsNeedSync) {
    document.querySelectorAll(".ms-input").forEach(input => {
      if (typeof syncPillsFromInput === "function") syncPillsFromInput(input);
    });
    console.log("   🎨 Visual pills synced.");
  }
}
window.__aed_child_applications = window.__aed_child_applications || [];

function collectValueFromField(fieldEl) {
  const tag = (fieldEl.tagName || "").toLowerCase();
  const type = (fieldEl.getAttribute("type") || "").toLowerCase();

  if (type === "checkbox") return fieldEl.checked ? (fieldEl.value || "true") : null;
  if (type === "radio") return fieldEl.checked ? (fieldEl.value || "") : null;
  if (tag === "select") return (fieldEl.value || "").trim();
  return (fieldEl.value || "").trim();
}

function collectChildData() {
  const data = {};
  // We only look at steps 1 through 5 for child-specific data
  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    const stepEl = getStepEl(s);
    if (!stepEl) continue;

    const fields = Array.from(stepEl.querySelectorAll("input, select, textarea"));
    
    for (const el of fields) {
      const name = el.getAttribute("name");
      if (!name) continue;

      const type = (el.getAttribute("type") || "").toLowerCase();

      // Fix for Radio Buttons (Program Type is usually a radio)
      if (type === "radio") {
        if (el.checked) data[name] = el.value;
        continue;
      }

      // Fix for Checkboxes
      if (type === "checkbox") {
        data[name] = el.checked ? (el.value || "on") : "";
        continue;
      }

      // THE PILL FIX: This ensures JSON lists aren't "stringified" twice
      if (el.classList.contains("ms-input")) {
        try {
          data[name] = JSON.parse(el.value || "[]");
        } catch (e) {
          data[name] = []; 
        }
        continue;
      }

      // Standard text/select handling
      data[name] = (el.value || "").trim();
    }
  }

  // FORCE CAPTURE: Explicitly grab Program Type from Step 0 if it's missing
  if (!data.program_type) {
    const step0 = getStepEl(0);
    const progEl = step0.querySelector('input[name="program_type"]:checked') || 
                   step0.querySelector('select[name="program_type"]');
    if (progEl) data.program_type = progEl.value;
  }

  console.log("✅ Child Data Captured:", data); // This lets you see the 'truth' in your console
  return data;
}

function resetChildFields() {
  // A. Clear standard fields across all child steps
  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    clearStepError(s);
    const stepEl = getStepEl(s);
    if (!stepEl) continue;

    Array.from(stepEl.querySelectorAll('[data-child-scope="true"]')).forEach(scope => {
      Array.from(scope.querySelectorAll("input, select, textarea")).forEach(el => {
        const type = (el.getAttribute("type") || "").toLowerCase();
        const tagName = el.tagName.toLowerCase();
        const name = el.getAttribute("name") || "";

        if (name === "state" || el.hasAttribute("data-state-key") || type === "hidden") return;

        if (type === "checkbox" && el.getAttribute("data-default-checked-group") === "curriculum") {
          el.checked = true;
        } else if (type === "checkbox" || type === "radio") {
          el.checked = false;
        } else if (el.classList && el.classList.contains("ms-input")) {
          el.value = "[]";
        } else if (tagName === "select") {
          el.selectedIndex = 0;
          el.value = "";
          el.style.color = "#cbd1d6"; 
        } else {
          el.value = "";
        }
        
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }

  // B. THE STICKY BUBBLE FIX: Clear every highlight on the page first
  document.querySelectorAll(".ms-option").forEach(p => {
    p.classList.remove("is-selected");
  });

  // C. DEFAULT PROGRAM TYPE (RADIO)
  // Force Child 2+ to default to Curriculum-Based
  const step1 = getStepEl(STEP_FIRST_CHILD);
  if (step1) {
    const desired = "curriculum_based";

    const radios = Array.from(step1.querySelectorAll('input[type="radio"][name="program_type"]'));
    if (radios.length) {
      // Clear them first (prevents stale checked state)
      radios.forEach(r => { r.checked = false; });

      // Pick the matching value if present, else fall back to the first radio
      const target = radios.find(r => r.value === desired) || radios[0];
      target.checked = true;

      // Trigger events so Webflow visual state updates
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));

      // Extra nudge: click the label if Webflow styling is tied to click
      const id = target.id;
      const label = id ? step1.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      if (label) label.click();
    }
  }


  // D. Run Refresh Logic
 for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
  const stepEl = getStepEl(s);
  if (stepEl) resyncAllMultiSelectGroups(stepEl);
}

  applyDefaultCheckedGroups();
  applyStateDefaultForCurrentChild(); 
  applyCarryOverDataForCurrentChild();
  updateCurrentChildHeading();

  // E. Safe Collapse & Custom Fields
  document.querySelectorAll('[data-show]').forEach(div => { div.style.display = "none"; });
  document.querySelectorAll('[data-target]').forEach(btn => { btn.textContent = "[+ Add Other]"; });
  
  const customFields = ["short_term_custom", "long_term_custom"];
  customFields.forEach(fieldName => {
    const el = document.querySelector(`textarea[name="${fieldName}"]`);
    if (el) {
      el.value = "";
      el.style.height = "auto";
    }
  });
}

function saveCurrentChildAndAdvance() {
  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    if (!validateStep(s)) { setActive(s); return; }
  }

  const idx = getChildIndex();
const childData = collectChildData();
childData.__saved = true;               // ✅ mark as completed/saved
window.__aed_child_applications[idx] = childData;


  // NEW: remember child 1's chosen State so we can reuse it for child 2+
  captureFirstChildStateIfNeeded();

  const total = getChildrenCount();
  const nextIdx = idx + 1;

  setChildIndex(nextIdx);

  if (nextIdx >= total) {
    setActive(STEP_PAYMENT);
    return;
  }

  resetChildFields();
  setActive(STEP_FIRST_CHILD);
  setTimeout(ensureDefaultProgramTypeForCurrentChild, 0);
  renderChildNavBar();
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

/* =========================
      STEP 6: SUMMARY & MERGED CONFIRMATIONS
      ========================= */

function renderChildSummary() {
  const container = document.getElementById('child-summary-display');
  if (!container) return;

  container.innerHTML = "";

  const allChildren = window.__aed_child_applications || [];
  const children = allChildren.slice(0, getChildrenCount());

  if (children.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No child data found.</p>';
    return;
  }

  const programMap = {
    "acara_aligned": "Curriculum-Based (ACARA)",
    "goal_directed": "Goal-Directed",
    "interest_led": "Interest-Led (Thematic)",
    "curriculum_based": "Curriculum-Based (ACARA)"
  };

  let html = '<div style="display: flex; flex-direction: column; gap: 12px; padding: 10px;">';

  children.forEach((child, idx) => {
    const name = child.student_first_name || `Child ${idx + 1}`;

    const formatPills = (val) => {
      let list = [];
      if (Array.isArray(val)) {
        list = val;
      } else {
        try {
          const parsed = JSON.parse(val || "[]");
          list = Array.isArray(parsed) ? parsed : [];
        } catch(e) {
          list = val ? [val] : [];
        }
      }
      return list.map(item => 
        item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      ).join(", ");
    };

    // 1. DATA PREPARATION
    const yearLevel = child.student_year_level || "Not Specified";
    
    let rawProgram = programMap[child.program_type] || child.program_type || "Standard Program";
    const programType = rawProgram.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const curriculum = formatPills(child.curriculum_coverage) || "Australian Curriculum";

    const focusItems = [
      formatPills(child.short_term_academic),
      formatPills(child.short_term_social),
      formatPills(child.short_term_independence),
      child.short_term_custom
    ].filter(Boolean).join(", ");

    const horizonItems = [
      formatPills(child.long_term_academic),
      formatPills(child.long_term_social),
      formatPills(child.long_term_independence),
      child.long_term_custom
    ].filter(Boolean).join(", ");

    // 2. HELPER TO CREATE CONSISTENT ROWS (Tighter spacing)
    const renderRow = (label, value) => `
      <div style="margin-bottom: 1px; line-height: 1.2;">
        <span style="font-weight: 600; color: #263358; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">${label}:</span>
        <span style="color: #7a7f87; font-weight: 400; font-size: 13px;">${value}</span>
      </div>
    `;

    // 3. HTML CONSTRUCTION
    html += `
      <div style="padding: 16px; border: 1px solid #DDe4dd; border-radius: 16px; background: #fff; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="margin: 0; color: #263358; font-size: 20px; font-weight: 600;">${name}</h4>
          <button type="button" 
                  onclick="jumpToChild(${idx})" 
                  style="background: #f4f7f4; border: 1px solid #DDe4dd; color: #263358; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 16px; cursor: pointer; text-transform: uppercase;">
            ✎ Edit
          </button>
        </div>

        <div style="padding-right: 10px;">
          ${renderRow("Year Level", yearLevel)}
          ${renderRow("Program Type", programType)}
          ${renderRow("Curriculum", curriculum)}
          ${renderRow("Focus", focusItems || "General Focus Area")}
          ${renderRow("Long-term", horizonItems || "General Long-term Goals")}
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
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
    const fd = new FormData(formEl);
    const obj = {};

    for (const [key, value] of fd.entries()) {
      if (obj[key] !== undefined) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(value);
      } else {
        obj[key] = value;
      }
    }

    const childrenArr = Array.isArray(window.__aed_child_applications)
      ? window.__aed_child_applications
      : [];

   obj.children = childrenArr.map((data, i) => ({ 
  child_index: i, 
  data: sanitizeDataForMake(data) 
}));

    obj.order = buildOrderFromStep0();
// NEW: travel context (family-level)
obj.travel_context = {
  timing: obj.travel_timing || "",
  destinations: obj.travel_destinations || "",
  style: obj.travel_style ? safeParseJsonArray(obj.travel_style) : [],
  learning_opportunities: obj.travel_learning_opportunities ? safeParseJsonArray(obj.travel_learning_opportunities) : [],
  notes: obj.travel_notes || ""
};



    // Make-side idempotency should use request_id (new per click)
    obj.request_id = makeRequestId();

    // Helpful context
    obj.current_child_index = getChildIndex();
    obj.children_count = getChildrenCount();
// These lines ensure your specific names are preserved for the AI:
    obj.contact_first_name = obj.contact_first_name || "";
    obj.contact_email = obj.contact_email || "";
obj.plan_start_date = obj.plan_start_date || "";
obj.plan_end_date = obj.plan_end_date || "";
// Force application_group_id into payload (even if FormData misses it)
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
   APPROACH DRAWER TOGGLE (NEW CODE)
   ========================= */
document.addEventListener("click", function (e) {
  const expandBtn = e.target.closest('.expand-btn');
  if (!expandBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const card = expandBtn.closest('.approach-card');
  const drawer = card ? card.querySelector('.approach-drawer') : null;

  if (drawer) {
    const isHidden = window.getComputedStyle(drawer).display === "none";
    drawer.style.display = isHidden ? "block" : "none";
    
    // Optional: Rotate the arrow
    const icon = expandBtn.querySelector('img, svg');
    if (icon) icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
  }
});
 /* =========================
     CLICK HANDLER (existing)
   ========================= */

document.addEventListener("click", function (e) {

  // ✅ ADD OTHER (free text reveal) — runs first and exits
  const addOther = e.target.closest(".add-other-link");
  if (addOther) {
    e.preventDefault();
    e.stopPropagation();

    const key = (addOther.getAttribute("data-field") || "").trim();

    const scope =
      addOther.closest(".field-group") ||
      addOther.closest(".ms-group") ||
      addOther.closest('[data-child-scope="true"]') ||
      document;

    let target =
      (key ? scope.querySelector(`[data-field="${CSS.escape(key)}"]`) : null) ||
      (key ? document.getElementById(key) : null) ||
      scope.querySelector(".free-text-field, .other-textarea");

    if (!target) return;

    const isHidden = window.getComputedStyle(target).display === "none";
    target.style.display = isHidden ? "block" : "none";
    addOther.textContent = isHidden ? "[-] Remove Other" : "[+ Add Other]";
    return; // 🔥 stop here so step logic never runs
  }

  // --- your existing step-action logic below ---
  const btn = e.target.closest("[data-step-action]");
  if (!btn) return;

  e.preventDefault();

  const action = (btn.getAttribute("data-step-action") || "").trim();

if (action === "back") {
    // If we are on Step 6 (Review), go to the last child's details instead of Step 5
    if (currentStepNum === 6) {
        const lastChildIdx = getChildrenCount() - 1;
        window.jumpToChild(lastChildIdx); 
    } else if (currentStepNum > 0) {
        setActive(currentStepNum - 1);
    }
    return;
  }

  if (action === "next") {
    if (!validateStep(currentStepNum)) return;
    if (currentStepNum === 4 && !validateGoalDirectedStep4()) return;
    if (currentStepNum === 4 && !validateInterestLedStep4()) return;

    if (currentStepNum === 0) {
      recalcOrderSummaryUIAndHidden();
    }

    recalcOrderSummaryUIAndHidden();

    if (currentStepNum < STEP_PAYMENT) setActive(currentStepNum + 1);
    return;
  }

  if (action === "save-child") {
    saveCurrentChildAndAdvance();
    return;
  }
});


/* =========================
   CHILD NAVIGATION & DATA LOADING
   ========================= */

function renderChildNavBar() {
  const activeStep = document.querySelector(".step.is-active");
  if (!activeStep) return;

  const container = activeStep.querySelector("#child-nav-bar");
  if (!container) return;

  container.style.display = "flex";
  container.innerHTML = "";

  const total = getChildrenCount();
  const currentIdx = getChildIndex();

  const childrenArr = Array.isArray(window.__aed_child_applications)
    ? window.__aed_child_applications
    : [];

  // ---------- Setup tab ----------
  const setupBtn = document.createElement("button");
  setupBtn.type = "button";
  setupBtn.className = (currentStepNum === 0) ? "child-nav-btn is-active" : "child-nav-btn";
  setupBtn.textContent = "⚙️ Setup";
  setupBtn.onclick = () => setActive(0);
  container.appendChild(setupBtn);

  // ---------- Child tabs ----------
  if (total > 0) {
    for (let i = 0; i < total; i++) {
      const btn = document.createElement("button");
      btn.type = "button";

      const isActiveChildTab = (i === currentIdx && currentStepNum !== 0);
      btn.className = isActiveChildTab ? "child-nav-btn is-active" : "child-nav-btn";

      const savedData = childrenArr[i] || {};
      const name =
        (savedData.student_first_name && String(savedData.student_first_name).trim())
          ? savedData.student_first_name.trim()
          : `Child ${i + 1}`;

      btn.textContent = name;
      btn.onclick = () => jumpToChild(i);
      container.appendChild(btn);
    }
  }

  // ---------- Review tab (only when editing a saved child) ----------
  const currentChild = childrenArr[currentIdx] || {};
  const isOnChildSteps = currentStepNum >= STEP_FIRST_CHILD && currentStepNum <= STEP_LAST_CHILD;
  const isSavedChild = currentChild.__saved === true;

  if (isOnChildSteps && isSavedChild) {
    const reviewBtn = document.createElement("button");
    reviewBtn.type = "button";
    reviewBtn.className = (currentStepNum === STEP_PAYMENT) ? "child-nav-btn is-active" : "child-nav-btn";
    reviewBtn.textContent = "Review";
    reviewBtn.onclick = () => setActive(STEP_PAYMENT); // Step 6
    container.appendChild(reviewBtn);
  }
}



/* =========================
   PILL VISUAL SYNC & DATA LOADING
   ========================= */

// 1. This function handles the "Visual" side of the pills
function syncPillsFromInput(inputEl) {
  const group = inputEl.closest(".ms-group");
  if (!group) return;

  const raw = (inputEl.value || "[]").trim();
  let selectedValues = [];
  try {
    selectedValues = JSON.parse(raw);
  } catch (e) {
    selectedValues = [];
  }

  const options = group.querySelectorAll(".ms-option");
  options.forEach(opt => {
    const val = opt.getAttribute("data-value");
    if (selectedValues.includes(val)) {
      opt.classList.add("is-selected");
    } else {
      opt.classList.remove("is-selected");
    }
  });
}

// 2. This function handles filling the form when jumping between children
function loadChildData(idx) {
  const data = window.__aed_child_applications[idx];

  if (!data) {
    resetChildFields();
    return;
  }

  const childScopes = document.querySelectorAll('[data-child-scope="true"]');

  childScopes.forEach(scope => {
    scope.querySelectorAll("input, select, textarea").forEach(el => {
      const name = el.getAttribute("name");
      if (!name || name === "state") return;

      const val = data[name];
      const type = (el.getAttribute("type") || "").toLowerCase();
      const tag = (el.tagName || "").toLowerCase();

      // ✅ FIX: radios must be checked by matching value
      if (type === "radio") {
        el.checked = (String(el.value) === String(val));
        if (el.checked) {
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return;
      }

      if (type === "checkbox") {
        el.checked = (val === el.value || val === "on" || val === "true" || val === true);
} else if (tag === "select") {
        el.value = val || "";
        el.style.color = (el.value === "") ? "#cbd1d6" : "#7a7f87";
      } else {
        el.value = val || "";
      }

      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  // If you have any ms-groups elsewhere, keep this
  const allPillInputs = document.querySelectorAll(".ms-input");
  allPillInputs.forEach(input => syncPillsFromInput(input));
updateCurrentChildHeading();
  updateFoundationOptionLabel();
  setTimeout(setupAutoExpandingTextareas, 50);
  setTimeout(refreshAllSelectColours, 50);

}


/* =========================
   LIVE NAME SYNC
   ========================= */

function setupLiveNameSync() {
  // Find the student first name input (Step 1)
  const nameInput = document.querySelector('input[name="student_first_name"]');
  if (!nameInput) return;

  // Listen for typing
  nameInput.addEventListener('input', (e) => {
    const newName = e.target.value.trim();
    const currentIdx = getChildIndex();
    const displayNum = currentIdx + 1;

    // 1. Update the H3 heading (e.g., "Child 1: Alice")
    updateCurrentChildHeading();

    // 2. Find the Navigation bar on the active step
    const activeStep = document.querySelector(".step.is-active");
    if (!activeStep) return;

    const navButtons = activeStep.querySelectorAll('.child-nav-btn');
    
    // In our new setup, Index 0 is "Setup", so Child 1 is Index 1, Child 2 is Index 2...
    const targetBtn = navButtons[currentIdx + 1]; 

    if (targetBtn) {
      targetBtn.textContent = newName || `Child ${displayNum}`;
    }
  });
}

function sanitizeDataForMake(data) {
  const cleanData = { ...data };
  for (let key in cleanData) {
    let val = cleanData[key];
    if (val === "on") cleanData[key] = true; 
    if (val === "") cleanData[key] = false; 
    if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
      try {
        const parsed = JSON.parse(val);
        cleanData[key] = Array.isArray(parsed) ? parsed.join(", ") : val;
      } catch (e) {
        cleanData[key] = val.replace(/[\[\]"]/g, "");
      }
    }
  }
  return cleanData;
}

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

  var step1Fields = [
    { name: 'student_year_level', label: 'Year Level' },
    { name: 'student_first_name', label: 'Student First Name' },
    { name: 'student_pronouns', label: 'Student Pronouns' }
  ];

  // Create or update an error message below a field
  function showError(field, message) {
    var errorId = 'error-' + field.name;
    var errorEl = document.getElementById(errorId);

    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.id = errorId;
      errorEl.style.color = '#e53e3e';
      errorEl.style.fontSize = '14px';
      errorEl.style.marginTop = '4px';
      errorEl.style.fontFamily = 'Montserrat, sans-serif';
      field.el.parentNode.insertBefore(errorEl, field.el.nextSibling);
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
  var form = document.querySelector('form[data-aed-form="intake"]');
  if (form) {
    form.setAttribute('novalidate', 'true');
  }

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

  // Hide errors as user fills in fields
  document.addEventListener('input', function(e) {
    if (e.target && e.target.name) hideError(e.target.name);
  });

  document.addEventListener('change', function(e) {
    if (e.target && e.target.name) hideError(e.target.name);
  });
}

/* =========================
   STEP 1 NEXT BUTTON VALIDATION
   ========================= */

function bindStep1Validation() {
  var nextBtn = document.getElementById('btn-next-step1');
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
        errorEl = document.createElement('p');
        errorEl.id = 'pill-error-message';
        errorEl.style.color = '#e53e3e';
        errorEl.style.fontSize = '14px';
        errorEl.style.marginTop = '8px';
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
    });
  }

  yearDropdown.addEventListener('change', updatePills);
  if (stateDropdown) stateDropdown.addEventListener('change', updatePills);
  updatePills();
}


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
  
// Populate static per-child prices in Step 0 add-on labels
const cfg = window.APPLYED_PRICING_CONFIG;
if (cfg) {
  document.querySelectorAll('[data-price-key="add_ons.detailed_weekly_planning"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.detailed_weekly_planning.amount_cents)));
  document.querySelectorAll('[data-price-key="add_ons.travel_program"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.travel_program.amount_cents)));
  document.querySelectorAll('[data-price-key="add_ons.expedited_delivery"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.expedited_delivery.amount_cents)));
  document.querySelectorAll('[data-price-key="add_ons.expedited_delivery_with_weekly"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.expedited_delivery_with_weekly.amount_cents)));
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
   LOCK STATE PICKER ON CREATE PROGRAM PAGE (BRUTE FORCE)
   ========================= */
function lockStatePickers() {
  const pickers = document.querySelectorAll('select[name="state-picker"], [data-aed-state-picker="1"]');
  
  pickers.forEach(picker => {
    // 1. Native HTML disable
    picker.disabled = true;
    
    // 2. CSS Forcefield: Kills all click interactions instantly
    picker.style.setProperty('pointer-events', 'none', 'important');
    picker.style.setProperty('opacity', '0.6', 'important');
    
    // 3. Apply the same lock to Webflow's custom parent wrapper
    if (picker.parentElement) {
        picker.parentElement.style.setProperty('pointer-events', 'none', 'important');
        picker.parentElement.style.setProperty('opacity', '0.6', 'important');
        picker.parentElement.style.setProperty('cursor', 'not-allowed', 'important');
        picker.parentElement.title = "State cannot be changed once you have started creating a program.";
    }
  });
}

// Run immediately, on load, and half a second later just in case Webflow loads slowly
/* =========================
   STEP 4: GOAL-DIRECTED VALIDATION
   ========================= */

function getGoalDirectedProgramType() {
  // Check the saved current child data first
  const idx = getChildIndex();
  const saved = window.__aed_child_applications && window.__aed_child_applications[idx];
  if (saved && saved.program_type) return saved.program_type;

  // Fall back to checking the radio directly
  const checked = document.querySelector('input[type="radio"][name="program_type"]:checked');
  return checked ? checked.value : null;
}

function countSelectedGoalPills(fieldNames) {
  let total = 0;
  fieldNames.forEach(function(name) {
    // Try all possible selectors - ms-input can be input or other element types
    const el = document.querySelector('.ms-input[name="' + name + '"]');
    if (!el) return;
    const raw = (el.value || '').trim();
    if (!raw || raw === '[]') return;
    try {
      const vals = JSON.parse(raw);
      if (Array.isArray(vals)) total += vals.length;
    } catch(e) {}
  });
  return total;
}

/* -------------------------------------------------------
   STEP 4 GOAL-DIRECTED VALIDATION — FIXED & EXPANDED
   ------------------------------------------------------- */

/**
 * Show or hide the step4-goal-error element.
 * Uses setProperty('display', ..., 'important') to override
 * Webflow's own display:none !important on hidden elements.
 */
function setStep4GoalError(msg) {
  // Try the Webflow element first; fall back to a dynamically-created one
  let el = document.getElementById('step4-goal-error');

  if (!el) {
    // Element is missing from DOM — create it just above the nav buttons
    const step4El = getStepEl(4);
    const navRow = step4El && step4El.querySelector('[data-step-action="next"]');
    const insertTarget = navRow ? navRow.closest('div, section') || navRow.parentElement : step4El;

    el = document.createElement('div');
    el.id = 'step4-goal-error';
    // Apply baseline styles so it looks correct even without Webflow styling
    el.style.cssText = [
      'color:#b00020',
      'background:#fff5f5',
      'border:1px solid #f5c6cb',
      'border-radius:6px',
      'padding:10px 14px',
      'font-size:14px',
      'line-height:1.5',
      'margin-bottom:12px',
      'font-family:Montserrat,sans-serif'
    ].join(';');

    if (insertTarget) insertTarget.insertAdjacentElement('beforebegin', el);
    else document.body.appendChild(el);

    console.log('[Goal Validation] step4-goal-error was missing from DOM — created dynamically');
  }

  if (msg) {
    el.textContent = msg;
    // Use setProperty + 'important' to override Webflow's display:none !important
    el.style.setProperty('display', 'block', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    el.style.setProperty('display', 'none', 'important');
    el.textContent = '';
  }
}

function validateGoalDirectedStep4() {
  // Always clear first
  setStep4GoalError(null);

  const programType = getGoalDirectedProgramType();
  if (programType !== 'goal_directed') return true;

  const shortTermFields = ['short_term_academic', 'short_term_social', 'short_term_independence'];
  const longTermFields  = ['long_term_academic', 'long_term_social', 'long_term_independence'];

  const shortCount = countSelectedGoalPills(shortTermFields);
  const longCount  = countSelectedGoalPills(longTermFields);

  console.log('[Goal Validation] short:', shortCount, 'long:', longCount);

  if (shortCount < 4) {
    setStep4GoalError(
      'Please select at least 4 short-term goals (across Academic, Social, and Independence). ' +
      'You have selected ' + shortCount + '.'
    );
    return false;
  }
  if (shortCount > 8) {
    setStep4GoalError(
      'You have selected ' + shortCount + ' short-term goals. ' +
      'To keep the program realistic, please reduce your selection to no more than 8.'
    );
    return false;
  }
  if (longCount < 1) {
    setStep4GoalError('Please select at least 1 long-term goal.');
    return false;
  }
  if (longCount > 2) {
    setStep4GoalError(
      'You have selected ' + longCount + ' long-term goals. ' +
      'To keep the program realistic, please reduce your selection to no more than 2.'
    );
    return false;
  }

  return true;
}

/* -------------------------------------------------------
   STEP 4 INTEREST-LED VALIDATION
   ------------------------------------------------------- */

function validateInterestLedStep4() {
  // Always clear error first
  setStep4GoalError(null);

  const programType = getGoalDirectedProgramType();
  if (programType !== 'interest_led') return true;

  const count = countSelectedGoalPills(['curiosities']);
  console.log('[Interest Validation] curiosities selected:', count);

  if (count < 1) {
    setStep4GoalError(
      'Please select at least one curiosity so we can build investigations around your child\u2019s interests.'
    );
    return false;
  }

  return true;
}
document.addEventListener("DOMContentLoaded", lockStatePickers);
setTimeout(lockStatePickers, 500);

/* =========================
   HOME PAGE "CREATE PROGRAM" CTA BUTTONS
   Buttons must have: data-aed-create-program="1"
   State dropdown:    select[name="state-picker"]
   Mid-page error:    id="mid-page-state-error"
   ========================= */
(function bindCreateProgramCtaButtons() {
  function getStateErrorEl(btn) {
    // Try mid-page error element first; fall back to creating one near the button
    const midPageErr = document.getElementById('mid-page-state-error');
    if (midPageErr) return midPageErr;

    // Dynamically create an error element right after the button
    let el = btn.parentElement && btn.parentElement.querySelector('.aed-state-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'aed-state-error';
      el.style.cssText = [
        'color:#b00020',
        'font-size:14px',
        'margin-top:8px',
        'font-family:Montserrat,sans-serif'
      ].join(';');
      el.style.display = 'none';
      btn.insertAdjacentElement('afterend', el);
    }
    return el;
  }

  function showStateError(btn, msg) {
    const el = getStateErrorEl(btn);
    if (!el) return;
    el.textContent = msg || 'Please select your state before continuing.';
    el.style.setProperty('display', 'block', 'important');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideStateError(btn) {
    const el = getStateErrorEl(btn);
    if (el) el.style.setProperty('display', 'none', 'important');
  }

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-aed-create-program="1"]');
    if (!btn) return;

    const statePicker = document.querySelector('select[name="state-picker"]');
    const stateVal = statePicker ? (statePicker.value || '').trim() : '';

    if (!stateVal) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showStateError(btn, 'Please select your state before creating a program.');
      return;
    }

    // State is valid — persist it for the intake form and allow navigation
    try { localStorage.setItem('aed_selected_state', stateVal); } catch (_) {}
    hideStateError(btn);
    // Button's natural href / onclick will fire normally
  });

  // Live clear error when state is selected
  document.addEventListener('change', function(e) {
    if (e.target && e.target.name === 'state-picker' && e.target.value) {
      const midPageErr = document.getElementById('mid-page-state-error');
      if (midPageErr) midPageErr.style.setProperty('display', 'none', 'important');
      document.querySelectorAll('.aed-state-error').forEach(function(el) {
        el.style.setProperty('display', 'none', 'important');
      });
    }
  });
})();

});
