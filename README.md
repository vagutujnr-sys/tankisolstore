# TankiSol Appstore

Discover, install and open Progressive Web Apps from TankiSol and trusted developers.

## Development

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Configure the Supabase project URL and publishable key in the local environment before starting the app. Server-side Supabase operations also require the corresponding server environment variables. Keep credentials out of source control.

Required environment variables are `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. Only trusted server operations use `SUPABASE_SERVICE_ROLE_KEY`; never expose it to browser code.

## Checks

```sh
npm run test
npm run lint
npm run build
```
