# Sports Squad Constraint Checker

A browser-based tool that validates a sports squad selection against a fixed set of business rules. Built as a take-home/interview exercise demonstrating clean separation of concerns, pure-function validation, and comprehensive unit testing.

---

## Technology Choices

| Concern | Choice | Reason |
| :--- | :--- | :--- |
| **Build / Dev Server** | [Vite](https://vitejs.dev/) | Zero-config, instant HMR, native ES modules |
| **Testing** | [Vitest](https://vitest.dev/) | Vite-native, Jest-compatible API, runs headlessly |
| **UI** | Vanilla HTML/CSS/JS | No framework overhead; logic is in a pure function |
| **Fonts** | Inter (Google Fonts) | Modern, highly legible, neutral |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
# → Open http://localhost:5173 in your browser

# 3. Run the unit test suite
npm test
```

---

## Project Structure

```
├── index.html              # App shell and layout
├── style.css               # Visual theme (blue-to-indigo, Inter)
├── src/
│   ├── data.js             # Fixed 9-player roster (single source of truth)
│   ├── validator.js        # Pure validateSquad(ids, roster) function
│   └── main.js             # DOM controller — reads state, calls validator, re-renders
└── tests/
    └── validator.test.js   # 13 unit tests covering all rules and edge cases
```

---

## Validation Rules

Rules are enforced in strict priority order. All violations that apply at each layer are collected and returned in this exact sequence:

| Priority | Rule | Error Code |
| :---: | :--- | :--- |
| 0 | Unknown or duplicate player ID | `INVALID_SELECTION_REFERENCE` |
| 1 | Squad must contain exactly 7 players | `SQUAD_SIZE_MUST_BE_7` |
| 2 | Exactly 1 Goalkeeper required | `GOALKEEPER_COUNT_MUST_BE_1` |
| 3 | Minimum 2 Defenders required (UTILITY does not count) | `MINIMUM_DEFENDERS_NOT_MET` |
| 4 | Minimum 2 Forwards required (UTILITY does not count) | `MINIMUM_FORWARDS_NOT_MET` |
| 5 | No UNAVAILABLE players (reported in roster order) | `PLAYER_UNAVAILABLE: [ID]` |
| 6 | Maximum 4 players per cohort (YEAR_2 checked first) | `COHORT_LIMIT_EXCEEDED: [COHORT]` |

> **Rule Precedence:** If `INVALID_SELECTION_REFERENCE` is triggered, all counts are zeroed and no further rules are evaluated.

---

## Unit Tests

```bash
npm test
```

**13 tests across 2 suites:**

- `Reference Validation` — duplicate IDs, unknown IDs
- `Basic Rules` — baseline valid squad, squad size, goalkeeper, defender, forward, unavailability, cohort limits, UTILITY isolation, and the two required acceptance-criteria scenarios

---

## Required Demo Scenarios

### Scenario 1 — Valid Squad (S01–S07)
Use the **Load Valid Sample** button.
- Expected result: **VALID**, all 6 rules show **PASS**

### Scenario 2 — Required Invalid (S01–S06 + S08)
Use the **Load Invalid Sample** button. S07 is replaced by S08.
- Expected result: **INVALID**, with exactly two violations in this order:
  1. `PLAYER_UNAVAILABLE: S08`
  2. `COHORT_LIMIT_EXCEEDED: YEAR_2 has 5, maximum 4`

### Scenario 3 — Manual Exploration
Check and uncheck players freely using the roster table. The summary counts, rule checklist, and validation result update live on each interaction.

---

## Architecture Notes

- **`validateSquad(selectedIds, roster)`** is a pure function with no side effects. It is imported by the UI but can be tested independently of the DOM.
- **`main.js`** uses a single declarative `updateUI()` render loop. The validator output is the only data source for every UI element — there is no duplicated logic.
- **Event delegation** is used on the roster table: a single `change` listener on `#roster-body` handles all checkbox interactions, preserving keyboard focus across updates.
