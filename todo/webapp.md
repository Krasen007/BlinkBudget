{{APP_NAME}} — Web App Genesis Prompt
1. Project Overview
Build a web app called "{{APP_NAME}}" — {{APP_ONE_LINE_DESCRIPTION}}.
{{APP_DETAILED_DESCRIPTION}}

2. Technical Requirements

Rendering: {{RENDERING_STRATEGY}}
<!-- e.g., "SPA (Vite + React)", "SSR (Next.js App Router)", "SSG (Astro)", "Full-stack (Next.js + API Routes)" -->

Framework: {{FRAMEWORK}}
<!-- Recommended: Next.js 15 (App Router) for most apps; Vite + React for pure SPAs -->

Language: TypeScript (strict mode — no any)
Styling: Tailwind CSS v4 + CSS custom properties for theming
Component Library: {{COMPONENT_LIBRARY}}
<!-- e.g., shadcn/ui (recommended), Radix UI primitives, Headless UI, or "None — custom only" -->

State Management: {{STATE_STRATEGY}}
<!-- e.g., "Zustand for global state, TanStack Query for server state" / "React Context + useReducer (simple apps)" -->

Data Fetching: TanStack Query v5 (recommended) or Next.js fetch with caching
Forms: React Hook Form + Zod validation
Package Manager: pnpm (recommended for solo devs — fast, disk-efficient)
Node version: 22 LTS (pin via .nvmrc or package.json#engines)
Mobile-first: All layouts designed for 375px wide, scaling up

Rendering Strategy Decision Guide
Need SEO + dynamic data?      → Next.js App Router (SSR/ISR)
Content-heavy / blog / docs?  → Astro (SSG) or Next.js (SSG)
Auth-heavy dashboard / SaaS?  → Next.js App Router + Server Components
Pure client app, no SEO need? → Vite + React (SPA)
Full-stack with DB?           → Next.js + API Routes or tRPC
Real-time features?           → Next.js + WebSockets / Supabase Realtime
Backend / API (if applicable)
{{BACKEND_STRATEGY}}
Options:

"No backend — client-side only"
"Next.js API Routes / Route Handlers"
"tRPC for type-safe full-stack"
"Supabase (Postgres + Auth + Storage + Realtime)"
"PlanetScale / Neon (serverless Postgres) + Drizzle ORM"
"Firebase (Firestore + Auth + Storage)"
"External REST/GraphQL API via TanStack Query"

Additional Libraries (app-specific)
{{ADDITIONAL_LIBRARIES}}
Examples:

Framer Motion for complex animations
Recharts / Tremor for data visualization
Tiptap for rich text editing
React PDF for PDF generation/viewing
Stripe.js for payment processing
Uploadthing / Cloudinary for file uploads
next-auth / Clerk / Lucia for authentication
Resend / Postmark for transactional email
OpenAI / Anthropic SDK for AI features
Mapbox GL / Leaflet for maps
date-fns / Day.js for date handling
nuqs for URL state management


3. Project Structure
Next.js App Router (recommended)
{{APP_NAME}}/
├── app/
│   ├── layout.tsx                  ← Root layout (fonts, providers, metadata)
│   ├── page.tsx                    ← Home route
│   ├── globals.css                 ← Tailwind base + CSS custom properties
│   ├── (marketing)/                ← Route group — no shared layout with app
│   │   ├── page.tsx                ← Landing page
│   │   └── pricing/page.tsx
│   ├── (app)/                      ← Route group — authenticated app shell
│   │   ├── layout.tsx              ← App shell (sidebar, nav)
│   │   ├── dashboard/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                        ← Route Handlers
│   │   └── {{ROUTE_HANDLERS}}
│   └── {{ADDITIONAL_ROUTES}}
├── components/
│   ├── ui/                         ← shadcn/ui primitives (auto-generated)
│   ├── layout/                     ← Header, Footer, Sidebar, MobileNav
│   ├── {{FEATURE}}/                ← Feature-scoped components
│   └── shared/                     ← App-wide shared components
├── lib/
│   ├── utils.ts                    ← cn() helper + general utilities
│   ├── validations.ts              ← Zod schemas
│   └── {{ADDITIONAL_LIB_FILES}}
├── hooks/
│   └── {{CUSTOM_HOOKS}}            ← useMediaQuery, useDebounce, etc.
├── stores/
│   └── {{ZUSTAND_STORES}}          ← Global client state
├── types/
│   └── index.ts                    ← Shared TypeScript types & interfaces
├── server/                         ← Server-only code (never imported client-side)
│   ├── db/                         ← Drizzle / Prisma schema + client
│   └── {{SERVER_MODULES}}
├── public/
│   ├── icons/                      ← SVG icons, favicon variants
│   └── images/
├── .env.local                      ← Local secrets (gitignored)
├── .env.example                    ← Committed template with dummy values
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                 ← shadcn/ui config
└── package.json
Vite + React SPA (alternative)
{{APP_NAME}}/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/                     ← TanStack Router or React Router v7
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── lib/
│   └── types/
├── public/
├── index.html
├── vite.config.ts
└── package.json

4. Design System
Design Tokens (CSS Custom Properties)
Define all tokens in globals.css. Tailwind v4 reads these natively:
css/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-background:   {{BACKGROUND_COLOR}};
  --color-surface:      {{SURFACE_COLOR}};
  --color-primary:      {{PRIMARY_COLOR}};
  --color-primary-hover:{{PRIMARY_HOVER_COLOR}};
  --color-secondary:    {{SECONDARY_COLOR}};
  --color-accent:       {{ACCENT_COLOR}};
  --color-text:         {{TEXT_PRIMARY}};
  --color-text-muted:   {{TEXT_MUTED}};
  --color-border:       {{BORDER_COLOR}};
  --color-destructive:  {{DESTRUCTIVE_COLOR}};

  /* Typography */
  --font-sans:    {{SANS_FONT}}, ui-sans-serif, system-ui, sans-serif;
  --font-serif:   {{SERIF_FONT}}, ui-serif, Georgia, serif;
  --font-mono:    {{MONO_FONT}}, ui-monospace, monospace;

  /* Spacing scale overrides (if needed) */
  --spacing-page-x:   {{HORIZONTAL_PADDING}}px;

  /* Radius */
  --radius-sm:  {{RADIUS_SM}};
  --radius-md:  {{RADIUS_MD}};
  --radius-lg:  {{RADIUS_LG}};
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card: {{CARD_SHADOW}};

  /* Transitions */
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   400ms;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background:  {{DARK_BACKGROUND}};
    --color-surface:     {{DARK_SURFACE}};
    --color-text:        {{DARK_TEXT}};
    /* ... override all tokens for dark */
  }
}

