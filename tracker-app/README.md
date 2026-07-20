# Digital Transformation Team Allocation Tracker

## 🌐 Live App
Deployed on Render: **see your Render dashboard for the URL**

## 🚀 Deploy to Render (one-time setup — ~5 minutes)

### Step 1 — Push to GitHub

1. Go to **https://github.com/new** → create a new repository (e.g. `dt-allocation-tracker`)
2. Open a terminal (cmd or PowerShell) and run:

```cmd
cd "C:\Users\VishalragavanMohanas\OneDrive - IBM\Desktop\bob-demo\Digital Transformation Team Allocation Tracker"

git init
git add tracker-app/ render.yaml
git commit -m "Initial commit: Digital Transformation Allocation Tracker"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/dt-allocation-tracker.git
git push -u origin main
```
*(Replace `YOUR-USERNAME` with your GitHub username)*

### Step 2 — Deploy on Render

1. Go to **https://render.com** → Sign up free (use GitHub login)
2. Click **New → Web Service**
3. Connect your GitHub repo `dt-allocation-tracker`
4. Render will auto-detect `render.yaml` — click **Create Web Service**
5. Wait ~3 minutes for the build to complete
6. Your live URL will appear: `https://dt-allocation-tracker.onrender.com`

**That's it!** Share the URL with your team. Everyone can edit simultaneously.

## ⚠️ Important Notes

### Data persistence on Render Free tier
Render free tier uses **ephemeral storage** — the SQLite database resets when the service restarts (every ~15 minutes of inactivity). The app auto-seeds all Excel data on every startup, so your base data is always there. For **permanent persistence**, either:
- Upgrade to Render Starter ($7/mo) and add a Persistent Disk
- Or migrate to a free PostgreSQL database on Render (ask Bob to help!)

### Multi-user sync
All team members on the live URL are editing the **same database**. Data refreshes every 10 seconds automatically.

## 🛠 Local Development

```cmd
cd tracker-app
npm install
npm install --prefix client
npm install --prefix server
npm run dev
```
Then open http://localhost:5173

## Features
- ✅ Inline-editable allocation table (click any cell)
- ✅ Add / Delete rows
- ✅ Monthly allocation % → hours auto-calculated
- ✅ Capacity alerts (🔴 >160h / 🟡 140-160h / 🟢 OK)
- ✅ Dashboard with bar charts + pivot table
- ✅ Access tracker per team member
- ✅ Add new team members from UI
- ✅ CSV export
- ✅ Auto-syncs every 10 seconds (multi-user)
