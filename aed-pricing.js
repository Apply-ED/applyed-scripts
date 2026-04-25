// ============================================================
// AED-PRICING.js — Module 2: Pricing, Order & Checkout
// Apply-ED Create Program Page
// ============================================================
// Depends on: aed-config.js (Module 1) — must load before this file.
// Uses: window.AED.helpers.*, window.AED.SELECTORS, window.AED.CONSTANTS
// ============================================================

window.AED = window.AED || {};

// ─── LOCAL ALIASES (for readability) ─────────────────────────
var _h = window.AED.helpers;

// ─── PRICING CONFIG READER ───────────────────────────────────

function getCfgAmountCents(path) {
  var cfg = window.APPLYED_PRICING_CONFIG;
  if (!cfg) return null;
  var node = path.split(".").reduce(function(acc, k) { return (acc && acc[k] != null ? acc[k] : null); }, cfg);
  var cents = node && typeof node.amount_cents === "number" ? node.amount_cents : null;
  return cents;
}

// ─── PRICING INITIALISATION ──────────────────────────────────

var PRICING = null;

function initPricingFromConfig() {
  if (PRICING) return PRICING;

  var cfg = window.APPLYED_PRICING_CONFIG;
  if (!cfg) throw new Error("APPLYED_PRICING_CONFIG not found (load order issue).");

  var get = function(path) {
    var node = path.split(".").reduce(function(acc, k) { return (acc && acc[k] != null ? acc[k] : null); }, cfg);
    var cents = node && typeof node.amount_cents === "number" ? node.amount_cents : null;
    if (cents == null) throw new Error("Missing pricing config for: " + path);
    return cents;
  };

  var getOptional = function(path) {
    var node = path.split(".").reduce(function(acc, k) { return (acc && acc[k] != null ? acc[k] : null); }, cfg);
    return node && typeof node.amount_cents === "number" ? node.amount_cents : null;
  };

  var expeditedBase = get("add_ons.expedited_delivery");
  var expeditedWithWeekly = getOptional("add_ons.expedited_delivery_with_weekly");
  if (expeditedWithWeekly == null) expeditedWithWeekly = expeditedBase;

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

// ─── TRAVEL SECTION TOGGLE (Step 0) ─────────────────────────

function toggleTravelFamilySection() {
  var section = document.getElementById("travel-family-section");
  if (!section) return;
  var show = _h.isChecked("add_on_travel");
  section.style.display = show ? "" : "none";
  // Do NOT clear values on uncheck.
}

// ─── ORDER BUILDER ───────────────────────────────────────────

function buildOrderFromStep0() {
  var P = initPricingFromConfig();

  var totalChildren = Math.max(1, _h.getSelectInt("total_children", 1));
  var additionalChildren = Math.max(0, totalChildren - 1);

  var addTravel = _h.isChecked("add_on_travel");
  var addExpedited = _h.isChecked("add_on_expedited");
  var addWeekly = _h.isChecked("add_on_weekly");

  var baseCents = P.first_child_cents + additionalChildren * P.additional_child_cents;
  var additionalCents = additionalChildren * P.additional_child_cents;

  var travelCents = addTravel ? totalChildren * P.travel_addon_cents_per_child : 0;
  var expeditedUnitCents = addWeekly
    ? P.expedited_addon_with_weekly_cents_per_child
    : P.expedited_addon_cents_per_child;
  var expeditedCents = addExpedited ? totalChildren * expeditedUnitCents : 0;
  var weeklyCents = addWeekly ? totalChildren * P.weekly_addon_cents_per_child : 0;

  var totalCents = baseCents + travelCents + expeditedCents + weeklyCents;

  var lineItems = [];

  // First child base program
  lineItems.push({
    id: "base_program_first_child",
    label: "Individual Home Education Program (first child)",
    quantity: 1,
    unit_amount_cents: P.first_child_cents,
    amount_cents: P.first_child_cents
  });

  // Additional children
  if (additionalChildren > 0) {
    lineItems.push({
      id: "additional_child",
      label: "Additional child (\u00d7" + additionalChildren + ")",
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
    totalChildren: totalChildren,
    additionalChildren: additionalChildren,
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
    lineItems: lineItems
  };
}

// ─── ORDER SUMMARY UI + HIDDEN FIELDS ────────────────────────

function recalcOrderSummaryUIAndHidden() {
  var order = buildOrderFromStep0();

  _h.setTextAll(".aed-price-base", _h.aud(_h.centsToDollars(order.cents.first_child)));
  _h.setTextAll(".aed-price-additional", _h.aud(_h.centsToDollars(order.cents.additional)));
  _h.setTextAll(".aed-price-travel", _h.aud(_h.centsToDollars(order.cents.travel)));
  _h.setTextAll(".aed-price-expedited", _h.aud(_h.centsToDollars(order.cents.expedited)));
  _h.setTextAll(".aed-price-weekly", _h.aud(_h.centsToDollars(order.cents.weekly)));
  _h.setTextAll(".aed-price-total", _h.aud(_h.centsToDollars(order.cents.total)));

  // Update label text for additional child row
  var additionalCount = Math.max(0, order.totalChildren - 1);
  document.querySelectorAll(".aed-label-additional").forEach(function(el) {
    el.textContent = additionalCount > 0 ? ("Additional child (\u00d7" + additionalCount + ")") : "Additional child";
  });

  // Update label text for per-child add-on rows
  var tc = order.totalChildren;
  document.querySelectorAll(".aed-label-weekly").forEach(function(el) {
    el.textContent = tc > 1 ? ("Detailed Weekly Plan Add-On (\u00d7" + tc + ")") : "Detailed Weekly Plan Add-On";
  });
  document.querySelectorAll(".aed-label-travel").forEach(function(el) {
    el.textContent = tc > 1 ? ("Travel Program Add-On (\u00d7" + tc + ")") : "Travel Program Add-On";
  });
  document.querySelectorAll(".aed-label-expedited").forEach(function(el) {
    el.textContent = tc > 1 ? ("Expedited Delivery Add-On (\u00d7" + tc + ")") : "Expedited Delivery Add-On";
  });

  // Show/hide summary rows
  _h.showAll(".aed-row-additional", order.cents.additional > 0);
  _h.showAll(".aed-row-travel", order.cents.travel > 0);
  _h.showAll(".aed-row-expedited", order.cents.expedited > 0);
  _h.showAll(".aed-row-weekly", order.cents.weekly > 0);

  // Hidden fields
  _h.writeHidden("order_currency", "AUD");
  _h.writeHidden("order_total_cents", order.cents.total);
  _h.writeHidden("order_add_ons_json", JSON.stringify(order.add_ons));
  _h.writeHidden("order_line_items_json", JSON.stringify(order.lineItems));
}

// ─── BIND ORDER SUMMARY SYNC (Step 0 listeners) ─────────────

function bindOrderSummarySync() {
  recalcOrderSummaryUIAndHidden();

  var childrenEl = _h.getElByName("total_children");
  var travelEl = _h.getElByName("add_on_travel");
  var expeditedEl = _h.getElByName("add_on_expedited");
  var weeklyEl = _h.getElByName("add_on_weekly");

  function getSelectedState() {
    return (localStorage.getItem("aed_selected_state") || "").trim().toUpperCase();
  }

  // --- Existing listeners ---
  if (childrenEl) {
    childrenEl.addEventListener("change", function () {
      recalcOrderSummaryUIAndHidden();
      // These functions are in apply-ed.js — called via window
      if (typeof setChildrenCount === 'function' && typeof getTotalChildrenFromStep0 === 'function') {
        setChildrenCount(getTotalChildrenFromStep0());
      }
      if (typeof setChildIndex === 'function') {
        setChildIndex(0);
      }
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
  var warningPanel = document.querySelector(".aed-weekly-warning");
  var keepBtn = document.querySelector(".aed-weekly-keep");
  var removeBtn = document.querySelector(".aed-weekly-remove");

  function hideWeeklyWarning() {
    if (warningPanel) warningPanel.style.setProperty('display', 'none', 'important');
  }

  function showWeeklyWarning() {
    if (warningPanel) {
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
    weeklyEl.addEventListener("change", function() {
      var st = getSelectedState();
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
    keepBtn.addEventListener("click", function(e) {
      e.preventDefault();
      var el = _h.getElByName("add_on_weekly");
      if (el) el.checked = true;
      hideWeeklyWarning();
      recalcOrderSummaryUIAndHidden();
    });
  }

  // Remove anyway
  if (removeBtn) {
    removeBtn.addEventListener("click", function(e) {
      e.preventDefault();
      hideWeeklyWarning();
      recalcOrderSummaryUIAndHidden();
    });
  }
}

// ─── SANITIZE DATA FOR MAKE.COM ──────────────────────────────

function sanitizeDataForMake(data) {
  var cleanData = Object.assign({}, data);
  for (var key in cleanData) {
    var val = cleanData[key];
    if (val === "on") cleanData[key] = true;
    if (val === "") cleanData[key] = false;
    if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
      try {
        var parsed = JSON.parse(val);
        cleanData[key] = Array.isArray(parsed) ? parsed.join(", ") : val;
      } catch (e) {
        cleanData[key] = val.replace(/[\[\]"]/g, "");
      }
    }
  }

  // Force HASS F-6 formatting for younger students
  var rawYear = cleanData.student_year_level || "";
  var isF6 = rawYear === 'FOUNDATION' || (rawYear.match(/\d+/) && parseInt(rawYear.match(/\d+/)[0], 10) <= 6);

  if (isF6 && typeof cleanData.curriculum_coverage === 'string') {
    cleanData.curriculum_coverage = cleanData.curriculum_coverage
      .replace(/Humanities and Social Sciences/gi, "HASS F-6")
      .replace(/\bHASS\b(?! F-6)/gi, "HASS F-6");
  }

  // Suppress Y2 fields when student is not split-year
  var span = Array.isArray(cleanData.study_span)
    ? cleanData.study_span[0]
    : cleanData.study_span;

  if (!span || span === 'all_one_year') {
    Object.keys(cleanData).forEach(function(k) {
      if (k.endsWith('_y2')) delete cleanData[k];
    });
  }

  // ─── ELECTIVE SANITISATION (Y9-10) ──────────────────────────────────────
  // For learning areas that have elective subject pickers at Y9-10, the
  // payload must never send "LA toggled on, zero subjects chosen".
  // If a field is boolean true / "on" but should contain an array of
  // selected subjects, set it to false.
  // Y7-8 is unaffected: HASS and Tech are integrated (boolean true is valid).
  var yearRaw = cleanData.student_year_level || '';
  var yearM = yearRaw.match(/\d+/);
  var yearN = yearM ? parseInt(yearM[0], 10) : null;

  if (yearN !== null) {
    // Keys that must be arrays (not boolean) when the student is in Y9-10
    var electiveKeys = [
      'the_arts', 'technologies', 'hass',
      'creative_arts', 'technological_and_applied_studies',
      'hsie', 'pdhpe', 'humanities', 'hpe'
    ];

    function sanitiseYearKeys(yNum, suffix) {
      if (yNum < 9) return;
      electiveKeys.forEach(function(key) {
        var fullKey = key + suffix;
        var val = cleanData[fullKey];
        // If it's boolean true or string "on" (not already an array), it's invalid
        if (val === true || val === 'on') {
          cleanData[fullKey] = false;
          console.log('🧹 AED: sanitizeDataForMake — ' + fullKey + ' → false (no subjects for Y' + yNum + ')');
        }
      });
    }

    sanitiseYearKeys(yearN, '');
    sanitiseYearKeys(yearN + 1, '_y2');
  }

  return cleanData;
}

// ─── STATIC PRICING LABELS (Step 0) ─────────────────────────

function applyStaticPricingLabels() {
  var cfg = window.APPLYED_PRICING_CONFIG;
  if (!cfg) return;

  document.querySelectorAll('[data-price-key="products.base_program"]')
    .forEach(function(el) { el.textContent = _h.aud(_h.centsToDollars(cfg.products.base_program.amount_cents)); });
  document.querySelectorAll('[data-price-key="products.additional_child"]')
    .forEach(function(el) { el.textContent = _h.aud(_h.centsToDollars(cfg.products.additional_child.amount_cents)); });
  document.querySelectorAll('[data-price-key="add_ons.detailed_weekly_planning"]')
    .forEach(function(el) { el.textContent = _h.aud(_h.centsToDollars(cfg.add_ons.detailed_weekly_planning.amount_cents)); });
  document.querySelectorAll('[data-price-key="add_ons.travel_program"]')
    .forEach(function(el) { el.textContent = _h.aud(_h.centsToDollars(cfg.add_ons.travel_program.amount_cents)); });
  document.querySelectorAll('[data-price-key="add_ons.expedited_delivery"]')
    .forEach(function(el) { el.textContent = _h.aud(_h.centsToDollars(cfg.add_ons.expedited_delivery.amount_cents)); });
  document.querySelectorAll('[data-price-key="add_ons.expedited_delivery_with_weekly"]')
    .forEach(function(el) { el.textContent = _h.aud(_h.centsToDollars(cfg.add_ons.expedited_delivery_with_weekly.amount_cents)); });

  // Step 0 label text — static per child
  document.querySelectorAll('.aed-label-weekly-unit')
    .forEach(function(el) { el.textContent = 'Detailed Weekly Plan Add-On'; });
  document.querySelectorAll('.aed-label-expedited-unit')
    .forEach(function(el) { el.textContent = 'Expedited Delivery Add-On'; });
  document.querySelectorAll('.aed-label-travel-unit')
    .forEach(function(el) { el.textContent = 'Travel Program Add-On'; });
}

// ─── EXPOSE ON WINDOW FOR OTHER MODULES ──────────────────────
// These are called from apply-ed.js (navigation, checkout flow, etc.)

window.AED.recalcOrderSummaryUIAndHidden = recalcOrderSummaryUIAndHidden;
window.AED.buildOrderFromStep0           = buildOrderFromStep0;
window.AED.bindOrderSummarySync          = bindOrderSummarySync;
window.AED.sanitizeDataForMake           = sanitizeDataForMake;
window.AED.toggleTravelFamilySection     = toggleTravelFamilySection;
window.AED.applyStaticPricingLabels      = applyStaticPricingLabels;
window.AED.getCfgAmountCents             = getCfgAmountCents;
window.AED.initPricingFromConfig         = initPricingFromConfig;

// Backward-compatible global aliases (called as bare function names in apply-ed.js)
// These will be removed as we extract further modules.
window.recalcOrderSummaryUIAndHidden = recalcOrderSummaryUIAndHidden;
window.buildOrderFromStep0           = buildOrderFromStep0;
window.bindOrderSummarySync          = bindOrderSummarySync;
window.sanitizeDataForMake           = sanitizeDataForMake;
window.toggleTravelFamilySection     = toggleTravelFamilySection;
window.getCfgAmountCents             = getCfgAmountCents;

console.log("✅ AED: aed-pricing.js loaded (Module 2)");