/* Manual dark mode toggle (add .dark class to <html>) */
.dark {
  --color-background:  {{DARK_BACKGROUND}};
  /* ... */
}
Typography Scale
css/* Base size: 16px. Scale: 1.25 (Major Third) */
/* Use rem throughout — respects user browser font preferences */

--text-xs:   0.75rem;   /* 12px — labels, captions */
--text-sm:   0.875rem;  /* 14px — secondary body, UI labels */
--text-base: 1rem;      /* 16px — primary body */
--text-lg:   1.125rem;  /* 18px — large body, card text */
--text-xl:   1.25rem;   /* 20px — subheadings */
--text-2xl:  1.5rem;    /* 24px — section titles */
--text-3xl:  1.875rem;  /* 30px — page titles (mobile) */
--text-4xl:  2.25rem;   /* 36px — hero headings (tablet+) */
--text-5xl:  3rem;      /* 48px — hero headings (desktop) */
```

### Breakpoints (Mobile-First)
```
xs:  375px   ← Minimum supported (small phones)
sm:  640px   ← Large phones / small tablets
md:  768px   ← Tablets portrait
lg:  1024px  ← Tablets landscape / small laptops
xl:  1280px  ← Desktops
2xl: 1536px  ← Large desktops
Every component starts with the mobile layout. Breakpoint prefixes
(sm:, md:, lg:) layer on larger styles. Never write desktop-first CSS.
Spacing & Touch Targets

Page horizontal padding: px-4 (16px) → sm:px-6 (24px) → lg:px-8 (32px)
Minimum touch target: 44×44px on all interactive elements
Use min-h-11 (44px) on buttons, links, form controls
Card padding: p-4 → sm:p-6
Section vertical spacing: py-12 → md:py-20 → lg:py-28

