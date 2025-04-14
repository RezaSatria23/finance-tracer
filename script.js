// Variabel global
let transactions = [];
let financeChart = null;
let editingTransactionId = null;

// Fungsi untuk menyimpan transaksi ke localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Fungsi untuk memformat angka ke format Rupiah
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Fungsi untuk memformat tanggal
function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Fungsi untuk toggle input lainnya
function toggleOtherInput(selectElement, containerId) {
    const container = document.getElementById(containerId);
    if (selectElement.value === 'Lainnya') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// Fungsi untuk validasi input angka
function validateNumberInput(input) {
    // Pastikan nilai tidak negatif
    if (input.value < 0) {
        input.value = '';
    }
}

// Fungsi untuk membuka modal tambah transaksi
function openModal() {
    document.getElementById('transaction-modal').style.display = 'flex';
    document.getElementById('transaction-date').valueAsDate = new Date();
}

// Fungsi untuk menutup modal tambah transaksi
function closeModal() {
    document.getElementById('transaction-modal').style.display = 'none';
    document.getElementById('transaction-form').reset();
    
    // Sembunyikan input lainnya
    document.getElementById('income-bank-container').style.display = 'none';
    document.getElementById('income-type-container').style.display = 'none';
    document.getElementById('expense-source-container').style.display = 'none';
    document.getElementById('expense-destination-container').style.display = 'none';
    document.getElementById('expense-category-container').style.display = 'none';
}

// Fungsi untuk membuka modal edit
function openEditModal() {
    document.getElementById('edit-transaction-modal').style.display = 'flex';
}

// Fungsi untuk menutup modal edit
function closeEditModal() {
    document.getElementById('edit-transaction-modal').style.display = 'none';
    editingTransactionId = null;
    document.getElementById('edit-transaction-form').reset();
    
    // Sembunyikan input lainnya
    document.getElementById('edit-income-bank-container').style.display = 'none';
    document.getElementById('edit-income-type-container').style.display = 'none';
    document.getElementById('edit-expense-source-container').style.display = 'none';
    document.getElementById('edit-expense-destination-container').style.display = 'none';
    document.getElementById('edit-expense-category-container').style.display = 'none';
}

// Fungsi untuk menambahkan transaksi baru
function addTransaction(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="transaction-type"]:checked').value;
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('transaction-description').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    
    let transaction = {
        id: Date.now(),
        date,
        description,
        amount,
        type
    };
    
    // Tambahkan field khusus berdasarkan jenis transaksi
    if (type === 'income') {
        const incomeType = document.getElementById('income-type').value;
        const bank = document.getElementById('income-bank').value;
        transaction.from = document.getElementById('income-source').value;

        transaction.incomeType = incomeType === 'Lainnya' 
            ? document.getElementById('income-type-input').value 
            : incomeType;

        transaction.bank = bank === 'Lainnya' 
            ? document.getElementById('income-bank-input').value 
            : bank;
    } else {
        const category = document.getElementById('expense-category').value;
        const source = document.getElementById('expense-source').value;
        const destination = document.getElementById('expense-destination').value;
    
        transaction.category = category === 'Lainnya'
            ? document.getElementById('expense-category-input').value
            : category;

        transaction.source = source === 'Lainnya'
            ? document.getElementById('expense-source-input').value
            : source;

        transaction.destination = destination === 'Lainnya'
            ? document.getElementById('expense-destination-input').value
            : destination;
    }
    
    transactions.push(transaction);
    saveTransactions();
    
    // Update tampilan
    updateSummary();
    renderTransactions();
    updateChart();
    
    closeModal();

    // Animasi pada transaksi baru
    const newTransaction = document.querySelector(`[data-id="${transaction.id}"]`);
    if (newTransaction) {
        newTransaction.classList.add('highlight');
        setTimeout(() => {
            newTransaction.classList.remove('highlight');
        }, 1000);
    }
}

// Fungsi untuk menghapus transaksi
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    renderTransactions();
    updateSummary();
    updateChart();
}

