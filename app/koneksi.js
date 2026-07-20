// Memuat CDN Supabase pada JS: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
const SUPABASE_URL = "https://ejvgembwkxgozpuuonpd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdmdlbWJ3a3hnb3pwdXVvbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1MDQ3MzMsImV4cCI6MjEwMDA4MDczM30.V-QRzrmL4ZD9KELbdZcHLsnF2L87HuL9NTzfy-MDbqs";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Export objek koneksi agar bisa dipanggil file lain
window.db = supabase;
