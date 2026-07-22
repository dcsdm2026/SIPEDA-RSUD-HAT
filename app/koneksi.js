// === FILE: app/koneksi.js ===
// Konfigurasi Koneksi Supabase

const SUPABASE_URL = "https://ejvgembwkxgozpuuonpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdmdlbWJ3a3hnb3pwdXVvbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MDQ3MzMsImV4cCI6MjEwMDA4MDczM30.V-QRzrmL4ZD9KELbdZcHLsnF2L87HuL9NTzfy-MDbqs";

// Cek apakah Library/CDN Supabase sudah berhasil dimuat oleh browser
if (typeof supabase !== 'undefined' && supabase.createClient) {
    // Inisialisasi Client Supabase
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Simpan ke window agar dapat diakses secara global oleh pegawai.js dan file JS lainnya
    window.supabaseClient = client;
    window.db = client; // Alias jika ada skrip lain yang memakai window.db
    
    console.log("✅ Koneksi Supabase Berhasil Diinisialisasi.");
} else {
    console.error("❌ CDN Supabase JS belum terkonfigurasi atau gagal dimuat di HTML!");
}

// Fallback variabel global
var supabaseClient = window.supabaseClient;
