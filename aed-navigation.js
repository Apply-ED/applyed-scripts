/* =========================================================
   Module 4 — aed-navigation.js  (Apply-ED intake form)
   Step discovery, setActive(), click handlers, progress bar,
   child nav bar, validation, step error display.
   Depends on: aed-config.js (Module 1), aed-state.js (Module 3)
   Runtime calls: functions from apply-ed.js via window.* bridges
   ========================================================= */
window.AED = window.AED || {};

// 1. THE GLOBAL BRIDGE (Must be defined early, before Webflow.push)
window.jumpToChild = function(targetIdx) {
    if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently();
    if (window.aed_nav) {
        window.aed_nav.jump(targetIdx);
    } else {
        console.error("Navigation bridge not ready.");
    }
};

window.Webflow ||= [];
window.Webflow.push(function () {
  "use strict";

  // --- Alias helpers from Module 1 ---
  var toInt = window.AED.helpers.toInt;

  // --- Alias state functions from Module 3 ---
  var getChildIndex    = window.getChildIndex;
  var setChildIndex    = window.setChildIndex;
  var getChildrenCount = window.getChildrenCount;

  /* =========================
     STEP NAVIGATION + VALIDATION
     ========================= */

  var steps = Array.from(document.querySelectorAll('.step[data-step]'))
    .sort(function(a, b) { return toInt(a.getAttribute("data-step"), 0) - toInt(b.getAttribute("data-step"), 0); });

  var sideSteps = Array.from(document.querySelectorAll(".side-step"));

  if (!steps.length) {
    console.warn("[Apply-ED] No .step[data-step] found.");
    return;
  }

  var STEP_FIRST_CHILD = 1;
  var STEP_LAST_CHILD = 5;
  // Change 4: STEP_Y2 is no longer a navigation target. Step 4's containers
  // have been relocated into Step 3 and are controlled by Y1/Y2 tabs.
  // We keep the constant for container-ID references only.
  var STEP_Y2 = 4;
  var STEP_ENVIRONMENT = 6;
  var STEP_PAYMENT = 7;

  // Change 4: Track which curriculum tab is active ('y1' or 'y2')
  // Exposed on window so the curriculum IIFE (separate scope) can read it.
  window.__aed_activeYearTab = 'y1';
  var _activeYearTab = 'y1';
  // Keep both in sync — local for fast access, window for cross-scope
  Object.defineProperty(window, '__aed_activeYearTab', {
    get: function() { return _activeYearTab; },
    set: function(v) { _activeYearTab = v; },
    configurable: true
  });

  var currentStepNum = 0;

  function getStepEl(stepNum) {
    return steps.find(function(s) { return toInt(s.getAttribute("data-step"), -1) === stepNum; }) || null;
  }

  /* =========================
     CHILD HEADING (Student name & Number)
     ========================= */

  function updateCurrentChildHeading() {
    // 1. Identify the active step or current step element
    var activeStep = document.querySelector(".step.is-active") || getStepEl(currentStepNum) || document;

    // 2. Locate the heading element (ensure this attribute is on your H3/H4 in Webflow)
    var heading = activeStep.querySelector('[data-child-heading="true"]');
    if (!heading) return;

    // 3. Get the Child Index and convert to 1-based "Human" number (e.g., Index 0 = Child 1)
    var childIdx = getChildIndex();
    var displayNum = childIdx + 1;

    // 4. Try to find the name input (checks active step first, then Step 1 as fallback)
    var nameEl = activeStep.querySelector('input[name="student_first_name"]');
    if (!nameEl) {
      var step1 = getStepEl(STEP_FIRST_CHILD);
      if (step1) nameEl = step1.querySelector('input[name="student_first_name"]');
    }

    var name = (nameEl && nameEl.value) ? nameEl.value.trim() : "";

    // 5. Update heading text: "Child 1: Alice" or just "Child 1"
    if (name) {
      heading.textContent = "Child " + displayNum + ": " + name;
    } else {
      heading.textContent = "Child " + displayNum;
    }
// Update the section heading
    var sectionHeading = document.getElementById('child-section-heading');
    if (sectionHeading) {
      sectionHeading.textContent = name ? ("About " + name) : 'About';
    }
    // Update the page heading based on current step
    var pageHeading = document.getElementById('child-page-heading');
    if (pageHeading) {
      if (currentStepNum === STEP_FIRST_CHILD) {
        pageHeading.textContent = name ? ("About " + name) : 'About your child';
      } else if (currentStepNum === 2) {
        pageHeading.textContent = name ? ("How does " + name + " learn?") : 'How does your child learn?';
      } else {
        pageHeading.textContent = name ? ("Now tell us about " + name) : 'Now tell us about your child';
      }
    }

    // Ensure it is visible
    heading.style.display = "";
  }

  /* =========================
     setActive — Centralised step activation
     ========================= */

  function setActive(stepNum) {
    steps.forEach(function(stepEl) {
      var n = toInt(stepEl.getAttribute("data-step"), -1);
      stepEl.classList.toggle("is-active", n === stepNum);
    });

    if (sideSteps.length) {
      sideSteps.forEach(function(panel, idx) { panel.classList.toggle("is-active", idx === stepNum); });
    }

    currentStepNum = stepNum;
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (stepNum === STEP_PAYMENT) {
      if (typeof window.renderChildSummary === 'function') window.renderChildSummary();
      if (typeof window.bindConfirmationGating === 'function') window.bindConfirmationGating();
      if (typeof window.recalcOrderSummaryUIAndHidden === 'function') window.recalcOrderSummaryUIAndHidden();
    }

    // Refresh all UI components for the new step
    updateCurrentChildHeading();
    if (typeof window.toggleTravelFamilySection === 'function') window.toggleTravelFamilySection();
    renderChildNavBar();
    if (typeof window.refreshAllSelectColours === 'function') window.refreshAllSelectColours();
    if (stepNum === STEP_FIRST_CHILD) {
      // Let the DOM "settle" for a beat, then enforce default if needed
      setTimeout(ensureDefaultProgramTypeForCurrentChild, 0);
    }

    // Show/hide the Step 3 goal-directed info banner
    if (stepNum === 3) {
      setTimeout(showStep4GoalInfo, 0);
    } else {
      hideStep4GoalInfo();
    }

    // Update the progress bar every time the step changes
    setTimeout(updateProgressBar, 50);

    // ─── CHANGE 3 + CHANGE 4: Centralised step-activation dispatch ─────────
    function dispatchAllStepUpdates() {
      // Curriculum banner and container visibility (all steps)
      if (typeof window.__aed_checkYearLevel === 'function') window.__aed_checkYearLevel();

      // Curriculum rendering (Step 3 — handles both Y1 and Y2 via tabs)
      if (stepNum === 3 && typeof window.__aed_refreshCurriculumDisplay === 'function') {
        window.__aed_refreshCurriculumDisplay();
        if (window.__aed_activeYearTab === 'y2' && typeof window.__aed_refreshY2CurriculumDisplay === 'function') {
          window.__aed_refreshY2CurriculumDisplay();
        }
      }

      // Language dropdown show/hide (all steps)
      if (typeof window.__aed_syncLanguageToggle === 'function') window.__aed_syncLanguageToggle();

      // Checkbox sync for curriculum cards (all steps)
      if (typeof window.__aed_updateCheckboxes === 'function') window.__aed_updateCheckboxes();

      // Program-type container swap (3A/3B)
      if (typeof window.__aed_swapProgramContainers === 'function') window.__aed_swapProgramContainers();
      if (typeof window.__aed_swapGoalContainers === 'function') window.__aed_swapGoalContainers();

      // Needs-attention / excelling widget (Step 3 only)
      if (stepNum === 3 && typeof window.__aed_renderNeedsWidget === 'function') window.__aed_renderNeedsWidget();

      // State picker lock/unlock (all steps)
      if (typeof window.__aed_updateStateLock === 'function') window.__aed_updateStateLock();

      // Goal counter (all steps)
      if (typeof window.__aed_updateGoalCounter === 'function') window.__aed_updateGoalCounter();

      // Interest deep dives (all steps)
      if (typeof window.__aed_updateDeepDives === 'function') window.__aed_updateDeepDives();

      // Goal-directed deep dives (all steps)
      if (typeof window.__aed_updateGoalDeepDives === 'function') window.__aed_updateGoalDeepDives();

      // Y1 step heading (Step 3 only)
      if (stepNum === 3 && typeof window.__aed_updateY1Heading === 'function') window.__aed_updateY1Heading();

      // ─── Change 4: syncYearTabs MUST run LAST ─────────────────────────────
      if (stepNum === 3 && typeof window.__aed_syncYearTabs === 'function') window.__aed_syncYearTabs();
    }

    // Fire immediately for fast UI, and again at 400ms to catch post-fade visibility!
    setTimeout(dispatchAllStepUpdates, 50);
    setTimeout(dispatchAllStepUpdates, 400); 
    // ─── END CHANGE 3 + 4 dispatch ──────────────────────────────────────
  }
  /* -------------------------------------------------------
     STEP 4: INFO BANNER & INTEREST BANNER
     ------------------------------------------------------- */
  function showStep4GoalInfo() {
    // Path 2: Single program type — always show the generic interests banner.

    // 1. INTERESTS BANNER
    var interestBanner = document.getElementById('aed-interest-banner');
    if (!interestBanner) {
      interestBanner = document.createElement('div');
      interestBanner.id = 'aed-interest-banner';
      interestBanner.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1450px; width: 100%; box-sizing: border-box;';
      var interestsContainer = document.getElementById('step3-interests-container');
      if (interestsContainer) interestsContainer.insertAdjacentElement('afterbegin', interestBanner);
    }

    interestBanner.innerHTML = '<strong>Student Interests</strong><br>Please select <strong>at least 1 area of interest</strong> so we can build investigations and activities around your child\u2019s passions.';
    interestBanner.style.setProperty('display', 'block', 'important');

    // 2. Goal-directed banner — always hidden (Path 2: no GD program type)
// 2. Goal-directed banner — always shown (Path 2: everyone uses detailed goals)
    var goalBanner3B = document.getElementById('step4-goal-info');
    if (!goalBanner3B) {
      goalBanner3B = document.createElement('div');
      goalBanner3B.id = 'step4-goal-info';
      goalBanner3B.style.cssText = 'color: #263358; background-color: #e2e8e2; border: 1px solid #799377; border-radius: 8px; padding: 12px 16px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-family: Montserrat, sans-serif; max-width: 1450px; width: 100%; box-sizing: border-box;';
      var container3B = document.getElementById('container-3b-goaldirected') || document.querySelector('.step3b-goal-container');
      if (container3B) container3B.insertAdjacentElement('afterbegin', goalBanner3B);
    }
    goalBanner3B.innerHTML = '<strong>Program Goals</strong><br>Please select <strong>4\u20138 short-term goals</strong> (across Academic, Social, and Independence) and <strong>1\u20132 long-term goals</strong> to help us build a focused, achievable program for your child.';
    goalBanner3B.style.setProperty('display', 'block', 'important');
  }

  function hideStep4GoalInfo() {
    var interestBanner = document.getElementById('aed-interest-banner');
    if (interestBanner) interestBanner.style.setProperty('display', 'none', 'important');

    var goalBanner3B = document.getElementById('step4-goal-info');
    if (goalBanner3B) goalBanner3B.style.setProperty('display', 'none', 'important');
  }

  /* =========================
     DEFAULT PROGRAM TYPE
     ========================= */

    function ensureDefaultProgramTypeForCurrentChild() {
    // Path 2: Program type is always curriculum_based.
    // Radio cards are hidden in Webflow; just ensure the hidden radio stays checked.
    var step1 = getStepEl(STEP_FIRST_CHILD);
    if (!step1) return;

    var radios = Array.from(step1.querySelectorAll('input[type="radio"][name="program_type"]'));
    if (!radios.length) return;

    var target = radios.find(function(r) { return r.value === "curriculum_based"; }) || radios[0];
    target.checked = true;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* =========================
     STEP ERROR DISPLAY
     ========================= */

  function showStepError(stepNum, msg) {
    var stepEl = getStepEl(stepNum);
    if (!stepEl) return;

    var err = stepEl.querySelector(".step-error");
    if (!err) {
      // If Webflow didn't provide an error text block, build our own!
      err = document.createElement("div");
      err.className = "step-error";
      err.style.cssText = "color: #c62828; background-color: #ffebee; border: 1px solid #ffcdd2; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 500;";

      // Try to put it right above the buttons
      var actionsWrap = stepEl.querySelector("[data-step-action]");
      if (actionsWrap) actionsWrap = actionsWrap.closest("div");
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

  /* =========================
     FIELD VISIBILITY CHECK
     ========================= */

  function isElementActuallyFillable(el) {
    if (!el) return false;
    if (el.disabled) return false;
    var type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "hidden") return false;
    if (el.hasAttribute("data-state-key")) return false;

    // THE ULTIMATE VISIBILITY CHECK: If it has 0 physical width or height, it is completely hidden!
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return false;

    // Specific fix for Webflow hidden Pill Groups
    if (el.classList.contains("ms-input")) {
      var group = el.closest(".ms-group");
      if (group && (group.offsetWidth === 0 || group.offsetHeight === 0)) return false;
    }

    return true;
  }

  /* =========================
     STEP VALIDATION
     ========================= */

  function validateStep(stepNum) {
    var stepEl = getStepEl(stepNum);
    if (!stepEl) return true;

    var requiredFlag = (stepEl.getAttribute("data-step-required") || "").toLowerCase();
    if (requiredFlag !== "true") return true;

    clearStepError(stepNum);

    var fields = Array.from(stepEl.querySelectorAll("input, select, textarea"))
      .filter(isElementActuallyFillable);

    for (var fi = 0; fi < fields.length; fi++) {
      var field = fields[fi];
      var isMsInput = field.classList && field.classList.contains("ms-input");
      if (isMsInput && field.hasAttribute("required")) {
        var raw = (field.value || "").trim();
        var ok = raw && raw !== "[]" && raw !== "{}" && raw !== '""';
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
     MAIN CLICK HANDLER (Back / Next / Add Other)
     ========================= */

  document.addEventListener("click", function (e) {

    // ✅ ADD OTHER (free text reveal) — runs first and exits
    var addOther = e.target.closest(".add-other-link");
    if (addOther) {
      e.preventDefault();
      e.stopPropagation();

      var key = (addOther.getAttribute("data-field") || "").trim();

      var scope =
        addOther.closest(".field-group") ||
        addOther.closest(".ms-group") ||
        addOther.closest('[data-child-scope="true"]') ||
        document;

      var target =
        (key ? scope.querySelector('[data-field="' + CSS.escape(key) + '"]') : null) ||
        (key ? document.getElementById(key) : null) ||
        scope.querySelector(".free-text-field, .other-textarea");

      if (!target) return;

      var isHidden = window.getComputedStyle(target).display === "none";
      target.style.display = isHidden ? "block" : "none";
      addOther.textContent = isHidden ? "[-] Remove Other" : "[+ Add Other]";
      return; // stop here so step logic never runs
    }

    // --- step-action logic ---
    var btn = e.target.closest("[data-step-action]");
    if (!btn) return;

    e.preventDefault();

    var action = (btn.getAttribute("data-step-action") || "").trim();

    if (action === "back") {
      if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently();

      if (currentStepNum === STEP_PAYMENT) {
        // From Review & Payment, go back to Environment
        setActive(STEP_ENVIRONMENT);

      } else if (currentStepNum === STEP_ENVIRONMENT) {
        // From Environment, go back to the LAST child's Step 5 (Interests & Goals)
        var lastChildIdx = getChildrenCount() - 1;
        setChildIndex(lastChildIdx);
        if (typeof window.loadChildData === 'function') window.loadChildData(lastChildIdx);
        setActive(STEP_LAST_CHILD);
        renderChildNavBar();

      } else if (currentStepNum === STEP_LAST_CHILD) {
        // Change 4: From Step 5, always go back to Step 3.
        // If split-year, activate the Y2 tab so user sees where they left off.
        var childIdx = getChildIndex();
        var childData = window.__aed_child_applications[childIdx] || {};
        var studySpan = Array.isArray(childData.study_span)
          ? childData.study_span[0]
          : childData.study_span;
        var isSplit = studySpan && studySpan !== 'all_one_year';

        if (isSplit) {
          _activeYearTab = 'y2';
        }
        setActive(3);
        if (typeof window.waitForCurriculumThenRestore === 'function') window.waitForCurriculumThenRestore(3);

      } else if (currentStepNum === 1) {
        // From Step 1, go back to previous child's Step 5, OR Step 0
        var idx = getChildIndex();
        if (idx > 0) {
          setChildIndex(idx - 1);
          if (typeof window.loadChildData === 'function') window.loadChildData(idx - 1);
          setActive(STEP_LAST_CHILD);
          renderChildNavBar();
        } else {
          setActive(0);
        }

      } else if (currentStepNum > 0) {
        // Change 4: Skip step 4 when going back from step 5
        var prevStep = (currentStepNum - 1 === STEP_Y2) ? 3 : currentStepNum - 1;
        setActive(prevStep);
      }
      return;
    }

    if (action === "next") {
      // FORCE AUTOSAVE BEFORE NAVIGATING FORWARD
      if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently();

      if (!validateStep(currentStepNum)) return;


// Path 2: Container 3B (detailed goals) is always visible.
      // Validate interests (at least 1) then goals via 3B validation.
      var container3B = document.getElementById('container-3b-goaldirected');
      if (container3B && container3B.offsetParent !== null) {
        if (typeof window.validateGoalDirectedStep4 === 'function' && !window.validateGoalDirectedStep4()) return;
      }
      // Check the curriculum rules (ONLY on Step 3)
      if (currentStepNum === 3) {
        if (typeof window.validateCurriculum === 'function' && !window.validateCurriculum()) return;
      }
      if (currentStepNum === 0) {
        if (typeof window.recalcOrderSummaryUIAndHidden === 'function') window.recalcOrderSummaryUIAndHidden();
        setChildIndex(0);
        if (typeof window.loadChildData === 'function') window.loadChildData(0);
      }

      if (typeof window.recalcOrderSummaryUIAndHidden === 'function') window.recalcOrderSummaryUIAndHidden();

      // --- Change 4: UNIFIED ROUTING LOGIC (no Step 4 navigation) ---

      if (currentStepNum === STEP_LAST_CHILD) {
        // Step 5 (Interests & Goals) is the last child step. Trigger save & loop!
        if (typeof window.saveCurrentChildAndAdvance === 'function') window.saveCurrentChildAndAdvance();
        return;
      }

      if (currentStepNum === 3) {
        // Change 4: Step 3 now handles BOTH Y1 and Y2 curriculum via tabs.
        var studySpanNext = null;

        var spanInput = document.querySelector('.ms-input[name="study_span"]');
        if (spanInput && spanInput.value) {
          try {
            var parsed = JSON.parse(spanInput.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              studySpanNext = parsed[0];
            }
          } catch (e) {}
        }

        // Fall back to saved data if DOM read failed
        if (!studySpanNext) {
          var childIdxNext = getChildIndex();
          var childDataNext = window.__aed_child_applications[childIdxNext] || {};
          studySpanNext = Array.isArray(childDataNext.study_span)
            ? childDataNext.study_span[0]
            : childDataNext.study_span;
        }

        var isSplitNext = studySpanNext && studySpanNext !== 'all_one_year';

        if (isSplitNext && _activeYearTab === 'y1') {
          // Change 4: User is on Y1 tab of a split-year child.
          if (typeof window.__aed_switchYearTab === 'function') {
            window.__aed_switchYearTab('y2');
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        if (isSplitNext && _activeYearTab === 'y2') {
          // Change 4: User is on Y2 tab. Validate Y2 before advancing.
          if (typeof window.validateY2Curriculum === 'function' && !window.validateY2Curriculum()) return;
        }

        // All validation passed — advance to Step 5 (Interests & Goals)
        _activeYearTab = 'y1'; // Reset to Y1 for next time
        setActive(STEP_LAST_CHILD);
        return;
      }

      if (currentStepNum === STEP_ENVIRONMENT) {
        setActive(STEP_PAYMENT);
        return;
      }

      // Change 4: Skip step 4 in generic forward navigation
      var nextStep = (currentStepNum + 1 === STEP_Y2) ? STEP_LAST_CHILD : currentStepNum + 1;
      if (nextStep <= STEP_PAYMENT) setActive(nextStep);
      return;
    }
  });

  /* =========================
     CHILD NAVIGATION BAR
     ========================= */

  function renderChildNavBar() {
    var activeStep = document.querySelector(".step.is-active");
    if (!activeStep) return;

    var container = activeStep.querySelector("#child-nav-bar");
    if (!container) return;

    container.style.display = "flex";
    container.innerHTML = "";

    var total = getChildrenCount();
    var currentIdx = getChildIndex();

    var childrenArr = Array.isArray(window.__aed_child_applications)
      ? window.__aed_child_applications
      : [];

    // ---------- Setup tab ----------
    var setupBtn = document.createElement("button");
    setupBtn.type = "button";
    setupBtn.className = (currentStepNum === 0) ? "child-nav-btn is-active" : "child-nav-btn";
    setupBtn.textContent = "\u2699\uFE0F Setup";
    setupBtn.onclick = function() {
      // Save the current child regardless of which step we're on
      var idx = getChildIndex();
      if (window.__aed_child_applications[idx] && window.__aed_child_applications[idx].__saved) {
        var freshData = typeof window.collectChildData === 'function' ? window.collectChildData() : {};
        var existing = window.__aed_child_applications[idx];
        for (var k in freshData) {
          if (freshData.hasOwnProperty(k)) existing[k] = freshData[k];
        }
      }
      setActive(0);
    };
    container.appendChild(setupBtn);

    // ---------- Child tabs ----------
    if (total > 0) {
      for (var i = 0; i < total; i++) {
        var btn = document.createElement("button");
        btn.type = "button";

        var isActiveChildTab = (i === currentIdx && currentStepNum !== 0);
        btn.className = isActiveChildTab ? "child-nav-btn is-active" : "child-nav-btn";

        var savedData = childrenArr[i] || {};
        var name =
          (savedData.student_first_name && String(savedData.student_first_name).trim())
            ? savedData.student_first_name.trim()
            : ("Child " + (i + 1));

        btn.textContent = name;
        btn.onclick = (function(childIdx) { return function() { window.jumpToChild(childIdx); }; })(i);
        container.appendChild(btn);
      }
    }

    // ---------- Review tab (only when editing a saved child) ----------
    var currentChild = childrenArr[currentIdx] || {};
    var isOnChildSteps = currentStepNum >= STEP_FIRST_CHILD && currentStepNum <= STEP_LAST_CHILD;
    var isSavedChild = currentChild.__saved === true;

    if (isOnChildSteps && isSavedChild) {
      var reviewBtn = document.createElement("button");
      reviewBtn.type = "button";
      reviewBtn.className = (currentStepNum === STEP_PAYMENT) ? "child-nav-btn is-active" : "child-nav-btn";
      reviewBtn.textContent = "Review";
      reviewBtn.onclick = function() {
        if (typeof window.saveProgressSilently === 'function') window.saveProgressSilently();
        setActive(STEP_PAYMENT);
      };
      container.appendChild(reviewBtn);
    }
  }

  /* =========================
     PROGRESS BAR
     ========================= */

  function updateProgressBar() {
    var activeStep = document.querySelector('.step.is-active');
    if (!activeStep) return;

    var totalChildren = getChildrenCount();
    var currentChildIdx = getChildIndex();

    function childScreenCount(idx) {
      var childData = window.__aed_child_applications[idx] || {};
      var studySpan = Array.isArray(childData.study_span)
        ? childData.study_span[0]
        : childData.study_span;

      // If still not found, try reading from the DOM directly (current child only)
      if (!studySpan && idx === getChildIndex()) {
        var spanInput = document.querySelector('.ms-input[name="study_span"]');
        if (spanInput && spanInput.value) {
          try {
            var parsed = JSON.parse(spanInput.value);
            if (Array.isArray(parsed) && parsed.length > 0) studySpan = parsed[0];
          } catch (e) {}
        }
      }

      // If still unknown (future unsaved children), default to 4
      return (studySpan && studySpan !== 'all_one_year') ? 5 : 4;
    }

    // Total screens = Setup (1) + sum of per-child screens + Environment (1) + Review (1)
    var totalScreens = 1 + 1 + 1;
    for (var i = 0; i < totalChildren; i++) {
      totalScreens += childScreenCount(i);
    }

    // Work out how many screens have been completed before the current child
    var screensBeforeCurrentChild = 1; // Setup
    for (var j = 0; j < currentChildIdx; j++) {
      screensBeforeCurrentChild += childScreenCount(j);
    }

    var currentScreen = 1;

    if (currentStepNum === 0) {
      currentScreen = 1;
    } else if (currentStepNum === 1) {
      currentScreen = screensBeforeCurrentChild + 1;
    } else if (currentStepNum === 2) {
      currentScreen = screensBeforeCurrentChild + 2;
    } else if (currentStepNum === 3) {
      // Change 4: Step 3 now contains both Y1 and Y2 tabs.
      var isOnY2Tab = (_activeYearTab === 'y2');
      currentScreen = screensBeforeCurrentChild + (isOnY2Tab ? 4 : 3);
    } else if (currentStepNum === STEP_LAST_CHILD) {
      var isSplitProg = childScreenCount(currentChildIdx) === 5;
      currentScreen = screensBeforeCurrentChild + (isSplitProg ? 5 : 4);
    } else if (currentStepNum === STEP_ENVIRONMENT) {
      currentScreen = totalScreens - 1;
    } else if (currentStepNum === STEP_PAYMENT) {
      currentScreen = totalScreens;
    }

    // Calculate percentage (ensure it never goes over 100%)
    var percentage = Math.min(100, Math.round((currentScreen / totalScreens) * 100));

    // Find where to put it (right before the child nav pills)
    var navBar = activeStep.querySelector('#child-nav-bar');
    if (!navBar) return;

    // Create or update the progress bar HTML dynamically
    var progressWrap = activeStep.querySelector('.aed-progress-wrapper');

    if (!progressWrap) {
      progressWrap = document.createElement('div');
      progressWrap.className = 'aed-progress-wrapper';
      progressWrap.style.cssText = 'width: 100%; background: #eef4ee; border-radius: 10px; height: 11px; margin-bottom: 20px; overflow: hidden; border: 1px solid #DDe4dd;';

      var progressFill = document.createElement('div');
      progressFill.className = 'aed-progress-fill';
      progressFill.style.cssText = 'width: ' + percentage + '%; background: #799377; height: 100%; transition: width 0.4s ease; border-radius: 10px;';

      progressWrap.appendChild(progressFill);

      // Insert it directly above the navigation buttons
      navBar.parentNode.insertBefore(progressWrap, navBar);
    } else {
      var progressFillEl = progressWrap.querySelector('.aed-progress-fill');
      if (progressFillEl) {
        progressFillEl.style.width = percentage + '%';
      }
    }
  }

  /* =========================
     NAVIGATION REGISTER (aed_nav bridge)
     ========================= */

  window.aed_nav = {
    jump: function(idx) {
      setChildIndex(idx);
      if (typeof window.loadChildData === 'function') window.loadChildData(idx);
      setActive(1);
      renderChildNavBar();
    }
  };

  /* =========================
     Expose on window.AED (clean namespace)
     ========================= */
  window.AED.nav = {
    STEP_FIRST_CHILD: STEP_FIRST_CHILD,
    STEP_LAST_CHILD: STEP_LAST_CHILD,
    STEP_Y2: STEP_Y2,
    STEP_ENVIRONMENT: STEP_ENVIRONMENT,
    STEP_PAYMENT: STEP_PAYMENT,
    getStepEl: getStepEl,
    setActive: setActive,
    validateStep: validateStep,
    showStepError: showStepError,
    clearStepError: clearStepError,
    renderChildNavBar: renderChildNavBar,
    updateProgressBar: updateProgressBar,
    updateCurrentChildHeading: updateCurrentChildHeading,
    isElementActuallyFillable: isElementActuallyFillable,
    showStep4GoalInfo: showStep4GoalInfo,
    hideStep4GoalInfo: hideStep4GoalInfo,
    ensureDefaultProgramTypeForCurrentChild: ensureDefaultProgramTypeForCurrentChild
  };

  // Getter/setter for currentStepNum so other modules can access it
  Object.defineProperty(window.AED.nav, 'currentStepNum', {
    get: function() { return currentStepNum; },
    set: function(v) { currentStepNum = v; },
    configurable: true
  });

  /* =========================
     Backward-compatible window.* aliases
     ========================= */
  window.setActive                             = setActive;
  window.getStepEl                             = getStepEl;
  window.validateStep                          = validateStep;
  window.showStepError                         = showStepError;
  window.clearStepError                        = clearStepError;
  window.renderChildNavBar                     = renderChildNavBar;
  window.updateProgressBar                     = updateProgressBar;
  window.updateCurrentChildHeading             = updateCurrentChildHeading;
  window.isElementActuallyFillable             = isElementActuallyFillable;
  window.showStep4GoalInfo                     = showStep4GoalInfo;
  window.hideStep4GoalInfo                     = hideStep4GoalInfo;
  window.ensureDefaultProgramTypeForCurrentChild = ensureDefaultProgramTypeForCurrentChild;

  // STEP constants on window
  window.STEP_FIRST_CHILD = STEP_FIRST_CHILD;
  window.STEP_LAST_CHILD  = STEP_LAST_CHILD;
  window.STEP_Y2          = STEP_Y2;
  window.STEP_ENVIRONMENT = STEP_ENVIRONMENT;
  window.STEP_PAYMENT     = STEP_PAYMENT;

  // currentStepNum accessible via window for cross-module reads
  Object.defineProperty(window, 'currentStepNum', {
    get: function() { return currentStepNum; },
    set: function(v) { currentStepNum = v; },
    configurable: true
  });

  console.log("✅ aed-navigation.js (Module 4) loaded");
});
