// === FILE: app/koneksi.js ===

// 1. Konfigurasi Project Supabase Anda
// Ganti nilai string di bawah dengan URL & ANON KEY dari Supabase Dashboard Anda
const SUPABASE_URL = 'https://ejvgembwkxgozpuuonpd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdmdlbWJ3a3hnb3pwdXVvbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MDQ3MzMsImV4cCI6MjEwMDA4MDczM30.V-QRzrmL4ZD9KELbdZcHLsnF2L87HuL9NTzfy-MDbqs';              

// 2. Inisialisasi ke window.db
// PENTING: Gunakan library `supabase` bawaan CDN langsung tanpa membuat `const supabase`
if (typeof supabase !== 'undefined') {
    window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Koneksi Supabase berhasil diinisialisasi.");
} else {
    console.error("Library Supabase CDN belum dimuat! Periksa urutan <script> di HTML.");
}
