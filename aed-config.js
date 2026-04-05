// ============================================================
// AED-CONFIG.js — Module 1: Configuration & Constants
// Apply-ED Create Program Page
// ============================================================
// This file must load FIRST, before all other aed-*.js modules.
// It creates the shared namespace and defines all configuration
// objects, constants, and injected CSS.
// ============================================================

window.AED = window.AED || {};

// ─── INJECTED CSS ────────────────────────────────────────────
document.head.insertAdjacentHTML("beforeend", `<style>
  .locked-checkbox {
    pointer-events: none !important;
    opacity: 0.8;
  }

  /* Program type radio color is managed via Webflow custom CSS (.approach-card :has selectors) */
  
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

  /* CHANGE 4: Y1/Y2 Curriculum Tab Bar */
  #aed-year-tabs {
    display: none; /* hidden by default; shown when split-year */
    gap: 0;
    margin-bottom: 20px;
    border-bottom: 2px solid #DDe4dd;
  }
  #aed-year-tabs.is-visible {
    display: flex;
  }
  .aed-year-tab {
    background: transparent;
    color: #7a7f87;
    border: none;
    border-bottom: 3px solid transparent;
    padding: 10px 24px;
    font-size: 14px;
    font-family: Montserrat, sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: -2px;
  }
  .aed-year-tab.is-active {
    color: #263358;
    border-bottom-color: #799377;
  }
  .aed-year-tab:hover:not(.is-active) {
    color: #263358;
    border-bottom-color: #c3d9c3;
  }
  /* Change 4: Y2 curriculum panel visibility (tab-controlled) */
  /* The Y1 curriculum containers have a Webflow class (f6-curriculum-container-legacy)
     that sets width: 1450px, overflowing the ~1148px .step parent. The Y2 panel must
     match this explicit width so its content aligns with Y1. */
  .aed-y2-panel { display: none; width: 1450px; box-sizing: border-box; }
  .aed-y2-panel.is-active { display: block; }
  .aed-y1-panel { display: block; }
  .aed-y1-panel.is-hidden { display: none; }
  /* Ensure Y2 inner content fills the panel */
  .aed-y2-panel .aed-dynamic-curriculum,
  .aed-y2-panel [id$="_y2"] {
    width: 100% !important;
    box-sizing: border-box !important;
  }
   /* Path 2: Goal counter banner — clean styling */
  #aed-goal-counter {
    background: #fdfdfd !important;
    border: 1px solid #DDe4dd !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03) !important;
    outline: none !important;
  }
  #aed-goal-counter * {
    background: transparent !important;
    outline: none !important;
  }
  /* Prevent parent focus states from bleeding into the counter */
  .step3b-goal-container > #aed-goal-counter,
  #container-3b-goaldirected > #aed-goal-counter {
    position: relative;
    z-index: 1;
  } 
</style>`);

// ─── SELECTORS & CONSTANTS ───────────────────────────────────
window.AED.SELECTORS = {
  INTAKE_FORM:        'form[data-aed-form="intake"]',
  PAY_CTA:            "#pay-button",
  CONFIRMATIONS_WRAP: ".confirmations-wrap",
  PAY_ERROR_ID:       "pay-error",
  CHILD_SUMMARY:      "#child-summary-display"
};

window.AED.CONSTANTS = {
  MAKE_CREATE_CHECKOUT_URL: "https://hook.eu1.make.com/9yolafl9n5m9z5osn9vnwxm8w100rse9",
  REQUEST_TIMEOUT_MS: 20000,
  DEFAULT_STATE_VALUE: "QLD"
};

// ─── FOUNDATION YEAR LABEL BY STATE ──────────────────────────
window.AED.FOUNDATION_LABEL_BY_STATE = {
  QLD: "Prep",
  TAS: "Prep",
  WA:  "Prep",
  NSW: "Kindergarten",
  ACT: "Kindergarten",
  VIC: "Foundation",
  SA:  "Reception",
  NT:  "Transition"
};

