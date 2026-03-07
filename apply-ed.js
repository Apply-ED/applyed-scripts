
// 1. THE GLOBAL BRIDGE (Must be at the very top)
window.jumpToChild = function(targetIdx) {
    if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently(); // Autosave first!
    if (window.aed_nav) {
        window.aed_nav.jump(targetIdx);
    } else {
        console.error("Navigation bridge not ready.");
    }
};

document.head.insertAdjacentHTML("beforeend", `<style>
  .locked-checkbox {
    pointer-events: none !important;
    opacity: 0.8;
  }
  
  /* CHILD NAVIGATION PILLS STYLING */
  #child-nav-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .child-nav-btn {
    background-color: #f4f7f4;
    color: #7a7f87;
    border: 1px solid #DDe4dd;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-family: Montserrat, sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .child-nav-btn.is-active {
    background-color: #799377;
    color: #ffffff;
    border-color: #799377;
  }
  .child-nav-btn:hover:not(.is-active) {
    background-color: #eef4ee;
  }
</style>`);

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
  // const INTAKE_FORM_SELECTOR = 'form';
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
    if (warningPanel) warningPanel.style.setProperty('display', 'none', 'important');
  }

  function showWeeklyWarning() {
    if (warningPanel) {
      // Injecting the standardized red error box CSS
      warningPanel.style.cssText = 'display: block !important; color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 12px 16px; border-radius: 6px; margin-top: 12px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;';
    }
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
  const STEP_LAST_CHILD = 3;  // Reduced from 5
  const STEP_ENVIRONMENT = 4; // The new Learning Environment step
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
// Update the section heading
  const sectionHeading = document.getElementById('child-section-heading');
  if (sectionHeading) {
    sectionHeading.textContent = name ? `About ${name}` : 'About';
  }
// Update the page heading
  const pageHeading = document.getElementById('child-page-heading');
  if (pageHeading) {
    pageHeading.textContent = name ? `Now tell us about ${name}` : 'Now tell us about your child';
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
  if (stepNum === 3) {
    setTimeout(showStep4GoalInfo, 0);
  } else {
    hideStep4GoalInfo();
  }
  // NEW: Update the progress bar every time the step changes
  setTimeout(updateProgressBar, 50);
}

/* -------------------------------------------------------
   STEP 4: INFO BANNER
   Shown at top of Step 4 for goal_directed and interest_led programs.
   ------------------------------------------------------- */
/* -------------------------------------------------------
   STEP 4: INFO BANNER & INTEREST BANNER
   ------------------------------------------------------- */
function showStep4GoalInfo() {
  const pType = typeof getGoalDirectedProgramType === 'function' ? getGoalDirectedProgramType() : null;

  // 1. UNIVERSAL INTERESTS BANNER (Shows for all programs)
  let interestBanner = document.getElementById('aed-interest-banner');
  if (!interestBanner) {
    interestBanner = document.createElement('div');
    interestBanner.id = 'aed-interest-banner';
    interestBanner.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1200px; width: 100%; box-sizing: border-box;';    
    const interestsContainer = document.getElementById('step3-interests-container');
    if (interestsContainer) interestsContainer.insertAdjacentElement('afterbegin', interestBanner);
  }

  // Set the correct text for the Interests banner
  if (pType === 'interest_led') {
    interestBanner.innerHTML = '<strong>Interest-Led Program</strong><br>Select your child’s curiosities below — even <strong>one strong interest is enough</strong>. We’ll build 4 unique investigations around what your child loves, each tied to curriculum.';
  } else {
    interestBanner.innerHTML = '<strong>Student Interests</strong><br>Please select <strong>at least 1 area of interest</strong> so we can build investigations and activities around your child’s passions.';
  }
  interestBanner.style.setProperty('display', 'block', 'important');

  // 2. GOAL-DIRECTED BANNER (Only for Container 3B)
  let goalBanner3B = document.getElementById('step4-goal-info');
  if (!goalBanner3B) {
    goalBanner3B = document.createElement('div');
    goalBanner3B.id = 'step4-goal-info';
    goalBanner3B.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1200px; width: 100%; box-sizing: border-box;';
    
    const container3B = document.getElementById('container-3b-goaldirected') || document.querySelector('.step3b-goal-container');
    if (container3B) container3B.insertAdjacentElement('afterbegin', goalBanner3B);
  }

  // Show or hide the 3B banner depending on program type
  if (pType === 'goal_directed') {
    goalBanner3B.innerHTML = '<strong>Goal-Directed Program</strong><br>Please select <strong>4–8 short-term goals</strong> (across Academic, Social, and Independence) and <strong>1–2 long-term goals</strong> to help us build a focused, achievable program for your child.';
    goalBanner3B.style.setProperty('display', 'block', 'important');
  } else {
    goalBanner3B.style.setProperty('display', 'none', 'important');
  }
}

function hideStep4GoalInfo() {
  const interestBanner = document.getElementById('aed-interest-banner');
  if (interestBanner) interestBanner.style.setProperty('display', 'none', 'important');
  
  const goalBanner3B = document.getElementById('step4-goal-info');
  if (goalBanner3B) goalBanner3B.style.setProperty('display', 'none', 'important');
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
    
    let err = stepEl.querySelector(".step-error");
    if (!err) {
      // If Webflow didn't provide an error text block, build our own!
      err = document.createElement("div");
      err.className = "step-error";
      err.style.cssText = "color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;";
      
      // Try to put it right above the buttons
      const actionsWrap = stepEl.querySelector("[data-step-action]")?.closest("div");
      if (actionsWrap) {
        actionsWrap.parentNode.insertBefore(err, actionsWrap);
      } else {
        stepEl.appendChild(err);
      }
    }
    
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

    // THE ULTIMATE VISIBILITY CHECK: If it has 0 physical width or height, it is completely hidden!
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return false;

    // Specific fix for Webflow hidden Pill Groups
    if (el.classList.contains("ms-input")) {
      const group = el.closest(".ms-group");
      if (group && (group.offsetWidth === 0 || group.offsetHeight === 0)) return false;
    }

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
    const langCbs = document.querySelectorAll('input[data-value="languages"], input[name="languages"], input[id="languages"], input[value="Languages"], input[data-value="Languages"]');
    
    langCbs.forEach(function(cb) {
      let wrap = null;
      let parent = cb.parentElement;
      while (parent && parent !== document.body) {
        wrap = parent.querySelector('.language-of-study-wrap');
        if (wrap) break;
        parent = parent.parentElement;
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
          // 🛡️ THE FIX: Protect the saved language from being wiped during load!
          if (!window.__aed_is_loading_data) {
             select.value = "";
             select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    });
  }

  document.addEventListener("change", function(e) {
    if (e.target && e.target.type === 'checkbox') setTimeout(syncAll, 50);
  }, true);
  
  document.addEventListener("click", function(e) {
    if (e.target && e.target.closest('.w-checkbox')) setTimeout(syncAll, 50);
  }, true);

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'class' && m.target.classList.contains('is-active')) setTimeout(syncAll, 50);
    });
  });
  document.querySelectorAll('.step').forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

  setTimeout(syncAll, 100); 
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

