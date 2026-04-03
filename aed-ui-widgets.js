/* =========================================================
   Module 7 — aed-ui-widgets.js  (Apply-ED intake form)
   Multi-select pills, tooltips, workload tracker, goals,
   tracking widget, confirmation gating, payment, checkout,
   date pickers, text areas, pill visibility, year level pills,
   checkbox sync, personalised heading, goal container swap,
   Step 0 banner upgrade, academic tracking widget.
   Depends on: aed-config.js (Module 1), aed-state.js (Module 3),
               aed-navigation.js (Module 4), aed-data.js (Module 5)
   ========================================================= */
window.AED = window.AED || {};

window.Webflow ||= [];
window.Webflow.push(function () {
  "use strict";

  // --- Alias helpers from Module 1 ---
  var toInt              = window.AED.helpers.toInt;
  var writeHidden        = window.AED.helpers.writeHidden;
  var centsToDollars     = window.AED.helpers.centsToDollars;
  var aud                = window.AED.helpers.aud;
  var qs                 = window.AED.helpers.qs;
  var setText            = window.AED.helpers.setText;
  var showEl             = window.AED.helpers.showEl;
  var showRow            = window.AED.helpers.showRow;
  var getElByName        = window.AED.helpers.getElByName;
  var isChecked          = window.AED.helpers.isChecked;
  var getSelectInt       = window.AED.helpers.getSelectInt;
  var safeParseJsonArray = window.AED.helpers.safeParseJsonArray;

  // --- Alias constants from Module 1 ---
  var MAKE_CREATE_CHECKOUT_URL    = window.AED.CONSTANTS.MAKE_CREATE_CHECKOUT_URL;
  var INTAKE_FORM_SELECTOR        = window.AED.SELECTORS.INTAKE_FORM;
  var PAY_CTA_SELECTOR            = window.AED.SELECTORS.PAY_CTA;
  var CONFIRMATIONS_WRAP_SELECTOR = window.AED.SELECTORS.CONFIRMATIONS_WRAP;
  var PAY_ERROR_ID                = window.AED.SELECTORS.PAY_ERROR_ID;
  var REQUEST_TIMEOUT_MS          = window.AED.CONSTANTS.REQUEST_TIMEOUT_MS;
  var CHILD_SUMMARY_SELECTOR      = window.AED.SELECTORS.CHILD_SUMMARY;

  // --- Alias state from Module 3 ---
  var getChildIndex    = window.getChildIndex;
  var setChildIndex    = window.setChildIndex;
  var getChildrenCount = window.getChildrenCount;
  var setChildrenCount = window.setChildrenCount;
  var getTotalChildrenFromStep0 = window.getTotalChildrenFromStep0;
  var getChildStateSelect = window.getChildStateSelect;

  // --- Alias navigation from Module 4 ---
  var STEP_FIRST_CHILD = window.STEP_FIRST_CHILD;
  var STEP_LAST_CHILD  = window.STEP_LAST_CHILD;
  var STEP_Y2          = window.STEP_Y2;
  var STEP_ENVIRONMENT = window.STEP_ENVIRONMENT;
  var STEP_PAYMENT     = window.STEP_PAYMENT;
  var getStepEl        = window.getStepEl;
  var setActive        = window.setActive;
  var showStepError    = window.showStepError;
  var clearStepError   = window.clearStepError;

  // --- Alias data from Module 5 ---
  var collectChildData = window.collectChildData;
  var syncPillsFromInput = window.syncPillsFromInput;

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

// Step 1: Child identity + learning background (Path 2 layout)
  var step1Fields = [
    { name: 'student_first_name', label: 'Student First Name' },
    { name: 'student_pronouns', label: 'Student Pronouns' },
    { name: 'student_year_level', label: 'Current Year Level' },
    { name: 'previous_schooling', label: 'Previous Schooling' },
    { name: 'time_home_educated', label: 'Time Home Educated' }
  ];

// Step 2: Learning preferences + rhythm & boundaries (Path 2 layout)
  var step2Fields = [
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
  // Path 2: Study span pills are now on Step 1, so validate on Step 1's next button.
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
  // Path 2: Always show container 3B (detailed goals), always hide 3A (flat pills).
  const container3A = document.getElementById('container-3a-general'); 
  const container3B = document.getElementById('container-3b-goaldirected');
  
  function swapContainers() {
    if (container3A) container3A.style.setProperty('display', 'none', 'important');
    if (container3B) container3B.style.setProperty('display', 'block', 'important');
  }

  // Expose for centralised dispatch from setActive()
  window.__aed_swapProgramContainers = swapContainers;

  // No need to listen for program_type changes — it's always curriculum_based.
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
     Expose on window.AED and window.* aliases
     ========================= */
  window.AED.widgets = {
    syncGroup: syncGroup,
    initAllMultiSelectGroups: initAllMultiSelectGroups,
    resyncAllMultiSelectGroups: resyncAllMultiSelectGroups,
    bindConfirmationGating: bindConfirmationGating,
    bindPayCta: bindPayCta,
    preventNativeSubmitOnIntakeForm: preventNativeSubmitOnIntakeForm,
    setupAutoExpandingTextareas: setupAutoExpandingTextareas,
    initDatePickers: initDatePickers,
    validatePlanDates: validatePlanDates,
    bindTooltips: bindTooltips,
    fixMultiSelectTooltipZIndex: fixMultiSelectTooltipZIndex,
    bindPillSelection: bindPillSelection,
    bindCustomValidation: bindCustomValidation,
    bindStep1Validation: bindStep1Validation,
    bindPillVisibility: bindPillVisibility,
    bindYearLevelPills: bindYearLevelPills,
    forceSelectHistory: forceSelectHistory,
    bindWorkloadTracker: bindWorkloadTracker,
    bindY2WorkloadTracker: bindY2WorkloadTracker,
    bindCheckboxSync: bindCheckboxSync,
    bindPersonalisedHeading: bindPersonalisedHeading,
    bindGoalContainerSwapper: bindGoalContainerSwapper,
    upgradeStep0Banner: upgradeStep0Banner,
    bindAcademicTrackingWidget: bindAcademicTrackingWidget,
    setApplicationGroupId: setApplicationGroupId
  };

  window.syncGroup                       = syncGroup;
  window.initAllMultiSelectGroups        = initAllMultiSelectGroups;
  window.resyncAllMultiSelectGroups      = resyncAllMultiSelectGroups;
  window.bindConfirmationGating          = bindConfirmationGating;
  window.bindPayCta                      = bindPayCta;
  window.preventNativeSubmitOnIntakeForm = preventNativeSubmitOnIntakeForm;
  window.setupAutoExpandingTextareas     = setupAutoExpandingTextareas;
  window.initDatePickers                 = initDatePickers;
  window.validatePlanDates               = validatePlanDates;
  window.bindTooltips                    = bindTooltips;
  window.fixMultiSelectTooltipZIndex     = fixMultiSelectTooltipZIndex;
  window.bindPillSelection               = bindPillSelection;
  window.bindCustomValidation            = bindCustomValidation;
  window.bindStep1Validation             = bindStep1Validation;
  window.bindPillVisibility              = bindPillVisibility;
  window.bindYearLevelPills              = bindYearLevelPills;
  window.forceSelectHistory              = forceSelectHistory;
  window.bindWorkloadTracker             = bindWorkloadTracker;
  window.bindY2WorkloadTracker           = bindY2WorkloadTracker;
  window.bindCheckboxSync                = bindCheckboxSync;
  window.bindPersonalisedHeading         = bindPersonalisedHeading;
  window.bindGoalContainerSwapper        = bindGoalContainerSwapper;
  window.upgradeStep0Banner              = upgradeStep0Banner;
  window.bindAcademicTrackingWidget      = bindAcademicTrackingWidget;
  window.setApplicationGroupId           = setApplicationGroupId;

  console.log("✅ aed-ui-widgets.js (Module 7) loaded");
});
