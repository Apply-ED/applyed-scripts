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
     CURRICULUM — Aliases from aed-curriculum.js (Module 6)
     ========================= */
  var bindCurriculumCheckboxes   = window.bindCurriculumCheckboxes;
  var bindLanguageToggle         = window.bindLanguageToggle;
  var bindFoundationLabelByState = window.bindFoundationLabelByState;
  var bindCurriculumVisibility   = window.bindCurriculumVisibility;
  var initYearTabs               = window.initYearTabs;
  var applyDefaultCheckedGroups  = window.applyDefaultCheckedGroups;
  var writeCurriculumCoverage    = window.writeCurriculumCoverage;
  var updateFoundationOptionLabel = window.updateFoundationOptionLabel;


/* =========================
   CROSS-MODULE EXPOSURES — for other modules
   ========================= */
window.bindConfirmationGating        = bindConfirmationGating;
window.refreshAllSelectColours       = refreshAllSelectColours;
window.getGoalDirectedProgramType    = getGoalDirectedProgramType;
window.resyncAllMultiSelectGroups    = resyncAllMultiSelectGroups;
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
   STATE DROPDOWN — In-form select[name="state"] on Step 0
   (Replaces the old dual navbar/form state-picker system)
   ========================= */
function bindStateDropdown() {
  const stateSelect = document.querySelector('select[name="state"]');
  if (!stateSelect) return;

  // 1. Lock/unlock: editable on Step 0, locked on all other steps
  function updateLock() {
    const shouldLock = (typeof window.currentStepNum !== 'undefined' && window.currentStepNum > 0);
    const wrapper = stateSelect.closest('.w-select') || stateSelect.parentElement;

    if (shouldLock) {
      stateSelect.style.setProperty('pointer-events', 'none', 'important');
      stateSelect.style.setProperty('opacity', '0.6', 'important');
      if (wrapper) {
        wrapper.style.setProperty('pointer-events', 'none', 'important');
        wrapper.style.setProperty('opacity', '0.6', 'important');
        wrapper.title = "State cannot be changed once you have started. Please return to Setup to change.";
      }
    } else {
      stateSelect.style.setProperty('pointer-events', 'auto', 'important');
      stateSelect.style.setProperty('opacity', '1', 'important');
      if (wrapper) {
        wrapper.style.setProperty('pointer-events', 'auto', 'important');
        wrapper.style.setProperty('opacity', '1', 'important');
        wrapper.title = "";
      }
    }
  }

  // 2. State validation removed — state is no longer selected in the nav bar.
  //    Any legacy state-picker-error element is hidden on load.
  var _legacyStateErr = document.getElementById('state-picker-error');
  if (_legacyStateErr) _legacyStateErr.style.display = 'none';

  // 3. On change: sync localStorage (legacy) + fire custom event for curriculum
  stateSelect.addEventListener('change', function() {
    const errEl = document.getElementById('state-picker-error');
    if (errEl) errEl.style.display = 'none';

    const val = (stateSelect.value || '').trim().toUpperCase();
    if (val) {
      localStorage.setItem('aed_selected_state', val);
    }
    document.dispatchEvent(new CustomEvent("aed:stateChanged", { detail: { state: val } }));
  });

  // 4. Expose lock updater for centralised dispatch from setActive()
  window.__aed_updateStateLock = updateLock;

  // 5. Seed localStorage from current value on load (in case it's pre-set)
  var initial = (stateSelect.value || '').trim().toUpperCase();
  if (initial) {
    localStorage.setItem('aed_selected_state', initial);
  }

  setTimeout(updateLock, 100);
}

bindStateDropdown();

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
  // Path 2: Validates interests (at least 1 sub-interest selected).
  showGoalError(null); 

  // Validate interests from the accordion groups
  var interestWrap = document.querySelector('.interest-deep-dive-wrap') || document.getElementById('interest-deep-dive-wrap');
  if (interestWrap) {
    var count = interestWrap.querySelectorAll('.ms-option.is-selected').length;
    if (count < 1) {
      showGoalError('Please select at least 1 area of interest so we can build investigations around your child\u2019s passions.', 'step3-interests-container');
      return false;
    }
  }

  return true;
};