window.saveProgressSilently = function() {
  // Only run this if we are currently looking at a Child Step (Steps 1, 2, or 3)
  if (currentStepNum >= STEP_FIRST_CHILD && currentStepNum <= STEP_LAST_CHILD) {
    const idx = getChildIndex();
    const currentDOMData = collectChildData();
    const existing = window.__aed_child_applications[idx] || {};
    
    // Merge them so we don't accidentally erase any previously saved hidden fields
    window.__aed_child_applications[idx] = { ...existing, ...currentDOMData };
  }
};

function collectChildData() {
  const data = {};
// FORCE SYNC: These pill groups don't auto-write their ms-input on click.
  // Read the visually selected pills and write the value manually before collecting.
  const FORCE_SYNC_GROUPS = [
    "learning_approaches",
    "academic_strengths",
    "learning_needs",
    "improvement_areas",
    "connections"
  ];

  FORCE_SYNC_GROUPS.forEach(fieldName => {
    const input = document.querySelector(`.ms-input[name="${fieldName}"]`);
    if (!input) return;
    const group = input.closest(".ms-group");
    if (!group) return;
    const selected = Array.from(group.querySelectorAll(".ms-option.is-selected"))
      .map(o => o.getAttribute("data-value"))
      .filter(Boolean);
    input.value = JSON.stringify(selected);
  });

  // Fields that must ALWAYS be captured even if their container is hidden.
  // These live inside conditionally-shown wrappers (e.g. language dropdown,
  // study_span pills, other_goal textareas) so the normal visibility filter
  // would skip them.
const ALWAYS_CAPTURE = [
    "study_span",
    "language_of_study",
    "other_goal_1",
    "other_goal_2",
    "other_goal_3",
    "learning_approaches_custom",
    "academic_strengths_custom",
    "learning_needs_custom",
    "improvement_custom",
    "connections_custom",
    "learning_approaches",
    "academic_strengths",
    "learning_needs",
    "improvement_areas",
    "connections"
  ];

  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    const stepEl = getStepEl(s);
    if (!stepEl) continue;

    const fields = Array.from(stepEl.querySelectorAll("input, select, textarea"));

    for (const el of fields) {
      const name = el.getAttribute("name");
      if (!name) continue;

      const type = (el.getAttribute("type") || "").toLowerCase();
      const isAlwaysCapture = ALWAYS_CAPTURE.includes(name);

      // For pill groups: skip hidden duplicate containers (e.g. Container 3B)
      // BUT always capture fields in the ALWAYS_CAPTURE list regardless.
      if (!isAlwaysCapture) {
        const group = el.closest(".ms-group");
        if (group && (group.offsetWidth === 0 || group.offsetHeight === 0)) {
          continue;
        }
      }

      // Radio buttons
      if (type === "radio") {
        if (el.checked) data[name] = el.value;
        continue;
      }

      // Checkboxes
      if (type === "checkbox") {
        if (el.checked) {
          data[name] = (el.value || "on");
        } else if (data[name] !== "on" && data[name] !== true) {
          data[name] = "";
        }
        continue;
      }

      // Pill groups (ms-input hidden fields)
      if (el.classList.contains("ms-input")) {
        // For study_span: only overwrite if we get a real value,
        // so a hidden duplicate doesn't wipe a good saved value.
        const parsed = (() => {
          try { return JSON.parse(el.value || "[]"); } catch (e) { return []; }
        })();

        if (isAlwaysCapture) {
          // Only save if non-empty, so hidden duplicates don't overwrite
          if (parsed.length > 0) data[name] = parsed;
        } else {
          data[name] = parsed;
        }
        continue;
      }

      // Selects and text fields
      const val = (el.value || "").trim();

      if (isAlwaysCapture) {
        // For language_of_study there are 3 selects with the same name.
        // Only overwrite with a non-empty value so hidden blank ones
        // don't wipe the real selected value.
        if (val) data[name] = val;
      } else {
        data[name] = val;
      }
    }
  }

  // FORCE CAPTURE: Grab Program Type from Step 0 if missing
  if (!data.program_type) {
    const step0 = getStepEl(0);
    if (step0) {
      const progEl = step0.querySelector('input[name="program_type"]:checked') ||
                     step0.querySelector('select[name="program_type"]');
      if (progEl) data.program_type = progEl.value;
    }
  }

  console.log("✅ Child Data Captured:", data);
  return data;
}