Component Patterns
tsx// Consistent card pattern
<div className="rounded-lg border border-border bg-surface p-4 sm:p-6 shadow-card">

// Consistent button sizing (always meets 44px touch target)
<button className="min-h-11 px-4 py-2 ...">

// Consistent page wrapper
<main className="mx-auto w-full max-w-{{MAX_WIDTH}} px-4 sm:px-6 lg:px-8">
// Common max-widths: max-w-sm (384), max-w-2xl (672), max-w-4xl (896),
//                   max-w-6xl (1152), max-w-7xl (1280)
Animations
ts// Consistent motion tokens — use with Tailwind or Framer Motion
transition-duration: var(--duration-fast)    // hover states
transition-duration: var(--duration-normal)  // modals, drawers
transition-duration: var(--duration-slow)    // page transitions

Page transitions: fade + subtle translate-y (8px → 0)
Interactive elements: hover:scale-[0.98] active:scale-[0.96]
Loading: skeleton shimmer with animate-pulse
Modals/drawers: slide-up on mobile, fade+scale on desktop
{{ANIMATION_PHILOSOPHY}}
e.g., "Respect prefers-reduced-motion on all animations" /
"Framer Motion for all transitions — spring physics"

css/* Always respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Favicon & PWA Icons
```
public/
├── favicon.ico              ← 32×32 legacy fallback
├── favicon.svg              ← Modern scalable (preferred by browsers)
├── apple-touch-icon.png     ← 180×180 for iOS home screen
├── icon-192.png             ← PWA manifest
└── icon-512.png             ← PWA manifest splash
{{APP_ICON_DESCRIPTION}}

5. Data Models
{{DATA_MODELS}}
Define all TypeScript interfaces, types, and Zod schemas:
typescript// types/index.ts — shared domain types
export interface {{ModelName}} {
  id: string
  createdAt: Date
  updatedAt: Date
  // ...
}

// lib/validations.ts — Zod schemas (source of truth for forms + API)
export const {{modelName}}Schema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  // ...
})
export type {{ModelName}}Input = z.infer<typeof {{modelName}}Schema>

// server/db/schema.ts — Drizzle ORM schema (if using a DB)
export const {{tableName}} = pgTable("{{table_name}}", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // ...
})
```

---

## 6. Screen / Page Specifications

{{PAGE_SPECIFICATIONS}}

*For each page/screen, specify:*
```
Route: /{{path}}
Component: app/{{path}}/page.tsx (Next.js) | src/routes/{{path}}.tsx (Vite)

Mobile layout (375px):
┌─────────────────┐
│ Header / Nav    │
├─────────────────┤
│                 │
│  Content        │
│                 │
└─────────────────┘

Desktop layout (1280px):
┌──────┬──────────────────────┐
│      │                      │
│ Side │   Main Content       │
│ bar  │                      │
│      │                      │
└──────┴──────────────────────┘

Components:
- <ComponentA /> — description
- <ComponentB /> — description

State variations:
- Loading: skeleton placeholders
- Empty: empty state with CTA
- Error: error boundary with retry
- Free vs. premium: locked state
- Authenticated vs. guest

7. Monetization Configuration
Strategy
{{MONETIZATION_STRATEGY}}
Choose one or more:

Stripe one-time purchase (lifetime access)
Stripe subscriptions (monthly / annual)
Stripe usage-based billing
Lemon Squeezy (simpler tax handling — recommended for solo devs)
Paddle (built-in global tax compliance)
"Free — no monetization"

Recommended: Lemon Squeezy or Stripe
Why Lemon Squeezy for solo devs: Acts as Merchant of Record — handles VAT/GST globally, no need to register for tax in each country. Simpler than Stripe for digital products.
Why Stripe: More control, better docs, industry standard. Use stripe-js + Stripe Checkout for fastest implementation.
Product IDs
typescript// lib/products.ts
export const PRODUCTS = {
  {{PRODUCT_IDS}}
  // Examples:
  // LIFETIME:          { id: "{{VARIANT_ID}}", price: "$49", label: "Lifetime" },
  // PRO_MONTHLY:       { id: "{{VARIANT_ID}}", price: "$9/mo", label: "Pro Monthly" },
  // PRO_ANNUAL:        { id: "{{VARIANT_ID}}", price: "$79/yr", label: "Pro Annual" },
} as const
Implementation Pattern
typescript// Stripe Checkout (server-side route handler)
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",              // or "payment" for one-time
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/pricing`,
    metadata: { userId },
  })
  return Response.json({ url: session.url })
}

// Webhook handler — ALWAYS verify Stripe signature
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!
  const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  // Handle: checkout.session.completed, customer.subscription.deleted, etc.
}
Premium State Management
typescript// Persist entitlement in DB, expose via server component or API
// Never trust client-side isPremium for gating real features

// middleware.ts — protect premium routes at the edge
export function middleware(request: NextRequest) {
  const isPremium = // check session / JWT
  if (!isPremium && request.nextUrl.pathname.startsWith("/app/premium")) {
    return NextResponse.redirect(new URL("/pricing", request.url))
  }
}
```

### Paywall / Pricing Page Design

{{PAYWALL_DESCRIPTION}}

*`/pricing` page layout:*
- *Sticky feature comparison above the fold on mobile*
- *Plan cards: Free | Pro | (Enterprise if applicable)*
- *Annual toggle with savings callout (e.g., "Save 30%")*
- *Primary CTA: large, full-width on mobile*
- *Social proof: testimonial or user count below plans*
- *FAQ accordion (reduces support load)*
- *Links to Privacy Policy + Terms of Service*

---

## 8. Authentication (if applicable)

{{AUTH_STRATEGY}}

*Choose one:*
```
Clerk        — Fastest for solo devs. Pre-built UI, social logins,
               organizations, webhooks. Generous free tier.
               clerk.com

NextAuth v5  — Open-source, self-hosted. More control, more setup.
(Auth.js)      Supports 50+ OAuth providers + credentials.
               authjs.dev

Supabase Auth — If already using Supabase. Integrated with RLS policies.

Lucia v3     — Lightweight, framework-agnostic. Full control, most setup.
Protected Route Pattern
typescript// middleware.ts (Next.js + Clerk example)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher(["/app(.*)", "/api/protected(.*)"])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})
```

---

## 9. App-Specific Core Features

{{CORE_FEATURES}}

*Examples:*
- *AI chat interface with streaming responses (Vercel AI SDK)*
- *Rich text editor (Tiptap with custom extensions)*
- *Real-time collaboration (Liveblocks / PartyKit / Supabase Realtime)*
- *Data dashboard with charts (Recharts / Tremor / Observable Plot)*
- *File upload and processing (Uploadthing + background jobs)*
- *Email sending (Resend + React Email templates)*
- *PDF generation (React PDF / Puppeteer)*
- *Offline-capable PWA (next-pwa / Workbox)*
- *Drag-and-drop interfaces (dnd-kit)*
- *Full-text search (Algolia / Typesense / Postgres full-text)*

---

## 10. Content / Data Specification

{{CONTENT_SPECIFICATION}}

*Define:*
- *Static content (MDX files, JSON data files in `public/` or `content/`)*
- *Database-driven content (schema + seed data)*
- *External API content (endpoints, rate limits, caching strategy)*
- *Content format (fields per item, media requirements)*
- *i18n requirements (if multiple languages): use `next-intl` or `react-i18next`*

---

## 11. Navigation Structure

### Mobile Navigation
```
Mobile (< 768px):
- Fixed bottom tab bar (max 5 items) — thumb-friendly, Material-style
  OR
- Hamburger → full-screen slide-over drawer
- Back navigation via browser history (no custom back buttons)

Thumb Zone Rule:
- Primary actions: bottom 40% of screen
- Secondary actions: middle
- Destructive / rarely-used: top
```

### Desktop Navigation
```
Desktop (≥ 1024px):
- Top navbar (marketing pages)
  OR
- Left sidebar (app/dashboard pages, collapsible)
- Breadcrumbs for deep navigation
Navigation Component
tsx// components/layout/MobileNav.tsx
// Renders bottom tab bar on mobile, hidden on md+

// components/layout/Sidebar.tsx
// Hidden on mobile (drawer on toggle), visible on lg+

// Consistent nav link pattern with active state:
<Link
  href="/dashboard"
  className={cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-text-muted hover:bg-surface hover:text-text"
  )}
>
```

---

## 12. Settings Page

### Structure
```
/settings (or /app/settings)

Sections (rendered as vertical list on mobile, sidebar tabs on desktop):
{{SETTINGS_SECTIONS}}
Common sections:

Profile — display name, avatar upload, email
Preferences — theme (light/dark/system), language, notifications
Billing — current plan, usage meter, upgrade/downgrade CTA, invoice history
Account — change password, connected accounts, export data, danger zone (delete account)
About — app version, changelog link, feedback link

Billing Section
tsx// Show current plan status
// Link to Stripe/Lemon Squeezy customer portal for self-service:
const portal = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${origin}/settings/billing`,
})
redirect(portal.url)
```

### Cross-Promotion Banner (Settings footer)
```
┌─────────────────────────────────────────────────┐
│ [Icon]  {{PROMO_TEXT}}                          │
│                                           →     │
└─────────────────────────────────────────────────┘

Full-width card, tappable
Opens in new tab: target="_blank" rel="noopener noreferrer"
Subtle styling — does not dominate the settings page
Promo URL: {{PROMO_APP_URL}}


13. Persistence Strategy
Client-Side State
typescript// Zustand store with persistence middleware
import { create } from "zustand"
import { persist } from "zustand/middleware"

export const use{{Feature}}Store = create<{{Feature}}State>()(
  persist(
    (set) => ({
      // state + actions
    }),
    { name: "{{feature}}-storage" }     // persists to localStorage
  )
)
Server-Side / Database
typescript// Drizzle ORM (recommended — lightweight, type-safe, no magic)
// OR Prisma (more features, heavier, better for teams)

// Repository pattern — keep DB logic out of route handlers
// server/db/queries/{{entity}}.ts
export async function get{{Entity}}ById(id: string) {
  return db.select().from({{table}}).where(eq({{table}}.id, id)).limit(1)
}
Caching Strategy
typescript// Next.js fetch caching
fetch(url, { next: { revalidate: 3600 } })    // ISR — revalidate hourly
fetch(url, { cache: "no-store" })              // Always fresh (SSR)
fetch(url)                                     // Cached indefinitely (SSG)

// TanStack Query client-side caching
const { data } = useQuery({
  queryKey: ["{{entity}}", id],
  queryFn: () => fetch{{Entity}}(id),
  staleTime: 1000 * 60 * 5,                   // Fresh for 5 minutes
})
URL State
typescript// nuqs — type-safe URL search params (great for filters, pagination, tabs)
import { useQueryState } from "nuqs"

const [tab, setTab] = useQueryState("tab", { defaultValue: "overview" })
const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))

14. Offline & PWA Behavior (if applicable)
{{PWA_STRATEGY}}
If building a PWA:
json// public/manifest.json
{
  "name": "{{APP_NAME}}",
  "short_name": "{{SHORT_NAME}}",
  "description": "{{APP_ONE_LINE_DESCRIPTION}}",
  "start_url": "/",
  "display": "standalone",
  "background_color": "{{BACKGROUND_COLOR}}",
  "theme_color": "{{PRIMARY_COLOR}}",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
Works Offline
{{OFFLINE_AVAILABLE}}
Requires Connection
{{ONLINE_REQUIRED}}
Offline Indicator
tsx// hooks/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine)
    window.addEventListener("online",  handler)
    window.addEventListener("offline", handler)
    return () => { /* cleanup */ }
  }, [])
  return isOnline
}

