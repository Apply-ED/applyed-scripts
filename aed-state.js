/* =========================================================
   Module 3 — aed-state.js  (Apply-ED intake form)
   STATE object, child index/count, state persistence,
   child-applications store, and related helpers.
   Depends on: aed-config.js (Module 1)
   ========================================================= */
window.AED = window.AED || {};

(function () {
  "use strict";

  // --- Alias helpers from Module 1 ---
  var toInt = window.AED.helpers.toInt;

  /* =========================
     STATE (IN MEMORY + MIRROR TO HIDDEN FIELDS)
     + Persist "state" across children
     ========================= */

  var STATE = {
    childrenCount: null,
    currentChildIndex: 0,

    // Shared values that should persist across children
    firstChildStateValue: null
  };

  // DEFAULT_STATE_VALUE from aed-config.js (Module 1)
  var DEFAULT_STATE_VALUE = window.AED.CONSTANTS.DEFAULT_STATE_VALUE;

  function getStateField(key) {
    return (
      document.querySelector('[data-state-key="' + key + '"]') ||
      document.querySelector("#" + key) ||
      document.querySelector('input[name="' + key + '"], select[name="' + key + '"], textarea[name="' + key + '"]')
    );
  }

  function readStateFieldInt(key) {
    var el = getStateField(key);
    if (!el) return null;
    var n = toInt(el.value, NaN);
    return Number.isFinite(n) ? n : null;
  }

  function writeStateField(key, val) {
    var el = getStateField(key);
    if (!el) return;
    el.value = String(val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getChildIndex() {
    var fieldVal = readStateFieldInt("current_child_index");
    if (fieldVal !== null) STATE.currentChildIndex = fieldVal;
    return toInt(STATE.currentChildIndex, 0);
  }

  function setChildIndex(n) {
    STATE.currentChildIndex = toInt(n, 0);
    writeStateField("current_child_index", STATE.currentChildIndex);
  }

  function getChildrenCount() {
    var fieldVal = readStateFieldInt("children_count");
    if (fieldVal !== null) STATE.childrenCount = fieldVal;
    return toInt(STATE.childrenCount, 1);
  }

  function setChildrenCount(n) {
    STATE.childrenCount = Math.max(1, toInt(n, 1));
    writeStateField("children_count", STATE.childrenCount);
  }

  /* =========================
     Persist "state" selection across children
     ========================= */

  function getChildStateSelect() {
    return document.querySelector('select[name="state"]');
  }

  // Capture the first child's chosen state so we can reuse it
  function captureFirstChildStateIfNeeded() {
    // Only capture for child 0
    if (getChildIndex() !== 0) return;

    var el = getChildStateSelect();
    if (!el) return;

    var v = (el.value || "").trim();
    if (v) STATE.firstChildStateValue = v;
  }

  // Apply state to the current child step (defaults to QLD if nothing captured)
  function applyStateDefaultForCurrentChild() {
    var el = getChildStateSelect();
    if (!el) return;

    var desired = STATE.firstChildStateValue || DEFAULT_STATE_VALUE;

    // Only set if empty/unset (prevents overwriting if user already changed it)
    var current = (el.value || "").trim();
    if (!current) {
      el.value = desired;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  /* =========================
     Step 0 child count reader
     ========================= */

  function getTotalChildrenFromStep0() {
    var el =
      document.querySelector('#total_children') ||
      document.querySelector('select[name="total_children"]') ||
      document.querySelector('input[name="total_children"]');
    return el ? toInt(el.value, 1) : 1;
  }

  /* =========================
     Selected state helper
     ========================= */

  function getSelectedStateValue() {
    var el = getChildStateSelect();
    return (el && el.value ? String(el.value).trim().toUpperCase() : "");
  }

  /* =========================
     Child applications store
     ========================= */
  window.__aed_child_applications = window.__aed_child_applications || [];

  /* =========================
     Expose on window.AED (clean namespace)
     ========================= */
  window.AED.state = {
    STATE: STATE,
    getStateField: getStateField,
    readStateFieldInt: readStateFieldInt,
    writeStateField: writeStateField,
    getChildIndex: getChildIndex,
    setChildIndex: setChildIndex,
    getChildrenCount: getChildrenCount,
    setChildrenCount: setChildrenCount,
    getChildStateSelect: getChildStateSelect,
    captureFirstChildStateIfNeeded: captureFirstChildStateIfNeeded,
    applyStateDefaultForCurrentChild: applyStateDefaultForCurrentChild,
    getTotalChildrenFromStep0: getTotalChildrenFromStep0,
    getSelectedStateValue: getSelectedStateValue
  };

  /* =========================
     Backward-compatible window.* aliases
     (so existing bare-name calls in apply-ed.js and aed-pricing.js still work)
     ========================= */
  window.getChildIndex                    = getChildIndex;
  window.setChildIndex                    = setChildIndex;
  window.getChildrenCount                 = getChildrenCount;
  window.setChildrenCount                 = setChildrenCount;
  window.getTotalChildrenFromStep0        = getTotalChildrenFromStep0;
  window.getSelectedStateValue            = getSelectedStateValue;
  window.getChildStateSelect              = getChildStateSelect;
  window.captureFirstChildStateIfNeeded   = captureFirstChildStateIfNeeded;
  window.applyStateDefaultForCurrentChild = applyStateDefaultForCurrentChild;
  window.getStateField                    = getStateField;
  window.readStateFieldInt                = readStateFieldInt;
  window.writeStateField                  = writeStateField;

  console.log("✅ aed-state.js (Module 3) loaded");
})();