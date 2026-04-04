# Tracerv2

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Konfigurasi lingkungan

Salin `.env.example` menjadi `.env` lalu sesuaikan:
```
VITE_API_BASE_URL=https://api.cdc.local     # Base URL backend (REST)
VITE_DASHBOARD_DATA_URL=/api/dashboard.json # Fallback dashboard bila backend belum siap
VITE_APP_NAME=Tracer CDC
VITE_APP_ENV=local
VITE_API_TIMEOUT_MS=10000                  # Timeout default request API (ms)
VITE_DASHBOARD_TIMEOUT_MS=20000            # Timeout khusus dashboard/insight (ms)
```

- Jika backend sudah tersedia: isi `VITE_API_BASE_URL` dengan host API (mis. `https://staging.cdc.ac.id/api`), jalankan frontend: `npm run dev`.
- Jika backend belum ada: biarkan `VITE_API_BASE_URL` kosong atau gunakan mock (json-server/Postman mock) dengan path sesuai kontrak REST; `VITE_DASHBOARD_DATA_URL` bisa diarahkan ke file JSON statis di `public/api/dashboard.json`.

### Menjalankan dengan backend mock
1. Sediakan mock endpoint sesuai kontrak (`/auth/login`, `/tracer/questionnaires`, `/tracer/questionnaires/:id/questions`, `/dashboard/tracer/accreditation-summary`, `/jobs`, `/news`, dll) memakai json-server/Postman mock.
2. Atur `VITE_API_BASE_URL` ke URL mock tersebut.
3. Pastikan CORS mock mengizinkan origin Vite; jalankan `npm run dev`.

## Deployment production (frontend + backend)

Lihat panduan: `docs/deploy/GO-LIVE-FULLSTACK.md`

## Load Test (k6)

Paket skenario lengkap ada di `stress/k6`:
- smoke
- baseline
- stress
- soak

Panduan penggunaan: `stress/k6/README.md`
