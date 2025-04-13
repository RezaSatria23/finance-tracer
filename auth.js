// Data awal untuk user admin
const initializeAdminUser = () => {
    const users = JSON.parse(localStorage.getItem('financeUsers')) || [];
    const adminExists = users.some(user => user.username === 'admin');
    
    if (!adminExists) {
        const adminUser = {
            id: 1,
            fullname: 'Administrator',
            email: 'admin@financeapp.com',
            username: 'admin',
            password: 'admin123',
            createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        localStorage.setItem('financeUsers', JSON.stringify(users));
    }
};

// Fungsi untuk mencari user
const findUser = (username) => {
    const users = JSON.parse(localStorage.getItem('financeUsers')) || [];
    return users.find(user => user.username === username);
};

// Fungsi untuk menyimpan user baru
const saveUser = (user) => {
    const users = JSON.parse(localStorage.getItem('financeUsers')) || [];
    users.push(user);
    localStorage.setItem('financeUsers', JSON.stringify(users));
};

// Fungsi untuk menampilkan alert
const showAlert = (type, message) => {
    // Hapus alert sebelumnya jika ada
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-icon">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>'}
        </div>
        <div class="alert-message">${message}</div>
    `;
    
    const activeForm = document.querySelector('.auth-container');
    if (activeForm) {
        activeForm.insertBefore(alert, activeForm.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }
};
// Fungsi untuk switch tab
const switchAuthTab = (tab) => {
    const authCard = document.querySelector('.auth-card');
    if (!authCard) return;

    // Update UI
    document.querySelectorAll('.auth-switcher button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelector('.auth-switcher').classList.toggle('register-active', tab === 'register');
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tab}Form`);
    });

    // Animasi
    authCard.style.animation = 'none';
    void authCard.offsetWidth;
    authCard.style.animation = 'cardFlip 0.6s ease';
};

// Handle login
const handleLogin = (e) => {
    e.preventDefault();
    
    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    const btn = form.querySelector('.auth-btn');
    
    // Validasi input
    if (!username || !password) {
        showAlert('error', 'Username dan password harus diisi');
        return;
    }
    
    // Nonaktifkan tombol sementara
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    // Cari user di localStorage
    const user = findUser(username);
    
    if (user && user.password === password) {
        // Simpan session
        localStorage.setItem('currentFinanceUser', JSON.stringify(user));
        
        // Tampilkan animasi sukses
        btn.innerHTML = '<i class="fas fa-check"></i> Login Berhasil!';
        btn.style.background = 'linear-gradient(90deg, var(--success), var(--primary-light))';
        
        // Redirect ke halaman utama
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        // Kembalikan tombol ke state semula
        btn.innerHTML = '<span>Login</span><div class="wave"></div>';
        btn.style.background = 'linear-gradient(90deg, var(--primary), var(--primary-light))';
        btn.disabled = false;
        
        showAlert('error', 'Username atau password salah');
        form.style.animation = 'shake 0.5s';
        setTimeout(() => form.style.animation = '', 500);
    }
};

// Fungsi untuk menampilkan modal lupa password
const showForgotPasswordModal = () => {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('passwordResult').style.display = 'none';
        document.getElementById('forgotPasswordForm').reset();
    }
};

