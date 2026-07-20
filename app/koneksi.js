// === FILE: app/koneksi.js ===
// Konfigurasi Koneksi Supabase

const SUPABASE_URL = "https://ejvgembwkxgozpuuonpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdmdlbWJ3a3hnb3pwdXVvbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MDQ3MzMsImV4cCI6MjEwMDA4MDczM30.V-QRzrmL4ZD9KELbdZcHLsnF2L87HuL9NTzfy-MDbqs";

// Inisialisasi Klien Supabase Global (Mencegah SyntaxError: Identifier already declared)
if (typeof supabase !== 'undefined' && supabase.createClient) {
    window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Koneksi Supabase Berhasil Diinisialisasi.");
} else {
    console.error("❌ CDN Supabase JS belum terkonfigurasi dengan benar di HTML!");
}
