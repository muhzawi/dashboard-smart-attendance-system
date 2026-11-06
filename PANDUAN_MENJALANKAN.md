# Panduan Menjalankan Smart Attendance System

Panduan ini menjelaskan alur dari menyiapkan Google Sheets dan Apps Script, mengunggah program ke ESP32, sampai membuka dashboard web. Jalankan tahap-tahapnya secara berurutan.

## 1. Siapkan perangkat

Rangkai ESP32, RC522, OLED, LED, dan buzzer sesuai tabel berikut. Semua GND harus tersambung bersama.

| Perangkat | Pin perangkat | Pin ESP32 |
|---|---|---|
| RC522 | SDA / SS | GPIO 5 |
| RC522 | SCK | GPIO 18 |
| RC522 | MOSI | GPIO 23 |
| RC522 | MISO | GPIO 19 |
| RC522 | RST | GPIO 4 |
| RC522 | 3.3V, GND | 3V3, GND |
| OLED SSD1306 | SDA, SCL | GPIO 21, GPIO 22 |
| OLED SSD1306 | VCC, GND | 3V3, GND |
| LED hijau | Anoda melalui resistor 220 ohm | GPIO 27 |
| LED merah | Anoda melalui resistor 220 ohm | GPIO 25 |
| Kedua LED | Katoda | GND |
| Buzzer | Positif, negatif | GPIO 26, GND |

RC522 menggunakan 3.3V, jangan hubungkan ke 5V. Gunakan resistor seri untuk LED. Bila buzzer memerlukan arus lebih besar dari kemampuan pin ESP32, gunakan transistor driver.

## 2. Buat Google Sheet

1. Buat spreadsheet baru di Google Sheets.
2. Ubah nama tab bawah spreadsheet menjadi `Absensi` (atau pilih nama lain, lalu gunakan nama yang sama di semua konfigurasi).
3. Isi baris pertama dengan delapan judul berikut, persis dalam urutan ini:

   `No` | `UID` | `Nama` | `NIM` | `Kelas` | `Tanggal` | `Waktu` | `Status`

Jangan tambahkan kolom di tengah delapan kolom tersebut. `doPost.gs` menambahkan baris absensi, sedangkan `doGet.gs` membaca baris untuk dashboard.

## 3. Siapkan dan deploy Google Apps Script

1. Dari spreadsheet, buka **Extensions > Apps Script**. Script yang dibuat dari spreadsheet ini terhubung ke spreadsheet tersebut; fungsi menggunakan `SpreadsheetApp.getActiveSpreadsheet()`.
2. Di editor Apps Script, buat atau gunakan dua file script. Salin isi `apps-script/doPost.gs` ke file untuk `doPost`, lalu salin isi `apps-script/doGet.gs` ke file lain. Kedua file berada dalam satu proyek Apps Script.
3. Pada `doPost.gs`, ganti `SHEET_NAME` dengan nama tab spreadsheet. Pada `doGet.gs`, ganti `ATTENDANCE_SHEET_NAME` dengan nama yang sama. Keduanya harus sama persis, termasuk huruf besar/kecil.
4. Ganti nilai `API_KEY` di `doPost.gs` dengan kunci acak milik proyek. Simpan kunci itu untuk langkah konfigurasi ESP32; nilai di kedua tempat harus identik. Jangan taruh kunci ini di kode frontend.
5. Klik **Save**.
6. Pilih **Deploy > New deployment**. Klik ikon jenis deployment, pilih **Web app**, lalu set **Execute as** ke akun Anda. Atur siapa yang dapat mengakses agar perangkat dan dashboard dapat mencapai endpoint. Untuk penggunaan publik, pertimbangkan bahwa `doGet` mengirimkan seluruh catatan absensi, termasuk nama dan NIM.
7. Klik **Deploy** dan berikan otorisasi Google bila diminta.
8. Salin URL Web App yang berakhiran `/exec`. URL ini akan digunakan di firmware dan `.env.local` dashboard.

Jika mengubah kode setelah deployment, buka **Deploy > Manage deployments**, edit deployment, pilih **New version**, lalu deploy. Gunakan URL deployment yang ditampilkan. Mengubah kode editor saja tidak memperbarui versi Web App yang sudah aktif.

## 4. Tes endpoint Apps Script

Buka URL `/exec` dari deployment di browser. Jika berhasil, respons berbentuk JSON yang memuat `success: true` dan `records` (bisa berupa array kosong sebelum ada absensi). Jika muncul error, periksa nama tab dan judul kolom. Dashboard menggunakan parameter JSONP untuk membaca data dari endpoint tersebut.

## 5. Siapkan dan unggah firmware ESP32

### Instalasi Arduino IDE

