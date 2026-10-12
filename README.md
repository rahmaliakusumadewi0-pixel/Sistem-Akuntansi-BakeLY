Sistem Akuntansi Toko BakeLY

[Website: https://rahmaliakusumadewi0-pixel.github.io/Sistem-Akuntansi-Toko-BakeLY/](https://rahmaliakusumadewi0-pixel.github.io/Sistem-Akuntansi-Toko-BakeLY/)

Aplikasi berbasis web untuk membantu pengelolaan penjualan, persediaan bahan baku, produksi, dan pencatatan pemakaian bahan baku pada usaha bakery.

1. Deskripsi Sistem

Sistem Akuntansi Toko BakeLY merupakan aplikasi yang dirancang untuk mendukung pencatatan dan pengelolaan aktivitas operasional usaha bakery secara terstruktur. Sistem ini mencakup pengelolaan bahan baku, barang jadi, pemakaian bahan baku, produksi, dan penjualan. Dalam usaha bakery, kegiatan produksi membutuhkan bahan baku dengan jenis dan jumlah yang berbeda. Selain itu, jumlah produk yang dihasilkan dan penjualan perlu dicatat agar pemilik usaha dapat memantau persediaan serta aktivitas operasional dengan lebih mudah.
Aplikasi ini dikembangkan untuk membantu mengintegrasikan pencatatan persediaan, produksi, dan penjualan dalam satu sistem. Supabase digunakan sebagai backend dan PostgreSQL sebagai basis data untuk mendukung penyimpanan serta pengelolaan data aplikasi.

2. Tujuan Pengembangan

- Membantu pengelolaan data bahan baku dan persediaannya.
- Mempermudah pencatatan hasil produksi bakery.
- Mendukung pencatatan pemakaian bahan baku dalam proses produksi.
- Membantu pengelolaan data penjualan dan transaksi.
- Mempermudah pemantauan ketersediaan bahan baku dan barang jadi.
- Menyediakan informasi operasional untuk mendukung pengambilan keputusan usaha.

3. Fitur Utama

| Fitur | Deskripsi |
|---|---|
| Dashboard | Menampilkan ringkasan informasi penjualan, barang jadi, stok bahan baku, dan aktivitas produksi. |
| Bahan Baku | Mengelola data bahan baku, kode, nama, satuan, harga, dan jumlah persediaan. |
| Barang Jadi | Mengelola data produk bakery yang dihasilkan dan informasi persediaannya. |
| Produksi | Mencatat kegiatan produksi dan jumlah produk yang dihasilkan. |
| Pemakaian Bahan Baku | Mencatat bahan baku yang digunakan dalam proses produksi. |
| Penjualan | Mencatat transaksi penjualan produk bakery dan informasi terkait transaksi. |

4. Sistem Akuntansi pada Usaha Bakery

Sistem Akuntansi Toko BakeLY menerapkan konsep pencatatan akuntansi pada aktivitas persediaan, produksi, dan penjualan usaha bakery.

Pencatatan dilakukan dengan memperhatikan tiga kelompok utama berikut.

| Komponen | Penjelasan |
|---|---|
| Persediaan Bahan Baku | Mencatat bahan yang digunakan dalam proses produksi, seperti tepung terigu, gula, mentega, telur, dan ragi. |
| Persediaan Barang Jadi | Mencatat produk bakery yang telah selesai diproduksi dan tersedia untuk dijual. |
| Penjualan | Mencatat transaksi penjualan produk sebagai bagian dari aktivitas pendapatan usaha. |

Dalam kegiatan produksi, bahan baku digunakan untuk menghasilkan barang jadi. Selanjutnya, barang jadi yang tersedia dapat dijual kepada pelanggan. Pencatatan tersebut membantu pemilik usaha mengetahui pergerakan persediaan dan mengawasi aktivitas operasional bakery. Perhitungan harga pokok produksi dan laba memerlukan data biaya yang memadai, seperti biaya bahan baku, tenaga kerja langsung, dan overhead produksi.

5. Alur Sistem

- Pengguna membuka Dashboard untuk melihat ringkasan informasi operasional bakery.
- Pengguna mengelola data bahan baku melalui menu Bahan Baku.
- Pengguna mengelola produk bakery melalui menu Barang Jadi.
- Pengguna mencatat kegiatan produksi dan jumlah produk yang dihasilkan.
- Pengguna mencatat pemakaian bahan baku yang digunakan dalam proses produksi.
- Pengguna mencatat transaksi penjualan produk bakery.
- Data yang tersimpan digunakan untuk membantu pemantauan persediaan, produksi, dan penjualan.

6. Entity Relationship Diagram (ERD)

Entity Relationship Diagram (ERD) menggambarkan struktur basis data dan hubungan antartabel yang digunakan dalam Sistem Akuntansi Toko BakeLY.

Struktur utama basis data dirancang untuk mendukung pengelolaan bahan baku, barang jadi, pemakaian bahan baku, produksi, dan penjualan.

Deskripsi Tabel Database

| Nama Tabel | Fungsi |
|---|---|
| `bahan_baku` | Menyimpan informasi bahan baku, seperti kode, nama, satuan, harga, dan stok. |
| `barang_jadi` | Menyimpan data produk bakery yang dihasilkan dan informasi terkait produk. |
| `pemakaian_bb` | Menyimpan pencatatan penggunaan bahan baku dalam kegiatan produksi. |
| `produksi` | Menyimpan informasi kegiatan produksi dan jumlah produk yang dihasilkan. |
| `penjualan` | Menyimpan informasi transaksi penjualan produk bakery. |

Relasi Antartabel

Hubungan antartabel disusun untuk mendukung keterkaitan data persediaan, pemakaian bahan baku, produksi, dan penjualan.

- `bahan_baku` digunakan sebagai sumber data bahan dalam pencatatan pemakaian bahan baku.
- `pemakaian_bb` mendukung pencatatan bahan baku yang digunakan dalam proses produksi.
- `produksi` mencatat aktivitas produksi dan hasil produk bakery.
- `barang_jadi` menyimpan informasi produk yang dihasilkan dan dikelola untuk kebutuhan penjualan.
- `penjualan` mencatat transaksi penjualan produk bakery.

Relasi teknis, termasuk penggunaan primary key dan foreign key, mengikuti struktur tabel dan konfigurasi yang diterapkan pada basis data aplikasi.

7. Teknologi Pengembangan

| Komponen | Teknologi | Fungsi |
|---|---|---|
| Frontend | HTML, CSS, dan JavaScript | Membangun antarmuka dan fungsi aplikasi web. |
| Backend | Supabase | Menyediakan layanan backend dan akses ke basis data. |
| Database | PostgreSQL melalui Supabase | Menyimpan dan mengelola data aplikasi. |
| Visualisasi Data | Chart.js | Menampilkan grafik untuk membantu pemantauan informasi pada Dashboard. |
| Hosting | GitHub Pages | Menyediakan akses ke website aplikasi. |

8. Manfaat Sistem

- Membantu pencatatan persediaan bahan baku secara terstruktur.
- Mempermudah pemantauan ketersediaan bahan baku dan barang jadi.
- Mendukung pencatatan pemakaian bahan baku untuk produksi.
- Mempermudah pencatatan hasil produksi bakery.
- Membantu pengelolaan transaksi penjualan.
- Menyajikan ringkasan informasi operasional melalui Dashboard.
- Mendukung pengawasan dan evaluasi kegiatan usaha bakery.

9. Integrasi Basis Data

Sistem Akuntansi Toko BakeLY menggunakan Supabase dengan PostgreSQL sebagai basis data untuk menyimpan dan mengelola informasi aplikasi.

Struktur utama basis data terdiri atas tabel `bahan_baku`, `barang_jadi`, `pemakaian_bb`, `produksi`, dan `penjualan`. Setiap tabel memiliki fungsi yang mendukung pencatatan aktivitas operasional usaha bakery.

Integrasi basis data memungkinkan aplikasi mengelola data sesuai dengan fungsi masing-masing menu. Data yang dimasukkan melalui aplikasi disimpan berdasarkan konfigurasi dan struktur basis data yang diterapkan.

10. Penutup

Sistem Akuntansi Toko BakeLY merupakan implementasi konsep akuntansi pada pengelolaan usaha bakery melalui aplikasi berbasis web. Dengan fitur Dashboard, Bahan Baku, Barang Jadi, Produksi, Pemakaian Bahan Baku, dan Penjualan, aplikasi ini dirancang untuk membantu pencatatan aktivitas operasional secara lebih terstruktur.

Integrasi dengan Supabase dan PostgreSQL mendukung pengelolaan data dalam satu sistem sehingga informasi persediaan, produksi, dan penjualan dapat digunakan untuk membantu pemantauan serta evaluasi kegiatan usaha bakery.