// 3. Goal Validation (REDESIGNED — goals are now optional, caps enforced by UI)
window.validateGoalDirectedStep4 = function() {
  showGoalError(null);

  // Interests validation stays — at least 1 sub-interest required
  var interestWrap = document.querySelector('.interest-deep-dive-wrap') || document.getElementById('interest-deep-dive-wrap');
  if (interestWrap) {
    var interestCount = interestWrap.querySelectorAll('.ms-option.is-selected').length;
    if (interestCount < 1) {
      showGoalError('Please select at least 1 area of interest so we can build investigations around your child\u2019s passions.', 'step3-interests-container');
      return false;
    }
  }

  // Goals are optional — no minimum enforcement.
  // Caps (3 academic / 2 independence / 1 social) are enforced
  // by pill disabling in updateGoalCaps(), not by validation.
  return true;
};

/* =========================================
   GOAL COUNTER & CAP ENFORCEMENT (REDESIGNED)
   ========================================= */
function bindGoalCounter() {
  // Remove old sticky banner if it exists
  var uglyBanner = document.getElementById('aed-goal-counter');
  if (uglyBanner) uglyBanner.remove();

  // Category caps
  var GOAL_CAPS = { academic: 3, independence: 2, social: 1 };

  function updateGoalCaps() {
    var counts = { academic: 0, independence: 0, social: 0 };

    // 1. Count selected pills per category
    var goalContainer = document.getElementById('container-3b-goaldirected');
    if (!goalContainer) return;

    goalContainer.querySelectorAll('.ms-option.is-selected').forEach(function(pill) {
      var cat = pill.getAttribute('data-category');
      if (cat && counts[cat] !== undefined) counts[cat]++;
    });

    // 2. Update each category's UI
    goalContainer.querySelectorAll('.cat-item').forEach(function(catItem) {
      // Determine which category this .cat-item belongs to
      var firstPill = catItem.querySelector('.ms-option[data-category]');
      if (!firstPill) return;
      var cat = firstPill.getAttribute('data-category');
      if (!cat || counts[cat] === undefined) return;

      var ct = counts[cat];
      var cap = GOAL_CAPS[cat];

      // Badge text: show "N selected" only when N > 0
      var badgeText = catItem.querySelector('.cat-badge-text');
      if (badgeText) {
        if (ct > 0) {
          badgeText.textContent = ct + ' selected';
          badgeText.style.display = '';
          // Style the badge when at cap
          var badge = catItem.querySelector('.cat-badge');
          if (badge) {
            if (ct >= cap) {
              badge.style.backgroundColor = '#EEEDFE';
              badge.style.borderColor = '#AFA9EC';
              badgeText.style.color = '#3C3489';
            } else {
              badge.style.setProperty('background-color', 'transparent', 'important');
              badge.style.borderColor = '';
              badgeText.style.color = '';
            }
          }
        } else {
          badgeText.textContent = '0 selected';
          badgeText.style.display = 'none';
          var badge2 = catItem.querySelector('.cat-badge');
          if (badge2) {
            badge2.style.setProperty('background-color', 'transparent', 'important');
          }
        }
      }

      // Cap message: show only when at cap
      var capMsg = catItem.querySelector('.cap-message');
      if (capMsg) {
        capMsg.style.display = (ct >= cap) ? 'block' : 'none';
      }

      // Disable/enable pills based on cap
      catItem.querySelectorAll('.ms-option[data-category="' + cat + '"]').forEach(function(pill) {
        var isSelected = pill.classList.contains('is-selected');
        if (ct >= cap && !isSelected) {
          pill.classList.add('is-disabled');
          pill.style.setProperty('opacity', '0.28', 'important');
          pill.style.setProperty('pointer-events', 'none', 'important');
        } else {
          pill.classList.remove('is-disabled');
          pill.style.removeProperty('opacity');
          pill.style.removeProperty('pointer-events');
        }
      });
    });
  }

  // Expose for centralised dispatch from setActive()
  window.__aed_updateGoalCounter = updateGoalCaps;
  window.__aed_updateGoalCaps = updateGoalCaps;

  // Listen for pill clicks
  document.addEventListener('click', function(e) {
    if (e.target.closest('.ms-option')) setTimeout(updateGoalCaps, 50);
  }, true);

  // Listen for custom text field changes
  document.addEventListener('input', function(e) {
    var n = e.target.name || "";
    if (n.indexOf('other_goal') !== -1 || n.indexOf('custom') !== -1) {
      setTimeout(updateGoalCaps, 50);
    }
  }, true);

  setTimeout(updateGoalCaps, 100);
}

setTimeout(bindGoalCounter, 500);
/* =========================================
   PROGRAM TYPE HELPER
   ========================================= */
