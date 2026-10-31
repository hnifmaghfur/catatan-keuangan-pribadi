# 📒 Catatan Keuangan Pribadi (Mobile-First + WhatsApp Bot)

Aplikasi pencatatan keuangan pribadi modern berorientasi **Mobile-First** yang terintegrasi penuh dengan **WhatsApp Bot**. Catat pengeluaran, pantau penggunaan harian, dan dapatkan estimasi kuota belanja harian yang dihitung secara real-time dari sisa budget.

---

## 🚀 Fitur Unggulan

1. **Jumlah Penggunaan Harian**: Menampilkan total uang yang sudah dibelanjakan hari ini.
2. **Estimasi Penggunaan Harian**: Dihitung otomatis: `(Sisa Budget) ÷ (Sisa Hari Periode)` untuk panduan belanja aman.
3. **Pencatatan & Ringkasan via WhatsApp**:
   - Catat: `25000 nasi padang #makan` atau `15k es kopi` atau `1.2jt sewa kos #tagihan`
   - Ringkasan harian: `hari ini`
   - Status budget: `budget`
   - Riwayat: `riwayat`
   - Update budget: `set budget 3.5jt`
   - Hapus transaksi: `hapus terakhir`
4. **Mobile-First Web Dashboard**: Tampilan clean bergaya aplikasi mobile dengan Bottom Navigation, Quick Add, dan ringkasan visual.
5. **Database Supabase**: PostgreSQL dengan Row Level Security (RLS) dan auto-seeding kategori.

---

## 🏗️ Struktur Project

```
Catatan Keuangan Pribadi/
├── web/                       # Next.js 16 + Tailwind CSS + shadcn (Vercel)
│   ├── src/
│   │   ├── app/               # App Router & API routes
│   │   │   ├── api/whatsapp/  # Webhook receiver dari bot WA
│   │   │   ├── api/summary/   # Kalkulasi budget & estimasi
│   │   │   └── api/transactions/ # CRUD Transaksi
│   │   ├── components/        # Mobile-first UI components
│   │   ├── lib/               # WhatsApp parser, formatter, calculations, Supabase
│   │   └── types/             # TypeScript definitions
│   ├── .env.example
│   └── .env.local
├── wa-bot/                    # WhatsApp Bot Baileys (Fly.io)
│   ├── src/index.ts           # WebSocket client & webhook forwarder
│   ├── Dockerfile             # Multi-stage Docker build
│   └── fly.toml               # Konfigurasi deploy Fly.io
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql # Skema database Supabase
```

---

## 🛠️ Panduan Menjalankan Secara Lokal

### 1. Setup Supabase
1. Buka dashboard [Supabase](https://supabase.com).
2. Jalankan query SQL dari `supabase/migrations/001_initial_schema.sql` di SQL Editor.
3. Salin **Project URL**, **Anon Key**, dan **Service Role Key** ke `web/.env.local`.

### 2. Jalankan Web App (Next.js)
```bash
cd web
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

### 3. Jalankan WhatsApp Bot (Lokal)
```bash
cd wa-bot
npm install
npm start
```
Terminal akan menampilkan **QR Code WhatsApp**. Scan dari menu **WhatsApp > Perangkat Tertaut (Linked Devices)**.

---

## 🚢 Panduan Deployment

### A. Deploy Web App ke Vercel
1. Hubungkan repository GitHub ke [Vercel](https://vercel.com).
2. Set **Root Directory** ke `web`.
3. Masukkan Environment Variables di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `WHATSAPP_WEBHOOK_SECRET`

### B. Deploy Bot WhatsApp ke Fly.io
```bash
cd wa-bot

# 1. Login ke Fly.io
fly auth login

# 2. Buat Volume persisten untuk session WhatsApp (agar tidak scan QR ulang saat restart)
fly volumes create wa_auth_data --region sin --size 1

# 3. Set secrets URL Vercel
fly secrets set VERCEL_API_URL=https://nama-app-anda.vercel.app/api/whatsapp
fly secrets set WEBHOOK_SECRET=secret_yang_sama_dengan_vercel

# 4. Deploy
fly deploy

# 5. Lihat QR Code untuk scan pertama kali
fly logs
```
