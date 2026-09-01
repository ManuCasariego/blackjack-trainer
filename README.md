# 21 Trainer

Blackjack basic-strategy trainer. React + Vite + Tailwind, deployable as a static site.

## Run locally

```bash
npm install
npm run dev
```

Open the printed localhost URL — on your iPhone, connect to the same wifi and visit `http://<your-computer-ip>:5173` to test on the actual device.

## Deploy to Vercel

**Option A — CLI (fastest, no GitHub needed)**

```bash
npm install -g vercel
cd blackjack-trainer
vercel login
vercel --prod
```

Follow the prompts (link to a new project, accept defaults — Vercel auto-detects Vite). You'll get a `https://your-project.vercel.app` URL.

**Option B — GitHub + Vercel dashboard**

```bash
cd blackjack-trainer
git init
git add .
git commit -m "Initial commit"
gh repo create blackjack-trainer --public --source=. --push
```

Then at vercel.com → **Add New Project** → import the repo. Vercel detects the Vite framework automatically (build command `npm run build`, output dir `dist`). Deploy.

**Continuous deployment (already set up)**

`.github/workflows/deploy.yml` deploys to Vercel production automatically
on every push to `main`, using the Vercel CLI rather than Vercel's own
GitHub integration. One-time setup, if not already done:

1. Create a Vercel token: vercel.com → your avatar → **Settings** →
   **Tokens** → **Create Token**.
2. Add it as a GitHub Actions secret named `VERCEL_TOKEN` — either at
   github.com → this repo → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**, or from the terminal:
   ```bash
   gh secret set VERCEL_TOKEN
   ```
   (paste the token when prompted — it's never written to disk or shell
   history this way).

After that, any push to `main` triggers a production deploy; check
progress under the repo's **Actions** tab. `vercel --prod` from Option A
above still works too, for ad-hoc deploys outside of `main`.

## How good is the strategy?

[docs/simulation-results.html](docs/simulation-results.html) (open it
directly in a browser) has the results of simulating millions of hands
played with this app's exact strategy: win rate, expected value, whether
deck count matters (barely), and how much a 6:5 blackjack payout costs you
versus the standard 3:2 (a lot).

## Add to iPhone home screen (feels like a native app)

Once deployed, open the Vercel URL in Safari on your iPhone → Share → **Add to Home Screen**. It'll launch full-screen without Safari's UI, which is a solid free stand-in while you build the real SwiftUI version.