function getGoalDirectedProgramType() {
  // Path 2: Always return curriculum_based. Single unified program type.
  return 'curriculum_based';
}
/* =========================================
   CONTAINER 3A / 3B MASTER SWITCH & BANNERS
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
  window.__aed_swapGoalContainers = swapContainers;

  // No need to listen for program_type changes — it's always curriculum_based.
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
   STEP 5: INTEREST ACCORDION SYSTEM (Path 2)
   Replaces the old deep-dive show/hide logic.
   Interest categories are now grouped into 4 accordion sections
   built in Webflow with .cat-item/.cat-header/.cat-body/.sub-item/.sub-header/.sub-body
   inside interest-deep-dive-wrap.
   ========================================= */
function initInterestDeepDives() {
  var interestWrap = document.querySelector('.interest-deep-dive-wrap') || document.getElementById('interest-deep-dive-wrap');
  if (!interestWrap) return;

// Hide the primary interest pills grid and its parent labels
  document.querySelectorAll('.grid-curiosities').forEach(function(el) { el.style.display = 'none'; });
  var primaryGrid = document.getElementById('primary-interests-grid');
  if (primaryGrid) {
    var fieldGroup = primaryGrid.closest('.field-group');
    if (fieldGroup) fieldGroup.style.display = 'none';
    // Also hide the parent div-connections wrapper if it contains the grid
    var divConnections = primaryGrid.closest('[class*="div-connections"]') || primaryGrid.closest('.div-connections_curiosities-rig');
    if (divConnections) divConnections.style.display = 'none';
  }
  // Hide the "AREAS OF INTEREST" heading and helper text
  var areaHeading = document.querySelector('.field-label-identifier');
  if (areaHeading && areaHeading.textContent.indexOf('AREAS OF INTEREST') !== -1) {
    var headingParent = areaHeading.closest('.field-group') || areaHeading.parentElement;
    if (headingParent) headingParent.style.display = 'none';
  }
  // Also hide the old subheadings
  var stdSub = document.getElementById('subheading-standard');
  var intSub = document.getElementById('subheading-interest-led');
  if (stdSub) stdSub.style.display = 'none';
  if (intSub) intSub.style.display = 'none';

  // 2. Map sub-interest field names to their top-level interest value
  //    (used to auto-populate the hidden primary grid)
  var subToTopMap = {
    'interest_technology_digital_coding': 'technology_digital_coding',
    'interest_science_experiments': 'science_experiments',
    'interest_space_astronomy': 'space_astronomy',
    'interest_building_construction': 'building_construction',
    'interest_art_creativity': 'art_creativity',
    'interest_creative_writing': 'creative_writing',
    'interest_music': 'music',
    'interest_animals_nature': 'animals_nature',
    'interest_history_culture': 'history_culture',
    'interest_sport': 'sport',
    'interest_cooking_life_skills': 'cooking_life_skills',
    'interest_strategic_games': 'strategic_games',
    'interest_online_gaming': 'online_gaming'
  };

  // 3. Wire up top-level accordion click handlers (.cat-header inside interest-deep-dive-wrap)
  interestWrap.querySelectorAll('.cat-item > .cat-header').forEach(function(header) {
    if (header.dataset.aedInterestBound === '1') return;
    header.dataset.aedInterestBound = '1';
    header.style.cursor = 'pointer';

header.addEventListener('click', function(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      var catItem = header.closest('.cat-item');
      if (!catItem) return;
      var body = catItem.querySelector('.cat-body');
      var chevron = catItem.querySelector('.cat-chevron');
      if (!body) return;

      var isOpen = body.style.maxHeight === 'none';
      if (isOpen) {
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
        body.style.overflow = 'hidden';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      } else {
        body.style.maxHeight = 'none';
        body.style.opacity = '1';
        body.style.overflow = 'visible';
        if (chevron) chevron.style.transform = 'rotate(90deg)';
      }
    }, true);
  });

  // 4. Wire up sub-level accordion click handlers (.sub-header inside interest-deep-dive-wrap)
  interestWrap.querySelectorAll('.sub-header').forEach(function(header) {
    if (header.dataset.aedInterestBound === '1') return;
    header.dataset.aedInterestBound = '1';
    header.style.cursor = 'pointer';

header.addEventListener('click', function(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      var subItem = header.closest('.sub-item');
      if (!subItem) return;
      var body = subItem.querySelector('.sub-body');
      var chevron = subItem.querySelector('.sub-chevron');
      if (!body) return;

      var isOpen = body.style.maxHeight === 'none';
      if (isOpen) {
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
        body.style.overflow = 'hidden';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      } else {
        body.style.maxHeight = 'none';
        body.style.opacity = '1';
        body.style.overflow = 'visible';
        if (chevron) chevron.style.transform = 'rotate(90deg)';
      }
    }, true);
  });

  // 5. Auto-populate hidden primary interests grid from sub-interest selections
  function syncPrimaryFromSubInterests() {
    var primaryInput = document.querySelector('#primary-interests-grid .ms-input');
    if (!primaryInput) return;

    var selectedTopLevel = [];
    for (var fieldName in subToTopMap) {
      var input = document.querySelector('.ms-input[name="' + fieldName + '"]');
      if (!input) continue;
      var vals = [];
      try { vals = JSON.parse(input.value || '[]'); } catch(e) {}
      if (vals.length > 0) {
        selectedTopLevel.push(subToTopMap[fieldName]);
      }
    }

    // Also check for custom text fields — if a parent typed something, count the category
    for (var fieldName2 in subToTopMap) {
      var customInput = document.querySelector('input[name="' + fieldName2 + '_custom"], textarea[name="' + fieldName2 + '_custom"]');
      if (customInput && customInput.value && customInput.value.trim() !== '') {
        var topVal = subToTopMap[fieldName2];
        if (selectedTopLevel.indexOf(topVal) === -1) {
          selectedTopLevel.push(topVal);
        }
      }
    }

    // Deduplicate and write to hidden primary input
    var unique = selectedTopLevel.filter(function(v, i, a) { return a.indexOf(v) === i; });
    primaryInput.value = JSON.stringify(unique);
    primaryInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Also sync the primary grid pill visuals (even though hidden, for data consistency)
    var primaryGroup = primaryInput.closest('.ms-group');
    if (primaryGroup) {
      primaryGroup.querySelectorAll('.ms-option').forEach(function(opt) {
        var val = opt.getAttribute('data-value');
        if (unique.indexOf(val) !== -1) {
          opt.classList.add('is-selected');
        } else {
          opt.classList.remove('is-selected');
        }
      });
    }
  }

  // 6. Update the badge counts on each interest accordion group
  function updateInterestBadges() {
    interestWrap.querySelectorAll('.cat-item').forEach(function(catItem) {
      var count = 0;
      catItem.querySelectorAll('.ms-option.is-selected').forEach(function() { count++; });
      // Also count filled custom text fields
      catItem.querySelectorAll('input[type="text"], textarea').forEach(function(input) {
        if (input.value && input.value.trim() !== '' && input.name && input.name.indexOf('_custom') !== -1) {
          count++;
        }
      });
      var badgeText = catItem.querySelector('.cat-badge-text');
      if (badgeText) {
        badgeText.textContent = count > 0 ? count + ' selected' : '0 selected';
      }
      // Clear green background on badge
      var badge = catItem.querySelector('.cat-badge');
    if (badge) badge.style.setProperty('background-color', 'transparent', 'important');
    });
  }

  // 7. Combined update function
  function updateInterests() {
    syncPrimaryFromSubInterests();
    updateInterestBadges();
    // Re-hide the primary grid every time (belt-and-braces)
    document.querySelectorAll('.grid-curiosities').forEach(function(el) { el.style.display = 'none'; });
    if (primaryGrid) {
      var fg = primaryGrid.closest('.field-group');
      if (fg) fg.style.display = 'none';
    }
    // Kill green badges on all cat-badge elements (goals + interests)
    document.querySelectorAll('.cat-badge').forEach(function(el) {
      el.style.setProperty('background-color', 'transparent', 'important');
    });
  }

  // Expose for centralised dispatch from setActive()
  window.__aed_updateDeepDives = updateInterests;

  // Listen for clicks on any pill inside the interest section
  interestWrap.addEventListener('click', function(e) {
    if (e.target.closest('.ms-option')) {
      setTimeout(updateInterests, 50);
    }
  }, true);

  // Listen for typing in custom fields
  interestWrap.addEventListener('input', function(e) {
    if (e.target && e.target.name && e.target.name.indexOf('_custom') !== -1) {
      setTimeout(updateInterests, 100);
    }
  }, true);

  // Run once on load
  // Run once on load
  setTimeout(updateInterests, 200);

  // Path 2: Permanently suppress green badge backgrounds.
  // Use both a MutationObserver AND a periodic interval as belt-and-braces.
  // The observer catches most changes; the interval catches anything the observer misses.
  function killGreenBadges() {
    document.querySelectorAll('.cat-badge').forEach(function(el) {
      if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent') {
        el.style.setProperty('background-color', 'transparent', 'important');
      }
    });
  }
  var badgeObserver = new MutationObserver(killGreenBadges);
  badgeObserver.observe(document.body, { attributes: true, attributeFilter: ['style'], subtree: true });
  // Also run every 500ms for 10 seconds to catch late Webflow IX2 animations
  var badgeInterval = setInterval(killGreenBadges, 500);
  setTimeout(function() { clearInterval(badgeInterval); }, 10000);
}

