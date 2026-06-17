# Texnik topshiriq (ТЗ)
## "Yordamchi (ko'rinmas) vagonlar" harakatini hisobga olish axborot tizimi
### Информационная система учёта движения «вспомогательных (невидимых) вагонов»

| | |
|---|---|
| **Hujjat versiyasi** | 1.0 (tasdiqlangan asosiy qarorlar bilan) |
| **Sana** | 2026-06-09 |
| **Buyurtmachi** | O'zbekiston Temir Yo'llari — Tashishlarni tashkil etish boshqarmasi (Служба организации перевозок) |
| **Maqsadli foydalanuvchi** | Faqat Tashishlarni tashkil etish boshqarmasi (markazlashgan) |
| **Holati** | Asosiy qarorlar tasdiqlangan (14-bo'lim). MVP ishlab chiqishga tayyor |

---

## 1. Umumiy ma'lumot (Общие сведения)

### 1.1. Muammoning mohiyati
Temir yo'l tarmog'ida (1520 mm, MDH umumiy parki) **boshqa davlatlarga tegishli vagonlar** (Rossiya — РЖД, Qozog'iston — КТЖ va b.) mavjud. Ushbu vagonlarning bir qismi rasmiy avtomatlashtirilgan kuzatuv tizimida (АСОУП / 5065-xabar) **to'liq aks etmaydi** — tizim ularni boshqa joyda ko'rsatadi yoki harakatini qayd etmaydi. Amalda esa vagon mamlakat hududida bo'lib, bir necha marta yuklash-bo'shatishda **qayta ishlatiladi**.

Bu vagonlarning hisobi hozircha **qo'lda** yuritiladi: натурный лист (натурка) qo'lda yoziladi, ma'lumotlar Excel jadvallarda saqlanadi. Bu — xatoliklarga, ma'lumot yo'qolishiga, tahlilning sekinligiga olib keladi.

### 1.2. Tizimning maqsadi
Stansiyalardan kunlik Excel ko'rinishida keladigan ma'lumotlarni markazlashgan tarzda **import qilish, tekshirish, saqlash** va ular asosida **ko'rinmas vagonlar harakatini kuzatishni avtomatlashtirish**: vagon *qayerda va qanday yurgani* tarixini yuritish, dislokatsiya (haqiqiy va tizim bo'yicha) farqini aniqlash, turish (простой), aylanma (оборот) va qayta yuklash sonini hisoblash, hamda hisobotlar shakllantirish.

> **Diqqat:** Tizim faqat **harakat/dislokatsiya hisobini** yuritadi. Vagonlar bo'yicha **moliyaviy hisob-kitob yuritilmaydi** (to'lov, tarif, плата за пользование, hisob-faktura — yo'q).

### 1.3. Tizim NIMA EMAS (chegaralar)
- Stansiyalar tizimga **kirmaydi** — ular faqat Excel beradi. Tizimda stansiya foydalanuvchilari yo'q.
- Rasmiy АСОУП/АСУ tizimiga **onlayn ulanmaydi** (mustaqil tizim). Faqat Excel import/eksport.
- **Moliyaviy / buxgalteriya tizimi EMAS.**

---

## 2. Atamalar lug'ati (Глоссарий)

| Atama | Izoh |
|------|------|
| **Ko'rinmas / yordamchi vagon** | Rasmiy tizimda (5065) to'liq aks etmagan, qo'lda hisobi yuritiladigan, boshqa davlat vagoni |
| **Натурный лист (натурка)** | Poezd tarkibi varaqasi — tarkibdagi har bir vagon ro'yxati |
| **5065-xabar** | Rasmiy axborot tizimidagi vagon dislokatsiyasi (joylashuvi) xabari turi |
| **СМГС** | Xalqaro yuk tashish kelishuvi bo'yicha temir yo'l yuk hujjati (накладная) |
| **Hujjatsiz (без документа)** | Vagon harakati СМГС hujjatisiz amalga oshgan holat |
| **Собственник / Administratsiya** | Vagon egasi — davlat temir yo'l administratsiyasi (davlat kodi bilan) |
| **Davlat kodi (код вагон)** | Vagon qaysi davlatga tegishliligini bildiruvchi kod |
| **Dislokatsiya** | Vagonning joriy joylashuvi (stansiya) |
| **Kirish / Chiqish** | Vagonning mamlakat hududiga kirgan / chiqqan sanasi |
| **Простой** | Vagonning turib qolish vaqti (kun) |
| **Оборот** | Vagonning aylanish davri |
| **Snapshot (kunlik yozuv)** | Bir vagonning bir kunlik holati (Excel'dagi bitta qator) |

---

## 3. Foydalanuvchilar va rollar (Роли)

Faqat **Tashishlarni tashkil etish boshqarmasi** xodimlari. **3 ta rol:**

| Rol | Huquqlar |
|-----|----------|
| **Administrator** | To'liq boshqaruv: foydalanuvchilar, ma'lumotnomalar (stansiya, administratsiya), **Excel import**, yozuvlarni qo'lda kiritish/tahrirlash/o'chirish, barcha hisobotlar, sozlamalar, audit |
| **Rahbar (Boshqaruvchi)** | Hammasini **ko'rish** + dashboard + barcha hisobot va eksport. Ma'lumotni tahrirlamaydi (nazorat/monitoring roli) |
| **Kuzatuvchi (Viewer)** | Faqat ko'rish + eksport (tahrirlamaydi) |

> Kunlik Excel import va ma'lumot kiritish — **Administrator** vazifasi. Agar kelajakda ma'lumot kiritishni alohida ajratish kerak bo'lsa, "Operator" roli qo'shiladi.

---

## 4. Funksional talablar (Функциональные требования)

### 4.1. F-01. Excel import (tizim yadrosi)
- **F-01.1** Administrator `.xlsx` faylni yuklaydi (drag-and-drop yoki tanlash).
- **F-01.2** Import oldidan **fayl pasporti**ni belgilaydi: **manba stansiyasi** (qaysi stansiya yuborgan) va **hisobot sanasi (report_date)** — chunki har bir stansiya kunlik alohida fayl beradi (Excel'da sana ustuni yo'q).
- **F-01.3** Tizim ustunlarni shablon bilan moslashtiradi (5-bo'lim) — sarlavha matni bo'yicha moslashuvchan tanish.
- **F-01.4** Har bir qator **validatsiyadan** o'tadi (6-bo'lim). Xato qatorlar alohida ko'rsatiladi, to'g'rilari qabul qilinadi (qisman import).
- **F-01.5** Import oldidan **preview**: nechta yangi vagon, nechta yangilanish, nechta xato — Administrator tasdiqlaydi.
- **F-01.6** Har bir import **partiya (ImportBatch)** sifatida saqlanadi va **bekor qilish (rollback)** imkoni bo'ladi.
- **F-01.7** Har bir Excel qatori → bitta **kunlik yozuv (wagon_record)** sifatida saqlanadi (bir vagon = bir qator = bir kunlik snapshot).
- **F-01.8** Importdan keyin vagon master kartochkasi yangilanadi (joriy dislokatsiya, holati) va **yuklash soni tizim tomonidan qayta hisoblanadi** (4.4 ga qarang).

### 4.2. F-02. Vagonlar reyestri (kartochka)
- Har bir vagon uchun **kartochka**: raqami (8 xona), davlat kodi/administratsiya, joriy haqiqiy dislokatsiya, 5065 bo'yicha dislokatsiya, jami yuklash soni, mamlakatga **kirish/chiqish** sanasi, holati (hududda/chiqib ketgan).
- Vagonning **harakat tarixi** (kunlik yozuvlar ketma-ketligi) jadval ko'rinishida — qayerda, qachon, qanday yurgan.
- Qo'lda **tahrirlash** va **yangi yozuv qo'shish** (Excelsiz, alohida holatlar uchun).

### 4.3. F-03. Dislokatsiya farqi (ko'rinmaslikni aniqlash) — asosiy funksiya
- **F-03.1** Har bir vagon uchun **факт станция** (A) va **5065 bo'yicha станция** (L) solishtiriladi.
- **F-03.2** Farq bo'lsa — vagon "**nomuvofiq / ko'rinmas**" deb belgilanadi va alohida ro'yxatga chiqadi.
- **F-03.3** "Hujjatsiz harakat" (E yoki K = без документа) bo'lgan vagonlar alohida filtrlanadi.

### 4.4. F-04. Operatsion ko'rsatkichlar (avtomatik) — 7-bo'lim
- Простой, оборот (kirish↔chiqish asosida), **tizim sanagan yuklash soni**, mamlakatdagi davr. **Moliyaviy hisob-kitob yo'q** — faqat harakat tahlili.

### 4.5. F-05. Qidiruv va filtrlash
- Vagon raqami, davlat/administratsiya, stansiya, sana oralig'i, hujjat holati (СМГС/hujjatsiz), nomuvofiqlik holati bo'yicha qidiruv va filtr.

### 4.6. F-06. Hisobotlar (Отчёты) — 8-bo'lim
- Tayyor hisobot shablonlari, Excel/PDF eksport.

### 4.7. F-07. Dashboard (boshqaruv paneli)
- Jami ko'rinmas vagonlar soni, davlat bo'yicha taqsimot, nomuvofiqliklar soni, hujjatsiz harakatlar, eng ko'p turgan vagonlar, davr bo'yicha dinamika (grafik).

### 4.8. F-08. Ma'lumotnomalar (Справочники)
- **Stansiyalar** (kod, nom, yo'l) — CRUD + Excel import.
- **Administratsiyalar / davlatlar** (davlat kodi + nom + davlat) — CRUD. *(код вагон va собственник shu yerga birlashadi.)*

### 4.9. F-09. Audit jurnali
- Kim, qachon, qaysi yozuvni o'zgartirdi/o'chirdi; importlar tarixi.

### 4.10. F-10. Eksport
- Istalgan ro'yxat/hisobotni **Excel** va **PDF** ga chiqarish.

### 4.11. F-11. Autentifikatsiya va foydalanuvchilar
- Login/parol, rol asosidagi huquqlar (RBAC), sessiya, parolni admin orqali tiklash.

---

## 5. Excel import spetsifikatsiyasi (ustunlar moslashuvi)

Shablon (`ёрдамчи вагонлар.xlsx`) — sarlavhalar 2-qatorda, har bir vagon **bitta qator**.

| Excel ust. | Sarlavha (RU) | Tizim maydoni | Tur | Majburiy |
|-----------|---------------|---------------|-----|----------|
| A | факт станция дислокация | `fact_station` | Stansiya (lookup) | Ha |
| B | номер вагон | `wagon_number` | 8 xonali raqam | **Ha (kalit)** |
| C | код вагон | `administration_code` | Davlat kodi (lookup) | Ha |
| D | собственник | `administration_name` | Administratsiya nomi (lookup) | Ha |
| E | прибытия станция погрузка с док. СМГС или без | `loading_doc_status` | Enum: `СМГС` / `без документа` | Yo'q |
| F | станции погрузка | `loading_station` | Stansiya | Yo'q |
| G | дата погрузка | `loading_date` | Sana | Yo'q |
| H | индекс поезд | `train_index` | Matn | Yo'q |
| I | назначения станция | `destination_station` | Stansiya | Yo'q |
| J | дата выгрузка | `unloading_date` | Sana | Yo'q |
| K | прибытия станция выгрузка с док. СМГС или без | `unloading_doc_status` | Enum: `СМГС` / `без документа` | Yo'q |
| L | станция дислокация по сообщ №5065 | `station_5065` | Stansiya | Yo'q |
| M | сколько раз погрузил | `reported_load_count` | Butun son (faqat ma'lumot) | Yo'q |

**Eslatmalar:**
- **C (код вагон) + D (собственник)** bitta `administrations` ma'lumotnomasiga ishora qiladi: C — kod, D — nom. Import paytida ikkisi mos kelmasa — ogohlantirish.
- **M (сколько раз погрузил)** faqat ma'lumot uchun saqlanadi; **haqiqiy yuklash soni tizim tomonidan hisoblanadi** (4.4 / 7-bo'lim).
- **Hisobot sanasi (report_date)** Excel'da yo'q — import paytida Administrator kiritadi.
- Sana formatlari: `DD.MM.YYYY`, `DD.MM.YY`, Excel serial — ichkarida ISO (`YYYY-MM-DD`) ga normallashtiriladi.
- Vagon raqami bo'shliq/belgilardan tozalanadi (`12345678`).

---

## 6. Validatsiya qoidalari (Валидация)

| Qoida | Tavsif | Daraja |
|------|--------|--------|
| V-01 | `wagon_number` bo'sh emas | Xato (rad) |
| V-02 | `wagon_number` aniq **8 ta raqam** | Xato (rad) |
| V-03 | Nazorat raqami (контрольная цифра) to'g'ri | Ogohlantirish |
| V-04 | `administration_code` ma'lumotnomada mavjud | Ogohlantirish + qo'shish taklifi |
| V-05 | C kodi va D nomi bir-biriga mos | Ogohlantirish |
| V-06 | Stansiyalar ma'lumotnomada mavjud | Ogohlantirish + qo'shish taklifi |
| V-07 | `loading_date` ≤ `unloading_date` | Ogohlantirish |
| V-08 | Sanalar kelajakda emas | Ogohlantirish |
| V-09 | `doc_status` qiymati to'plamga mos (СМГС / без док.) | Ogohlantirish |

"Xato" qatorlar import qilinmaydi; "ogohlantirish" qatorlar import qilinadi, lekin belgilanadi.

---

## 7. Operatsion ko'rsatkichlar mantiqi (Операционные показатели)

> Barchasi faqat **harakat tahlili** uchun; moliyaviy emas.

| Ko'rsatkich | Mantiq | Izoh |
|------------|--------|------|
| **Joriy dislokatsiya** | Oxirgi kunlik yozuv bo'yicha `fact_station` | Vagonning hozirgi joyi |
| **Nomuvofiqlik (ko'rinmas)** | `fact_station ≠ station_5065` | "Ko'rinmaslik" indikatori |
| **Kirish sanasi** | Vagon birinchi marta paydo bo'lgan kunlik yozuv sanasi | Hududga kirish |
| **Chiqish sanasi** | Vagon hududdan chiqqani aniqlangan sana | Hududdan chiqish |
| **Mamlakatdagi davr** | `(chiqish ?? bugun) − kirish` (kun) | Asosiy davr — **kirish↔chiqish** |
| **Простой** | Joriy joyda harakatsiz turgan kunlar | Chegaradan oshsa — ogohlantirish |
| **Оборот** | Kirish↔chiqish sikli (hududda bo'lish davri) | O'rtacha aylanma |
| **Yuklash soni** | Tizim hisoblaydi: kunlik yozuvlarda yuklash (sana/stansiya) o'zgargani har safar +1 | M ustuniga ishonilmaydi |
| **Hujjatsiz harakatlar** | `doc_status = без документа` yozuvlar | Nazorat indikatori |

> Простой chegarasi (masalan, > N kun) — sozlamalardan o'zgartiriladi.

---

## 8. Hisobotlar ro'yxati (Отчёты)

1. **Ko'rinmas vagonlar reyestri** — joriy holat, haqiqiy joylashuv, davlat.
2. **Nomuvofiqlik hisoboti** — `факт ≠ 5065` bo'lgan vagonlar.
3. **Davlat (administratsiya) bo'yicha** — vagonlar soni, jami kun.
4. **Простой hisoboti** — N kundan ortiq turgan vagonlar.
5. **Qayta yuklash hisoboti** — vagon/davr kesimida.
6. **Hujjatsiz harakatlar** — без документа yozuvlar.
7. **Kirish/chiqish hisoboti** — davr ichida hududga kirgan/chiqqan vagonlar.
8. **Davr yakuni (kunlik/oylik)** — umumiy ko'rsatkichlar.
9. **Import tarixi** — partiyalar va xatolar statistikasi.

Har bir hisobot: ekranda jadval + grafik (kerakda) + **Excel/PDF eksport**.

---

## 9. Ma'lumotlar modeli (Модель данных)

> PostgreSQL + Prisma. **Asosiy g'oya:** har Excel qatori = bitta `wagon_record` (kunlik snapshot); `wagons` — undan hosil bo'ladigan joriy holat.

### 9.1. `administrations` (davlat / собственник)
`id, code (davlat kodi, unique), name_uz, name_ru, country, is_active, created_at`

### 9.2. `stations` (stansiyalar)
`id, code, name_uz, name_ru, railway, country, is_active`

### 9.3. `wagons` (vagonlar — master, joriy holat)
```
id, wagon_number (8 xona, unique), administration_id,
current_fact_station_id, current_5065_station_id,
total_load_count (tizim hisoblaydi),
entry_date (kirish), exit_date (chiqish, null bo'lishi mumkin),
last_report_date, status (in_country / departed),
is_discrepant (derived: fact ≠ 5065),
notes, created_at, updated_at
```

### 9.4. `wagon_records` (kunlik yozuvlar — harakat tarixi)
```
id, wagon_id, import_batch_id,
report_date, source_station,
fact_station_id, station_5065_id,
loading_station_id, loading_date, loading_doc_status (enum),
train_index, destination_station_id,
unloading_date, unloading_doc_status (enum),
reported_load_count (M, faqat ma'lumot),
is_new_loading (tizim aniqlaydi), created_at
```

### 9.5. `import_batches`
```
id, file_name, source_station, report_date,
uploaded_by, uploaded_at, total_rows, success_rows,
warning_rows, error_rows, status (preview/committed/rolledback)
```

### 9.6. `import_rows` (staging + xatolar)
`id, import_batch_id, row_number, raw_json, status, messages[]`

### 9.7. `users`
`id, full_name, login, password_hash, role (admin/rahbar/viewer), is_active, last_login`

### 9.8. `audit_logs`
`id, user_id, entity, entity_id, action, before_json, after_json, created_at`

---

## 10. Nofunksional talablar (Нефункциональные требования)

| Kategoriya | Talab |
|-----------|-------|
| **Platforma** | Web; desktop + **mobile responsive** (bitta kodbaza) |
| **Til (i18n)** | O'zbek (lotin) + Rus — interfeys va hisobotlar; almashtirish |
| **Unumdorlik** | 100k+ yozuvda qidiruv/filtr < 1-2 s; import 10k qator < ~30 s |
| **Xavfsizlik** | RBAC, parol hash (argon2/bcrypt), HTTPS, sessiya, audit |
| **Joylashtirish** | **On-prem — buyurtmachining o'z serveri**. Docker (Next.js + PostgreSQL) |
| **Zaxira (backup)** | DB kunlik avtomatik backup; import fayllari saqlanadi |
| **Brauzerlar** | Chrome, Edge, Firefox (so'nggi versiyalar) |
| **Loglar** | Server loglari + xato kuzatuvi |

---

## 11. Texnologik stek (RailMap bilan mos, o'z serverda)

| Qatlam | Texnologiya |
|--------|-------------|
| Frontend/Backend | **Next.js (App Router) + TypeScript + React** |
| UI | **Tailwind CSS + shadcn/ui** |
| ORM / DB | **Prisma + PostgreSQL** |
| Excel | **SheetJS (xlsx)** / ExcelJS |
| Auth | **Auth.js (NextAuth)** + RBAC |
| i18n | **next-intl** |
| Grafiklar | **Recharts** |
| PDF | server-side render / react-pdf |
| Validatsiya | **Zod** |
| Joylashtirish | **Docker Compose** (app + db) o'z serverda |

---

## 12. Ekranlar ro'yxati (UI/UX)

1. Login
2. Dashboard (KPI + grafiklar)
3. Excel import (manba stansiya + sana → yuklash → preview → tasdiqlash)
4. Vagonlar reyestri (jadval, filtr, qidiruv)
5. Vagon kartochkasi (tafsilot + harakat tarixi)
6. Nomuvofiqliklar (ko'rinmas vagonlar)
7. Hisobotlar (shablonlar + eksport)
8. Ma'lumotnomalar (stansiya / administratsiya)
9. Foydalanuvchilar (admin)
10. Audit jurnali (admin)
11. Sozlamalar (til, простой chegarasi)

Responsive: stolda — keng jadval; telefonda — karta/ro'yxat.

---

## 13. Bosqichlar (Roadmap / MVP)

### Bosqich 1 — MVP
- Auth + 3 rol (admin / rahbar / kuzatuvchi)
- Ma'lumotnomalar (stansiya, administratsiya)
- **Excel import** (manba stansiya + sana, validatsiya, preview, partiya)
- Vagonlar reyestri + kartochka + harakat tarixi
- Nomuvofiqlik (факт ≠ 5065) aniqlash
- Tizim sanaydigan yuklash soni
- Asosiy 3 hisobot + Excel eksport

### Bosqich 2 — Tahlil
- Простой / оборот (kirish↔chiqish) hisobi
- Dashboard + grafiklar
- Qolgan hisobotlar + PDF

### Bosqich 3 — Yetuklik
- Audit jurnali, import rollback
- Qo'lda kiritish/tahrirlash kengaytmasi
- Ikki til to'liq, sozlamalar
- Backup, monitoring, hujjatlashtirish

### Boshlang'ich ma'lumot (migratsiya)
- Faqat **so'nggi 5 kun** (2026-06-04 dan boshlab) ma'lumotlari import qilinadi. Eski arxiv migratsiyasi shart emas.

---

## 14. Tasdiqlangan asosiy qarorlar (2026-06-09)

| # | Savol | Qaror |
|---|-------|-------|
| 1 | Excel qator tuzilishi | **1 vagon = 1 qator** (kunlik snapshot) |
| 2 | `код вагон` (C) ma'nosi | **Davlat kodi** (vagon qaysi davlatniki) — `собственник` bilan birlashadi |
| 3 | Vagon raqami | **8 xonali** (majburiy validatsiya) |
| 4 | Yuklash soni | **Tizim o'zi sanaydi** (M ustunga ishonmaydi) |
| 5 | Простой / оборот asosi | **Kirish ↔ chiqish** sanalari |
| 6 | Rollar | **Admin, Rahbar, Kuzatuvchi** (3 ta) |
| 7 | Joylashtirish | **Buyurtmachining o'z serveri** (on-prem) |
| 8 | Excel manbai | **Har stansiya alohida fayl, kunlik** |
| 9 | Tarixiy ma'lumot | **So'nggi 5 kundan** boshlab |
| — | Moliyaviy hisob | **YO'Q** (faqat harakat hisobi) |

### Aniqlik kiritilishi mumkin bo'lgan kichik nuqtalar (bloklamaydi)
- **Chiqish sanasi (exit)** qanday aniqlanadi: manzil chet el stansiyasi bo'lganidami, qo'lda belgilanadimi yoki vagon ortiq hisobotlarda ko'rinmay qolgandami?
- **Простой chegarasi** uchun standart qiymat (masalan, 10 kun) — sozlamadan o'zgaradi.

---

## 15. Keyingi qadam
1. Next.js loyiha skeletini yaratish (TypeScript + Tailwind/shadcn + Prisma + PostgreSQL, Docker).
2. Prisma sxemasini (9-bo'lim) yozish va migratsiya.
3. **Excel import prototipi** (eng katta qiymat) — preview + validatsiya bilan.
4. Vagonlar reyestri + kartochka + nomuvofiqlik ko'rinishi.
