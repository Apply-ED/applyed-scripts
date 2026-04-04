/* =========================================================
   Module 5 — aed-data.js  (Apply-ED intake form)
   Save/load/reset child data, collectChildData, loadChildData,
   live-save, child summary, carry-over, pill sync.
   Depends on: aed-config.js (Module 1), aed-state.js (Module 3),
               aed-navigation.js (Module 4)
   Runtime calls: functions from apply-ed.js via window.* bridges
   ========================================================= */
window.AED = window.AED || {};

window.Webflow ||= [];
window.Webflow.push(function () {
  "use strict";

  // --- Alias helpers from Module 1 ---
  var toInt      = window.AED.helpers.toInt;
  var writeHidden = window.AED.helpers.writeHidden;

  // --- Alias state functions from Module 3 ---
  var getChildIndex    = window.getChildIndex;
  var setChildIndex    = window.setChildIndex;
  var getChildrenCount = window.getChildrenCount;
  var captureFirstChildStateIfNeeded   = window.captureFirstChildStateIfNeeded;
  var applyStateDefaultForCurrentChild = window.applyStateDefaultForCurrentChild;

  // --- Alias navigation functions from Module 4 ---
  var STEP_FIRST_CHILD = window.STEP_FIRST_CHILD;
  var STEP_LAST_CHILD  = window.STEP_LAST_CHILD;
  var STEP_Y2          = window.STEP_Y2;
  var STEP_ENVIRONMENT = window.STEP_ENVIRONMENT;
  var STEP_PAYMENT     = window.STEP_PAYMENT;
  var getStepEl                             = window.getStepEl;
  var setActive                             = window.setActive;
  var validateStep                          = window.validateStep;
  var clearStepError                        = window.clearStepError;
  var renderChildNavBar                     = window.renderChildNavBar;
  var updateCurrentChildHeading             = window.updateCurrentChildHeading;
  var ensureDefaultProgramTypeForCurrentChild = window.ensureDefaultProgramTypeForCurrentChild;

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

  // Read from aed-config.js (Module 1)
  const CARRY_OVER_FIELDS = window.AED.CARRY_OVER_FIELDS;

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

function collectValueFromField(fieldEl) {
  const tag = (fieldEl.tagName || "").toLowerCase();
  const type = (fieldEl.getAttribute("type") || "").toLowerCase();

  if (type === "checkbox") return fieldEl.checked ? (fieldEl.value || "true") : null;
  if (type === "radio") return fieldEl.checked ? (fieldEl.value || "") : null;
  if (tag === "select") return (fieldEl.value || "").trim();
  return (fieldEl.value || "").trim();
}

window.saveProgressSilently = function() {
  // Only run this if we are currently looking at a Child Step (Steps 1–5)
  if (window.currentStepNum >= STEP_FIRST_CHILD && window.currentStepNum <= STEP_LAST_CHILD) {
    const idx = getChildIndex();
    const currentDOMData = collectChildData();
    const existing = window.__aed_child_applications[idx] || {};
    
    // Smart merge: never let an empty/invisible-step value overwrite a real saved selection
    const merged = { ...existing };
    for (const key of Object.keys(currentDOMData)) {
      const newVal = currentDOMData[key];
      const oldVal = merged[key];

      // Protect non-empty arrays from being wiped by empty arrays
      if (Array.isArray(newVal) && newVal.length === 0
          && Array.isArray(oldVal) && oldVal.length > 0) {
        continue; 
      }

      // Protect non-empty strings from being blanked by invisible fields
      if ((newVal === '' || newVal === undefined || newVal === null)
          && oldVal && oldVal !== '' && oldVal !== undefined) {
        continue; 
      }

      // Protect pill arrays from being overwritten by checkbox "on" values
      if (Array.isArray(oldVal) && oldVal.length > 0 && !Array.isArray(newVal)) {
        continue;
      }

      merged[key] = newVal;
    }
    window.__aed_child_applications[idx] = merged;
  }
};

function collectChildData() {
  const data = {};

  // FORCE SYNC: These pill groups don't auto-write their ms-input on click.
  const FORCE_SYNC_GROUPS = [
    "learning_approaches", "academic_strengths", "learning_needs", 
    "improvement_areas", "social_community_connections"
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

  const ALWAYS_CAPTURE = window.AED.ALWAYS_CAPTURE;

  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    const stepEl = getStepEl(s);
    if (!stepEl) continue;

    const isStepVisible = stepEl.offsetParent !== null;
    const fields = Array.from(stepEl.querySelectorAll("input, select, textarea"));

    for (const el of fields) {
      const name = el.getAttribute("name");
      if (!name) continue;

      const type = (el.getAttribute("type") || "").toLowerCase();
      const isAlwaysCapture = ALWAYS_CAPTURE.includes(name);

      let isVisible = isStepVisible;
      const containerObj = el.closest(".ms-group") || el.closest(".aed-elective-card") || el.closest(".aed-pathway-card") || el.closest(".field-group") || el.closest(".w-checkbox");
      if (containerObj && (containerObj.offsetWidth === 0 || containerObj.offsetHeight === 0)) {
          isVisible = false;
      }

      if (!isAlwaysCapture && !isVisible) continue;

      if (type === "radio") {
        if (el.checked) data[name] = el.value;
        continue;
      }

      if (type === "checkbox") {
        if (el.checked) {
          if (!Array.isArray(data[name])) data[name] = (el.value || "on");
        } else if (!Array.isArray(data[name]) && data[name] !== "on" && data[name] !== true) {
          if (data[name] === undefined) data[name] = "";
        }
        continue;
      }

      let parsed = null;
      if (el.classList.contains("ms-input")) {
        try { parsed = JSON.parse(el.value || "[]"); } catch (e) { parsed = []; }
      } else {
        let val = (el.value || "").trim();
        if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
          try { parsed = JSON.parse(val); } catch(e){ parsed = val; }
        } else {
          parsed = val;
        }
      }

      if (Array.isArray(parsed)) {
        if (parsed.length > 0) {
            data[name] = parsed; 
        } else if ((isVisible || isAlwaysCapture) && (!data[name] || data[name].length === 0)) {
            data[name] = parsed; 
        }
      } else {
        if (parsed) {
            data[name] = parsed; 
        } else if ((isVisible || isAlwaysCapture) && !data[name]) {
            data[name] = parsed; 
        }
      }
    }
  }

  data.program_type = 'curriculum_aligned';

  console.log("✅ Child Data Captured:", data);
  return data;
}

function resetChildFields() {
  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    clearStepError(s);
    const stepEl = getStepEl(s);
    if (!stepEl) continue;

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
      
      if (!(type === "checkbox" && el.classList.contains("locked-checkbox"))) {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  if (window.__aed_clearCurriculumCacheForChild) {
    var newChildIdx = (typeof getChildIndex === 'function') ? getChildIndex() : 0;
    window.__aed_clearCurriculumCacheForChild(newChildIdx);
  }

  ["f6-curriculum-container", "y9-curriculum-container", "y10-curriculum-container",
   "f6-curriculum-container_y2", "y9-curriculum-container_y2", "y10-curriculum-container_y2"].forEach(function(id) {
    var ctr = document.getElementById(id);
    if (ctr) {
      var wrap = ctr.querySelector('.aed-dynamic-curriculum');
      if (wrap) ctr.removeChild(wrap);
    }
  });

  document.querySelectorAll(".ms-option:not(.aed-dynamic-pill)").forEach(p => {
    p.classList.remove("is-selected");
  });

  const step1 = getStepEl(STEP_FIRST_CHILD);
  if (step1) {
    const radios = Array.from(step1.querySelectorAll('input[type="radio"][name="program_type"]'));
    if (radios.length) {
      var target = radios.find(r => r.value === "curriculum_based") || radios[0];
      target.checked = true;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  for (let s = STEP_FIRST_CHILD; s <= STEP_LAST_CHILD; s++) {
    const stepEl = getStepEl(s);
    if (stepEl) window.resyncAllMultiSelectGroups(stepEl);
  }

  window.__aed_activeYearTab = 'y1';
  if (typeof window.__aed_syncYearTabs === 'function') {
    window.__aed_syncYearTabs();
  }

  window.applyDefaultCheckedGroups();
  applyStateDefaultForCurrentChild(); 
  applyCarryOverDataForCurrentChild();
  updateCurrentChildHeading();

  document.querySelectorAll('[data-show]').forEach(div => { div.style.display = "none"; });
  document.querySelectorAll('[data-target]').forEach(btn => { btn.textContent = "[+ Add Other]"; });

  // Path 2: Collapse 3B goal accordion sections on child switch.
  // Delayed to run AFTER Webflow IX2 animations that may re-open the first accordion.
  setTimeout(function() {
    var goalContainer3B = document.getElementById('container-3b-goaldirected') || document.querySelector('.step3b-goal-container');
    if (goalContainer3B) {
      goalContainer3B.querySelectorAll('.cat-body').forEach(function(body) {
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
        body.style.overflow = 'hidden';
      });
      goalContainer3B.querySelectorAll('.cat-chevron').forEach(function(chev) {
        chev.style.transform = 'rotate(0deg)';
      });
      ['deep-dive-gd-reading', 'deep-dive-gd-numeracy', 'deep-dive-gd-digital',
       'deep-dive-gd-creative', 'deep-dive-gd-emotional', 'deep-dive-gd-social',
       'deep-dive-gd-communication', 'deep-dive-gd-resilience', 'deep-dive-gd-lifeskills',
       'deep-dive-gd-organisation', 'deep-dive-gd-financial', 'deep-dive-gd-pathways'
      ].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.setProperty('display', 'none', 'important');
      });
    }
  }, 300);
  
  ['aed-tracking-needs_attention', 'aed-tracking-excelling'].forEach(function(id) {
    var inp = document.getElementById(id);
    if (inp) inp.value = '[]';
  });

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
  const finalScrape = collectChildData();
  const existing = window.__aed_child_applications[idx] || {};

  for (const key of Object.keys(finalScrape)) {
    const newVal = finalScrape[key];
    const oldVal = existing[key];

    if (Array.isArray(newVal) && newVal.length === 0 && Array.isArray(oldVal) && oldVal.length > 0) continue;
    if ((newVal === '' || newVal === undefined || newVal === null) && oldVal && oldVal !== '') continue;
    if (Array.isArray(oldVal) && oldVal.length > 0 && !Array.isArray(newVal)) continue;

    existing[key] = newVal;
  }

  existing.__saved = true;
  window.__aed_child_applications[idx] = existing;

  console.log("✅ SAVED CHILD " + idx + " (live-save + final scrape):", JSON.stringify(existing));
  captureFirstChildStateIfNeeded();

  const total = getChildrenCount();
  const nextIdx = idx + 1;

  if (nextIdx >= total) {
    setChildIndex(nextIdx - 1);
    setActive(STEP_ENVIRONMENT);
    return;
  }

  setChildIndex(nextIdx);

  const nextChildData = window.__aed_child_applications[nextIdx];
  if (nextChildData && nextChildData.__saved) {
    loadChildData(nextIdx);
  } else {
    resetChildFields();
  }

  setActive(STEP_FIRST_CHILD);
  setTimeout(ensureDefaultProgramTypeForCurrentChild, 0);
  renderChildNavBar();
}

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
    "acara_aligned": "Personalised Program",
    "goal_directed": "Personalised Program",
    "interest_led": "Personalised Program",
    "curriculum_based": "Personalised Program",
    "curriculum_aligned": "Personalised Program"
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

    const yearLevel = child.student_year_level || "Not Specified";
    let rawProgram = programMap[child.program_type] || child.program_type || "Standard Program";
    const programType = rawProgram.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    let currArray = [];
    if (child.english === "on") currArray.push("English");
    if (child.mathematics === "on") currArray.push("Mathematics");
    if (child.science === "on") currArray.push("Science");
    if (child.health_physical_ed === "on") currArray.push("HPE");
    if (child.hass === "on") currArray.push("HASS");
    if (child.technologies === "on") currArray.push("Technologies");
    if (child.the_arts === "on") currArray.push("The Arts");
    if (child.languages === "on") currArray.push("Languages");

    const electiveItems = [
      formatPills(child.hass_electives),
      formatPills(child.arts_electives),
      formatPills(child.tech_electives),
      formatPills(child.english_electives),
      formatPills(child.hpe_electives),
      formatPills(child.maths_electives),
      formatPills(child.science_electives),
      child.Language_of_study || child.language_of_study
    ].filter(Boolean);

    if (electiveItems.length > 0) {
       currArray = currArray.concat(electiveItems);
    }
    
    let curriculum = currArray.length > 0 ? currArray.join(", ") : formatPills(child.curriculum_coverage);
    if (!curriculum || curriculum === "[]" || curriculum === "") curriculum = "Australian Curriculum";

    const interestItems = [
      formatPills(child.curiosities),
      formatPills(child.interests),
      formatPills(child.interest_animals_nature),
      formatPills(child.interest_technology_digital_coding),
      formatPills(child.interest_art_creativity),
      formatPills(child.interest_building_construction),
      formatPills(child.interest_creative_writing),
      formatPills(child.interest_space_astronomy),
      formatPills(child.interest_strategic_games),
      formatPills(child.interest_online_gaming),
      formatPills(child.interest_history_culture),
      formatPills(child.interest_cooking_life_skills),
      formatPills(child.interest_science_experiments),
      formatPills(child.interest_music),
      formatPills(child.interest_sport),
      child.curiosities_custom,
      child.interests_custom
    ].filter(Boolean).join(", ");

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

    const renderRow = (label, value) => `
      <div style="margin-bottom: 1px; line-height: 1.2;">
        <span style="font-weight: 600; color: #263358; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">${label}:</span>
        <span style="color: #7a7f87; font-weight: 400; font-size: 13px;">${value}</span>
      </div>
    `;

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

function waitForCurriculumThenRestore(stepNum) {
  let handled = false;
  function doRestore() {
    if (handled) return;
    handled = true;
    restoreDynamicPillsForStep(stepNum);
  }
  document.addEventListener("aed:curriculumRendered", function handler(e) {
    document.removeEventListener("aed:curriculumRendered", handler);
    requestAnimationFrame(() => doRestore());
  });
  setTimeout(doRestore, 600);
}

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

function loadChildData(idx) {
  const data = window.__aed_child_applications[idx];

  if (!data) {
    resetChildFields();
    return;
  }

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

  const allPillInputs = document.querySelectorAll(".ms-input");
  allPillInputs.forEach(input => syncPillsFromInput(input));

  // Path 2: Collapse 3B goal accordions when loading a child.
  // Delayed to run AFTER Webflow IX2 animations that may re-open the first accordion.
  setTimeout(function() {
    var goalContainer3B = document.getElementById('container-3b-goaldirected') || document.querySelector('.step3b-goal-container');
    if (goalContainer3B) {
      goalContainer3B.querySelectorAll('.cat-body').forEach(function(body) {
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
        body.style.overflow = 'hidden';
      });
      goalContainer3B.querySelectorAll('.cat-chevron').forEach(function(chev) {
        chev.style.transform = 'rotate(0deg)';
      });
      ['deep-dive-gd-reading', 'deep-dive-gd-numeracy', 'deep-dive-gd-digital',
       'deep-dive-gd-creative', 'deep-dive-gd-emotional', 'deep-dive-gd-social',
       'deep-dive-gd-communication', 'deep-dive-gd-resilience', 'deep-dive-gd-lifeskills',
       'deep-dive-gd-organisation', 'deep-dive-gd-financial', 'deep-dive-gd-pathways'
      ].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.setProperty('display', 'none', 'important');
      });
    }
  }, 300);

  ['aed-tracking-needs_attention', 'aed-tracking-excelling'].forEach(function(id) {
    var inp = document.getElementById(id);
    if (inp) {
      var childTracking = data[id];
      inp.value = childTracking ? JSON.stringify(childTracking) : '[]';
    }
  });

  if (data.study_span) {
    const pillSection = document.getElementById('year-level-pills');
    if (pillSection) pillSection.style.display = '';
  }

  ["other_goal_1", "other_goal_2", "other_goal_3"].forEach((fieldName, i) => {
    const val = data[fieldName];
    if (!val) return; 

    const textarea = document.querySelector(`textarea[name="${fieldName}"], input[name="${fieldName}"]`);
    if (!textarea) return;

    const wrapper = textarea.closest('[data-show]') || textarea.parentElement;
    if (wrapper) wrapper.style.display = "block";

    const btnLabel = `[+ Add Other ${i + 1}]`;
    const allAddOtherLinks = document.querySelectorAll('.add-other-link');
    allAddOtherLinks.forEach(link => {
      if ((link.getAttribute('data-field') || '').includes(`other_goal_${i + 1}`)) {
        link.textContent = "[-] Remove Other";
      }
    });
  });

  updateCurrentChildHeading();
  window.updateFoundationOptionLabel();
  setTimeout(function() { if (typeof window.setupAutoExpandingTextareas === 'function') window.setupAutoExpandingTextareas(); }, 50);
  setTimeout(function() { if (typeof window.refreshAllSelectColours === 'function') window.refreshAllSelectColours(); }, 50);

  window.__aed_activeYearTab = 'y1';

  if (window.__aed_clearCurriculumCacheForChild) {
    window.__aed_clearCurriculumCacheForChild(idx);
  }
  
  ["f6-curriculum-container", "y9-curriculum-container", "y10-curriculum-container",
   "f6-curriculum-container_y2", "y9-curriculum-container_y2", "y10-curriculum-container_y2"].forEach(function(id) {
    var ctr = document.getElementById(id);
    if (ctr) {
      var wrap = ctr.querySelector('.aed-dynamic-curriculum');
      if (wrap) ctr.removeChild(wrap);
    }
  });

  if (typeof window.__aed_syncYearTabs === 'function') {
    setTimeout(window.__aed_syncYearTabs, 150);
  }

 setTimeout(function() {
    window.__aed_is_loading_data = false;
    var dropdownNow = document.querySelector('select[name="student_year_level"]');
    if (typeof window.__aed_checkYearLevel === 'function') {
      window.__aed_checkYearLevel();
    }
    if (typeof window.__aed_refreshCurriculumDisplay === 'function') {
      window.__aed_refreshCurriculumDisplay();
    }
    if (typeof window.__aed_syncLanguageToggle === 'function') {
      window.__aed_syncLanguageToggle();
    }
  }, 100);

  setTimeout(function() {
    if (typeof window.__aed_updateGoalCounter === 'function') {
      window.__aed_updateGoalCounter();
    }
    if (typeof window.__aed_updateGoalDeepDives === 'function') {
      window.__aed_updateGoalDeepDives();
    }
  }, 200);
}

