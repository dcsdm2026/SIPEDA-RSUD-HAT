// === FILE: app/login.js ===

async function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const btnLogin = document.getElementById('btnLogin');
    const alertBox = document.getElementById('loginAlert');

    if (!usernameInput || !passwordInput) {
        showAlert('Email/NIK dan Password wajib diisi!', 'error');
        return;
    }

    // Ubah tampilan tombol menjadi loading
    btnLogin.disabled = true;
    btnLogin.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-sm"></i> <span>Memproses...</span>`;
    alertBox.classList.add('hidden');

    try {
        if (!window.db) {
            throw new Error("Koneksi database belum siap. Periksa app/koneksi.js Anda.");
        }

        // Cari pegawai berdasarkan email ATAU NIK
        const { data, error } = await window.db
            .from('pegawai')
            .select('*')
            .or(`email.eq.${usernameInput},nik.eq.${usernameInput}`)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            showAlert('Akun tidak ditemukan. Periksa Email atau NIK Anda.', 'error');
            resetButton();
            return;
        }

        // Cek password sederhanakan (atau perbandingan default)
        // Catatan: Pastikan kolom password sesuai di database Supabase Anda
        const passDiDB = data.password || data.nik; 
        if (passwordInput !== passDiDB) {
            showAlert('Kata sandi yang Anda masukkan salah!', 'error');
            resetButton();
            return;
        }

        // Simpan sesi user ke localStorage
        localStorage.setItem('sipeda_user', JSON.stringify(data));

        showAlert('Login berhasil! Mengalihkan halaman...', 'success');

        setTimeout(() => {
            const role = (data.aksesrole || '').toLowerCase();
            if (role === 'superadmin' || role === 'admin') {
                // Diarahkan ke beranda.html
                window.location.href = 'beranda.html';
            } else {
                window.location.href = 'portal.html';
            }
        }, 1000);

    } catch (err) {
        console.error("Detail Error Login:", err);
        showAlert(`Gagal Login: ${err.message || 'Terjadi kesalahan sistem'}`, 'error');
        resetButton();
    }
}

function showAlert(message, type) {
    const alertBox = document.getElementById('loginAlert');
    alertBox.classList.remove('hidden', 'bg-red-500/10', 'border-red-500/30', 'text-red-400', 'bg-emerald-500/10', 'border-emerald-500/30', 'text-emerald-400');
    
    if (type === 'error') {
        alertBox.className = "mb-6 p-4 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2";
        alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation text-sm"></i> <span>${message}</span>`;
    } else {
        alertBox.className = "mb-6 p-4 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2";
        alertBox.innerHTML = `<i class="fa-solid fa-circle-check text-sm"></i> <span>${message}</span>`;
    }
}

function resetButton() {
    const btnLogin = document.getElementById('btnLogin');
    btnLogin.disabled = false;
    btnLogin.innerHTML = `<span>Masuk ke Sistem</span><i class="fa-solid fa-right-to-bracket text-xs"></i>`;
}

// Fungsi Toggle Password
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');

    if (!passwordInput || !toggleIcon) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash', 'text-emerald-400');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash', 'text-emerald-400');
        toggleIcon.classList.add('fa-eye');
    }
}

window.togglePassword = togglePassword;
