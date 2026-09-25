# Corporation Management Frontend

React 19, TypeScript, Vite, and SCSS frontend for Corporation Resource
Management. It uses the FastAPI `/api/v1` API, JWT authentication, role-aware
navigation, English/Polish translations, the operational dashboard, resource
planning pages, explainable matching, and the Admin Console.

```bash
npm ci
npm run dev
```

Validation:

```bash
npm test -- --run
npm run lint
npm run typecheck
npm run build
```

The production Docker image serves the Vite build through nginx, provides SPA
route fallback, and proxies `/api` to the configured backend host.
