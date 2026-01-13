---

# Yemekhane Backend

Bu proje, Yemekhane App mobil uygulamasının arka uç (backend) API'sini barındırır.
API, istemciden gelen istekleri işler, veritabanı ile etkileşir ve uygulamanın çalışması için gerekli verileri sağlar.

---

## Teknolojiler

Bu backend projesi aşağıdaki teknolojilerle geliştirilmiştir:

* **Node.js** – Sunucu tarafı çalışma ortamı
* **Express.js** – REST API oluşturmak için web framework
* **JavaScript** – Uygulama dili
* **seed_data.js** – Başlangıç verilerini veritabanına eklemek için script
* **inspect_db.js** – Veritabanı inceleme / test scripti
* **package.json / package-lock.json** – Bağımlılık yönetimi

---

## Proje Yapısı

```
├── config/           # Ortam ayarları / config
├── middleware/       # Ara katman yazılımları
├── routes/           # API endpoint tanımları
├── .gitignore        # Git ignore kuralları
├── inspect_db.js     # DB inceleme scripti
├── seed_data.js      # Test / başlangıç verisi ekleme
├── server.js         # Sunucu giriş noktası
├── package.json      # Proje bağımlılıkları
└── package-lock.json # Bağımlılık versiyon kontrolü
```

---

## Çalıştırma

Aşağıdaki adımlarla backend API’yi çalıştırabilirsin:

### Gereksinimler

* Node.js (12+)
* npm

---

### Adımlar

1. Depoyu klonla:

```bash
git clone https://github.com/isil-ada/yemekhane_backend.git
cd yemekhane_backend
```

2. Bağımlılıkları yükle:

```bash
npm install
```

3. Sunucuyu başlat:

```bash
npm start
```

Varsayılan olarak sunucu **[http://localhost:3000](http://localhost:3000)** üzerinde çalışır.

---

## Kullanım

API endpoint’leri ile:

* Menü verilerini sorgulayabilir
* Kullanıcı isteklerini alabilir
* Veritabanı üzerinden yemek bilgilerine erişebilirsin

> API detayları endpoint tanımları `routes/` klasöründe yer alır.

---

## Veritabanı (Opsiyonel)

* `seed_data.js`: Başlangıç verilerini ekler
* `inspect_db.js`: Veritabanını inceler

Bu scriptleri çalıştırarak veritabanı içeriğini test edebilirsin.

---

## Lisans

Bu proje eğitim ve proje amacıyla hazırlanmıştır.
*Ticari amaçla kullanılması veya çoğaltılması **yasaktır***.

---
