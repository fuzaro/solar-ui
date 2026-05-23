# Solar UI

```
                              . *  .    *    .   *   .
                 *    .           *        .        *
           .          *    .          .    *

                           ╭──────────╮
              ○            │   ☀ SUN  │            ○
         Mercury    ○      ╰────┬─────╯      ○    Pluto
                   Venus        │        Neptune
                          ╭─────┼─────╮
                    ○     │ PLATFORM  │     ○
                   Mars   ╰─────┼─────╯   Saturn
                                │
                       ○        │        ○
                     Moon    ───┴───   Themis
                             Mercury

           .     *     .          .     *     .
```

> Multi-role web interface for the SolarSystemsAI distributed
> AI agent execution platform — beautiful, ergonomic, and lean.

---

## Architecture

### Shared Packages

| Package | Purpose |
|---------|---------|
| `@solar/ui` | Design system — 40+ components, planet theming, AURA status bands |
| `@solar/api` | Typed API clients for all 8 planet services |
| `@solar/auth` | Saturn JWT session management + React context |

### Portals

| Portal | URL | Audience |
|--------|-----|----------|
| **Console** | `app.solarsystems.ai` | Users — task submission, monitoring, billing |
| **Control Plane** | `manage.solarsystems.ai` | Platform Managers — agents, models, tenants |
| **Engineering** | `ops.solarsystems.ai` | Operators — topology, parameters, security |

---

## Quick Start

```bash
npm install --legacy-peer-deps
npm run dev
```

Portals start on: Console `:3000` | Control `:3001` | Engineering `:3002`

---

## Tech Stack

Astro 5 · React 19 Islands · Tailwind CSS 4 · TanStack Query · D3.js · Zustand · Turborepo

---

## Project Structure

```
solar-ui/
├── packages/
│   ├── ui/               @solar/ui — design system
│   ├── api/              @solar/api — typed API clients
│   └── auth/             @solar/auth — auth helpers
└── apps/
    ├── console/          User Portal (port 3000)
    ├── control/          Control Plane (port 3001)
    └── engineering/      Engineering Portal (port 3002)
```

---

## License

Proprietary — SolarSystemsAI Platform