function restoreDynamicPillsForStep(stepNum) {
  const idx = getChildIndex();
  const data = window.__aed_child_applications[idx];
  if (!data) return;

  const DYNAMIC_PILL_FIELDS_Y1 = [
    "english_pathway", "mathematics_pathway", "science_pathway",
    "the_arts", "technologies", "hass",
    "creative_arts", "technological_and_applied_studies", "hsie", "pdhpe", "humanities", "hpe"
  ];
  const DYNAMIC_PILL_FIELDS_Y2 = [
    "english_pathway_y2", "mathematics_pathway_y2", "science_pathway_y2",
    "the_arts_y2", "technologies_y2", "hass_y2",
    "creative_arts_y2", "technological_and_applied_studies_y2", "hsie_y2", "pdhpe_y2", "humanities_y2", "hpe_y2"
  ];

  const TRACKING_FIELDS = [
    "aed-tracking-needs_attention",
    "aed-tracking-excelling"
  ];

  const fields = stepNum === STEP_Y2 ? DYNAMIC_PILL_FIELDS_Y2 : DYNAMIC_PILL_FIELDS_Y1;
  const stepEl = getStepEl(stepNum === STEP_Y2 ? 3 : stepNum);
  if (!stepEl) return;

  fields.forEach(function(fieldName) {
    const savedValues = data[fieldName];
    if (!savedValues || !savedValues.length) return;

    const hiddenInput = stepEl.querySelector('input[name="' + fieldName + '"].aed-hidden-input');
    if (!hiddenInput) return;

    const card = hiddenInput.closest('[data-learning-area]');
    if (!card) return;

    card.querySelectorAll('.aed-dynamic-pill').forEach(function(pill) {
      const isLocked = pill.getAttribute('data-locked') === 'true';
      if (!isLocked) {
        const submitVal = pill.getAttribute('data-submit-value');
        const dataVal   = pill.getAttribute('data-value');
        pill.classList.toggle('is-selected',
          savedValues.includes(submitVal) || savedValues.includes(dataVal)
        );
      }
    });

    hiddenInput.value = JSON.stringify(savedValues);
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

    const countEl = card.querySelector('.aed-elective-card-count');
    if (countEl) {
      const selected = card.querySelectorAll('.aed-dynamic-pill.is-selected').length;
      countEl.textContent = selected > 0 ? selected + ' selected' : '';
    }
  });

  const langKey = stepNum === STEP_Y2 ? 'language_of_study_y2' : 'language_of_study';
  const savedLang = data[langKey] || (stepNum === STEP_Y2 ? data['language_of_study'] : '');
  if (savedLang) {
    var langSearchScope = stepEl;
    if (stepNum === STEP_Y2) {
      var y2p = document.getElementById('aed-y2-curriculum-panel');
      if (y2p) langSearchScope = y2p;
    }
    const langBody = langSearchScope.querySelector('.aed-languages-card-body');
    if (langBody) {
      const dynSelect = langBody.querySelector('select');
      if (dynSelect) {
        dynSelect.value = savedLang;
        if (!dynSelect.value || dynSelect.value === '') {
          var lowerLang = savedLang.toLowerCase();
          for (var li = 0; li < dynSelect.options.length; li++) {
            if (dynSelect.options[li].value.toLowerCase() === lowerLang) {
              dynSelect.value = dynSelect.options[li].value;
              if (window.__aed_child_applications && window.__aed_child_applications[idx]) {
                window.__aed_child_applications[idx][langKey] = dynSelect.options[li].value;
              }
              break;
            }
          }
        }
      }
    }
  }

  if (stepNum === 3) {
    TRACKING_FIELDS.forEach(function(fieldName) {
      const savedValues = data[fieldName];
      if (!savedValues || !savedValues.length) return;

      const trackingInput = document.getElementById(fieldName);
      if (!trackingInput) return;

      const type = fieldName.replace('aed-tracking-', '');
      stepEl.querySelectorAll('.aed-tracking-pill[data-type="' + type + '"]').forEach(function(pill) {
        const area = pill.getAttribute('data-area');
        if (savedValues.includes(area)) {
          pill.classList.add(type); 
        }
      });

      trackingInput.value = JSON.stringify(savedValues);
    });
  }

  console.log('✅ AED: Dynamic pills restored for Step ' + stepNum);
}

