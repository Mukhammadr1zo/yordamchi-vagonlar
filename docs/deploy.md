# Joylashtirish — helper-vagons.d-railway.uz

**Server:** `89.39.94.99` · **Domen:** `d-railway.uz` (NGINX) · **Subdomen:** `helper-vagons.d-railway.uz`

> ⚠️ `d-railway.uz` da allaqachon **analitika platformasi** ishlayapti. Quyidagi qadamlar unga **TEGMAYDI** — biz faqat yangi **alohida** subdomen va NGINX bloki qo'shamiz. Ilova **3100** portda ishlaydi (platformaning 3000/3001 portlari bilan to'qnashmaslik uchun).

---

## 0. Tayyorgarlik
SSH bilan serverga kiring:
```bash
ssh root@89.39.94.99
```
Docker va NGINX o'rnatilganini tekshiring (platforma uchun bor bo'lishi kerak):
```bash
docker --version && docker compose version && nginx -v
```

---

## 1. DNS — `helper-vagons` subdomenini qo'shish
`d-railway.uz` DNS panelida (domen provayderi yoki Cloudflare):

| Tur | Nom (host) | Qiymat | Proxy/TTL |
|-----|-----------|--------|-----------|
| **A** | `helper-vagons` | `89.39.94.99` | Auto |

Tekshirish (DNS tarqalgach):
```bash
dig +short helper-vagons.d-railway.uz     # 89.39.94.99 chiqishi kerak
```

---

## 2. Kodni serverga olish
```bash
sudo mkdir -p /opt/helper-vagons && cd /opt/helper-vagons
# git orqali:
git clone <repo-url> .
#   yoki lokal mashinadan:  scp -r ./* root@89.39.94.99:/opt/helper-vagons/
```

---

## 3. `.env.prod` faylini yaratish
```bash
cd /opt/helper-vagons
cat > .env.prod <<'EOF'
POSTGRES_USER=vagon
POSTGRES_PASSWORD=BU_YERGA_KUCHLI_PAROL
POSTGRES_DB=vagon_db
AUTH_SECRET=BU_YERGA_SECRET
AUTH_URL=https://helper-vagons.d-railway.uz
EOF

# AUTH_SECRET generatsiya:
openssl rand -base64 32
# natijani .env.prod dagi AUTH_SECRET ga qo'ying
```

---

## 4. Ilovani Docker'da ishga tushirish
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```
- Ilova **`127.0.0.1:3100`** da ishlaydi (faqat localhost — tashqaridan ko'rinmaydi).
- PostgreSQL ichki tarmoqда (porti tashqariga ochilmagan).
- Migratsiya konteyner ichida avtomatik (`prisma migrate deploy`).

Tekshirish:
```bash
docker compose -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:3100/uz/dashboard      # 200 yoki 307
```

Ma'lumotnomani to'ldirish (bir marta — davlatlar/stansiyalar). Production image'da `tsx` yo'q, shuning uchun SQL orqali (db konteyner ichida):
```bash
docker compose -f docker-compose.prod.yml exec -T db psql -U vagon -d vagon_db < deploy/seed.sql
```

---

## 5. NGINX server bloki (alohida fayl)
```bash
sudo cp /opt/helper-vagons/deploy/nginx/helper-vagons.conf /etc/nginx/sites-available/helper-vagons.conf
sudo ln -s /etc/nginx/sites-available/helper-vagons.conf /etc/nginx/sites-enabled/
sudo nginx -t          # sintaksis tekshiruvi — "ok" bo'lishi kerak
sudo systemctl reload nginx
```
> Agar sizda `sites-available/` yo'q bo'lsa (ba'zi tizimlarda), blokni `/etc/nginx/conf.d/helper-vagons.conf` ga qo'ying.

---

## 6. HTTPS sertifikat (Let's Encrypt)
```bash
sudo certbot --nginx -d helper-vagons.d-railway.uz
```
Certbot 443 blokini va 80→443 redirectni avtomatik qo'shadi. (Certbot d-railway.uz uchun allaqachon o'rnatilgan bo'lsa shu buyruq yetarli.)

---

## 7. Yakuniy tekshiruv
```bash
curl -I https://helper-vagons.d-railway.uz/uz/dashboard
```
Brauzer: **https://helper-vagons.d-railway.uz** → boshqaruv paneli ochilishi kerak.

---

## ⚙️ Agar NGINX Docker konteynerida bo'lsa
Analitika platformasi NGINX'i konteynerda bo'lsa, `127.0.0.1:3100` konteyner ichidan ko'rinmaydi. Ikki yo'l:
1. **Eng toza:** ilova konteynerini platformaning NGINX tarmog'iga ulang va `proxy_pass http://vagon_app_prod:3000;` yozing (port-mapping kerak emas).
2. Yoki ilovani host tarmog'ida 3100 da qoldirib, NGINX'dan `proxy_pass http://89.39.94.99:3100;` (bu holda firewall'da 3100 ni faqat ichki ochiq qiling).

---

## 🔄 Yangilash (keyingi versiyalar)
```bash
cd /opt/helper-vagons && git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## 🔐 Eslatmalar
- Firewall: **80, 443** ochiq; **3100 va DB porti** tashqariga ochilmasin.
- `serverActions.allowedOrigins` (next.config.ts) da `helper-vagons.d-railway.uz` bor — proxy `X-Forwarded-Proto`/`Host` ni uzatadi (config'da bor), shuning uchun qo'shish/tahrir/o'chirish ishlaydi.
- Mavjud `d-railway.uz` bloklarini **o'zgartirmang** — bu blok mustaqil.
