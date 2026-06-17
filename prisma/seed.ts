import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Davlat / temir yo'l administratsiyalari (ОСЖД kod administratsii).
// DIQQAT: kodlar namuna sifatida — buyurtmachi bilan tekshirilsin.
const administrations = [
  { code: "29", nameUz: "O'zbekiston temir yo'llari (UTY)", nameRu: "Узбекские ж.д. (УТЙ)", country: "O'zbekiston" },
  { code: "20", nameUz: "Rossiya temir yo'llari (RJD)", nameRu: "РЖД", country: "Rossiya" },
  { code: "27", nameUz: "Qozog'iston temir yo'llari (KTJ)", nameRu: "КТЖ", country: "Qozog'iston" },
  { code: "21", nameUz: "Belarus temir yo'li (BCh)", nameRu: "БЧ", country: "Belarus" },
  { code: "22", nameUz: "Ukraina temir yo'li (UZ)", nameRu: "УЗ", country: "Ukraina" },
  { code: "67", nameUz: "Turkmaniston temir yo'li", nameRu: "ТЖД Туркменистан", country: "Turkmaniston" },
  { code: "66", nameUz: "Tojikiston temir yo'li", nameRu: "ТЖД Таджикистан", country: "Tojikiston" },
  { code: "59", nameUz: "Qirg'iziston temir yo'li", nameRu: "КРЖД", country: "Qirg'iziston" },
  { code: "57", nameUz: "Ozarbayjon temir yo'li (ADY)", nameRu: "АЖД", country: "Ozarbayjon" },
  { code: "28", nameUz: "Gruziya temir yo'li", nameRu: "ГР", country: "Gruziya" },
];

// Namuna stansiyalar (kodlar — taxminiy, tekshirilsin). Qolganlari import paytida qo'shiladi.
const stations = [
  { code: "700000", nameUz: "Toshkent", nameRu: "Ташкент", country: "O'zbekiston" },
  { code: "734000", nameUz: "Keles", nameRu: "Келес", country: "O'zbekiston" },
  { code: "725000", nameUz: "Sirg'ali", nameRu: "Сергели", country: "O'zbekiston" },
  { code: "710000", nameUz: "Xovos", nameRu: "Хаваст", country: "O'zbekiston" },
  { code: "740000", nameUz: "Qo'ng'irot", nameRu: "Кунград", country: "O'zbekiston" },
  { code: "800000", nameUz: "Saryog'och (chegara)", nameRu: "Сарыагаш (граница)", country: "Qozog'iston" },
];

async function main() {
  console.log("Seeding administrations...");
  for (const a of administrations) {
    await prisma.administration.upsert({
      where: { code: a.code },
      update: { nameUz: a.nameUz, nameRu: a.nameRu, country: a.country },
      create: a,
    });
  }

  console.log("Seeding stations...");
  for (const s of stations) {
    await prisma.station.upsert({
      where: { code: s.code },
      update: { nameUz: s.nameUz, nameRu: s.nameRu, country: s.country },
      create: s,
    });
  }

  console.log("Seeding superadmin...");
  await prisma.user.upsert({
    where: { login: "superadmin" },
    update: {},
    create: {
      login: "superadmin",
      fullName: "Super Admin",
      role: "SUPERADMIN",
      passwordHash: await bcrypt.hash("superadmin123", 10),
    },
  });

  const admCount = await prisma.administration.count();
  const stCount = await prisma.station.count();
  console.log(`Done. Administrations: ${admCount}, Stations: ${stCount}. Login: superadmin / superadmin123`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
