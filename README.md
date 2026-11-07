# Dashboard Monitoring Absensi
Sistem absensi berbasis Internet of Things (IoT) menggunakan ESP32 dan RFID RC522. Sistem membaca kartu RFID, memvalidasi UID kartu, menampilkan informasi mahasiswa melalui OLED, serta mengirimkan data kehadiran ke Google Sheets melalui Google Apps Script melalui protocol httpclient menggunakan wifi. Dilengkapi dashboard berbasis website. sistem ini masih jalan di local

## Komponen yang Digunakan

| No. | Komponen | Jumlah | Fungsi |
|---:|---|---:|---|
| 1 | ESP32 Dev Module | 1 | Mikrokontroler utama |
| 2 | RFID RC522 | 1 | Membaca UID kartu RFID |
| 3 | RFID Card / Tag | Sesuai kebutuhan | Identitas pengguna |
| 4 | OLED Display 0.96" SSD1306 | 1 | Menampilkan informasi absensi |
| 5 | Breadboard | 1 | Media perakitan rangkaian |
| 6 | Buzzer | 1 | Indikator suara |
| 7 | LED Hijau | 1 | Indikator kartu terdaftar |
| 8 | LED Merah | 1 | Indikator kartu tidak terdaftar |
| 9 | Resistor 220Ω | 2 | Membatasi arus LED |
| 10 | Kabel Jumper | Secukupnya | Menghubungkan komponen |


## Wiring dan Koneksi Komponen

### A. ESP32 dengan RFID RC522

Modul RC522 menggunakan komunikasi SPI.

| No. | Pin RC522 | Pin ESP32 |
|---:|---|---|
| 1 | SDA / SS | GPIO 5 |
| 2 | SCK | GPIO 18 |
| 3 | MOSI | GPIO 23 |
| 4 | MISO | GPIO 19 |
| 5 | RST | GPIO 4 |
| 6 | 3.3V | 3V3 |
| 7 | GND | GND |

**Catatan:** Pin SDA pada RC522 merupakan pin SS untuk komunikasi SPI, bukan SDA I2C. RC522 wajib menggunakan tegangan 3.3V, bukan 5V.

### B. ESP32 dengan OLED SSD1306 0.96"

OLED menggunakan komunikasi I2C.

| No. | Pin OLED | Pin ESP32 |
|---:|---|---|
| 1 | VCC | 3V3 |
| 2 | GND | GND |
| 3 | SDA | GPIO 21 |
| 4 | SCL | GPIO 22 |

Konfigurasi OLED:
- Resolusi: 128 × 64 pixel
- Alamat I2C: 0x3C
- Komunikasi: I2C

### C. ESP32 dengan LED

| No. | Komponen | Koneksi ESP32 |
|---:|---|---|
| 1 | LED Hijau (Anoda) | GPIO 27 melalui resistor 220Ω |
| 2 | LED Hijau (Katoda) | GND |
| 3 | LED Merah (Anoda) | GPIO 25 melalui resistor 220Ω |
| 4 | LED Merah (Katoda) | GND |

Keterangan:
- LED hijau menyala ketika kartu RFID terdaftar.
- LED merah menyala ketika kartu RFID tidak terdaftar.
- Resistor 220Ω digunakan untuk membatasi arus LED.

### D. ESP32 dengan Buzzer

| No. | Pin Buzzer | Pin ESP32 |
|---:|---|---|
| 1 | Positif (+) | GPIO 26 |
| 2 | Negatif (-) | GND |

Pastikan spesifikasi buzzer sesuai dengan kemampuan output GPIO ESP32. Gunakan transistor driver jika buzzer membutuhkan arus lebih besar.

## Library yang Dibutuhkan

Instal library berikut melalui Arduino IDE Library Manager:

| No. | Nama Library | Kegunaan |
|---:|---|---|
| 1 | MFRC522 | Komunikasi dengan RFID RC522 |
| 2 | Adafruit GFX Library | Library grafis OLED |
| 3 | Adafruit SSD1306 | Mengontrol OLED SSD1306 |

Library bawaan ESP32:
- SPI
- Wire
- WiFi
- WiFiClientSecure
- HTTPClient

Pastikan ESP32 Board Package sudah terpasang di Arduino IDE.


## Menyiapkan Apps Script

1. Buka proyek Apps Script yang saat ini menerima data ESP32.
2. Tambahkan isi `apps-script/doGet.gs` dan `apps-script/doPost.gs`
3. Ubah `ATTENDANCE_SHEET_NAME` agar sama persis dengan nama tab spreadsheet. Pastikan delapan header berada di baris pertama dalam urutan di atas.
4. Simpan, lalu pilih **Deploy → Manage deployments → Edit → New version → Deploy**. Pertahankan URL deployment Web App yang sudah dipakai ESP32.
5. Buka URL `/exec` di browser untuk melihat respons JSON. Dashboard meminta `?callback=...` (JSONP) agar dapat mengikuti redirect ContentService Google Apps Script tanpa kendala CORS browser.

Endpoint `doGet` hanya membaca data. Bila Web App disetel agar dapat diakses siapa saja, nama dan NIM siswa juga dapat dibaca siapa saja; atur izin deployment sesuai kebijakan sekolah. Jangan taruh password Wi-Fi atau API key ESP32 di frontend, URL, atau parameter dashboard.

## Menjalankan dashboard

1. Salin `.env.example` menjadi `.env.local`.
2. Ganti `DEPLOYMENT_ID` dengan URL Web App milikmu yang berakhiran `/exec`.
3. Jalankan `npm install`, lalu `npm run dev` dan buka alamat lokal yang ditampilkan Vite.
4. Dashboard memuat ulang data otomatis setiap 30 detik. Tombol **Perbarui data** memuat ulang seketika.

Untuk menghasilkan berkas hosting, jalankan `npm run build`; hasilnya ada di `dist/`. Isi `VITE_APPS_SCRIPT_URL` sebelum proses build.

## Fitur

- Ringkasan total catatan absensi, kehadiran hari ini, dan siswa unik yang pernah tercatat.
- Pencarian nama/NIM/UID, filter tanggal/kelas/status, serta ekspor CSV.
- Refresh manual dan otomatis tiap 30 detik.

Jumlah siswa terdaftar atau belum hadir tidak bisa dihitung dari sheet absensi saja; metrik tersebut memerlukan daftar roster siswa.

## Panduan lengkap

Lihat [Panduan Menjalankan Smart Attendance System](PANDUAN_MENJALANKAN.md) untuk langkah terperinci menyiapkan Google Sheets dan Apps Script, mengunggah firmware ke ESP32, menjalankan dashboard, serta memeriksa kendala umum.
