// session.js - Session Management
document.addEventListener('DOMContentLoaded', function() {
    // Cek autentikasi
    checkAuth();
    
    // Inisialisasi modal logout
    initLogoutModal();
});

function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentFinanceUser'));
    const isLoginPage = window.location.pathname.endsWith('login.html');
    
    if (!currentUser && !isLoginPage) {
        window.location.href = 'login.html';
        return;
    }
    
    if (currentUser && isLoginPage) {
        window.location.href = 'index.html';
    }
}

function initLogoutModal() {
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const cancelBtn = document.getElementById('cancel-logout');
    const confirmBtn = document.getElementById('confirm-logout');

    // Debugging: Cek apakah elemen ditemukan
    console.log('Logout Button:', logoutBtn);
    console.log('Logout Modal:', logoutModal);
    
    if (!logoutBtn || !logoutModal) {
        console.error('Elemen logout tidak ditemukan!');
        return;
    }

    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Tombol logout diklik');
        logoutModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    cancelBtn.addEventListener('click', function() {
        logoutModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    confirmBtn.addEventListener('click', function() {
        console.log('Konfirmasi logout diklik');
        const wave = this.querySelector('.logout-wave');
        wave.style.animation = 'waveAnimation 0.8s linear';
        
        setTimeout(() => {
            logout();
        }, 800);
    });

    logoutModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

function logout() {
    console.log('Proses logout dimulai');
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        localStorage.removeItem('currentFinanceUser');
        window.location.href = 'login.html';
    }, 500);
}

// Export untuk akses global
window.session = {
    checkAuth,
    logout,
    initLogoutModal
};