// Fungsi untuk menampilkan transaksi
function renderTransactions(filteredTransactions = null) {
    const transactionsContainer = document.getElementById('transactions-container');
    const transactionsToRender = filteredTransactions || transactions;
    
    if (transactionsToRender.length === 0) {
        transactionsContainer.innerHTML = '<p class="no-transactions">Tidak ada transaksi yang ditemukan</p>';
        return;
    }
    
    // Urutkan berdasarkan tanggal (terbaru pertama)
    const sortedTransactions = [...transactionsToRender].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactionsContainer.innerHTML = sortedTransactions.map(transaction => `
        <div class="transaction-item" data-id="${transaction.id}">
            <div class="transaction-details">
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-description">${transaction.description}</div>
                <div>
                    ${transaction.type === 'income' ? `
                        <span class="transaction-source">Dari: ${transaction.from}</span>
                        <span class="transaction-destination"> | Bank: ${transaction.bank}</span>
                        <span class="transaction-category"> | Jenis: ${transaction.incomeType}</span>
                    ` : `
                        <span class="transaction-source">Dari: ${transaction.source}</span>
                        <span class="transaction-destination"> | Tujuan: ${transaction.destination}</span>
                        <span class="transaction-category"> | Keperluan: ${transaction.category}</span>
                    `}
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}Rp${formatNumber(transaction.amount)}
                <button class="edit-btn" onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Fungsi untuk mengedit transaksi
function editTransaction(id) {
    editingTransactionId = id;
    
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    openEditModal();
    
    // Isi form dengan data transaksi
    document.getElementById('edit-transaction-date').value = transaction.date;
    document.getElementById('edit-transaction-description').value = transaction.description;
    document.getElementById('edit-transaction-amount').value = transaction.amount;
    
    // Set jenis transaksi
    document.querySelector(`input[name="edit-transaction-type"][value="${transaction.type}"]`).checked = true;
    
    // Tampilkan field yang sesuai dengan jenis transaksi
    if (transaction.type === 'income') {
        document.getElementById('edit-income-fields').style.display = 'block';
        document.getElementById('edit-expense-fields').style.display = 'none';
        
        // Isi field pemasukan
        document.getElementById('edit-income-source').value = transaction.from || '';
        
        // Handle bank
        if (['BCA', 'BRI', 'Mandiri', 'BNI', 'Lainnya'].includes(transaction.bank)) {
            document.getElementById('edit-income-bank').value = transaction.bank;
            document.getElementById('edit-income-bank-container').style.display = 'none';
        } else {
            document.getElementById('edit-income-bank').value = 'Lainnya';
            document.getElementById('edit-income-bank-container').style.display = 'block';
            document.getElementById('edit-income-bank-input').value = transaction.bank || '';
        }
        
        // Handle jenis pemasukan
        if (['Gaji', 'Bonus', 'THR', 'Investasi', 'Lainnya'].includes(transaction.incomeType)) {
            document.getElementById('edit-income-type').value = transaction.incomeType;
            document.getElementById('edit-income-type-container').style.display = 'none';
        } else {
            document.getElementById('edit-income-type').value = 'Lainnya';
            document.getElementById('edit-income-type-container').style.display = 'block';
            document.getElementById('edit-income-type-input').value = transaction.incomeType || '';
        }
    } else {
        document.getElementById('edit-income-fields').style.display = 'none';
        document.getElementById('edit-expense-fields').style.display = 'block';
        
        // Handle sumber dana
        if (['BCA', 'BRI', 'Mandiri', 'BNI', 'E-Wallet', 'Cash', 'Lainnya'].includes(transaction.source)) {
            document.getElementById('edit-expense-source').value = transaction.source;
            document.getElementById('edit-expense-source-container').style.display = 'none';
        } else {
            document.getElementById('edit-expense-source').value = 'Lainnya';
            document.getElementById('edit-expense-source-container').style.display = 'block';
            document.getElementById('edit-expense-source-input').value = transaction.source || '';
        }
        
        // Handle tujuan transaksi
        if (['Bank', 'Tunai', 'E-Wallet', 'Merchant', 'Transfer', 'Lainnya'].includes(transaction.destination)) {
            document.getElementById('edit-expense-destination').value = transaction.destination;
            document.getElementById('edit-expense-destination-container').style.display = 'none';
        } else {
            document.getElementById('edit-expense-destination').value = 'Lainnya';
            document.getElementById('edit-expense-destination-container').style.display = 'block';
            document.getElementById('edit-expense-destination-input').value = transaction.destination || '';
        }
        
        // Handle kategori
        if (['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'].includes(transaction.category)) {
            document.getElementById('edit-expense-category').value = transaction.category;
            document.getElementById('edit-expense-category-container').style.display = 'none';
        } else {
            document.getElementById('edit-expense-category').value = 'Lainnya';
            document.getElementById('edit-expense-category-container').style.display = 'block';
            document.getElementById('edit-expense-category-input').value = transaction.category || '';
        }
    }
}

// Fungsi untuk mengupdate transaksi
function updateTransaction(e) {
    e.preventDefault();
    
    if (!editingTransactionId) return;
    
    const type = document.querySelector('input[name="edit-transaction-type"]:checked').value;
    const date = document.getElementById('edit-transaction-date').value;
    const description = document.getElementById('edit-transaction-description').value;
    const amount = parseFloat(document.getElementById('edit-transaction-amount').value);
    
    const index = transactions.findIndex(t => t.id === editingTransactionId);
    if (index === -1) return;
    
    let updatedTransaction = {
        id: editingTransactionId,
        date,
        description,
        amount,
        type
    };
    
    // Tambahkan field khusus berdasarkan jenis transaksi
    if (type === 'income') {
        const incomeType = document.getElementById('edit-income-type').value;
        const bank = document.getElementById('edit-income-bank').value;
        
        updatedTransaction.from = document.getElementById('edit-income-source').value;
        updatedTransaction.bank = bank === 'Lainnya' 
            ? document.getElementById('edit-income-bank-input').value 
            : bank;
        updatedTransaction.incomeType = incomeType === 'Lainnya' 
            ? document.getElementById('edit-income-type-input').value 
            : incomeType;
    } else {
        const category = document.getElementById('edit-expense-category').value;
        const source = document.getElementById('edit-expense-source').value;
        const destination = document.getElementById('edit-expense-destination').value;
        
        updatedTransaction.source = source === 'Lainnya'
            ? document.getElementById('edit-expense-source-input').value
            : source;
        updatedTransaction.destination = destination === 'Lainnya'
            ? document.getElementById('edit-expense-destination-input').value
            : destination;
        updatedTransaction.category = category === 'Lainnya'
            ? document.getElementById('edit-expense-category-input').value
            : category;
    }
    
    // Update transaksi
    transactions[index] = updatedTransaction;
    saveTransactions();
    
    // Update tampilan
    updateSummary();
    renderTransactions();
    updateChart();
    
    closeEditModal();
    
    // Animasi pada transaksi yang diupdate
    const updatedItem = document.querySelector(`[data-id="${editingTransactionId}"]`);
    if (updatedItem) {
        updatedItem.classList.add('highlight');
        setTimeout(() => {
            updatedItem.classList.remove('highlight');
        }, 1000);
    }
}

// Fungsi untuk memfilter transaksi
function filterTransactions() {
    const month = document.getElementById('month-filter').value;
    const type = document.getElementById('type-filter').value;
    
    let filteredTransactions = [...transactions];
    
    // Filter by month
    if (month !== 'all') {
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transactionMonth = new Date(transaction.date).getMonth() + 1;
            return transactionMonth.toString() === month;
        });
    }
    
    // Filter by type
    if (type !== 'all') {
        filteredTransactions = filteredTransactions.filter(transaction => transaction.type === type);
    }
    
    renderTransactions(filteredTransactions);
    updateChart(filteredTransactions);
    updateSummary(filteredTransactions);
}

// Fungsi untuk update summary
function updateSummary(transactionsToCalculate = null) {
    const trans = transactionsToCalculate || transactions;
    
    const income = trans
        .filter(transaction => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    const expense = trans
        .filter(transaction => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    
    const balance = income - expense;
    
    document.getElementById('balance-amount').textContent = `Rp${formatNumber(balance)}`;
    document.getElementById('income-amount').textContent = `Rp${formatNumber(income)}`;
    document.getElementById('expense-amount').textContent = `Rp${formatNumber(expense)}`;
    
    // Animasi saat nilai berubah
    [document.getElementById('balance-amount'), document.getElementById('income-amount'), document.getElementById('expense-amount')].forEach(el => {
        el.classList.add('value-updated');
        setTimeout(() => {
            el.classList.remove('value-updated');
        }, 500);
    });
}

// Fungsi untuk update chart
function updateChart(filteredTransactions = null) {
    const ctx = document.getElementById('finance-chart').getContext('2d');
    const transactionsToRender = filteredTransactions || transactions;
    
    // Handle case ketika tidak ada transaksi
    if (transactionsToRender.length === 0) {
        if (financeChart) {
            financeChart.destroy();
            financeChart = null;
        }
        document.getElementById('finance-chart').style.display = 'none';
        return;
    }
    
    document.getElementById('finance-chart').style.display = 'block';
    
    // Kelompokkan data per bulan
    const monthlyData = {};
    
    transactionsToRender.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                income: 0,
                expense: 0
            };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthYear].income += transaction.amount;
        } else {
            monthlyData[monthYear].expense += transaction.amount;
        }
    });
    
    // Urutkan bulan secara kronologis
    const sortedMonths = Object.keys(monthlyData).sort();
    
    // Siapkan data untuk chart
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(year, monthNum - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    });
    
    const incomeData = sortedMonths.map(month => monthlyData[month].income);
    const expenseData = sortedMonths.map(month => monthlyData[month].expense);
    
    // Jika chart sudah ada, update data
    if (financeChart) {
        financeChart.data.labels = labels;
        financeChart.data.datasets[0].data = incomeData;
        financeChart.data.datasets[1].data = expenseData;
        financeChart.update();
        return;
    }
    
    // Buat chart baru jika belum ada
    financeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: incomeData,
                    backgroundColor: 'rgba(76, 201, 240, 0.7)',
                    borderColor: 'rgba(76, 201, 240, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Pengeluaran',
                    data: expenseData,
                    backgroundColor: 'rgba(247, 37, 133, 0.7)',
                    borderColor: 'rgba(247, 37, 133, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp' + value.toLocaleString('id-ID');
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += 'Rp' + context.raw.toLocaleString('id-ID');
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                }
            }
        }
    });
}

// Fungsi untuk toggle tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon tema
    const icon = document.getElementById('theme-toggle').querySelector('i');
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Fungsi untuk memuat transaksi dari localStorage
function loadTransactions() {
    try {
        const transactions = localStorage.getItem('transactions');
        return transactions ? JSON.parse(transactions) : [];
    } catch (e) {
        console.error("Error loading transactions:", e);
        return [];
    }
}

// Fungsi untuk mendapatkan pengguna saat ini
function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentFinanceUser');
        return user ? JSON.parse(user) : { fullname: "Pengguna" };
    } catch (e) {
        return { fullname: "Pengguna" };
    }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    // Cegah reload pada mobile
    window.addEventListener('touchmove', function(e) {
        if (e.target.classList.contains('modal-content') || 
            e.target.closest('.modal-content')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Cegah double submit
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Memproses...';
            }
        });
    });

    // Pengecekan session
    const currentUser = JSON.parse(localStorage.getItem('currentFinanceUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Load transaksi dari localStorage
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Set tema awal
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeIcon = document.getElementById('theme-toggle').querySelector('i');
    themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    // Event listeners
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    document.getElementById('export-btn').addEventListener('click', exportToPDF);
    document.getElementById('add-transaction-btn').addEventListener('click', openModal);
    document.querySelector('#transaction-modal .close-btn').addEventListener('click', closeModal);
    document.getElementById('transaction-form').addEventListener('submit', addTransaction);
    document.getElementById('month-filter').addEventListener('change', filterTransactions);
    document.getElementById('type-filter').addEventListener('change', filterTransactions);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('edit-transaction-form').addEventListener('submit', updateTransaction);
    
    // Event listener untuk toggle field berdasarkan jenis transaksi (tambah)
    document.querySelectorAll('input[name="transaction-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'income') {
                document.getElementById('income-fields').style.display = 'block';
                document.getElementById('expense-fields').style.display = 'none';
            } else {
                document.getElementById('income-fields').style.display = 'none';
                document.getElementById('expense-fields').style.display = 'block';
            }
        });
    });
    
    // Event listener untuk toggle field berdasarkan jenis transaksi (edit)
    document.querySelectorAll('input[name="edit-transaction-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'income') {
                document.getElementById('edit-income-fields').style.display = 'block';
                document.getElementById('edit-expense-fields').style.display = 'none';
            } else {
                document.getElementById('edit-income-fields').style.display = 'none';
                document.getElementById('edit-expense-fields').style.display = 'block';
            }
        });
    });
    
    // Event listener untuk toggle input lainnya (tambah)
    document.getElementById('income-bank').addEventListener('change', function() {
        toggleOtherInput(this, 'income-bank-container');
    });
    document.getElementById('income-type').addEventListener('change', function() {
        toggleOtherInput(this, 'income-type-container');
    });
    document.getElementById('expense-source').addEventListener('change', function() {
        toggleOtherInput(this, 'expense-source-container');
    });
    document.getElementById('expense-destination').addEventListener('change', function() {
        toggleOtherInput(this, 'expense-destination-container');
    });
    document.getElementById('expense-category').addEventListener('change', function() {
        toggleOtherInput(this, 'expense-category-container');
    });
    
    // Event listener untuk toggle input lainnya (edit)
    document.getElementById('edit-income-bank').addEventListener('change', function() {
        toggleOtherInput(this, 'edit-income-bank-container');
    });
    document.getElementById('edit-income-type').addEventListener('change', function() {
        toggleOtherInput(this, 'edit-income-type-container');
    });
    document.getElementById('edit-expense-source').addEventListener('change', function() {
        toggleOtherInput(this, 'edit-expense-source-container');
    });
    document.getElementById('edit-expense-destination').addEventListener('change', function() {
        toggleOtherInput(this, 'edit-expense-destination-container');
    });
    document.getElementById('edit-expense-category').addEventListener('change', function() {
        toggleOtherInput(this, 'edit-expense-category-container');
    });
    
    // Close modal ketika klik di luar
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('transaction-modal')) {
            closeModal();
        }
        if (e.target === document.getElementById('edit-transaction-modal')) {
            closeEditModal();
        }
    });
    
    // Render awal
    updateSummary();
    renderTransactions();
    updateChart();
});

// Fungsi global untuk diakses dari HTML
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;
window.closeEditModal = closeEditModal;
window.toggleOtherInput = toggleOtherInput;
window.validateNumberInput = validateNumberInput;

// ===== PROTECTION LAYER ===== //
// 1. Blokir klik kanan dan shortcut keyboard
document.addEventListener('contextmenu', (e) => e.preventDefault());

const blockedKeys = {
  73: true, // I
  74: true, // J
  67: true, // C
  123: true // F12
};

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey && e.shiftKey && blockedKeys[e.keyCode]) || e.keyCode === 123) {
    e.preventDefault();
    alert('Akses developer tools tidak diizinkan');
    window.location.href = "/"; // Redirect ke halaman utama
  }
});
// Tambahkan di awal file:
let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
if (isIOS) {
  // Nonaktifkan fitur devtools untuk iOS
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', { value: null });
  
  // Blok console yang tidak perlu
  const noop = () => {};
  if (!debug) {
    console.log = noop;
    console.warn = noop;
    console.error = noop; // Biarkan error tetap terlihat jika perlu
  }
};
// Atur scroll saat input fokus
document.querySelectorAll('#transaction-form input, #transaction-form select, #transaction-form textarea').forEach(el => {
  el.addEventListener('focus', () => {
    setTimeout(() => {
      el.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 300);
  });
});
document.querySelectorAll('#transaction-form input').forEach(input => {
    input.addEventListener('focus', () => {
      setTimeout(() => {
        input.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    });
  });