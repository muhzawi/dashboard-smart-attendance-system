# Attendly — Dashboard Absensi

Dashboard React + Vite untuk memantau spreadsheet absensi ESP32 dengan kolom yang ada: `No, UID, Nama, NIM, Kelas, Tanggal, Waktu, Status`.

## Menyiapkan Apps Script

1. Buka proyek Apps Script yang saat ini menerima data ESP32.
2. Tambahkan isi `apps-script/doGet.gs` ke proyek yang sama. Biarkan fungsi `doPost(e)` yang sudah dipakai ESP32 tetap ada.
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
