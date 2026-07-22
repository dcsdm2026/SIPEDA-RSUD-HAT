// Import Supabase Client (sesuaikan dengan konfigurasi Anda)
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. CEK SESI LOGIN (Auth Guard)
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    // Jika tidak ada sesi login, kembalikan ke login
    alert("Sesi Anda telah berakhir. Silakan login kembali.");
    window.location.href = 'login.html';
    return;
  }

  // 2. TAMPILKAN EMAIL/NAMA USER DI SIDEBAR
  const userEmail = session.user.email;
  const userEl = document.getElementById('userProfileName');
  if (userEl) userEl.textContent = userEmail;

  // 3. INISIALISASI EVENT SIDEBAR MOBILE
  const sidebar = document.getElementById('sidebar');
  const sidebarCollapse = document.getElementById('sidebarCollapse');
  const sidebarClose = document.getElementById('sidebarClose');

  if (sidebarCollapse) {
    sidebarCollapse.addEventListener('click', () => sidebar.classList.add('active'));
  }
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => sidebar.classList.remove('active'));
  }
});

// 4. FUNGSI SET ACTIVE MENU
window.setActive = function(element) {
  document.querySelectorAll('.nav-link-custom').forEach(item => {
    item.classList.remove('active');
  });
  element.classList.add('active');

  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768 && sidebar) {
    sidebar.classList.remove('active');
  }
};

// 5. FUNGSI LOGOUT DENGAN SUPABASE
window.prosesLogout = async function(event) {
  event.preventDefault();
  if (confirm("Apakah Anda yakin ingin keluar dari aplikasi SIPEDA?")) {
    // Logout dari Supabase Session
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  }
};
