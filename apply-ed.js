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

// initYearTabs and Y1/Y2 tab system moved to aed-curriculum.js (Module 6)

});