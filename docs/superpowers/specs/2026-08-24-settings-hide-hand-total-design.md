# Settings menu: hide hand total toggle

Date: 2026-08-24

## Problem

The trainer currently always displays the numeric total under the player's
cards (e.g. a 5+4 shows "9"). The user wants to practice computing hand
totals mentally before relying on the app, so they need a way to hide that
number while still using the trainer for strategy feedback.

## Goals

- Add a settings menu (gear icon in the header, next to "Chart").
- One toggle in it: "Show hand total". Off by default is NOT required —
  default is ON (current behavior unchanged unless the user opts in).
- When off, the player's hand total is hidden while a hand is in progress,
  and reveals automatically once the round resolves, so the user can check
  their mental math against the real number.
- The dealer's total display is unaffected — only "under my cards."
- The setting persists across reloads via `localStorage`.

## Non-goals

- No card-counting / running-count feature. This is strictly about hiding
  the basic hand-value sum (e.g. "9", "Soft 18").
- No other settings are being added now. The modal is structured so future
  toggles could be added later, but none are speced here.
- No change to the dealer's revealed total, feedback messages, or strategy
  chart behavior.

## Design

### State

- `showTotal: boolean`, initialized from `localStorage.getItem("21trainer.showTotal")`
  (default `true` if unset), stored via `useState` + `useEffect` that writes
  back to `localStorage` on change.
- `settingsOpen: boolean` — controls the settings modal visibility, mirrors
  the existing `chartOpen` pattern.

### UI

- Header gains a second button (gear icon or "⚙" label) next to the existing
  "Chart" button, opening `SettingsModal`.
- `SettingsModal` is a new component, visually consistent with
  `StrategyChart` (same overlay/panel styling, `✕` close button). Contains
  one row: a label ("Show hand total"), a short caption ("Practice counting
  your hand in your head"), and a toggle switch bound to `showTotal`.

### Hand total rendering

In the hands-rendering block (`App.jsx`, the `hands.map` loop that currently
renders `v.soft ? \`Soft ${v.total}\` : v.total`):

- If `showTotal` is `true`, or `stage === "result"`, render the total as
  today.
- Otherwise, render a placeholder (`"—"`) in place of the number/soft label.

This only touches the player hand total span; nothing else in that block
changes.

### Persistence

- Read once on mount from `localStorage`; write on every change via a
  `useEffect([showTotal])`. Key: `21trainer.showTotal`, stored as `"true"`/`"false"`.

## Testing

Manual verification in the browser (no existing test suite in this project):

1. Toggle off → deal a hand → total under player cards shows "—" while
   `stage === "player"`.
2. Stand/bust/finish the round → total reveals once `stage === "result"`.
3. Toggle on → total always visible, matching current behavior.
4. Reload the page → toggle state persists as last set.
5. Dealer's total display is unaffected in all cases.