function resetChildFields() {
  // A. Clear standard fields across all child steps safely
  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    clearStepError(s);
    const stepEl = getStepEl(s);
    if (!stepEl) continue;

    // THE FIX: Target all inputs in the step directly
    stepEl.querySelectorAll("input, select, textarea").forEach(el => {
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
  }

  // B. THE STICKY BUBBLE FIX... (leave the rest of the function exactly as it is)
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
  childData.__saved = true;               
  window.__aed_child_applications[idx] = childData; 
  console.log("SAVED CHILD DATA:", JSON.stringify(childData))
  captureFirstChildStateIfNeeded();

  const total = getChildrenCount();
  const nextIdx = idx + 1;

  if (nextIdx >= total) {
    // All children are complete! Keep index anchored and move to Step 4
    setChildIndex(nextIdx - 1);
    setActive(STEP_ENVIRONMENT);
    return;
  }

  // Move to the next child
  setChildIndex(nextIdx);

  // THE FIX: Check if the next child already exists before wiping the screen!
  const nextChildData = window.__aed_child_applications[nextIdx];
  if (nextChildData && nextChildData.__saved) {
    loadChildData(nextIdx); // Load their existing data
  } else {
    resetChildFields();     // Or give them a clean slate
  }

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
    
// Build curriculum from individual checkboxes since curriculum_coverage is empty
    let currArray = [];
    if (child.english === "on") currArray.push("English");
    if (child.mathematics === "on") currArray.push("Mathematics");
    if (child.science === "on") currArray.push("Science");
    if (child.health_physical_ed === "on") currArray.push("HPE");
    if (child.hass === "on") currArray.push("HASS");
    if (child.technologies === "on") currArray.push("Technologies");
    if (child.the_arts === "on") currArray.push("The Arts");
    if (child.languages === "on") currArray.push("Languages");

    // NEW: Pull in specific elective pill selections!
    const electiveItems = [
      formatPills(child.hass_selections),
      formatPills(child.arts_selections),
      formatPills(child.tech_selections),
      formatPills(child.english_elective),
      formatPills(child.hpe_elective),
      formatPills(child.maths_pathways),
      formatPills(child.science_specialist),
      child.Language_of_study || child.language_of_study // Added this to ensure your language fix gets displayed!
    ].filter(Boolean);

    // Combine them all
    if (electiveItems.length > 0) {
       currArray = currArray.concat(electiveItems);
    }
    
    let curriculum = currArray.length > 0 ? currArray.join(", ") : formatPills(child.curriculum_coverage);
    if (!curriculum || curriculum === "[]" || curriculum === "") curriculum = "Australian Curriculum";

    // Pulling in your Interests (added 'curiosities' back to catch the current Webflow data!)
    const interestItems = [
      formatPills(child.curiosities),
      formatPills(child.interests),
      formatPills(child.interest_animals),
      formatPills(child.interest_coding),
      formatPills(child.interest_art),
      formatPills(child.interest_building),
      formatPills(child.interest_writing),
      formatPills(child.interest_space),
      formatPills(child.interest_games),
      formatPills(child.interest_tech),
      formatPills(child.interest_history),
      formatPills(child.interest_cooking),
      formatPills(child.interest_chemistry),
      formatPills(child.interest_music),
      formatPills(child.interest_sport),
      child.curiosities_custom,
      child.interests_custom
    ].filter(Boolean).join(", ");

    // Combining your General Goals with Specific Goals AND the "other_goal" fields
    const goalItems = [
      formatPills(child.general_academic_goals),
      formatPills(child.general_independence_goals),
      formatPills(child.general_social_goals),
      formatPills(child.short_term_academic),
      formatPills(child.short_term_social),
      formatPills(child.short_term_independence),
      child.short_term_custom,
      formatPills(child.long_term_academic),
      formatPills(child.long_term_social),
      formatPills(child.long_term_independence),
      child.long_term_custom,
      child.other_goal_1,
      child.other_goal_2,
      child.other_goal_3
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
          ${renderRow("Interests", interestItems || "General Interests")}
          ${renderRow("Goals", goalItems || "General Goals")}
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
    const obj = {};

   
    // 1. SURGICAL SCRAPING: Only grab inputs from Step 0, Step 4, and Step 6
    const targetSteps = [0, 4, 6];
    targetSteps.forEach(stepNum => {
      const stepEl = getStepEl(stepNum);
      if (!stepEl) return;

      const fields = stepEl.querySelectorAll("input[name], select[name], textarea[name]");
      fields.forEach(el => {
        const name = el.getAttribute("name");
        if (!name) return;
        
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
      if (name) obj[name] = el.value;
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

    // 5. TRAVEL CONTEXT (Family-Level)
    obj.travel_context = {
      timing: obj.travel_timing || "",
      destinations: obj.travel_destinations || "",
      style: obj.travel_style ? safeParseJsonArray(obj.travel_style) : [],
      learning_opportunities: obj.travel_learning_opportunities ? safeParseJsonArray(obj.travel_learning_opportunities) : [],
      notes: obj.travel_notes || ""
    };

    // 6. METADATA
    obj.request_id = makeRequestId();
    obj.current_child_index = getChildIndex();
    obj.children_count = getChildrenCount();

    // 7. FALLBACKS (Just in case)
    obj.contact_first_name = obj.contact_first_name || "";
    obj.contact_email = obj.contact_email || "";
    obj.plan_start_date = obj.plan_start_date || "";
    obj.plan_end_date = obj.plan_end_date || "";

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
    if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently(); // Autosave first!
    if (currentStepNum === 6) {
      
        //       // From Step 6, go back to Step 4 (Environment)
        setActive(4);
    } else if (currentStepNum === 4) {
        // From Step 4, go back to the LAST child's Step 3
        const lastChildIdx = getChildrenCount() - 1;
        setChildIndex(lastChildIdx);
        loadChildData(lastChildIdx);
        setActive(3);
        renderChildNavBar();
    } else if (currentStepNum === 1) {
        // From Step 1, go back to previous child's Step 3, OR Step 0
        const idx = getChildIndex();
        if (idx > 0) {
            setChildIndex(idx - 1);
            loadChildData(idx - 1);
            setActive(3);
            renderChildNavBar();
        } else {
            setActive(0);
        }
    } else if (currentStepNum > 0) {
        setActive(currentStepNum - 1);
    }
    return;
  }

  if (action === "next") {
    if (!validateStep(currentStepNum)) return;
    
    // FOOLPROOF VISIBILITY CHECK: Run validations based on what is actually on screen!
    const container3B = document.getElementById('container-3b-goaldirected');
    if (container3B && container3B.offsetParent !== null) {
      if (typeof validateGoalDirectedStep4 === 'function' && !validateGoalDirectedStep4()) return;
    }

    const container3A = document.getElementById('container-3a-general');
    if (container3A && container3A.offsetParent !== null) {
      if (typeof validateInterestLedStep4 === 'function' && !validateInterestLedStep4()) return;
    }

   // NEW CODE: Check the curriculum rules! (ONLY on Step 3)
    if (currentStepNum === 3) {
      if (typeof window.validateCurriculum === 'function' && !window.validateCurriculum()) return;
    }
    if (currentStepNum === 0) {
      recalcOrderSummaryUIAndHidden();
      setChildIndex(0);
      loadChildData(0);
    }

    recalcOrderSummaryUIAndHidden();

    // --- NEW LOOPING & ROUTING LOGIC ---
    if (currentStepNum === 3) {
      // Step 3 is the new last child step. Trigger the save & loop!
      saveCurrentChildAndAdvance();
      return;
    }

    if (currentStepNum === 4) {
      // Step 4 jumps straight to 6 (Review), skipping redundant Step 5
      setActive(6);
      return;
    }

    if (currentStepNum < STEP_PAYMENT) setActive(currentStepNum + 1);
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
setupBtn.onclick = () => {
    // Save the current child regardless of which step we're on
    const idx = getChildIndex();
    if (window.__aed_child_applications[idx] && window.__aed_child_applications[idx].__saved) {
        const freshData = collectChildData();
        window.__aed_child_applications[idx] = { 
            ...window.__aed_child_applications[idx], 
            ...freshData 
        };
    }
    setActive(0);
};
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
    reviewBtn.onclick = () => {
        if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently(); // Autosave!
        setActive(STEP_PAYMENT); // Step 6
    };
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

  // 🛡️ Activate the shield so aggressive listeners don't clear data while loading
  window.__aed_is_loading_data = true;

  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    const stepEl = getStepEl(s);
    if (!stepEl) continue;

    stepEl.querySelectorAll("input, select, textarea").forEach(el => {
      const name = el.getAttribute("name");
      if (!name || name === "state") return;

      const val = data[name];
      const type = (el.getAttribute("type") || "").toLowerCase();
      const tag = (el.tagName || "").toLowerCase();

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
      } else if (el.classList.contains("ms-input")) {
        el.value = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : (val || "[]");
      } else if (tag === "select") {
        el.value = val || "";
        el.style.color = (el.value === "") ? "#cbd1d6" : "#7a7f87";
      } else {
        el.value = val || "";
      }

      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  // Sync pill visuals
  const allPillInputs = document.querySelectorAll(".ms-input");
  allPillInputs.forEach(input => syncPillsFromInput(input));

  // FIX 1: If study_span has a saved value, make sure the pill section is visible
  if (data.study_span) {
    const pillSection = document.getElementById('year-level-pills');
    if (pillSection) pillSection.style.display = '';
  }

  // FIX 2: If language_of_study has a saved value, restore it after the shield
  // drops (so bindLanguageToggle has already shown the wrapper)
  if (data.language_of_study) {
    setTimeout(() => {
      const langSelect = document.querySelector('select[name="language_of_study"]');
      if (langSelect) {
        langSelect.value = data.language_of_study;
        langSelect.style.color = "#7a7f87";
        langSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, 150);
  }

  // FIX 3: If other_goal fields have saved values, show their hidden wrappers
  ["other_goal_1", "other_goal_2", "other_goal_3"].forEach((fieldName, i) => {
    const val = data[fieldName];
    if (!val) return; // Nothing saved, leave hidden

    // Find the textarea
    const textarea = document.querySelector(`textarea[name="${fieldName}"], input[name="${fieldName}"]`);
    if (!textarea) return;

    // Show the wrapper div (it uses display:none to hide)
    const wrapper = textarea.closest('[data-show]') || textarea.parentElement;
    if (wrapper) wrapper.style.display = "block";

    // Update the corresponding "Add Other" button text
    const btnLabel = `[+ Add Other ${i + 1}]`;
    const allAddOtherLinks = document.querySelectorAll('.add-other-link');
    allAddOtherLinks.forEach(link => {
      if ((link.getAttribute('data-field') || '').includes(`other_goal_${i + 1}`)) {
        link.textContent = "[-] Remove Other";
      }
    });
  });

  updateCurrentChildHeading();
  updateFoundationOptionLabel();
  setTimeout(setupAutoExpandingTextareas, 50);
  setTimeout(refreshAllSelectColours, 50);

  // 🛡️ Deactivate the shield once the DOM has safely settled
  setTimeout(() => { window.__aed_is_loading_data = false; }, 100);
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
    { name: 'structured_learning_time', label: 'Structured Learning Time' },
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
    });
  }

  yearDropdown.addEventListener('change', updatePills);
  if (stateDropdown) stateDropdown.addEventListener('change', updatePills);
  updatePills();
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
    bannerContainer.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1200px; width: 100%; box-sizing: border-box; display: none;';
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

  // NEW: Bulletproof function to force History to be selected and locked
  function forceSelectHistory(prefix) {
    var hassPills = document.getElementById(prefix + '-hass-pills');
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
      y9Container.style.display = 'block';
      lockSpecificElements(y9Container); 
      setCheckboxLock('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]', false); 
      setCheckboxLock('#y9-hass-cb', true); // Lock HASS checkbox
      forceSelectHistory('y9'); // Auto-select History
      
      bannerContainer.innerHTML = '<strong>Curriculum Requirements (Year 9)</strong><br>Your child must complete 5 core areas (English, Maths, Science, HPE, and History). You must also select 2 or more electives from different learning areas to suit their interests.';
      bannerContainer.style.display = 'block';
    }
    
    if (isY10 && y10Container) {
      y10Container.style.display = 'block';
      lockSpecificElements(y10Container);
      setCheckboxLock('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]', false); 
      setCheckboxLock('#y10-hass-cb', true); // Lock HASS checkbox
      forceSelectHistory('y10'); // Auto-select History
      
      bannerContainer.innerHTML = '<strong>Curriculum Requirements (Year 10)</strong><br>Your child must complete 5 core areas (English, Maths, Science, HPE, and History). You must also select 2 or more electives from different learning areas to shape their future pathway.';
      bannerContainer.style.display = 'block';
    }
  }

  yearDropdown.addEventListener('change', checkYearLevel);
  checkYearLevel(); 
}

/* =========================
   CURRICULUM VALIDATION (Checks Rules on "Next" Click)
   ========================= */
window.validateCurriculum = function() {
  var existingErr = document.getElementById('curriculum-error-msg');
  if (existingErr) existingErr.style.display = 'none';

  function showCurrError(msg, targetContainerId) {
    var errEl = document.getElementById('curriculum-error-msg');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'curriculum-error-msg';
      errEl.style.cssText = 'color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;';
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
    
    var container = document.getElementById(targetContainerId);
    if (container) {
      container.insertAdjacentElement('afterbegin', errEl);
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  var yearDropdown = document.querySelector('select[name="student_year_level"]');
  if (!yearDropdown) return true;
  var rawValue = yearDropdown.value;
  if (!rawValue || rawValue === 'FOUNDATION') return true;

  var match = rawValue.match(/\d+/);
  if (!match) return true;
  var yearNum = parseInt(match[0], 10);

  // RULE 1: Years 7-8 Must Select at Least 1 Arts subject
  if (yearNum === 7 || yearNum === 8) {
    var artsPills = document.getElementById('y78-arts-pills');
    if (artsPills && artsPills.offsetParent !== null) { 
      var selectedArts = artsPills.querySelectorAll('.ms-option.is-selected').length;
      if (selectedArts < 1) {
        showCurrError('Please select at least 1 Arts elective for Years 7-8.', 'y78-arts-pills');
        return false;
      }
    }
  }

  // RULE 2: Years 9-10 Must Have 2 Electives from DIFFERENT Learning Areas
  if (yearNum === 9 || yearNum === 10) {
    var prefix = yearNum === 9 ? 'y9' : 'y10';
    var containerId = prefix + '-curriculum-container';

    var selectedAreas = [];
    var totalElectivePills = 0;

    // Bucket 1: Technologies
    var techPills = document.getElementById(prefix + '-tech-pills');
    if (techPills) {
       var techCount = techPills.querySelectorAll('.ms-option.is-selected').length;
       if (techCount > 0) {
          selectedAreas.push('Technologies');
          totalElectivePills += techCount;
       }
    }

    // Bucket 2: The Arts
    var artsPills910 = document.getElementById(prefix + '-arts-pills');
    if (artsPills910) {
       var artsCount = artsPills910.querySelectorAll('.ms-option.is-selected').length;
       if (artsCount > 0) {
          selectedAreas.push('The Arts');
          totalElectivePills += artsCount;
       }
    }

    // Bucket 3: Languages
    var hasLang = false;
    document.querySelectorAll('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]').forEach(function(cb) {
       if (cb.checked && cb.offsetParent !== null) hasLang = true;
    });
    if (hasLang) {
       selectedAreas.push('Languages');
       totalElectivePills += 1; 
    }

    // Bucket 4: Additional HASS Subject
    var hassPills = document.getElementById(prefix + '-hass-pills');
    if (hassPills) {
       var hassCount = hassPills.querySelectorAll('.ms-option.is-selected').length;
       if (hassCount > 1) { // 1 is core (History), anything above 1 is an elective!
          selectedAreas.push('Additional HASS');
          totalElectivePills += (hassCount - 1);
       }
    }

    // Check A: Do they have at least 2 distinct learning areas?
    if (selectedAreas.length < 2) {
      var areasText = selectedAreas.length === 1 ? selectedAreas[0] : "none";
      showCurrError('Please select electives from at least 2 DIFFERENT learning areas. Currently you only have electives from: ' + areasText + '.', containerId);
      return false;
    }

    // Check B: Do they have at least 2 total electives?
    if (totalElectivePills < 2) {
      showCurrError('Please select at least 2 electives in total.', containerId);
      return false;
    }
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

    // 2. COUNT PILLS
    function countPills(wrapperId) {
      var wraps = document.querySelectorAll('#' + wrapperId);
      var wrap = Array.from(wraps).find(el => el.offsetParent !== null) || wraps[0];
      if (!wrap || wrap.style.display === 'none') return 0;
      return wrap.querySelectorAll('.ms-option.is-selected').length;
    }

    function hasLanguage() {
      var langCbs = document.querySelectorAll('input.curriculum-checkbox[data-value="languages"], input[name="languages"], input[id="languages"]');
      var isChecked = false;
      langCbs.forEach(function(cb) {
         if (cb.checked && cb.offsetParent !== null) isChecked = true;
      });
      return isChecked ? 1 : 0;
    }

    // 3. DO THE MATH
    if (yearNum === 7 || yearNum === 8) {
      total = 7 + countPills('y78-arts-pills');
    } 
    else if (yearNum === 9) {
      total = 4 + countPills('y9-hass-pills') + countPills('y9-tech-pills') + countPills('y9-arts-pills') + hasLanguage();
    } 
    else if (yearNum === 10) {
      total = 1 + countPills('y10-english-pills') + countPills('y10-maths-pills') + countPills('y10-science-pills') + countPills('y10-hass-pills') + countPills('y10-tech-pills') + countPills('y10-arts-pills') + 1 + countPills('y10-hpe-pills') + hasLanguage();
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

  document.addEventListener('click', function(e) {
    if(e.target.closest('.ms-option')) setTimeout(updateCheckboxes, 50); 
  }, true);
  
  document.addEventListener('change', function(e) {
    if(e.target && e.target.classList.contains('ms-input')) setTimeout(updateCheckboxes, 50);
  }, true);

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class' && mutation.target.classList.contains('is-active')) {
        setTimeout(updateCheckboxes, 50);
      }
    });
  });

  document.querySelectorAll('.step').forEach(function(step) {
    observer.observe(step, { attributes: true, attributeFilter: ['class'] });
  });

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
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === 'class' && m.target.classList.contains('is-active')) {
        setTimeout(swapContainers, 50);
      }
    });
  });
  
  document.querySelectorAll('.step').forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

  setTimeout(swapContainers, 100);
}
/* =========================
   DYNAMIC PROGRESS BAR
   ========================= */