// Render a subtle top banner when offline

15. Performance Targets
These are the baselines for a quality web app. Profile with Lighthouse and Web Vitals.
MetricTargetToolLCP (Largest Contentful Paint)< 2.5sLighthouse / CrUXFID / INP (Interaction to Next Paint)< 200msWeb VitalsCLS (Cumulative Layout Shift)< 0.1LighthouseFCP (First Contentful Paint)< 1.8sLighthouseTTI (Time to Interactive)< 3.5sLighthouseBundle size (initial JS)< 200KB gzipped@next/bundle-analyzerMobile Lighthouse score≥ 90Lighthouse
Performance Best Practices
tsx// Images — always use next/image (lazy load, WebP, responsive sizes)
import Image from "next/image"
<Image src="..." alt="..." width={800} height={600} priority={isAboveFold} />

// Code splitting — lazy load heavy components
const HeavyChart = dynamic(() => import("./HeavyChart"), { ssr: false })

// Fonts — self-host with next/font (eliminates layout shift)
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin"], display: "swap" })

// Bundle analysis
// Add to package.json: "analyze": "ANALYZE=true next build"

16. Accessibility (a11y)
Accessibility is not optional — it also directly improves SEO.
tsx// Semantic HTML first
<main>, <nav>, <header>, <footer>, <section aria-label="...">, <article>

