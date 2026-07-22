// === FILE: app/koneksi.js ===
const SUPABASE_URL = "https://ejvgembwkxgozpuuonpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdmdlbWJ3a3hnb3pwdXVvbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MDQ3MzMsImV4cCI6MjEwMDA4MDczM30.V-QRzrmL4ZD9KELbdZcHLsnF2L87HuL9NTzfy-MDbqs";

if (typeof supabase !== 'undefined' && supabase.createClient) {
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Set kedua variabel ke window global
    window.supabaseClient = client;
    window.db = client;
    
    console.log("✅ Koneksi Supabase Berhasil Diinisialisasi.");
} else {
    console.error("❌ CDN Supabase JS belum dimuat di file HTML!");
}
