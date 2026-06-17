# Kompleks yechimlar — xalqaro tajriba asosida
### "Ko'rinmas vagonlar" tizimini rivojlantirish bo'yicha tahlil va tavsiyalar

| | |
|---|---|
| Sana | 2026-06-12 |
| Asos | Yuklangan `Погрузка_вагонов.xlsx` tahlili + MDH va Yevropa temir yo'l tizimlari tadqiqi |

---

## 1. Yuklangan fayl tahlili va tuzatish

`Погрузка_вагонов.xlsx` — bu **«ko'rinmas vagonlar» emas**, balki **yuklash rejasi (план погрузки)** hisoboti:

| Ustun | Ma'no |
|------|------|
| № | tartib raqami |
| Станция погрузки | yuklash stansiyasi |
| Род вагона | vagon **turi** (Крытый, Цистерна...) |
| Тип вагона | СПС-Карго, СПС-Разное |
| Заявка / Обеспечение / Требуется | zayavka / ta'minlangan / kerak (sonlar) |
| Подход | izoh (yondashuvdagi vagonlar) |

Bu **agregat** ma'lumot (har stansiya bo'yicha sonlar) — bunda vagon raqami, собственник yoki dislokatsiya **yo'q**. Shu sababli import buni qabul qila olmadi.

**Tuzatildi:** import endi shablon mos kelmasa **aniq xabar** beradi (HTTP 422):
> «Bu fayl «ko'rinmas vagonlar» shabloniga mos emas: «номер вагон» topilmadi. Bu «Погрузка / yuklash rejasi» hisobotiga o'xshaydi. Topilgan ustunlar: …»

**Qo'shimcha tuzatishlar:**
- Vagon raqami **nazorat raqami (контрольная цифра)** validatsiyasi qo'shildi — MDH 1520 standarti (Luhn-ga o'xshash algoritm).
- Brauzer kengaytmasi keltirib chiqargan hidratsiya ogohlantirishi bartaraf etildi.

> **Asosiy xulosa:** Bo'limingiz **bir nechta xil hisobot** bilan ishlaydi. Tizim buni hisobga olishi kerak (3-bo'limga qarang).

---

## 2. Boshqa davlatlar tajribasi (tadqiqot)

