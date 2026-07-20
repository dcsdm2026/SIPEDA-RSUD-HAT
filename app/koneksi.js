// === FILE: app/koneksi.js ===
// Konfigurasi Koneksi Supabase

const SUPABASE_URL = "https://ejvgembwkxgozpuuonpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdmdlbWJ3a3hnb3pwdXVvbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzQwNzAsImV4cCI6MjA1NjgxMDA3MH0.T3vTbdF5zX090kI9P_GUpv9w_Vz2xV78u3E04V--FkE";

// Inisialisasi Klien Supabase Global (Mencegah SyntaxError: Identifier already declared)
if (typeof supabase !== 'undefined' && supabase.createClient) {
    window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Koneksi Supabase Berhasil Diinisialisasi.");
} else {
    console.error("❌ CDN Supabase JS belum terkonfigurasi dengan benar di HTML!");
}
