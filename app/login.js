// === FILE: app/login.js ===
// Logika Proses Login & Pengarahan Berdasarkan Hak Akses

async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const btnLogin = document.getElementById('btnLogin');

    if (alertBox) alertBox.classList.add('hidden');

    if (!usernameInput || !passwordInput) {
        showAlert('Harap isi Email/NIK dan Kata Sandi!', 'red');
        return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memverifikasi...`;

    try {
        if (!window.db) {
            throw new Error("Koneksi Supabase belum siap. Periksa app/koneksi.js!");
        }

        // Cari pegawai berdasarkan email atau NIK
        const { data, error } = await window.db
            .from('pegawai')
            .select('*')
            .or(`email.eq.${usernameInput},nik.eq.${usernameInput}`)
            .maybeSingle();

        if (error) {
            throw new Error(`Database Error (${error.code}): ${error.message}`);
        }

        if (!data) {
            showAlert('Email atau NIK tidak terdaftar dalam sistem.', 'red');
            resetBtn();
            return;
        }

        // Verifikasi Kata Sandi
        const passwordDatabase = data.password || data.nik;

        if (passwordInput !== passwordDatabase) {
            showAlert('Kata sandi yang Anda masukkan salah.', 'red');
            resetBtn();
            return;
        }

        // Simpan sesi login ke LocalStorage
        const userRole = (data.aksesrole || 'user').toLowerCase();
        const userSession = {
            nik: data.nik,
            nama: data.nama,
            email: data.email,
            aksesrole: userRole,
            jabatan: data.jabatan,
            foto: data.upload_foto
        };
        localStorage.setItem('sipeda_user', JSON.stringify(userSession));

        showAlert(`Login Berhasil! Selamat datang, ${data.nama}`, 'green');

        // Pengarahan Halaman Berdasarkan Role
        setTimeout(() => {
            if (userRole === 'superadmin' || userRole === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'portal.html';
            }
        }, 1000);

    } catch (err) {
        console.error("Detail Error Login:", err);
        showAlert(`Gagal Login: ${err.message}`, 'red');
        resetBtn();
    }
}

function showAlert(message, type) {
    const alertBox = document.getElementById('loginAlert');
    if (!alertBox) return;
    alertBox.classList.remove('hidden');
    if (type === 'red') {
        alertBox.className = 'p-3.5 rounded-xl text-xs font-medium border bg-red-500/10 border-red-500/30 text-red-400';
    } else {
        alertBox.className = 'p-3.5 rounded-xl text-xs font-medium border bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
    alertBox.innerHTML = `<i class="fa-solid fa-circle-info mr-1.5"></i> ${message}`;
}

function resetBtn() {
    const btnLogin = document.getElementById('btnLogin');
    if (!btnLogin) return;
    btnLogin.disabled = false;
    btnLogin.innerHTML = `<span>Masuk ke Sistem</span> <i class="fa-solid fa-right-to-bracket text-xs"></i>`;
}

// Hubungkan ke scope window agar dapat dipanggil dari FORM HTML
window.handleLogin = handleLogin;
