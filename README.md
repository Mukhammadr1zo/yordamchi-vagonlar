# Ko'rinmas (yordamchi) vagonlar — hisob tizimi

O'zbekiston Temir Yo'llari — Tashishlarni tashkil etish boshqarmasi uchun
boshqa davlatlar ("ko'rinmas") vagonlarining **harakatini hisobga olish** web ilovasi.
Stansiyalardan kelgan kunlik Excel fayllar import qilinadi, vagon *qayerda va qanday
yurgani* kuzatiladi, dislokatsiya nomuvofiqligi (факт ≠ 5065) aniqlanadi.

> To'liq texnik topshiriq: [`docs/TZ-yordamchi-vagonlar.md`](docs/TZ-yordamchi-vagonlar.md)

## Texnologiyalar
- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** + shadcn/ui
- **Prisma 6** + **PostgreSQL 16**
- **next-intl** (o'zbek + rus)
- **ExcelJS** (Excel import)

## Ishga tushirish (ishlab chiqish)

1. **Bazani ko'tarish** (Docker):
   ```bash
   docker compose up -d        # PostgreSQL :5434 + Adminer :8080
   ```
2. **`.env`** mavjudligini tekshiring (`.env.example` namunasi bor).
3. **Bog'liqliklar va baza**:
   ```bash
   npm install
   npm run db:migrate          # jadvallarni yaratadi
   npm run db:seed             # administratsiya + stansiya ma'lumotnomasi
   ```
4. **Ilovani ishga tushirish**:
   ```bash
   npm run dev                 # http://localhost:3000 (band bo'lsa 3002)
   ```

## Foydali skriptlar
| Buyruq | Vazifa |
|--------|--------|
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` / `npm start` | Production build / ishga tushirish |
| `npm run db:migrate` | Prisma migratsiya |
| `npm run db:seed` | Ma'lumotnomani to'ldirish |
| `npm run db:studio` | Prisma Studio (baza ko'rish) |

## Test ma'lumoti
`scripts/` ichida namuna fayllar bor:
- `make-test-xlsx.ts` → `docs/namuna-data.xlsx` (5 namunaviy qator) yaratadi
- `test-import-http.ts` → import oqimini (preview→commit) sinaydi
- `check-wagons.ts` → bazadagi vagonlarni ko'rsatadi

Test ma'lumotini tozalash: `docker compose down -v && docker compose up -d` keyin migrate+seed.

## Tuzilma
```
src/
  app/[locale]/            # uz | ru
    (app)/                 # asosiy ilova (sidebar bilan)
      dashboard/           # boshqaruv paneli
      import/              # Excel import
      wagons/[id]          # reyestr + kartochka
      discrepancies/       # ko'rinmas (факт ≠ 5065)
  app/api/import/          # preview + commit API
  lib/import/              # parse / validate / lookup mantiqi
  components/              # UI + sidebar + jadvallar
prisma/schema.prisma       # ma'lumotlar modeli
messages/{uz,ru}.json      # tarjimalar
docs/                      # TZ + namuna Excel
```

## Production (o'z serverda)
```bash
# .env.prod da POSTGRES_PASSWORD va AUTH_SECRET ni belgilang
docker compose -f docker-compose.prod.yml up -d --build
```

## Hozir tayyor (MVP — Bosqich 1)
- ✅ Excel import: yuklash → validatsiya → ko'rib chiqish → tasdiqlash
- ✅ Vagonlar reyestri + qidiruv/filtr
- ✅ Vagon kartochkasi + harakat tarixi
- ✅ Nomuvofiqlik (факт ≠ 5065) aniqlash
- ✅ Tizim sanaydigan yuklash soni
- ✅ Dashboard (asosiy ko'rsatkichlar)
- ✅ Ikki til (uz/ru)

## Keyingi qadamlar (Bosqich 2-3)
- Autentifikatsiya + rollar (Admin / Rahbar / Kuzatuvchi)
- Простой / оборот (kirish↔chiqish) hisobi
- Hisobotlar + Excel/PDF eksport
- Ma'lumotnomalar CRUD (stansiya, administratsiya)
- Audit jurnali, import bekor qilish (rollback)
