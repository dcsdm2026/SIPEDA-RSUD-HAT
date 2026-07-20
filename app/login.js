document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value.trim();

    try {
        // Query verifikasi user pada tabel pegawai
        const { data, error } = await window.db
            .from('pegawai')
            .select('*')
            .or(`nik.eq.${userVal},email.eq.${userVal}`)
            .single();

        if (error || !data) {
            alert('NIK / Email tidak ditemukan!');
            return;
        }

        // Pengaturan Role Sederhana
        sessionStorage.setItem('user_session', JSON.stringify(data));

        if (data.aksesrole === 'superadmin' || data.aksesrole === 'admin') {
            window.location.href = 'homepage/index.html';
        } else {
            window.location.href = 'homepage/portal.html';
        }
    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat verifikasi login.');
    }
});