// Start the watcher
setTimeout(initInterestDeepDives, 500);

/* =========================================
   GOAL SUB-GROUP ACCORDIONS & DEEP DIVES (REDESIGNED)
   Binds click handlers on .sub-header inside the goal container
   to toggle the adjacent .pill-wrap visibility.
   Also handles auto-expand on desktop.
   ========================================= */
function initGoalDirectedDeepDives() {
  // Expose a no-op for the old deep-dive dispatch (no longer needed)
  window.__aed_updateGoalDeepDives = function() {};

  // Bind click handlers on goal sub-headers to toggle pill-wrap visibility
  var goalContainer = document.getElementById('container-3b-goaldirected');
  if (!goalContainer) return;

  goalContainer.querySelectorAll('.sub-header').forEach(function(header) {
    if (header.dataset.aedGoalSubBound === '1') return;
    header.dataset.aedGoalSubBound = '1';
    header.style.cursor = 'pointer';

    header.addEventListener('click', function(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();

      // The pill-wrap is the next sibling of the sub-header
      var pillWrap = header.nextElementSibling;
      if (!pillWrap || !pillWrap.classList.contains('pill-wrap')) return;

      var chevron = header.querySelector('.sub-chevron');
      var isOpen = pillWrap.style.display !== 'none';

      if (isOpen) {
        pillWrap.style.display = 'none';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      } else {
        pillWrap.style.display = '';
        if (chevron) chevron.style.transform = 'rotate(90deg)';
      }
    }, true);
  });
}