// ─── CARRY-OVER FIELDS (environment/resources shared between children) ──
window.AED.CARRY_OVER_FIELDS = [
  "study_spaces",
  "physical_conditions",
  "resources_physical",
  "resources_digital",
  "resources_management"
];

// ─── ALWAYS-CAPTURE FIELDS (saved even when hidden) ──────────
window.AED.ALWAYS_CAPTURE = [
  "study_span", "language_of_study", "language_of_study_y2",
  "other_goal_1", "other_goal_2", "other_goal_3",
  "learning_approaches_custom", "academic_strengths_custom", "learning_needs_custom",
  "improvement_custom", "social_community_connections_custom",
  "learning_approaches", "academic_strengths", "learning_needs", "improvement_areas", "social_community_connections",
  "arts_electives", "hass_electives", "tech_electives", "english_electives", "maths_electives", "science_electives", "hpe_electives",
  "arts_electives_y2", "hass_electives_y2", "tech_electives_y2", "english_electives_y2", "maths_electives_y2", "science_electives_y2", "hpe_electives_y2",
  "english_pathway", "mathematics_pathway", "science_pathway", "the_arts", "technologies", "hass",
  "creative_arts", "technological_and_applied_studies", "hsie", "pdhpe", "humanities", "hpe",
  "english_pathway_y2", "mathematics_pathway_y2", "science_pathway_y2", "the_arts_y2", "technologies_y2", "hass_y2",
  "creative_arts_y2", "technological_and_applied_studies_y2", "hsie_y2", "pdhpe_y2", "humanities_y2", "hpe_y2",
  "aed-tracking-needs_attention", "aed-tracking-excelling",
  "interests", "interests_custom",
  "interest_technology_digital_coding", "interest_art_creativity", "interest_animals_nature",
  "interest_building_construction", "interest_creative_writing", "interest_space_astronomy",
  "interest_strategic_games", "interest_online_gaming", "interest_history_culture",
  "interest_cooking_life_skills", "interest_science_experiments", "interest_music", "interest_sport"
];

// ─── FAMILY-LEVEL FIELDS (excluded from per-child live-save) ─
window.AED.FAMILY_FIELDS = [
  "contact_first_name", "contact_email", "total_children", "plan_start_date",
  "add_on_weekly", "add_on_expedited", "add_on_travel",
  "travel_timing", "travel_destinations", "travel_style", "travel_learning_opportunities",
  "family_non_negotiables", "learning_space", "screen_time",
  "resources_physical", "resources_digital", "resources_management",
  "study_spaces_custom", "screen_time_custom",
  "resources_physical_custom", "resources_digital_custom", "resources_management_custom",
  "confirm_accuracy_oversight", "confirm_program_approval", "confirm_ai_privacy",
  "state", "intake_secret", "application_group_id",
  "order_currency", "order_total_cents", "order_add_ons_json", "order_line_items_json"
];

// ─── CURRICULUM CONFIGURATION ────────────────────────────────
// State-specific subject options for Years 7-10
// id: internal key (underscores allowed)
// value: exact curriculum name passed to backend (spaces, exact case)
// label: parent-friendly display name

