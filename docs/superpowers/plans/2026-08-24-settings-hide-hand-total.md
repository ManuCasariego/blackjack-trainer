# Settings: Hide Hand Total Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a settings menu with a "Show hand total" toggle so the user can hide the numeric total under their cards (e.g. the "9" under a 5+4) to practice mental math, with the total reappearing once each round resolves.

**Architecture:** Everything lives in the existing single-file component structure of `src/App.jsx` — a new `SettingsModal` component (styled like the existing `StrategyChart` overlay) plus two pieces of state (`showTotal`, `settingsOpen`) on `BlackjackTrainer`, persisted to `localStorage`. No new files, no new dependencies, no test framework — this project has none (`package.json` has no test runner), so verification is manual via the dev server, matching the approved spec's Testing section.

**Tech Stack:** React 18 (hooks only, no external state libs), Tailwind CSS utility classes, Vite dev server, `localStorage` for persistence.

## Global Constraints

- Default value of `showTotal` is `true` (current behavior unchanged unless the user opts out) — from spec Goals.
- `localStorage` key is exactly `21trainer.showTotal`, stored as the string `"true"`/`"false"` — from spec Persistence.
- Only the player's per-hand total display is affected. The dealer's total (line ~534 in `src/App.jsx`, `handValue(dealer.cards).total`) must not change — from spec Goals/Non-goals.
- When `showTotal` is `false`, the total is hidden only while `stage !== "result"`; once `stage === "result"` it always shows the real total regardless of the toggle — from spec Design.
- No other settings, no card-counting/running-count feature — from spec Non-goals.
- `SettingsModal` visually matches `StrategyChart`'s overlay/panel styling (same `fixed inset-0 z-50 bg-black/70` backdrop, same panel gradient/rounding, same `✕` close button) — from spec Design.

---

### Task 1: Settings state, persistence, and SettingsModal UI

**Files:**
- Modify: `src/App.jsx:292-300` (add `showTotal`/`settingsOpen` state + persistence effect inside `BlackjackTrainer`)
- Modify: `src/App.jsx` (add new `SettingsModal` component, placed after `StrategyChart` and before the `// ---------- Main app ----------` comment, i.e. after line 287)
- Modify: `src/App.jsx:504-515` (add gear button to header)
- Modify: `src/App.jsx:617` (render `SettingsModal` alongside `StrategyChart`)

**Interfaces:**
- Produces: `showTotal` (boolean state, default `true`), `setShowTotal` (setter), `settingsOpen` (boolean state, default `false`), `setSettingsOpen` (setter) — all in scope of `BlackjackTrainer`, consumed by Task 2.
- Produces: `SettingsModal({ onClose, showTotal, onToggleShowTotal })` component — `onClose: () => void`, `showTotal: boolean`, `onToggleShowTotal: (next: boolean) => void`.

- [ ] **Step 1: Add `showTotal`/`settingsOpen` state and persistence effect**

In `src/App.jsx`, the top of the `import` list already includes `useEffect` (line 1: `import React, { useState, useRef, useEffect, useCallback } from "react";`) so no import changes are needed. Find this block (`src/App.jsx:292-300`):

```jsx
export default function BlackjackTrainer() {
  const shoeRef = useRef(buildShoe(6));
  const [dealer, setDealer] = useState({ cards: [], hideHole: true });
  const [hands, setHands] = useState([]); // {cards, done, isDoubled, result, bust, splitAces}
  const [activeHand, setActiveHand] = useState(0);
  const [stage, setStage] = useState("idle"); // idle | player | dealer | result
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, best: 0, wins: 0, losses: 0, pushes: 0 });
  const [feedback, setFeedback] = useState(null);
  const [chartOpen, setChartOpen] = useState(false);
```

Replace it with:

```jsx
export default function BlackjackTrainer() {
  const shoeRef = useRef(buildShoe(6));
  const [dealer, setDealer] = useState({ cards: [], hideHole: true });
  const [hands, setHands] = useState([]); // {cards, done, isDoubled, result, bust, splitAces}
  const [activeHand, setActiveHand] = useState(0);
  const [stage, setStage] = useState("idle"); // idle | player | dealer | result
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, best: 0, wins: 0, losses: 0, pushes: 0 });
  const [feedback, setFeedback] = useState(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTotal, setShowTotal] = useState(() => {
    const stored = localStorage.getItem("21trainer.showTotal");
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("21trainer.showTotal", String(showTotal));
  }, [showTotal]);
```

- [ ] **Step 2: Add the `SettingsModal` component**

Find the end of the `StrategyChart` component and the start of the main-app comment (`src/App.jsx:286-290`):

```jsx
      </div>
    </div>
  );
}

// ---------- Main app ----------
let handCounter = 0;
```

Replace it with (inserting `SettingsModal` between them):