/* =========================================
   GOAL SUB-GROUP AUTO-EXPAND (NEW)
   On desktop (768px+): expand all sub-groups when step 5 activates.
   On mobile: collapse sub-groups, but auto-expand any with selections.
   ========================================= */
function autoExpandGoalSubGroups() {
  var goalContainer = document.getElementById('container-3b-goaldirected');
  if (!goalContainer) return;

  var isDesktop = window.innerWidth >= 768;

  goalContainer.querySelectorAll('.cat-item').forEach(function(catItem) {
    var catBody = catItem.querySelector(':scope > .cat-body');
    if (!catBody) catBody = catItem.querySelector('.cat-body');
    if (!catBody) return;

    // Check if this category has any selections
    var hasSelections = catBody.querySelectorAll('.ms-option.is-selected').length > 0;

    // Handle sub-groups: each sub-header + pill-wrap pair
    catBody.querySelectorAll('.sub-header').forEach(function(subHeader) {
      var pillWrap = subHeader.nextElementSibling;
      if (!pillWrap || !pillWrap.classList.contains('pill-wrap')) return;

      var subChevron = subHeader.querySelector('.sub-chevron');

      // Check if THIS sub-group has selections
      var subHasSelections = pillWrap.querySelectorAll('.ms-option.is-selected').length > 0;

      if (isDesktop || subHasSelections) {
        // Expand
        pillWrap.style.display = '';
        if (subChevron) subChevron.style.transform = 'rotate(90deg)';
      } else {
        // Collapse on mobile when no selections
        pillWrap.style.display = 'none';
        if (subChevron) subChevron.style.transform = 'rotate(0deg)';
      }
    });

    // If the category has selections, also expand the category itself
    if (hasSelections) {
      if (catBody.style.maxHeight === '0px' || catBody.style.opacity === '0') {
        catBody.style.maxHeight = 'none';
        catBody.style.opacity = '1';
        catBody.style.overflow = 'visible';
        var catChevron = catItem.querySelector('.cat-chevron');
        if (catChevron) catChevron.style.transform = 'rotate(90deg)';
      }
    }
  });
}

// Expose for centralised dispatch from setActive()
window.__aed_autoExpandGoalSubGroups = autoExpandGoalSubGroups;

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

// initYearTabs and Y1/Y2 tab system moved to aed-curriculum.js (Module 6)

});