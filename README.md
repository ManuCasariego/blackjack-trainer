# 21 Trainer

A mobile-first web app for drilling blackjack basic strategy. It deals you real hands from a shuffled shoe, you decide Hit / Stand / Double / Split / Surrender, and it grades every decision against optimal basic strategy in real time — no ads, no bankroll, no fake chips, just reps.

Built with React, Vite, and Tailwind as a static site; runs entirely in the browser.

## How it works

- **Play** — tap Deal, get two cards against a dealer up-card, and choose your action. Wrong move? It tells you what basic strategy says and why.
- **Track progress** — accuracy %, current streak, best streak, and hands played, updated live.
- **Strategy chart** — an in-app overlay of the full hard/soft/pairs/surrender chart, with the cell for your current hand highlighted so you can check yourself before or after acting.
- **Settings** — toggle whether your hand total is shown (to practice counting it yourself), and choose a 4, 6, or 8-deck shoe.

Rules assumed throughout: dealer stands on soft 17, double after split allowed, no insurance/even money (basic strategy always says decline).

## The strategy

Every decision in the app is checked against the table below — hard totals, soft totals, pair splitting, and 16/15 surrender vs. a dealer 9/10/A. Columns are the dealer's up-card.

![21 Trainer basic strategy chart](docs/strategy-chart.svg)

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL — on your iPhone, connect to the same wifi and visit `http://<your-computer-ip>:5173` to test on the actual device.

## Deployment

Pushes to `main` deploy automatically to production via GitHub Actions (`.github/workflows/deploy.yml`).

## How good is the strategy?

[docs/simulation-results.html](docs/simulation-results.html) (open it
directly in a browser) has the results of simulating millions of hands
played with this app's exact strategy: win rate, expected value, whether
deck count matters (barely), and how much a 6:5 blackjack payout costs you
versus the standard 3:2 (a lot).

## Add to iPhone home screen (feels like a native app)

Open the deployed URL in Safari on your iPhone → Share → **Add to Home Screen**. It'll launch full-screen without Safari's UI, which is a solid free stand-in while you build the real SwiftUI version.