// All images have meaningful alt text (or alt="" if decorative)
<Image alt="User profile photo of {{name}}" ... />

// All interactive elements are keyboard focusable
// Never use div/span as buttons — always <button> or <a>
// Custom components must have role + aria attributes:
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">

// Focus management — trap focus in modals, return focus on close
// Visible focus ring — never outline: none without a replacement

// Color contrast — minimum 4.5:1 for normal text, 3:1 for large text
// Test with: Chrome DevTools → Accessibility panel, or axe DevTools

// Skip link for keyboard users
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Announce dynamic content to screen readers
<div role="status" aria-live="polite">{statusMessage}</div>

17. SEO & Metadata (Next.js)
typescript// app/layout.tsx — default metadata
export const metadata: Metadata = {
  title:       { default: "{{APP_NAME}}", template: "%s | {{APP_NAME}}" },
  description: "{{APP_STORE_DESCRIPTION_FIRST_LINE}}",
  metadataBase: new URL("{{APP_URL}}"),
  openGraph: {
    type:  "website",
    title: "{{APP_NAME}}",
    description: "{{OG_DESCRIPTION}}",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "{{APP_NAME}}",
    description: "{{OG_DESCRIPTION}}",
    images:      ["/og-image.png"],
  },
  robots: {
    index:  true,
    follow: true,
  },
}