function updateProgressBar() {
  const activeStep = document.querySelector('.step.is-active');
  if (!activeStep) return;

  // 1. Calculate the exact math based on how many kids there are
  const totalChildren = getChildrenCount();
  const currentChildIdx = getChildIndex();
  
  // Total screens = Setup (1) + Children (Kids x 3) + Environment (1) + Review (1)
  const totalScreens = 1 + (totalChildren * 3) + 1 + 1; 
  let currentScreen = 1;

  if (currentStepNum === 0) {
    currentScreen = 1;
  } else if (currentStepNum >= 1 && currentStepNum <= 3) {
    currentScreen = 1 + (currentChildIdx * 3) + currentStepNum;
  } else if (currentStepNum === 4) {
    currentScreen = 1 + (totalChildren * 3) + 1;
  } else if (currentStepNum === 6) {
    currentScreen = totalScreens;
  }

  // Calculate percentage (ensure it never goes over 100%)
  const percentage = Math.min(100, Math.round((currentScreen / totalScreens) * 100));

  // 2. Find where to put it (right before the child nav pills)
  const navBar = activeStep.querySelector('#child-nav-bar');
  if (!navBar) return;

  // 3. Create or update the progress bar HTML dynamically
  let progressWrap = activeStep.querySelector('.aed-progress-wrapper');
  
  if (!progressWrap) {
    // Build the bar if it doesn't exist on this step yet
    progressWrap = document.createElement('div');
    progressWrap.className = 'aed-progress-wrapper';
    // Using your brand colors!
    progressWrap.style.cssText = 'width: 100%; background: #eef4ee; border-radius: 10px; height: 11px; margin-bottom: 20px; overflow: hidden; border: 1px solid #DDe4dd;';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'aed-progress-fill';
    progressFill.style.cssText = `width: ${percentage}%; background: #799377; height: 100%; transition: width 0.4s ease; border-radius: 10px;`;
    
    progressWrap.appendChild(progressFill);
    
    // Insert it directly above the navigation buttons
    navBar.parentNode.insertBefore(progressWrap, navBar);
  } else {
    // If it already exists, just animate the width to the new percentage!
    const progressFill = progressWrap.querySelector('.aed-progress-fill');
    if (progressFill) {
      progressFill.style.width = percentage + '%';
    }
  }
}

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
       el.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 24px; margin-top: 8px; font-family: Montserrat, sans-serif; max-width: 1200px; width: 100%; box-sizing: border-box; display: block;';
    }
  });
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
bindCurriculumVisibility();
bindWorkloadTracker();
bindCheckboxSync();
bindPersonalisedHeading();
upgradeStep0Banner();

