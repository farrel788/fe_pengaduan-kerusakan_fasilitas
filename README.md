# Pengaduan Fasilitas Sekolah

Aplikasi web untuk melaporkan kerusakan fasilitas sekolah agar laporan tercatat, ditugaskan ke teknisi, dan dipantau sampai selesai. Frontend dibuat dengan HTML, CSS, dan JavaScript murni, terhubung ke REST API Laravel.

## Fitur

### Umum

- Login dengan NISN untuk siswa, atau email + password untuk admin/teknisi.
- Logout, dan sesi disimpan di browser.
- Setiap peran langsung diarahkan ke halamannya sendiri.
- Tampilan responsif, nyaman dibuka di HP.
- Pesan kesalahan dari server (validasi 422, akses ditolak 403, data tidak ada 404) tampil dalam bahasa yang jelas.

### Siswa

- **Laporan saya:** riwayat laporan, dengan tab filter status (Semua, Menunggu, Diproses, Selesai, Ditolak) yang menampilkan jumlahnya.
- **Buat laporan:** pilih kategori, isi lokasi dan deskripsi, pilih urgensi, lalu unggah maksimal 2 foto dengan pratinjau.
- **Detail laporan:** progres bertahap, catatan dari admin, foto bukti, foto hasil perbaikan, dan info teknisi.
- **Percakapan:** kirim pesan dua arah dengan admin atau teknisi di setiap laporan.
- **Notifikasi:** daftar notifikasi, penanda jumlah yang belum dibaca di menu, tandai dibaca, dan klik untuk langsung ke laporannya.

### Admin

- **Ringkasan:** jumlah laporan per status, bar komposisi, dan daftar laporan yang masih menunggu.
- **Semua laporan:** filter berdasarkan status, kategori, dan urgensi, plus jumlah hasilnya.
- **Tindakan di halaman detail:** tugaskan teknisi, ubah status disertai catatan, dan unggah foto hasil perbaikan.
- Admin juga bisa ikut percakapan di setiap laporan.

### Belum ada

- Pencarian teks bebas di daftar laporan.
- Halaman khusus untuk teknisi (saat ini teknisi masuk ke tampilan admin).
- Edit atau hapus laporan.
- Pendaftaran akun.
- Dropdown daftar teknisi. Saat ini berupa input ID teknisi, kecuali backend menyediakan `GET /api/admin/teknisi`.

## Menjalankan

1. Jalankan backend Laravel (default `http://localhost:8000`) dan pastikan CORS mengizinkan asal frontend.
2. Sesuaikan `CONFIG` di bagian atas `app.js`:

   ```js
   const CONFIG = {
     API: 'http://localhost:8000/api',
     STORAGE: 'http://localhost:8000/storage',
     FIELD_FOTO: 'foto[]',
   };
   ```

3. Buka `index.html` di browser, atau layani folder ini dengan server statis, misalnya `npx serve .`

## Struktur

```
index.html   kerangka halaman
style.css    tampilan
app.js       logika, routing, dan pemanggilan API
```