function setupLiveNameSync() {
  const nameInput = document.querySelector('input[name="student_first_name"]');
  if (!nameInput) return;

  nameInput.addEventListener('input', (e) => {
    const newName = e.target.value.trim();
    const currentIdx = getChildIndex();
    const displayNum = currentIdx + 1;

    updateCurrentChildHeading();

    const activeStep = document.querySelector(".step.is-active");
    if (!activeStep) return;

    const navButtons = activeStep.querySelectorAll('.child-nav-btn');
    const targetBtn = navButtons[currentIdx + 1]; 

    if (targetBtn) {
      targetBtn.textContent = newName || `Child ${displayNum}`;
    }
  });
}

function liveWriteToChildStore(fieldName, value) {
  if (window.__aed_is_loading_data) return;

  if (window.currentStepNum < STEP_FIRST_CHILD || window.currentStepNum > STEP_LAST_CHILD) return;

  var idx = getChildIndex();

  if (!window.__aed_child_applications) window.__aed_child_applications = [];
  if (!window.__aed_child_applications[idx]) window.__aed_child_applications[idx] = {};

  var existing = window.__aed_child_applications[idx][fieldName];
  if (Array.isArray(existing) && existing.length > 0 && !Array.isArray(value)) {
    return;
  }

  window.__aed_child_applications[idx][fieldName] = value;
}

