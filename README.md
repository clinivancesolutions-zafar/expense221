# Zafar's Construction Expense

An offline-first construction site expense tracker — log material and labour costs, set overall and per-category budgets, track vendors, export reports, and back up your data. Built with React, Vite, Tailwind CSS, Recharts, and lucide-react icons.

## Features

- Dashboard with a budget "measuring tape" progress bar, spend stats, category breakdown, and monthly trend
- Add / edit / delete expenses with quantity, unit price, payment mode, vendor, notes, and an optional bill photo
- Custom categories with color tags
- Overall and per-category budgets with overspending alerts
- Reports by day / week / month / category / vendor, exportable to Excel (.xlsx) or PDF (print)
- Analytics: category breakdown, monthly trend, top items, biggest vendors
- Built-in offline rule-based assistant that answers questions about your own spending data
- JSON export/import for backups, plus an optional Supabase cloud backup
- Light and dark mode
- All data is stored locally in your browser (`localStorage`) — nothing leaves your device unless you set up the optional Supabase backup

## Getting started

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
npm run preview
```

The production build is output to `dist/`, which you can deploy to any static host (Netlify, Vercel, GitHub Pages, etc.).

## Data storage

All expenses, budgets, categories, settings, and bill photos are stored in your browser's `localStorage`, scoped to whichever domain/port you run the app on. This means:

- Your data persists between visits on the same browser/device
- Clearing browser data or switching browsers will lose access to it — use **Settings → Export JSON backup** regularly
- Bill photos are stored as compressed images inside `localStorage`; browsers typically cap this storage around 5–10MB, so very large photo libraries may eventually hit that limit

## Optional cloud backup (Supabase)

If you want an extra copy of your expenses in the cloud, create a free [Supabase](https://supabase.com) project with a table matching your expense fields, then enter your Project URL, anon key, and table name under **Settings → Optional Supabase cloud backup**. This step is entirely optional — the app works fully offline without it.

## Project structure

```
zafars-construction-expense/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx      # React entry point
    ├── App.jsx        # The entire application
    └── index.css      # Tailwind directives
```