// app/sitemap.ts — auto-generated sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "{{APP_URL}}",          lastModified: new Date() },
    { url: "{{APP_URL}}/pricing",  lastModified: new Date() },
    // Dynamic routes from DB...
  ]
}

// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules:   { userAgent: "*", allow: "/", disallow: "/app/" },
    sitemap: "{{APP_URL}}/sitemap.xml",
  }
}

18. Environment Variables
bash# .env.example — commit this (no real values)
# .env.local  — gitignored (real values)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME={{APP_NAME}}

# Database
DATABASE_URL=postgresql://...

# Auth (e.g., Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Payments (e.g., Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External APIs
{{API_KEY_NAME}}=...

# Email (e.g., Resend)
RESEND_API_KEY=re_...

{{ADDITIONAL_ENV_VARS}}
typescript// lib/env.ts — validate env vars at build time with Zod
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL:          z.string().url(),
  STRIPE_SECRET_KEY:     z.string().startsWith("sk_"),
  // ...
})

export const env = envSchema.parse(process.env)
// Now import { env } from "@/lib/env" — fully typed, validated at startup

19. Error Handling
tsx// app/error.tsx — Next.js error boundary (catches rendering errors)
"use client"
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button onClick={reset} className="...">Try again</button>
    </div>
  )
}

// app/not-found.tsx — 404 page

// API error responses — consistent shape
export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

// Client-side — React Query error handling
const { data, error, isError } = useQuery(...)
if (isError) return <ErrorMessage message={error.message} />

// Toast notifications for user-facing errors
// Use sonner (lightweight, beautiful):
import { toast } from "sonner"
toast.error("Something went wrong. Please try again.")

20. Testing Strategy
For a solo dev, focus on high-ROI tests. Don't aim for 100% coverage.
typescript// 1. Unit tests — pure functions, Zod schemas, utility logic
//    Vitest (fast, Vite-native, Jest-compatible API)
import { describe, it, expect } from "vitest"

// 2. Component tests — critical UI components
//    React Testing Library + Vitest
import { render, screen } from "@testing-library/react"

// 3. E2E tests — critical user journeys only
//    Playwright (recommended) or Cypress
//    Test: sign up → upgrade → use core feature → settings

// package.json scripts
"test":       "vitest",
"test:e2e":   "playwright test",
"test:ui":    "vitest --ui"

// Prioritize testing:
// ✅ Payment webhook handler
// ✅ Auth middleware
// ✅ Core feature logic (not UI)
// ✅ Critical form validation
// ❌ Don't test: styling, third-party libs, trivial getters