// Fungsi untuk menutup modal
const closeModal = () => {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Handle forgot password
const handleForgotPassword = (e) => {
    e.preventDefault();
    
    const input = document.getElementById('recoveryInput').value.trim();
    const btn = e.target.querySelector('.auth-btn');
    const resultDiv = document.getElementById('passwordResult');
    const passwordSpan = document.getElementById('recoveredPassword');
    
    if (!input) {
        showAlert('error', 'Masukkan username atau email');
        return;
    }
    
    // Nonaktifkan tombol sementara
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    // Cari user di localStorage
    const users = JSON.parse(localStorage.getItem('financeUsers')) || [];
    const user = users.find(u => u.username === input || u.email === input);
    
    setTimeout(() => {
        if (user) {
            // Tampilkan password
            passwordSpan.textContent = user.password;
            resultDiv.style.display = 'block';

            // Tampilkan Email
            emailSpan.textContent = user.email;
            
            // Kembalikan tombol ke state semula
            btn.innerHTML = '<span>Pulihkan Password</span><div class="wave"></div>';
            btn.disabled = false;

            // Set timeout untuk menghapus input dan hasil setelah 5 detik
            setTimeout(() => {

                // Reset form
                recoveryInput.value = '';
                passwordSpan.textContent = '';
                resultDiv.style.display = 'none';
            }, 3000);
        } else {
            showAlert('error', 'Username/Email tidak ditemukan');
            
            // Kembalikan tombol ke state semula
            btn.innerHTML = '<span>Pulihkan Password</span><div class="wave"></div>';
            btn.disabled = false;
        }
    }, 1000);
};

// Handle register
const handleRegister = (e) => {
    e.preventDefault();
    
    const users = JSON.parse(localStorage.getItem('financeUsers')) || [];
    if (users.length > 1) { // Sudah ada user selain admin
        showAlert('error', 'Registrasi hanya diperbolehkan satu kali saja');
        return;
    }

    const form = e.target;
    const fullname = form.fullname.value.trim();
    const email = form.email.value.trim();
    const username = form.regUsername.value.trim();
    const password = form.regPassword.value;
    const confirmPassword = form.confirmPassword.value;
    const btn = form.querySelector('.auth-btn');
    
    // Validasi input
    if (!fullname || !email || !username || !password || !confirmPassword) {
        showAlert('error', 'Semua field harus diisi');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('error', 'Konfirmasi password tidak cocok');
        return;
    }

    // Cek apakah username sudah ada
    if (findUser(username)) {
        showAlert('error', 'Username sudah digunakan');
        return;
    }

    // Nonaktifkan tombol sementara
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendaftarkan...';

    // Buat user baru
    const newUser = {
        id: Date.now(),
        fullname,
        email,
        username,
        password, // Note: Dalam produksi, password HARUS di-hash
        createdAt: new Date().toISOString()
    };

    // Simpan ke localStorage
    saveUser(newUser);

    // Tampilkan feedback sukses
    btn.innerHTML = '<i class="fas fa-check"></i> Pendaftaran Berhasil!';
    btn.style.background = 'linear-gradient(90deg, var(--success), var(--primary-light))';

    // Reset form setelah 1.5 detik
    setTimeout(() => {
        form.reset();
        switchAuthTab('login');
        
        // Kembalikan tombol ke state semula
        setTimeout(() => {
            btn.innerHTML = '<span>Daftar</span><div class="wave"></div>';
            btn.style.background = 'linear-gradient(90deg, var(--primary), var(--primary-light))';
            btn.disabled = false;
        }, 300);
    }, 1500);
    document.querySelectorAll('.auth-switcher button')
        .forEach(btn => {
            if (btn.dataset.tab === 'register') {
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        });

    setTimeout(() => {
        form.reset();
        switchAuthTab('login');
        setTimeout(() => {
            btn.innerHTML = '<span>Daftar</span><div class="wave"></div>';
            btn.style.background = 'linear-gradient(90deg, var(--primary), var(--primary-light))';
        }, 300);
    }, 1500);
    // Nonaktifkan tombol register setelah sukses
    document.querySelectorAll('.auth-switcher button')
    .forEach(btn => {
        if (btn.dataset.tab === 'register') {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });
};

// Inisialisasi floating labels
const initFloatingLabels = () => {
    document.querySelectorAll('.input-group.floating input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentNode.classList.remove('focused');
            }
        });
        
        // Check on load if has value
        if (input.value) {
            input.parentNode.classList.add('focused');
        }
    });
};

// Inisialisasi utama
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi data admin
    initializeAdminUser();

    // Event listener untuk lupa password
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
    
    // Event listener untuk modal lupa password
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Event listener untuk menutup modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // Tutup modal ketika klik di luar modal
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('forgotPasswordModal');
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Event listener untuk form login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Event listener untuk form register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Switch tab handler
    const authSwitcher = document.querySelector('.auth-switcher');
    if (authSwitcher) {
        authSwitcher.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const tab = e.target.dataset.tab;
                switchAuthTab(tab);
            }
        });
    }
    
    // Inisialisasi floating labels
    initFloatingLabels();
    
    // Tambahkan style untuk animasi
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes cardFlip {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(90deg); }
            100% { transform: rotateY(0deg); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }
        
        .auth-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .auth-btn:disabled:hover {
            box-shadow: none;
        }
        
        .auth-btn:disabled .wave {
            display: none;
        }
    `;
    document.head.appendChild(style);
});