1. Instal Arduino IDE dan dukungan board ESP32 melalui Boards Manager Arduino IDE. Pilih paket **esp32 by Espressif Systems**.
2. Dari Library Manager, instal:
   - `MFRC522`
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`
3. Buka `arduino-script/code.txt`. Buat sketch baru di Arduino IDE, salin seluruh isi file tersebut ke sketch, lalu simpan sebagai `SmartAttendance.ino` (nama folder sketch dan nama file `.ino` harus sama).
4. Pada bagian konfigurasi di awal sketch, isi nilai berikut:

   ```cpp
   const char* WIFI_SSID = "NAMA_WIFI";
   const char* WIFI_PASSWORD = "PASSWORD_WIFI";
   const char* SCRIPT_URL = "https://script.google.com/macros/s/ID_DEPLOYMENT/exec";
   const char* API_KEY = "API_KEY_YANG_SAMA_DENGAN_APPS_SCRIPT";
   ```

   ESP32 harus tersambung ke jaringan Wi-Fi 2.4 GHz yang dapat mengakses internet. URL harus berupa URL Web App `/exec`, bukan URL editor Apps Script. Jangan membagikan sketch yang berisi kredensial Wi-Fi atau API key.
5. Sesuaikan daftar `dataMahasiswa` dengan UID kartu dan data pemilik kartu. UID harus ditulis dalam format byte heksadesimal dipisahkan spasi, misalnya `7E 51 D8 05`. Kartu yang UID-nya tidak ada dalam daftar akan ditolak dan tidak dikirim ke Sheet.
6. Sambungkan board dengan USB. Di Arduino IDE pilih board ESP32 yang sesuai, pilih port serial yang muncul, lalu klik **Verify** untuk kompilasi.
7. Klik **Upload**. Jika IDE berhenti di `Connecting...`, tekan dan tahan tombol **BOOT** pada board saat proses mulai, lalu lepaskan ketika proses upload berlangsung.
8. Buka **Tools > Serial Monitor**, pilih `115200 baud`, lalu tekan tombol **EN/RESET**. Pastikan log menunjukkan Wi-Fi tersambung dan sistem aktif.
9. Tempelkan kartu terdaftar ke RC522. OLED/Serial Monitor seharusnya menunjukkan data dan status berhasil; periksa apakah baris baru masuk ke Google Sheet.

## 6. Jalankan dashboard web di komputer

Pastikan Node.js dan npm tersedia. Dari terminal, pindah ke folder proyek lalu jalankan:

```bash
npm install
```

Buat atau edit file `.env.local` di folder utama proyek dan isi URL deployment Apps Script yang sama:

```dotenv
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/ID_DEPLOYMENT/exec
```

Jalankan server pengembangan:

```bash
npm run dev
```

Buka alamat lokal yang ditampilkan Vite (biasanya `http://localhost:5173`). Dashboard memuat ulang data otomatis setiap 30 detik; tombol **Perbarui data** memuat ulang seketika. File `.env.local` diabaikan Git, jadi buat file itu secara lokal dan jangan commit kredensial.

Untuk membuat berkas siap hosting statis:

```bash
npm run build
```

Hasil build berada di `dist/`. Atur `VITE_APPS_SCRIPT_URL` sebelum build. Jika mengubah nilai environment setelah build, build ulang agar perubahan masuk ke aplikasi.

## 7. Pemeriksaan jika belum berhasil

- **OLED tidak menyala:** periksa catu 3.3V, GND, jalur SDA/SCL, dan alamat I2C `0x3C`.
- **Kartu tidak terbaca:** periksa kabel RC522, terutama SS/GPIO 5, RST/GPIO 4, dan catu 3.3V. Pastikan UID kartu sudah dimasukkan ke `dataMahasiswa`.
- **Wi-Fi gagal:** pastikan SSID/password benar dan jaringan yang digunakan ESP32 mendukung koneksi 2.4 GHz.
- **Tidak ada baris baru di Sheet:** pastikan URL deployment `/exec`, API key sama, nama tab sama pada kedua file Apps Script, header benar, deployment sudah diperbarui ke versi terbaru, dan akses Web App sesuai.
- **Dashboard menampilkan error:** pastikan `.env.local` berada di root proyek dan nama variabel tepat `VITE_APPS_SCRIPT_URL`. Setelah mengubahnya, mulai ulang `npm run dev`. Coba buka URL `/exec` di browser untuk memeriksa respons dan izin akses.
- **Kartu ter-scan berulang:** firmware saat ini mengirim absensi setiap kali kartu dibaca. Tempelkan kartu sekali dan angkat sebelum scan berikutnya.

## Catatan keamanan

Apps Script Web App perlu dapat diakses oleh klien yang menggunakannya. Endpoint GET dashboard mengembalikan semua catatan di spreadsheet, termasuk data identitas. Batasi akses sesuai kebijakan dan kebutuhan proyek. Firmware saat ini menggunakan `client.setInsecure()` untuk koneksi TLS, sehingga tidak memverifikasi sertifikat server; gunakan hanya untuk demonstrasi/lingkungan yang risikonya dapat diterima dan pertimbangkan validasi sertifikat untuk penggunaan lebih luas.