window.AED.CURRICULUM_CONFIG = {

  // ── NSW (NESA) ──────────────────────────────────────────────────
  nsw_nesa: {
    id: "nsw_nesa",
    states: ["NSW"],
    mandatory: {
      f6:  {
        display: ["English", "Mathematics", "Science", "HSIE", "PDHPE", "Creative Arts", "Technological and Applied Studies", "Languages"],
        bannerText: "To meet NSW home education requirements, your child will cover all 8 Key Learning Areas."
      },
      y78: {
        display: ["English", "Mathematics", "Science", "HSIE", "PDHPE", "Technological and Applied Studies", "Creative Arts", "Languages"],
        bannerText: "All 8 Key Learning Areas are required. Your child can now choose their Creative Arts focus and subject pathways.",
        artsRequired: true, artsMin: 1
      },
      y9:  {
        display: ["English", "Mathematics", "Science", "HSIE", "PDHPE"],
        bannerText: "Five subjects are mandatory in NSW Stage 5. History AND Geography are both required within HSIE. Select subject pathways and 2 or more electives from different learning areas.",
        historyLocked: true, geographyLocked: true
      },
      y10: {
        display: ["English", "Mathematics", "Science", "HSIE", "PDHPE"],
        bannerText: "Five subjects remain mandatory in NSW Stage 5. History AND Geography continue to be required within HSIE. Select subject pathways and 2 or more electives to shape the senior pathway.",
        historyLocked: true, geographyLocked: true
      }
    },
    electives: {
      y78: {
        english_pathway: {
          label: "English Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "English_Standard",   value: "English Standard",   label: "Standard" },
            { id: "English_Extension",  value: "English Extension",  label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard",   value: "Mathematics Standard",   label: "Standard" },
            { id: "Mathematics_Extension",  value: "Mathematics Extension",  label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "Science_Standard",   value: "Science Standard",   label: "Standard" },
            { id: "Science_Extension",  value: "Science Extension",  label: "Extension" }
          ]
        },
        creative_arts: {
          label: "Creative Arts",
          helpText: "Select at least 1 subject:",
          min: 1, max: 2,
          options: [
            { id: "Visual_Arts", value: "Visual Arts", label: "Visual Arts" },
            { id: "Music",       value: "Music",       label: "Music" },
            { id: "Drama",       value: "Drama",       label: "Drama" },
            { id: "Dance",       value: "Dance",       label: "Dance" }
          ]
        }
      },
      y9: {
        english_pathway: {
          label: "English Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "English_Standard",   value: "English Standard",   label: "Standard" },
            { id: "English_Extension",  value: "English Extension",  label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard",   value: "Mathematics Standard",   label: "Standard" },
            { id: "Mathematics_Extension",  value: "Mathematics Extension",  label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "Science_Standard",   value: "Science Standard",   label: "Standard" },
            { id: "Science_Extension",  value: "Science Extension",  label: "Extension" }
          ]
        },
        technological_and_applied_studies: {
          label: "Technological and Applied Studies (TAS) Electives",
          helpText: "Select 0–2 subjects:",
          min: 0, max: 2,
          options: [
            { id: "Agricultural_Technology",             value: "Agricultural Technology",             label: "Agricultural Technology" },
            { id: "Design_and_Technology",               value: "Design and Technology",               label: "Design and Technology" },
            { id: "Food_Technology",                     value: "Food Technology",                     label: "Food Technology" },
            { id: "Graphics_Technology",                 value: "Graphics Technology",                 label: "Graphics Technology" },
            { id: "Industrial_Technology",               value: "Industrial Technology",               label: "Industrial Technology" },
            { id: "Information_and_Software_Technology", value: "Information and Software Technology", label: "Information and Software Technology" },
            { id: "Marine_and_Aquaculture_Technology",   value: "Marine and Aquaculture Technology",   label: "Marine and Aquaculture Technology" },
            { id: "Textiles_Technology",                 value: "Textiles Technology",                 label: "Textiles Technology" }
          ]
        },
        creative_arts: {
          label: "Creative Arts Electives",
          helpText: "Select 0–2 subjects:",
          min: 0, max: 2,
          options: [
            { id: "Visual_Arts",                    value: "Visual Arts",                    label: "Visual Arts" },
            { id: "Music",                          value: "Music",                          label: "Music" },
            { id: "Drama",                          value: "Drama",                          label: "Drama" },
            { id: "Dance",                          value: "Dance",                          label: "Dance" },
            { id: "Photographic_and_Digital_Media", value: "Photographic and Digital Media", label: "Photographic and Digital Media" },
            { id: "Visual_Design",                  value: "Visual Design",                  label: "Visual Design" }
          ]
        },
        hsie: {
          label: "HSIE Electives",
          helpText: "History and Geography are mandatory. You may also select:",
          min: 0, max: 2,
          options: [
            { id: "Commerce",           value: "Commerce",           label: "Commerce" },
            { id: "Geography_Elective", value: "Geography Elective", label: "Geography (Elective)" },
            { id: "History_Elective",   value: "History Elective",   label: "History (Elective)" },
            { id: "Work_Studies",       value: "Work Studies",       label: "Work Studies" }
          ]
        },
        pdhpe: {
          label: "PDHPE Electives",
          helpText: "Select 0–1 subjects:",
          min: 0, max: 1,
          options: [
            { id: "Physical_Activity_and_Sports_Studies", value: "Physical Activity and Sports Studies", label: "Physical Activity and Sports Studies" },
            { id: "Child_Studies",                        value: "Child Studies",                        label: "Child Studies" }
          ]
        }
      },
      y10: {
        english_pathway: {
          label: "English Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "English_Standard",   value: "English Standard",   label: "Standard" },
            { id: "English_Extension",  value: "English Extension",  label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard",   value: "Mathematics Standard",   label: "Standard" },
            { id: "Mathematics_Extension",  value: "Mathematics Extension",  label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway",
          helpText: "Select the pathway that best suits your child:",
          min: 1, max: 1,
          options: [
            { id: "Science_Standard",   value: "Science Standard",   label: "Standard" },
            { id: "Science_Extension",  value: "Science Extension",  label: "Extension" }
          ]
        },
        technological_and_applied_studies: {
          label: "Technological and Applied Studies (TAS) Electives",
          helpText: "Select 0–2 subjects:",
          min: 0, max: 2,
          options: [
            { id: "Agricultural_Technology",             value: "Agricultural Technology",             label: "Agricultural Technology" },
            { id: "Design_and_Technology",               value: "Design and Technology",               label: "Design and Technology" },
            { id: "Food_Technology",                     value: "Food Technology",                     label: "Food Technology" },
            { id: "Graphics_Technology",                 value: "Graphics Technology",                 label: "Graphics Technology" },
            { id: "Industrial_Technology",               value: "Industrial Technology",               label: "Industrial Technology" },
            { id: "Information_and_Software_Technology", value: "Information and Software Technology", label: "Information and Software Technology" },
            { id: "Marine_and_Aquaculture_Technology",   value: "Marine and Aquaculture Technology",   label: "Marine and Aquaculture Technology" },
            { id: "Textiles_Technology",                 value: "Textiles Technology",                 label: "Textiles Technology" }
          ]
        },
        creative_arts: {
          label: "Creative Arts Electives",
          helpText: "Select 0–2 subjects:",
          min: 0, max: 2,
          options: [
            { id: "Visual_Arts",                    value: "Visual Arts",                    label: "Visual Arts" },
            { id: "Music",                          value: "Music",                          label: "Music" },
            { id: "Drama",                          value: "Drama",                          label: "Drama" },
            { id: "Dance",                          value: "Dance",                          label: "Dance" },
            { id: "Photographic_and_Digital_Media", value: "Photographic and Digital Media", label: "Photographic and Digital Media" },
            { id: "Visual_Design",                  value: "Visual Design",                  label: "Visual Design" }
          ]
        },
        hsie: {
          label: "HSIE Electives",
          helpText: "History and Geography are mandatory. You may also select:",
          min: 0, max: 2,
          options: [
            { id: "Commerce",           value: "Commerce",           label: "Commerce" },
            { id: "Geography_Elective", value: "Geography Elective", label: "Geography (Elective)" },
            { id: "History_Elective",   value: "History Elective",   label: "History (Elective)" },
            { id: "Work_Studies",       value: "Work Studies",       label: "Work Studies" }
          ]
        },
        pdhpe: {
          label: "PDHPE Electives",
          helpText: "Select 0–1 subjects:",
          min: 0, max: 1,
          options: [
            { id: "Physical_Activity_and_Sports_Studies", value: "Physical Activity and Sports Studies", label: "Physical Activity and Sports Studies" },
            { id: "Child_Studies",                        value: "Child Studies",                        label: "Child Studies" }
          ]
        }
      }
    }
  },

  // ── VICTORIA (VCAA) ─────────────────────────────────────────────
  vic_vcaa: {
    id: "vic_vcaa",
    states: ["VIC"],
    mandatory: {
      f6:  {
        display: ["English", "Mathematics", "Science", "Humanities", "Health and Physical Education", "The Arts", "Technologies", "Languages"],
        bannerText: "Victorian Curriculum requires coverage of all 8 learning areas."
      },
      y78: {
        display: ["English", "Mathematics", "Science", "Humanities", "Health and Physical Education", "Technologies", "Languages"],
        bannerText: "All learning areas remain required. Select subject pathways and at least 2 Arts disciplines — at least 1 Performing Arts and 1 Visual Arts.",
        artsRequired: true, artsMin: 2
      },
      y9:  {
        display: ["English", "Mathematics", "Science", "Humanities", "Health and Physical Education"],
        bannerText: "Core subjects are mandatory. Select subject pathways. At least 1 Arts discipline is required. Select additional electives to personalise learning.",
        artsMin: 1
      },
      y10: {
        display: ["English", "Mathematics", "Science", "Humanities", "Health and Physical Education"],
        bannerText: "Core subjects remain mandatory. Select subject pathways and electives to prepare for VCE pathways."
      }
    },
    electives: {
      y78: {
        english_pathway: {
          label: "English Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "English_Standard", value: "English Standard", label: "Standard" },
            { id: "English_Extension", value: "English Extension", label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard", value: "Mathematics Standard", label: "Standard" },
            { id: "Mathematics_Extension", value: "Mathematics Extension", label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Science_Standard", value: "Science Standard", label: "Standard" },
            { id: "Science_Extension", value: "Science Extension", label: "Extension" }
          ]
        },
        the_arts: {
          label: "The Arts",
          helpText: "Select at least 2 — at least 1 Performing Arts and 1 Visual Arts:",
          min: 2, max: 4,
          options: [
            { id: "Dance",                       value: "Dance",                       label: "Dance",                       category: "performing" },
            { id: "Drama",                       value: "Drama",                       label: "Drama",                       category: "performing" },
            { id: "Music",                       value: "Music",                       label: "Music",                       category: "performing" },
            { id: "Media_Arts",                  value: "Media Arts",                  label: "Media Arts",                  category: "visual" },
            { id: "Visual_Arts",                 value: "Visual Arts",                 label: "Visual Arts",                 category: "visual" },
            { id: "Visual_Communication_Design", value: "Visual Communication Design", label: "Visual Communication Design", category: "visual" }
          ]
        }
      },
      y9: {
        english_pathway: {
          label: "English Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "English_Standard", value: "English Standard", label: "Standard" },
            { id: "English_Extension", value: "English Extension", label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard", value: "Mathematics Standard", label: "Standard" },
            { id: "Mathematics_Extension", value: "Mathematics Extension", label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Science_Standard", value: "Science Standard", label: "Standard" },
            { id: "Science_Extension", value: "Science Extension", label: "Extension" }
          ]
        },
        the_arts: {
          label: "The Arts", helpText: "Select at least 1 subject:", min: 1, max: 3,
          options: [
            { id: "Dance", value: "Dance", label: "Dance" },
            { id: "Drama", value: "Drama", label: "Drama" },
            { id: "Music", value: "Music", label: "Music" },
            { id: "Media_Arts", value: "Media Arts", label: "Media Arts" },
            { id: "Visual_Arts", value: "Visual Arts", label: "Visual Arts" },
            { id: "Visual_Communication_Design", value: "Visual Communication Design", label: "Visual Communication Design" }
          ]
        },
        technologies: {
          label: "Technologies", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Digital_Technologies", value: "Digital Technologies", label: "Digital Technologies" },
            { id: "Design_and_Technologies", value: "Design and Technologies", label: "Design and Technologies" }
          ]
        },
        humanities: {
          label: "Humanities Electives", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Geography", value: "Geography", label: "Geography" },
            { id: "Civics_and_Citizenship", value: "Civics and Citizenship", label: "Civics and Citizenship" },
            { id: "Economics_and_Business", value: "Economics and Business", label: "Economics and Business" }
          ]
        }
      },
      y10: {
        english_pathway: {
          label: "English Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "English_Standard", value: "English Standard", label: "Standard" },
            { id: "English_Extension", value: "English Extension", label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard", value: "Mathematics Standard", label: "Standard" },
            { id: "Mathematics_Extension", value: "Mathematics Extension", label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Science_Standard", value: "Science Standard", label: "Standard" },
            { id: "Science_Extension", value: "Science Extension", label: "Extension" }
          ]
        },
        the_arts: {
          label: "The Arts", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Dance", value: "Dance", label: "Dance" },
            { id: "Drama", value: "Drama", label: "Drama" },
            { id: "Music", value: "Music", label: "Music" },
            { id: "Media_Arts", value: "Media Arts", label: "Media Arts" },
            { id: "Visual_Arts", value: "Visual Arts", label: "Visual Arts" },
            { id: "Visual_Communication_Design", value: "Visual Communication Design", label: "Visual Communication Design" }
          ]
        },
        technologies: {
          label: "Technologies", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Digital_Technologies", value: "Digital Technologies", label: "Digital Technologies" },
            { id: "Design_and_Technologies", value: "Design and Technologies", label: "Design and Technologies" }
          ]
        },
        humanities: {
          label: "Humanities Electives", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Geography", value: "Geography", label: "Geography" },
            { id: "Civics_and_Citizenship", value: "Civics and Citizenship", label: "Civics and Citizenship" },
            { id: "Economics_and_Business", value: "Economics and Business", label: "Economics and Business" }
          ]
        }
      }
    }
  },

  // ── NATIONAL FRAMEWORK (QLD, WA, SA, TAS, ACT, NT) ──────────────
  national_ac: {
    id: "national_ac",
    states: ["QLD", "WA", "SA", "TAS", "ACT", "NT"],
    mandatory: {
      f6: {
        display: ["English", "Mathematics", "Science", "HASS", "Health and Physical Education", "The Arts", "Technologies", "Languages"],
        bannerText: "The Australian Curriculum covers all 8 learning areas for Foundation to Year 6."
      },
      y78: {
        display: ["English", "Mathematics", "Science", "Humanities and Social Sciences", "Health and Physical Education", "Technologies", "Languages"],
        bannerText: "All learning areas remain required. Select subject pathways and at least 1 Arts discipline.",
        artsRequired: true, artsMin: 1
      },
      y9: {
        display: ["English", "Mathematics", "Science", "Humanities and Social Sciences", "Health and Physical Education"],
        bannerText: "Core subjects are mandatory. Select subject pathways and electives to personalise learning."
      },
      y10: {
        display: ["English", "Mathematics", "Science", "Humanities and Social Sciences", "Health and Physical Education"],
        bannerText: "Core subjects remain mandatory. Select subject pathways and electives to shape the senior pathway."
      }
    },
    electives: {
      y78: {
        english_pathway: {
          label: "English Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "English_Standard", value: "English Standard", label: "Standard" },
            { id: "English_Extension", value: "English Extension", label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard", value: "Mathematics Standard", label: "Standard" },
            { id: "Mathematics_Extension", value: "Mathematics Extension", label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Science_Standard", value: "Science Standard", label: "Standard" },
            { id: "Science_Extension", value: "Science Extension", label: "Extension" }
          ]
        },
        the_arts: {
          label: "The Arts", helpText: "Select at least 1 subject:", min: 1, max: 3,
          options: [
            { id: "Dance", value: "Dance", label: "Dance" },
            { id: "Drama", value: "Drama", label: "Drama" },
            { id: "Music", value: "Music", label: "Music" },
            { id: "Media_Arts", value: "Media Arts", label: "Media Arts" },
            { id: "Visual_Arts", value: "Visual Arts", label: "Visual Arts" }
          ]
        }
      },
      y9: {
        english_pathway: {
          label: "English Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "English_Standard", value: "English Standard", label: "Standard" },
            { id: "English_Extension", value: "English Extension", label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard", value: "Mathematics Standard", label: "Standard" },
            { id: "Mathematics_Extension", value: "Mathematics Extension", label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Science_Standard", value: "Science Standard", label: "Standard" },
            { id: "Science_Extension", value: "Science Extension", label: "Extension" }
          ]
        },
        the_arts: {
          label: "The Arts", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Dance", value: "Dance", label: "Dance" },
            { id: "Drama", value: "Drama", label: "Drama" },
            { id: "Music", value: "Music", label: "Music" },
            { id: "Media_Arts", value: "Media Arts", label: "Media Arts" },
            { id: "Visual_Arts", value: "Visual Arts", label: "Visual Arts" }
          ]
        },
        technologies: {
          label: "Technologies", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Design_and_Technologies", value: "Design and Technologies", label: "Design and Technologies" },
            { id: "Digital_Technologies", value: "Digital Technologies", label: "Digital Technologies" },
            { id: "Food_Technology", value: "Food Technology", label: "Food Technology" },
            { id: "Agricultural_Technology", value: "Agricultural Technology", label: "Agricultural Technology" }
          ]
        },
        hass: {
          label: "HASS Electives", helpText: "History is mandatory. You may also select 0–1 additional:", min: 1, max: 2,
          options: [
            { id: "History", value: "History", label: "History", locked: true },
            { id: "Geography", value: "Geography", label: "Geography" },
            { id: "Civics_and_Citizenship", value: "Civics and Citizenship", label: "Civics and Citizenship" },
            { id: "Economics_and_Business", value: "Economics and Business", label: "Economics and Business" }
          ]
        }
      },
      y10: {
        english_pathway: {
          label: "English Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "English_Standard", value: "English Standard", label: "Standard" },
            { id: "English_Extension", value: "English Extension", label: "Extension" }
          ]
        },
        mathematics_pathway: {
          label: "Mathematics Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Mathematics_Standard", value: "Mathematics Standard", label: "Standard" },
            { id: "Mathematics_Extension", value: "Mathematics Extension", label: "Extension" }
          ]
        },
        science_pathway: {
          label: "Science Pathway", helpText: "Select the pathway that best suits your child:", min: 1, max: 1,
          options: [
            { id: "Science_Standard", value: "Science Standard", label: "Standard" },
            { id: "Science_Extension", value: "Science Extension", label: "Extension" }
          ]
        },
        the_arts: {
          label: "The Arts", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Dance", value: "Dance", label: "Dance" },
            { id: "Drama", value: "Drama", label: "Drama" },
            { id: "Music", value: "Music", label: "Music" },
            { id: "Media_Arts", value: "Media Arts", label: "Media Arts" },
            { id: "Visual_Arts", value: "Visual Arts", label: "Visual Arts" }
          ]
        },
        technologies: {
          label: "Technologies", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "Design_and_Technologies", value: "Design and Technologies", label: "Design and Technologies" },
            { id: "Digital_Technologies", value: "Digital Technologies", label: "Digital Technologies" },
            { id: "Food_Technology", value: "Food Technology", label: "Food Technology" },
            { id: "Agricultural_Technology", value: "Agricultural Technology", label: "Agricultural Technology" }
          ]
        },
        hass: {
          label: "HASS Electives", helpText: "Select 0–2 subjects:", min: 0, max: 2,
          options: [
            { id: "History", value: "History", label: "History" },
            { id: "Geography", value: "Geography", label: "Geography" },
            { id: "Civics_and_Citizenship", value: "Civics and Citizenship", label: "Civics and Citizenship" },
            { id: "Economics_and_Business", value: "Economics and Business", label: "Economics and Business" }
          ]
        },
        hpe: {
          label: "Health and Physical Education", helpText: "Select 0–1 elective:", min: 0, max: 1,
          options: [
            { id: "Outdoor_Education", value: "Outdoor Education", label: "Outdoor Education" },
            { id: "Sport_and_Recreation", value: "Sport and Recreation", label: "Sport and Recreation" }
          ]
        }
      }
    }
  }
};