21. Deployment
Recommended: Vercel (zero-config for Next.js)
bash# One-command deploy
pnpm dlx vercel

# Or connect GitHub repo for automatic preview + production deploys
```

*Vercel gives you: automatic HTTPS, CDN, preview URLs per PR, Edge Runtime,
image optimization, Analytics. Free hobby tier is generous for solo devs.*

### Alternative Platforms
```
Netlify       — Similar to Vercel, great for static/SSG sites
Railway       — Full-stack with DB hosting, good DX
Render        — Good for Node.js servers + Postgres
Cloudflare Pages — Fastest global CDN, Workers for edge compute
Fly.io        — Containerized, good for latency-sensitive apps
```

### Database Hosting
```
Neon          — Serverless Postgres, generous free tier, instant branch DBs
Supabase      — Postgres + Auth + Storage + Realtime as a service
PlanetScale   — Serverless MySQL (Vitess), excellent for high scale
Turso         — SQLite at the edge (with Drizzle) — great for low-latency reads
Upstash       — Serverless Redis (rate limiting, caching, queues)
CI/CD
yaml# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

---

## 22. Security Checklist
```
Authentication & Authorization
  [ ] All API routes validate session/token — never trust client
  [ ] Role-based access enforced server-side (not just UI)
  [ ] Middleware protects all /app/* routes

Input Validation
  [ ] All user input validated with Zod on the server (not just client)
  [ ] No raw SQL string interpolation — use parameterized queries (Drizzle/Prisma handles this)
  [ ] File upload types and sizes validated server-side

Secrets
  [ ] No API keys in client-side code (no NEXT_PUBLIC_ prefix for secrets)
  [ ] .env.local in .gitignore
  [ ] Secrets rotated if accidentally committed

Headers
  [ ] Content Security Policy (CSP) configured
  [ ] CORS locked down on API routes
  [ ] next.config.ts security headers set

Payments
  [ ] Stripe webhook signature verified on every request
  [ ] Premium features gated server-side, not just client-side UI

Dependencies
  [ ] pnpm audit run before release
  [ ] Dependabot or Renovate enabled for automated updates
```

---

## 23. Launch Metadata

### App Identity

| Field | Value |
|-------|-------|
| **App Name** | {{APP_NAME}} |
| **Domain** | {{APP_DOMAIN}} |
| **Tagline** | {{APP_TAGLINE}} (max ~10 words) |
| **Primary Category** | {{PRIMARY_CATEGORY}} |
| **Target Audience** | {{TARGET_AUDIENCE}} |