```jsx
      </div>
    </div>
  );
}

// ---------- Settings overlay ----------
function SettingsModal({ onClose, showTotal, onToggleShowTotal }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div
        className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[88vh] overflow-y-auto p-4 pb-8"
        style={{ background: "linear-gradient(180deg,#0a3f2d,#062318)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-yellow-400 font-serif text-xl">Settings</div>
          <button
            onClick={onClose}
            className="text-emerald-100 bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-white/10">
          <div>
            <div className="text-sm font-semibold text-emerald-100">Show hand total</div>
            <div className="text-xs text-emerald-200/60 mt-0.5">
              Practice counting your hand in your head
            </div>
          </div>
          <button
            role="switch"
            aria-checked={showTotal}
            onClick={() => onToggleShowTotal(!showTotal)}
            className={`w-12 h-7 rounded-full relative transition-colors ${
              showTotal ? "bg-emerald-500" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                showTotal ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main app ----------
let handCounter = 0;
```

- [ ] **Step 3: Add the gear button to the header**

Find the header block (`src/App.jsx:504-515`):

```jsx
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <div>
          <div className="font-serif text-2xl text-yellow-400 leading-none">21 Trainer</div>
          <div className="text-emerald-200/60 text-[11px] mt-0.5">basic strategy, no ads, no ledger</div>
        </div>
        <button
          onClick={() => setChartOpen(true)}
          className="border border-yellow-500/50 text-yellow-300 text-xs font-semibold px-3 py-2 rounded-full bg-white/5 active:bg-white/15"
        >
          Chart
        </button>
      </div>
```

Replace it with:

```jsx
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <div>
          <div className="font-serif text-2xl text-yellow-400 leading-none">21 Trainer</div>
          <div className="text-emerald-200/60 text-[11px] mt-0.5">basic strategy, no ads, no ledger</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartOpen(true)}
            className="border border-yellow-500/50 text-yellow-300 text-xs font-semibold px-3 py-2 rounded-full bg-white/5 active:bg-white/15"
          >
            Chart
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="border border-yellow-500/50 text-yellow-300 text-xs font-semibold px-3 py-2 rounded-full bg-white/5 active:bg-white/15"
          >
            ⚙
          </button>
        </div>
      </div>
```

- [ ] **Step 4: Render `SettingsModal`**

Find (`src/App.jsx:617`):

```jsx
      {chartOpen && <StrategyChart onClose={() => setChartOpen(false)} activeHint={buildHint()} />}
    </div>
  );
}
```

Replace it with:

```jsx
      {chartOpen && <StrategyChart onClose={() => setChartOpen(false)} activeHint={buildHint()} />}
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          showTotal={showTotal}
          onToggleShowTotal={setShowTotal}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Start the dev server and verify manually**

Run: `npm run dev` (or use the `mcp__Claude_Browser__preview_start` tool with name pointing at this dev server, per `.claude/launch.json` if configured — otherwise start it directly and open the printed localhost URL in the Browser pane).

In the browser:
1. Confirm a "⚙" button appears next to "Chart" in the header.
2. Click it — confirm the Settings modal opens, styled like the Chart overlay, showing "Show hand total" with a toggle in the "on" (emerald, right-aligned) position.
3. Click the toggle — confirm it visually switches to "off" (gray, left-aligned).
4. Open browser devtools / run `localStorage.getItem("21trainer.showTotal")` via the JS tool — confirm it returns `"false"`.
5. Reload the page, reopen Settings — confirm the toggle is still "off".
6. Toggle back "on", confirm `localStorage` reads `"true"`.
7. Close the modal via "✕" — confirm it closes.

Expected: all 7 checks pass. No total-hiding behavior yet (that's Task 2) — this step only verifies the settings UI and persistence.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add settings menu with persisted show-hand-total toggle"
```

---

### Task 2: Hide the player's hand total based on the setting

**Files:**
- Modify: `src/App.jsx:557-563` (hand total rendering inside the `hands.map` block)

**Interfaces:**
- Consumes: `showTotal` (boolean) and `stage` (string, one of `"idle" | "player" | "dealer" | "result"`) from `BlackjackTrainer` state (both already in scope at this render location — `showTotal` added in Task 1, `stage` pre-existing).

- [ ] **Step 1: Update the hand total span**

Find (`src/App.jsx:557-563`):

```jsx
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-yellow-200">
                      {v.soft ? `Soft ${v.total}` : v.total}
                    </span>
                    {h.isDoubled && <span className="text-emerald-300">2x</span>}
                    {h.result && <ResultBadge result={h.result} />}
                  </div>
```

Replace it with:

```jsx
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-yellow-200">
                      {showTotal || stage === "result"
                        ? v.soft
                          ? `Soft ${v.total}`
                          : v.total
                        : "—"}
                    </span>
                    {h.isDoubled && <span className="text-emerald-300">2x</span>}
                    {h.result && <ResultBadge result={h.result} />}
                  </div>
```

- [ ] **Step 2: Verify manually in the browser**

With the dev server still running (from Task 1, Step 5):

1. Open Settings, toggle "Show hand total" off, close the modal.
2. Click "Deal" — confirm the player's hand shows "—" instead of a number while `stage === "player"`.
3. Act on the hand until the round ends (Hit to bust, or Stand through to dealer resolution) — confirm the total reveals the real number (e.g. "9" or "Soft 18") once the round result is shown.
4. Click "Next Hand" to deal again — confirm it hides again ("—") during play.
5. Open Settings, toggle "Show hand total" back on, close the modal — confirm the total is visible immediately during play on the next hand, with no "—" at any point.
6. Confirm the dealer's total display (next to the dealer's cards, once revealed) is unaffected by the toggle in both states.

Expected: all 6 checks pass.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: hide player hand total during play when setting is off"
```
