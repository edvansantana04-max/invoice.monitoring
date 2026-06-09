# USD Ops Dashboard (PT Universe Solusi Digital)

Aplikasi internal untuk:
- input & monitoring **termin project**, **status invoice**, dan **status pembayaran**
- **cashflow per bulan** (inflow plan vs paid + outflow/cost)
- **CRM Prospect** + follow up
- **import dari Excel** (format mengikuti file yang Anda lampirkan: sheet `Project`, `Cost`, `Prospect`, dll.)

## Setup lokal (development)

### 1) Install dependency
```bash
npm install
```

### 2) Konfigurasi ENV
Copy `.env.example` → `.env`, lalu isi:
- `DATABASE_URL` (Postgres; disarankan Neon / Supabase)
- `NEXTAUTH_SECRET`
- `ADMIN_USERNAME` + `ADMIN_PASSWORD` (atau `ADMIN_PASSWORD_HASH`)

### 3) Buat tabel di database
Setelah `DATABASE_URL` valid:
```bash
npx prisma db push
```

### 4) Jalankan
```bash
npm run dev
```
Buka `http://localhost:3000` lalu login.

## Import Excel
Masuk ke menu **Import Excel** lalu upload `.xlsx`. Import akan:
- membuat Client/Project/Termin (Billing) dari sheet `Project`
- membuat Cost (Expense) dari sheet `Cost`
- membuat Prospect dari sheet `Prospect`

Catatan: import melakukan _skip_ untuk duplikat sederhana (agar tidak dobel saat upload ulang).

## Hubungkan ke GitHub
Di folder project:
```bash
git init
git add .
git commit -m "init usd-ops dashboard"
```
Buat repository baru di GitHub, lalu:
```bash
git remote add origin <URL_REPO_GITHUB>
git branch -M main
git push -u origin main
```

## Deploy ke Vercel
1. Import repository dari GitHub ke Vercel
2. Tambahkan Environment Variables di Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (isi dengan domain Vercel Anda, mis. `https://xxx.vercel.app`)
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD` (atau `ADMIN_PASSWORD_HASH`)
3. Setelah deploy, pastikan tabel database sudah dibuat (jalankan `npx prisma db push` sekali dari lokal dengan `DATABASE_URL` yang sama).