function initLiveSave() {
  document.addEventListener("input", function(e) {
    var el = e.target;
    if (!el) return;

    var name = el.getAttribute("name");
    if (!name) return;

    var familyFields = window.AED.FAMILY_FIELDS; 
    if (familyFields.indexOf(name) !== -1) return;

    if (el.hasAttribute("data-state-key")) return;
    var type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "hidden" && !el.classList.contains("ms-input") && !el.classList.contains("aed-hidden-input")) return;

    var value;
    if (el.classList.contains("ms-input") || el.classList.contains("aed-hidden-input")) {
      try { value = JSON.parse(el.value || "[]"); } catch(ex) { value = el.value; }
    } else {
      value = (el.value || "").trim();
    }

    liveWriteToChildStore(name, value);
  }, true);

  document.addEventListener("change", function(e) {
    var el = e.target;
    if (!el) return;

    var name = el.getAttribute("name");
    if (!name) return;

    var familyFields = window.AED.FAMILY_FIELDS;
    if (familyFields.indexOf(name) !== -1) return;
    if (el.hasAttribute("data-state-key")) return;

    var type = (el.getAttribute("type") || "").toLowerCase();

    if (type === "radio") {
      if (el.checked) {
        liveWriteToChildStore(name, el.value);
      }
      return;
    }

    if (type === "checkbox") {
      liveWriteToChildStore(name, el.checked ? (el.value || "on") : "");
      return;
    }

    if (type === "hidden" && !el.classList.contains("ms-input") && !el.classList.contains("aed-hidden-input")) return;

    var value;
    if (el.classList.contains("ms-input") || el.classList.contains("aed-hidden-input")) {
      try { value = JSON.parse(el.value || "[]"); } catch(ex) { value = el.value; }
    } else {
      value = (el.value || "").trim();
    }

    liveWriteToChildStore(name, value);
  }, true);

  console.log("✅ AED: Live-save system initialised");
}

  /* =======================
     Expose on window.AED (clean namespace)
     ========================= */
  window.AED.data = {
    collectChildData: collectChildData,
    collectValueFromField: collectValueFromField,
    resetChildFields: resetChildFields,
    saveCurrentChildAndAdvance: saveCurrentChildAndAdvance,
    loadChildData: loadChildData,
    renderChildSummary: renderChildSummary,
    syncPillsFromInput: syncPillsFromInput,
    applyCarryOverDataForCurrentChild: applyCarryOverDataForCurrentChild,
    waitForCurriculumThenRestore: waitForCurriculumThenRestore,
    restoreDynamicPillsForStep: restoreDynamicPillsForStep,
    liveWriteToChildStore: liveWriteToChildStore,
    initLiveSave: initLiveSave,
    setupLiveNameSync: setupLiveNameSync
  };

  /* =========================
     Backward-compatible window.* aliases
     ========================= */
  window.collectChildData              = collectChildData;
  window.collectValueFromField         = collectValueFromField;
  window.resetChildFields              = resetChildFields;
  window.saveCurrentChildAndAdvance    = saveCurrentChildAndAdvance;
  window.loadChildData                 = loadChildData;
  window.renderChildSummary            = renderChildSummary;
  window.syncPillsFromInput            = syncPillsFromInput;
  window.applyCarryOverDataForCurrentChild = applyCarryOverDataForCurrentChild;
  window.waitForCurriculumThenRestore  = waitForCurriculumThenRestore;
  window.restoreDynamicPillsForStep    = restoreDynamicPillsForStep;
  window.liveWriteToChildStore         = liveWriteToChildStore;
  window.initLiveSave                  = initLiveSave;
  window.setupLiveNameSync             = setupLiveNameSync;
  window.saveProgressSilently          = saveProgressSilently;

  console.log("✅ aed-data.js (Module 5) loaded");
});