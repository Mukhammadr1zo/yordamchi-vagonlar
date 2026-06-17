-- Ma'lumotnoma (reference) — administratsiyalar va namuna stansiyalar.
-- Production'da ishlatish (db konteyner ichida):
--   docker compose -f docker-compose.prod.yml exec -T db psql -U vagon -d vagon_db < deploy/seed.sql
-- ON CONFLICT tufayli qayta ishga tushirsa ham xavfsiz (dublikat yaratmaydi).
-- DIQQAT: kodlar namuna — buyurtmachi bilan tekshirilsin.

INSERT INTO administrations (id, code, "nameUz", "nameRu", country) VALUES
  (gen_random_uuid()::text, '29', 'O''zbekiston temir yo''llari (UTY)', 'Узбекские ж.д. (УТЙ)', 'O''zbekiston'),
  (gen_random_uuid()::text, '20', 'Rossiya temir yo''llari (RJD)', 'РЖД', 'Rossiya'),
  (gen_random_uuid()::text, '27', 'Qozog''iston temir yo''llari (KTJ)', 'КТЖ', 'Qozog''iston'),
  (gen_random_uuid()::text, '21', 'Belarus temir yo''li (BCh)', 'БЧ', 'Belarus'),
  (gen_random_uuid()::text, '22', 'Ukraina temir yo''li (UZ)', 'УЗ', 'Ukraina'),
  (gen_random_uuid()::text, '67', 'Turkmaniston temir yo''li', 'ТЖД Туркменистан', 'Turkmaniston'),
  (gen_random_uuid()::text, '66', 'Tojikiston temir yo''li', 'ТЖД Таджикистан', 'Tojikiston'),
  (gen_random_uuid()::text, '59', 'Qirg''iziston temir yo''li', 'КРЖД', 'Qirg''iziston'),
  (gen_random_uuid()::text, '57', 'Ozarbayjon temir yo''li (ADY)', 'АЖД', 'Ozarbayjon'),
  (gen_random_uuid()::text, '28', 'Gruziya temir yo''li', 'ГР', 'Gruziya')
ON CONFLICT (code) DO NOTHING;

INSERT INTO stations (id, code, "nameUz", "nameRu", country) VALUES
  (gen_random_uuid()::text, '700000', 'Toshkent', 'Ташкент', 'O''zbekiston'),
  (gen_random_uuid()::text, '734000', 'Keles', 'Келес', 'O''zbekiston'),
  (gen_random_uuid()::text, '725000', 'Sirg''ali', 'Сергели', 'O''zbekiston'),
  (gen_random_uuid()::text, '710000', 'Xovos', 'Хаваст', 'O''zbekiston'),
  (gen_random_uuid()::text, '740000', 'Qo''ng''irot', 'Кунград', 'O''zbekiston'),
  (gen_random_uuid()::text, '800000', 'Saryog''och (chegara)', 'Сарыагаш (граница)', 'Qozog''iston')
ON CONFLICT (code) DO NOTHING;