// --- THE NEWLY RESCUED SCRIPTS ---
initInterestDeepDives();
initGoalDirectedDeepDives();
bindGoalCounter();
bindGoalContainerSwapper();
  
// Static per-child pricing — Step 0 add-on labels
const cfg = window.APPLYED_PRICING_CONFIG;
if (cfg) {
  document.querySelectorAll('[data-price-key="products.base_program"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.products.base_program.amount_cents)));
  document.querySelectorAll('[data-price-key="products.additional_child"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.products.additional_child.amount_cents)));
  document.querySelectorAll('[data-price-key="add_ons.detailed_weekly_planning"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.detailed_weekly_planning.amount_cents)));
  document.querySelectorAll('[data-price-key="add_ons.travel_program"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.travel_program.amount_cents)));
  document.querySelectorAll('[data-price-key="add_ons.expedited_delivery"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.expedited_delivery.amount_cents)));
  document.querySelectorAll('[data-price-key="add_ons.expedited_delivery_with_weekly"]')
    .forEach(el => el.textContent = aud(centsToDollars(cfg.add_ons.expedited_delivery_with_weekly.amount_cents)));

  // Step 0 label text — static per child
  document.querySelectorAll('.aed-label-weekly-unit')
    .forEach(el => el.textContent = 'Detailed Weekly Plan Add-On');
  document.querySelectorAll('.aed-label-expedited-unit')
    .forEach(el => el.textContent = 'Expedited Delivery Add-On');
  document.querySelectorAll('.aed-label-travel-unit')
    .forEach(el => el.textContent = 'Travel Program Add-On');
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
   DYNAMIC STATE PICKER LOCK & VALIDATION (Sticky Navbar Fix v3)
   ========================= */
function bindStatePickerLock() {
  const pickers = document.querySelectorAll('select[name="state-picker"], [data-aed-state-picker="1"], select[name="state"]');

  // 1. Function to lock or unlock based on the current step
  function updateLock() {
    const shouldLock = (typeof currentStepNum !== 'undefined' && currentStepNum > 0);

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
    if (nextBtn && typeof currentStepNum !== 'undefined' && currentStepNum === 0) {
      
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
     }
  });


  // 4. Watch for step changes to lock/unlock automatically
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'class' && m.target.classList.contains('is-active')) {
        setTimeout(updateLock, 50);
      }
    });
  });

  document.querySelectorAll('.step').forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

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

  // Watch for step changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === 'class' && m.target.classList.contains('is-active')) setTimeout(updateCounter, 50);
    });
  });
  document.querySelectorAll('.step').forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

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
    banner.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1200px; width: 100%; box-sizing: border-box;';
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

  document.addEventListener('change', function(e) {
    if (e.target.name === 'program_type') setTimeout(swapContainers, 50);
  });
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === 'class' && m.target.classList.contains('is-active')) setTimeout(swapContainers, 50);
    });
  });
  document.querySelectorAll('.step').forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

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
      'animals_nature': 'deep-dive-animals',
      'digital_coding': 'deep-dive-coding', /* Check if your main pill is digital_coding or digital_design! */
      'art_creativity': 'deep-dive-art',
      'building_construction': 'deep-dive-building',
      'creative_writing': 'deep-dive-writing',
      'space_astronomy': 'deep-dive-space',
      'strategic_games': 'deep-dive-games',
      'technology_gaming': 'deep-dive-tech',
      'history_culture': 'deep-dive-history',
      'cooking_life_skills': 'deep-dive-cooking',
      'chemistry_experiments': 'deep-dive-chemistry',
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

  // Listen for step changes (runs automatically when Step 3 opens)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.attributeName === 'class' && m.target.classList.contains('is-active')) {
        setTimeout(updateDeepDives, 50);
      }
    });
  });
  
  document.querySelectorAll('.step').forEach(step => {
    observer.observe(step, { attributes: true, attributeFilter: ['class'] });
  });

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

  // 4. Listeners to trigger the reveal instantly
  document.addEventListener('click', function(e) {
    if (e.target.closest('.ms-option')) {
      setTimeout(updateGoalDeepDives, 50);
    }
  }, true);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === 'class' && m.target.classList.contains('is-active')) {
        setTimeout(updateGoalDeepDives, 50);
      }
    });
  });
  
  document.querySelectorAll('.step').forEach(step => observer.observe(step, { attributes: true, attributeFilter: ['class'] }));

  setTimeout(updateGoalDeepDives, 100);
}

});