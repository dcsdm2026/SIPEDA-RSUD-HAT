// === FILE: Homepage/js/tambahpegawai.js ===

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Inisialisasi Supabase Client dari koneksi.js
    const supabase = window.supabaseClient || window.db;
    
    if (!supabase) {
        showAlert("danger", "Gagal terhubung ke database. Pastikan koneksi.js sudah dimuat.");
        return;
    }

    // 2. Ambil parameter NIK dari URL jika dalam mode Edit
    const urlParams = new URLSearchParams(window.location.search);
    const nikParam = urlParams.get("nik");

    const form = document.getElementById("formTambahPegawai");
    const btnSimpanUtama = document.getElementById("btnSimpanUtama");
    const nikInput = document.getElementById("nik");
    const pageTitle = document.getElementById("pageTitle");

    // 3. Mode Edit atau Tambah Baru
    if (nikParam) {
        pageTitle.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i>Edit Data Pegawai`;
        nikInput.value = nikParam;
        nikInput.readOnly = true; // NIK primary key tidak boleh diubah
        await loadPegawaiDetail(nikParam);
        await loadRiwayatPendidikan(nikParam);
        await loadRiwayatPekerjaan(nikParam);
    }

    // 4. Trigger perubahan NIK secara manual (jika mengetik NIK baru)
    nikInput.addEventListener("blur", () => {
        const currentNik = nikInput.value.trim();
        if (currentNik) {
            loadRiwayatPendidikan(currentNik);
            loadRiwayatPekerjaan(currentNik);
        }
    });

    // 5. Listener Tombol Refresh
    document.getElementById("btnRefreshRPendidikan")?.addEventListener("click", () => {
        const currentNik = nikInput.value.trim();
        if (currentNik) loadRiwayatPendidikan(currentNik);
    });

    document.getElementById("btnRefreshRPekerjaan")?.addEventListener("click", () => {
        const currentNik = nikInput.value.trim();
        if (currentNik) loadRiwayatPekerjaan(currentNik);
    });

    // 6. Submit Event Handler untuk Simpan Pegawai
    btnSimpanUtama.addEventListener("click", async () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        btnSimpanUtama.disabled = true;
        btnSimpanUtama.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Menyimpan...`;

        try {
            const formData = new FormData(form);
            const payload = {};

            formData.forEach((value, key) => {
                payload[key] = value !== "" ? value : null;
            });

            // Konversi tipe data khusus (integer)
            if (payload.jumlah_anak) payload.jumlah_anak = parseInt(payload.jumlah_anak) || 0;
            if (payload.bup) payload.bup = parseInt(payload.bup) || null;

            // Eksekusi Upsert ke Supabase
            const { data, error } = await supabase
                .from("pegawai")
                .upsert(payload, { onConflict: "nik" });

            if (error) throw error;

            showAlert("success", "Data Pegawai berhasil disimpan ke database!");
            
            // Re-fetch riwayat setelah menyimpan NIK baru
            if (payload.nik) {
                await loadRiwayatPendidikan(payload.nik);
                await loadRiwayatPekerjaan(payload.nik);
            }

        } catch (err) {
            console.error("Error saving pegawai:", err);
            showAlert("danger", `Gagal menyimpan data pegawai: ${err.message}`);
        } finally {
            btnSimpanUtama.disabled = false;
            btnSimpanUtama.innerHTML = `<i class="bi bi-floppy-fill me-1"></i> Simpan Pegawai`;
        }
    });

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    // Dynamic Alert Message
    function showAlert(type, message) {
        const alertContainer = document.getElementById("alertContainer");
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }

    // Load Data Pegawai jika Mode Edit
    async function loadPegawaiDetail(nik) {
        try {
            const { data, error } = await supabase
                .from("pegawai")
                .select("*")
                .eq("nik", nik)
                .single();

            if (error) throw error;

            if (data) {
                Object.keys(data).forEach(key => {
                    const el = document.getElementById(key);
                    if (el) {
                        el.value = data[key] !== null ? data[key] : "";
                    }
                });
            }
        } catch (err) {
            console.error("Gagal memuat detail pegawai:", err);
            showAlert("danger", "Gagal memuat data detail pegawai dari Supabase.");
        }
    }

    // Load Tabel Riwayat Pendidikan (Tab 6)
    async function loadRiwayatPendidikan(nik) {
        const tbody = document.getElementById("tbodyRiwayatPendidikan");
        const notice = document.getElementById("noticeRPendidikan");

        if (!nik) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Pilih / Masukkan NIK untuk melihat riwayat pendidikan.</td></tr>`;
            notice.classList.remove("d-none");
            return;
        }

        notice.classList.add("d-none");
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3"><span class="spinner-border spinner-border-sm me-2"></span>Memuat data...</td></tr>`;

        try {
            const { data, error } = await supabase
                .from("riwayat_pendidikan")
                .select("*")
                .eq("nik", nik)
                .order("tanggal_lulus", { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Belum ada data riwayat pendidikan untuk NIK: <strong>${nik}</strong></td></tr>`;
                return;
            }

            let html = "";
            data.forEach((row, index) => {
                const linkIjazah = row.upload_ijazah 
                    ? `<a href="${row.upload_ijazah}" target="_blank" class="btn btn-xs btn-outline-info"><i class="bi bi-file-earmark-pdf me-1"></i>Lihat</a>`
                    : `<span class="text-muted">-</span>`;

                html += `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td><span class="badge bg-primary">${row.jenjang_pendidikan || '-'}</span></td>
                        <td>${row.asal_pendidikan || '-'}</td>
                        <td>${row.fakultas ? row.fakultas + ' / ' : ''}${row.jurusan || '-'}</td>
                        <td>${row.tanggal_lulus || '-'}</td>
                        <td>${row.kepala_pendidikan || '-'}</td>
                        <td class="text-center">${linkIjazah}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

        } catch (err) {
            console.error("Gagal memuat riwayat pendidikan:", err);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Gagal mengambil data riwayat pendidikan.</td></tr>`;
        }
    }

    // Load Tabel Riwayat Pekerjaan (Tab 7)
    async function loadRiwayatPekerjaan(nik) {
        const tbody = document.getElementById("tbodyRiwayatPekerjaan");
        const notice = document.getElementById("noticeRPekerjaan");

        if (!nik) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Pilih / Masukkan NIK untuk melihat riwayat pekerjaan.</td></tr>`;
            notice.classList.remove("d-none");
            return;
        }

        notice.classList.add("d-none");
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3"><span class="spinner-border spinner-border-sm me-2"></span>Memuat data...</td></tr>`;

        try {
            const { data, error } = await supabase
                .from("riwayat_pekerjaan")
                .select("*")
                .eq("nik", nik)
                .order("tahun", { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Belum ada data riwayat pekerjaan untuk NIK: <strong>${nik}</strong></td></tr>`;
                return;
            }

            let html = "";
            data.forEach((row, index) => {
                const linkSk = row.upload_sk 
                    ? `<a href="${row.upload_sk}" target="_blank" class="btn btn-xs btn-outline-info"><i class="bi bi-file-earmark-pdf me-1"></i>Lihat SK</a>`
                    : `<span class="text-muted">-</span>`;

                const gajiFormatted = row.gaji_pokok 
                    ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(row.gaji_pokok)
                    : "-";

                html += `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td><span class="badge bg-secondary">${row.tahun || '-'}</span></td>
                        <td>${row.uraian_perubahan || '-'}</td>
                        <td>${row.mulai || '-'} s/d ${row.akhir || '-'}</td>
                        <td>${gajiFormatted}</td>
                        <td>${row.pejabat || '-'} <br><small class="text-muted">${row.nomor || ''}</small></td>
                        <td class="text-center">${linkSk}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

        } catch (err) {
            console.error("Gagal memuat riwayat pekerjaan:", err);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Gagal mengambil data riwayat pekerjaan.</td></tr>`;
        }
    }
});