### Landing Page Structure
```
/  (marketing homepage)
├── Hero          — headline, subheadline, primary CTA, hero image/demo
├── Social proof  — user count, testimonials, or logos
├── Features      — 3–6 key benefits (icon + title + 1-line description)
├── How it works  — 3-step visual flow
├── Pricing       — plan cards or link to /pricing
├── FAQ           — 5–8 questions, accordion
└── Footer        — links, social, legal
Open Graph Image

Size: 1200 × 630px
Generate dynamically with next/og (ImageResponse) for per-page OG images:

typescript// app/og/route.tsx
import { ImageResponse } from "next/og"
export async function GET(request: Request) {
  return new ImageResponse(
    <div style={{ ... }}>{{APP_NAME}}</div>,
    { width: 1200, height: 630 }
  )
}
Privacy Policy & Terms

{{PRIVACY_POLICY_URL}} — required before launch (especially if collecting any data)
{{TERMS_URL}} — required if accepting payments
Generators: Termly, iubenda, or self-hosted MDX pages


24. Implementation Priority
Phase 1: Core Experience
{{PHASE_1_TASKS}}
Phase 2: Polish & Secondary Features
{{PHASE_2_TASKS}}
Phase 3: Monetization
{{PHASE_3_TASKS}}
Phase 4: Launch Readiness

Dark mode (if not already via CSS custom properties)
Mobile layout audit on real devices (iOS Safari, Android Chrome)
Lighthouse audit — fix LCP, CLS, accessibility issues
Error boundaries on all major sections
Loading and empty states on all data-fetching components
Meta tags, OG image, sitemap, robots.txt
Cookie consent banner (if using analytics — required for EU/GDPR)
Analytics setup (Plausible / Fathom for privacy-first, or Vercel Analytics)


25. Pre-Launch Checklist
Code Quality

 TypeScript strict mode — zero any types
 No console.log in production (eslint-plugin-no-console)
 All TODO / FIXME comments resolved or ticketed
 pnpm typecheck passes with zero errors
 pnpm lint passes with zero errors
 Bundle analyzed — no accidental large dependencies

Functionality

 All core features work on mobile (iOS Safari + Android Chrome)
 All forms validate and show helpful error messages
 Payment flow tested end-to-end in test mode
 Webhook handler tested with Stripe CLI / Lemon Squeezy dev tools
 Auth flow: sign up, sign in, sign out, password reset
 404 and error pages render correctly

Performance & Accessibility

 Lighthouse mobile score ≥ 90
 No images missing alt text
 All interactive elements reachable by keyboard
 No color contrast failures
 prefers-reduced-motion respected

SEO & Legal

 <title> and <meta description> on all public pages
 OG image renders correctly (test with opengraph.xyz)
 Sitemap submitted to Google Search Console
 Privacy policy live and linked in footer
 Terms of service live and linked in footer (if payments)
 Cookie consent compliant (if using analytics)
 GDPR data deletion flow exists (if collecting user data)

Infrastructure

 Environment variables set in deployment platform
 Database migrations run in production
 Stripe/Lemon Squeezy webhook URL registered with production domain
 Custom domain connected with HTTPS
 Error monitoring set up (Sentry free tier)
 Uptime monitoring set up (Better Uptime / UptimeRobot free tier)
 {{ADDITIONAL_CHECKLIST_ITEMS}}


26. Application Entry Point
tsx// app/layout.tsx (Next.js App Router)
import type { Metadata } from "next"
import { {{FontName}} } from "next/font/google"
import { Providers } from "@/components/Providers"
import "./globals.css"

const font = {{FontName}}({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  // See Section 17
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

// components/Providers.tsx — client boundary for all context providers
"use client"
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
{{ADDITIONAL_PROVIDER_IMPORTS}}

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster richColors position="bottom-right" />
        {{ADDITIONAL_PROVIDERS}}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

27. Deliverable
A complete, runnable web application with:

All core functionality implemented
Full UI matching the design spec, mobile-first with responsive breakpoints
Monetization integrated (Stripe / Lemon Squeezy with placeholder IDs)
Auth flow integrated (if applicable)
TypeScript strict throughout — zero type errors
{{ADDITIONAL_DELIVERABLES}}
Light and dark mode support
Accessible markup (semantic HTML, ARIA where needed, keyboard navigable)
All {{PLACEHOLDER}} values documented for easy replacement before launch


28. Placeholder Reference
Before launch, search the project for {{ and replace all values. Also search TODO, FIXME, and REPLACE_ME:
PlaceholderDescriptionExample{{APP_NAME}}App display nameReflecta{{APPLICATION_ID}}Reverse-domain package IDcom.yourdomain.appname{{APP_URL}}Production URLhttps://reflecta.app{{APP_DOMAIN}}Domain onlyreflecta.appYOUR_API_KEYExternal API key — env var onlyNever hardcode{{VARIANT_ID}}Stripe/Lemon Squeezy product/price IDFrom dashboard{{PROMO_APP_URL}}Cross-promoted app URLhttps://otherapp.com{{PRIVACY_POLICY_URL}}Live privacy policyhttps://reflecta.app/privacy{{TERMS_URL}}Live terms of servicehttps://reflecta.app/termsWEBHOOK_SECRETPayment webhook secretFrom Stripe dashboard{{ADDITIONAL_PLACEHOLDERS}}

29. Notes
{{ADDITIONAL_NOTES}}
Final notes, known limitations, future roadmap, third-party attribution,
browser support edge cases, or other context for the developer. Examples:

iOS Safari quirks: 100vh is unreliable — use 100dvh (dynamic viewport height) for full-screen layouts
Safari does not support all CSS features at parity with Chrome — test on real iOS devices
Stripe test card: 4242 4242 4242 4242, any future date, any CVC
Run pnpm dlx shadcn@latest init to scaffold the component library
Add "type": "module" to package.json for ESM-native config files