// ─── SMART DEFAULTS (pre-selected pathways per state) ────────
window.AED.SMART_DEFAULTS = {
  nsw_nesa: {
    y78: { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard"], message: "We've pre-selected Standard pathways for English, Mathematics, and Science. Adjust below if needed." },
    y9:  { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard", "Information_and_Software_Technology", "Visual_Arts"], message: "We've pre-selected Standard pathways and common elective choices. Adjust below if needed." },
    y10: { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard", "Information_and_Software_Technology", "Visual_Arts"], message: "We've pre-selected Standard pathways and common elective choices. Adjust below if needed." }
  },
  vic_vcaa: {
    y78: { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard"], message: "We've pre-selected Standard pathways for English, Mathematics, and Science. Adjust below if needed." },
    y9:  { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard", "Digital_Technologies", "Visual_Arts"], message: "We've pre-selected Standard pathways and common elective choices. Adjust below if needed." },
    y10: { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard", "Digital_Technologies", "Visual_Arts"], message: "We've pre-selected Standard pathways and common elective choices. Adjust below if needed." }
  },
  national_ac: {
    y78: { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard"], message: "We've pre-selected Standard pathways for English, Mathematics, and Science. Adjust below if needed." },
    y9:  { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard", "Digital_Technologies", "Visual_Arts"], message: "We've pre-selected Standard pathways and common elective choices. Adjust below if needed." },
    y10: { suggested: ["English_Standard", "Mathematics_Standard", "Science_Standard", "Digital_Technologies", "Visual_Arts"], message: "We've pre-selected Standard pathways and common elective choices. Adjust below if needed." }
  }
};

// ─── SHARED DOM HELPERS ──────────────────────────────────────
// Pure utility functions used across multiple modules.
// Defined here (Module 1) so all subsequent modules can use them.

window.AED.helpers = {
  qs:          function(sel, root) { return (root || document).querySelector(sel); },
  setText:     function(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; },
  showEl:      function(id, show) { var el = document.getElementById(id); if (el) el.style.display = show ? "" : "none"; },
  showRow:     function(labelId, priceId, show) { window.AED.helpers.showEl(labelId, show); window.AED.helpers.showEl(priceId, show); },
  getElByName: function(name) { return document.querySelector('[name="' + name + '"]'); },
  isChecked:   function(name) { var el = window.AED.helpers.getElByName(name); return !!(el && el.checked); },
  setTextAll:  function(selector, text) { document.querySelectorAll(selector).forEach(function(el) { el.textContent = text; }); },
  showAll:     function(selector, show) { document.querySelectorAll(selector).forEach(function(el) { el.style.display = show ? "" : "none"; }); },
  getSelectInt: function(name, fallback) {
    var el = window.AED.helpers.getElByName(name);
    if (!el) return fallback;
    var n = parseInt(String(el.value || "").trim(), 10);
    return Number.isFinite(n) ? n : fallback;
  },
  writeHidden: function(name, value) {
    var el = window.AED.helpers.getElByName(name);
    if (!el) return;
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  },
  toInt: function(val, fallback) {
    var n = parseInt(String(val || "").trim(), 10);
    return Number.isFinite(n) ? n : fallback;
  },
  safeParseJsonArray: function(raw) {
    try { var v = JSON.parse(raw); return Array.isArray(v) ? v : []; }
    catch (_) { return []; }
  },
  centsToDollars: function(cents) { return (Number(cents || 0) / 100); },
  aud: function(amountDollars) {
    try { return Number(amountDollars).toLocaleString("en-AU", { style: "currency", currency: "AUD" }); }
    catch (_) { return "$" + String(amountDollars); }
  }
};

// ─── BACKWARD-COMPATIBLE ALIASES ─────────────────────────────
// The rest of apply-ed.js currently reads these as bare variable names.
// These aliases let it continue working without changing every reference
// in the main file. We'll remove these as we extract further modules.
var CURRICULUM_CONFIG        = window.AED.CURRICULUM_CONFIG;
var SMART_DEFAULTS           = window.AED.SMART_DEFAULTS;
var FOUNDATION_LABEL_BY_STATE = window.AED.FOUNDATION_LABEL_BY_STATE;

console.log("✅ AED: aed-config.js loaded (Module 1)");