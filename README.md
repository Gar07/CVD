# 👁️‍🗨️ Real-Time Color Blindness Corrector & Simulator (PWA)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-PWA%20%7C%20Web%20%7C%20Mobile-success.svg)
![Tech Stack](https://img.shields.io/badge/tech-WebGL%20%7C%20GLSL%20%7C%20JS-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Aplikasi **Progressive Web App (PWA)** aksesibilitas visual berbasis *Client-Side Edge Computing*. Aplikasi ini menggunakan akselerasi perangkat keras **WebGL** dan algoritma matematika **Daltonization** yang ditulis dalam bahasa *GLSL Shader* untuk mengoreksi dan menyimulasikan 8 jenis anomali buta warna secara *real-time* (60 FPS) melalui kamera perangkat.

Dikembangkan sebagai luaran Skripsi Program Studi Ilmu Komputer, Universitas Negeri Medan.

## ✨ Fitur Utama
- **⚡ Akselerasi GPU (WebGL):** Pemrosesan citra *real-time* tanpa latensi jaringan (bebas server).
- **🛠️ Korektor & Simulator CVD:** Mendukung 8 mode (Protanopia, Deuteranopia, Tritanopia, Anomali, dan Achromatopsia).
- **🔍 Color Inspector:** Ketuk objek di layar untuk mendeteksi warna piksel (RGB) dan nama warna dalam bahasa Indonesia.
- **🎚️ Split-Screen Compare:** Geser tuas untuk membandingkan warna asli kamera dengan hasil koreksi GPU.
- **📱 Progressive Web App (PWA):** Dapat diinstal ke *Home Screen* Android/iOS/PC dan berjalan *offline*.
- **🔦 Integrasi Perangkat Keras:** Dilengkapi akses ke *Torch API* (Senter) dan fitur pengambil gambar (*Snapshot*).
- **📚 Modul Edukasi Terpadu:** Berisi ensiklopedia mini mengenai jenis buta warna dan cara kerja Daltonization.

## 🚀 Cara Instalasi & Menjalankan (Localhost)
Karena aplikasi ini menggunakan API Kamera (`getUserMedia`), *browser* mewajibkan aplikasi dijalankan melalui protokol aman (HTTPS atau `localhost`). Anda tidak bisa hanya mengeklik ganda file `index.html`.

1. Kloning repositori ini:
   ```bash
   git clone [https://github.com/Gar2007/cvd-corrector-pwa.git](https://github.com/Gar2007/cvd-corrector-pwa.git)
   cd cvd-corrector-pwa
2. Jalankan Local Web Server. Jika Anda menggunakan Python, jalankan:
   ```bash
   python3 -m http.server 8000```
   ```
(Alternatif: Gunakan ekstensi "Live Server" di VS Code).

3. Buka peramban web (Chrome/Safari) dan akses: ```http://localhost:8000```

4. Berikan izin akses kamera saat diminta.

## 📂 Struktur Direktori
```
/
├── index.html           # Struktur UI utama
├── manifest.json        # Konfigurasi PWA (Nama, Ikon, Tema)
├── service-worker.js    # Script caching untuk akses Offline
├── css/
│   └── style.css        # Desain antarmuka (Responsif & Minimalis)
└── js/
    ├── main.js          # Kontroler UI, Event Listener, PWA Register
    ├── webcam.js        # Modul WebRTC (Kamera & Torch API)
    ├── renderer.js      # Modul WebGL Engine & Kalkulasi FPS
    └── shaders.js       # Logika Algoritma Daltonization (GLSL)
```
