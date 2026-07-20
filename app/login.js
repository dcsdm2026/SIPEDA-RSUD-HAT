// === FILE: app/login.js ===

async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const alertBox = document.getElementById('loginAlert');
    const btnLogin = document.getElementById('btnLogin');

    if (alertBox) alertBox.classList.add('hidden');

    if (!usernameInput || !passwordInput) {
        showAlert('Harap isi NIK/Email dan Kata Sandi!', 'red');
        return;
    }

    btnLogin.disabled = true;
    btnLogin.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memverifikasi...`;

    try {
        if (!window.db) {
            throw new Error("Koneksi Supabase belum siap. Periksa app/koneksi.js!");
        }

        // Query data pegawai berdasarkan NIK atau Email
        const { data, error } = await window.db
            .from('pegawai')
            .select('*')
            .or(`nik.eq.${usernameInput},email.eq.${usernameInput}`)
            .maybeSingle();

        if (error) {
            throw new Error(`Database Error (${error.code}): ${error.message}`);
        }

        if (!data) {
            showAlert('NIK atau Email tidak terdaftar dalam sistem.', 'red');
            resetBtn();
            return;
        }

        // Cek Kata Sandi (Default menggunakan NIK jika kolom password belum diisi)
        const passwordDatabase = data.password || data.nik;

        if (passwordInput !== passwordDatabase) {
            showAlert('Kata sandi yang Anda masukkan salah.', 'red');
            resetBtn();
            return;
        }

        // Simpan Sesi Pengguna
        const userSession = {
            nik: data.nik,
            nama: data.nama,
            aksesrole: (data.aksesrole || 'user').toLowerCase(),
            email: data.email,
            foto: data.upload_foto
        };
        localStorage.setItem('sipeda_user', JSON.stringify(userSession));

        showAlert('Login berhasil! Mengalihkan halaman...', 'green');

        setTimeout(() => {
            if (userSession.aksesrole === 'superadmin' || userSession.aksesrole === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'portal.html';
            }
        }, 1000);

    } catch (err) {
        console.error("Detail Error Login:", err);
        showAlert(`Gagal Verifikasi: ${err.message}`, 'red');
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

// PENTING: Daftarkan fungsi ke ranah global window
window.handleLogin = handleLogin;