### 2.1. MDH (1520 mm tarmoq) — ДИСПАРК / АБД ПВ
- **ДИСПАРК** (РЖД) — vagon parkining **пономерной (har bir raqam bo'yicha) hisobi**, dislokatsiya nazorati, foydalanish tahlili va boshqaruvi tizimi. АСОУП tarkibida ishlaydi, MDH va Boltiqbo'yi yo'llarini bog'laydi.
- **ИВЦ ЖА** (Temir yo'l administratsiyalari axborot-hisoblash markazi) **АБД ПВ** (Vagon parki avtomatlashtirilgan ma'lumotlar bazasi)ni **real vaqtda** yuritadi — СЖТ СНГ (MDH Temir yo'l transporti kengashi) qoidalari asosida. Xususiy vagonlarga "5" bilan boshlanuvchi 8 xonali raqam beriladi.
- **ЦКПВ / ДКПВ** — barcha vagonlarning texnik xususiyatlari kartotekasi.
- **Saboq:** oltin standart — **пономерной solishtirish (reconciliation)**: fizik harakat (натурный лист) va tizim modeli o'rtasidagi farqni topish. «Ko'rinmas vagon» = АБД ПВ va fizik haqiqat orasidagi **bo'shliq**. Aynan shu siz hal qilayotgan muammo.

### 2.2. Yevropa — GCU + TAF TSI
- **GCU** (General Contract of Use for Wagons) — COTIF/CUV asosidagi ko'p tomonlama shartnoma; ikki tomonlama kelishuvlar o'rnini bosadi. **28 davlat, ~570 000 vagon** yagona bazada. Har vagonning **egasi (keeper, VKM belgisi)** aniq.
- **TAF TSI** (Telematic Applications for Freight) — yagona raqamli xabar formatlari: yuk hujjati, **poezd tarkibi (train composition)**, vagon harakati, poezd holati. EI yuk bozorining **85%**ini qamraydi.
- **Saboq:** (1) standartlashtirilgan ma'lumot almashinuvi, (2) vagon **egasi** identifikatsiyasi, (3) markaziy vagon bazasi.

### 2.3. Sizning tizimingizga tatbiq etiladigan saboqlar
| Tamoyil | Holat |
|--------|-------|
| Пономерной (har raqam) hisob | ✅ Bor |
| Факт ↔ model solishtirish (reconciliation) | ✅ Boshlandi (факт≠5065) |
| Vagon raqami nazorat raqami | ✅ **Endi qo'shildi** |
| Bir nechta standart hisobot turi | ⏳ Kerak (loading plan va b.) |
| Markaziy ma'lumotnomalar (vagon turi, egasi, stansiya kodi) | ⏳ Kengaytirish kerak |
| Vagon egasi (собственник) aniq identifikatsiyasi | ◑ Qisman (administratsiya kodi) |

---

## 3. Kompleks yechim (tavsiya etilgan arxitektura)

### 3.1. Ko'p shabloli import dvigateli (multi-report engine)
**Muammo:** bo'lim ≥ 2 xil Excel hisobot bilan ishlaydi (ёрдамчи вагонлар, Погрузка, ...).
**Yechim:** "hisobot turi" reyestri — har biri o'z ustun-moslashuvi, maqsadli jadvali va validatsiyasiga ega. Import paytida foydalanuvchi turni tanlaydi **yoki** tizim sarlavhalar bo'yicha **avtomatik aniqlaydi**.
- `ReportType` konfiguratsiyasi: { id, nom, ustun-qoidalari, processor }
- Avto-aniqlash: sarlavhalardan turni topish (masalan, "номер вагон" bor → ko'rinmas vagonlar; "Заявка/Обеспечение" bor → yuklash rejasi).

### 3.2. Yuklash rejasi moduli (Погрузка)
Yuklangan faylni qo'llab-quvvatlash uchun:
- Yangi jadval `loading_plan_entries`: `reportDate, station, wagonKind, wagonType, requested, provided, required, approachNote`.
- Ma'lumotnoma: `wagon_kinds` (Крытый, Цистерна, Полувагон, Платформа...), `wagon_types` (СПС-Карго, СПС-Разное...).
- Dashboard: kunlik **reja vs bajarilish** (Заявка → Обеспечение) ko'rsatkichi.

### 3.3. Reconciliation / "ko'rinmas" detektorini kuchaytirish (ДИСПАРК uslubida)
- `факт ≠ 5065` dan tashqari: fizik mavjud, lekin 5065'da yo'q vagonlar; **eskirgan** (N kundan beri hisobotsiz) vagonlar; **administratsiya bo'yicha park balansi** (kirgan/chiqgan).

### 3.4. Vagon raqami intellekti (qisman bajarildi)
- ✅ 8 xonali + nazorat raqami.
- ➕ Birinchi raqam semantikasi (xususiy "5" va b.) — ogohlantirish/klassifikatsiya.

### 3.5. Ma'lumotnomalarni kengaytirish
- `wagon_kinds`, `wagon_types`, `administrations` (kodlarni tekshirish), `stations` (ЕСР kodlari bilan).
- CRUD interfeysi (Bosqich 2).

### 3.6. Hisobotlar (MDH amaliyotiga mos)
- Administratsiya bo'yicha **park balansi**, foydalanish-kunlari, kirish/chiqish (interchange), yuklash rejasi bajarilishi.

### 3.7. Kelajak: standart eksport
- СЖТ СНГ / TAF-TSI uslubidagi standart formatlarda eksport (uzoq muddatli).

---

## 4. Yo'l xaritasi

| Bosqich | Ish |
|--------|-----|
| **A (tezkor)** | ✅ Nazorat raqami, ✅ import xato xabari · ➕ vagon turi/tip ma'lumotnomasi · ➕ yuklash rejasi moduli |
| **B** | Ko'p shabloli import (avto-aniqlash) · Reconciliation dashboard (park balansi, eskirgan vagonlar) |
| **C** | Autentifikatsiya + rollar · простой/оборот · hisobotlar + Excel/PDF eksport |

---

## 5. Manbalar (research)
- ДИСПАРК / АБД ПВ — [poezdon.ru: Вагонная модель и Диспарк](http://poezdon.ru/zheleznaya-doroga/kak-ustroena-zhd/vagonnaya-model-i-dispark.html)
- СЖТ СНГ qoidalari — [Правила эксплуатации и пономерного учёта собственных грузовых вагонов (ГАРАНТ)](https://base.garant.ru/72097746/)
- GCU — [GCU Bureau](https://gcubureau.org/) · [UIC GCU](https://uic.org/freight/wagon-utilisation/article/gcu)
- TAF TSI — [RNE TAF TAP TSI](https://rne.eu/it/taf-tap-tsi/) · [EUR-Lex 1305/2014](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02014R1305-20210418)
- Vagon raqami nazorat raqami — [Калькулятор контрольной цифры](https://www.clubtrack.ru/hobby/nomer-vagona.php)
