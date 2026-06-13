# MarkhamOffice.com — Marketing Website

Standalone public marketing site for **markhamoffice.com**, built with Next.js 14,
Tailwind CSS and lucide-react. It is intentionally separate from the business web
app (which lives at the repository root and deploys to `my.markhamoffice.com`).

## Local development

```bash
cd marketing-site
npm install
npm run dev
```

Open http://localhost:3000.

No environment variables are required — this is a fully static marketing site.

## Deploying on Vercel (separate project)

This site shares the GitHub repository with the web app but deploys as its **own**
Vercel project:

1. In Vercel, **Add New… → Project** and import this same repository.
2. Set **Root Directory** to `marketing-site`.
3. Framework preset: **Next.js** (auto-detected).
4. Deploy, then add the domain **markhamoffice.com** under the project's
   **Settings → Domains**.

The existing web-app Vercel project keeps Root Directory `.` and serves
`my.markhamoffice.com`. The two projects build independently from the one repo.

## Structure

```
marketing-site/
├─ app/
│  ├─ layout.tsx      Fonts (Inter + Poppins) + base metadata
│  ├─ page.tsx        Landing page composition + SEO metadata
│  └─ globals.css     Design tokens (blue brand palette + gold accent) & utilities
├─ components/marketing/   Hero, services, pricing, contact, footer, etc.
├─ lib/utils.ts       cn() class helper
└─ tailwind.config.ts Brand colors, display font, marketing animations
```

Links to the client portal point to `https://my.markhamoffice.com/login`.
