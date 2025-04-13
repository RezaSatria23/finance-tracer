// pdfexport.js - Full Financial Report with Local Storage
async function exportToPDF() {
    try {
        // Load libraries
        await loadPDFLibraries();
        
        // Dapatkan nilai filter bulan dari UI
        const selectedMonth = document.getElementById('month-filter').value;
        let transactions = loadTransactions();

        // Filter transaksi berdasarkan bulan jika bukan "all"
        if (selectedMonth !== 'all') {
            transactions = transactions.filter(transaction => {
                const date = new Date(transaction.date);
                return (date.getMonth() + 1) === parseInt(selectedMonth);
            });

            if (transactions.length === 0) {
                alert(`Tidak ada transaksi di bulan yang dipilih!`);
                return;
            }
        }

        // Calculate report period from transaction dates
        const dates = transactions.map(t => new Date(t.date).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // Create document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });
        // Fungsi untuk mendapatkan data user saat ini
        function getCurrentUser() {
        const user = JSON.parse(localStorage.getItem('currentFinanceUser'));
        return user || { fullname: "Pelanggan" }; // Default jika tidak ada user
    }

        // User data (can be customized)
        const userData = {
            name: getCurrentUser().fullname || "Pelanggan",
            initialBalance: getInitialBalance() // Load from local storage
        };

        // Add header with dynamic period
        addHeader(doc, userData, minDate, maxDate);

        // Add full width transactions table
        addFullWidthTable(doc, transactions, userData.initialBalance);

        // Add footer
        addFooter(doc, userData);

        // Save PDF
        doc.save(`Laporan Keuangan ${formatDate(minDate)}-${formatDate(maxDate)}.pdf`);

    } catch (error) {
        console.error("PDF Export Error:", error);
        alert("Gagal membuat laporan. Silakan coba lagi.");
    }
}

// Load transactions from local storage
function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Get initial balance from local storage
function getInitialBalance() {
    return parseFloat(localStorage.getItem('initialBalance')) || 0;
}

// Main table function
// Fungsi untuk membuat tabel dengan penyesuaian tanggal yang benar
async function addFullWidthTable(doc, transactions, initialBalance) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 8;
    
    // Pisahkan transaksi pemasukan dan pengeluaran
    const incomeData = transactions.filter(t => t.type === 'income').sort((a, b) => new Date(a.date) - new Date(b.date));
    const expenseData = transactions.filter(t => t.type === 'expense').sort((a, b) => new Date(a.date) - new Date(b.date));

    // Gabungkan dan urutkan semua transaksi berdasarkan tanggal
    const allTransactions = [...incomeData, ...expenseData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Hitung saldo berjalan
    let runningBalance = BigInt(initialBalance);
    const tableData = [];
    
    // Buat data tabel dengan mempertahankan urutan tanggal
    allTransactions.forEach(transaction => {
        const isIncome = transaction.type === 'income';
        const amount = BigInt(transaction.amount);
        
        if (isIncome) {
            runningBalance += amount;
        } else {
            runningBalance -= amount;
        }
        
        tableData.push([
            formatDate(transaction.date),
            transaction.description || '-',
            isIncome ? `Rp${formatCurrency(transaction.amount)}` : '',
            !isIncome ? `Rp${formatCurrency(transaction.amount)}` : '',
            `Rp${formatCurrency(runningBalance)}`
        ]);
    });

    // Hitung total pemasukan dan pengeluaran
    const totalIncome = incomeData.reduce((sum, t) => sum + BigInt(t.amount), BigInt(0));
    const totalExpense = expenseData.reduce((sum, t) => sum + BigInt(t.amount), BigInt(0));
    const finalBalance = BigInt(initialBalance) + totalIncome - totalExpense;

    // Tambahkan baris summary
    addSummaryRows(tableData, totalIncome, totalExpense, finalBalance);

    // Buat tabel
    doc.autoTable({
        startY: 70,
        head: [
            [
                { content: 'Tanggal', styles: { fontStyle: 'bold' } },
                { content: 'Keterangan', styles: { fontStyle: 'bold' } },
                { content: 'Pemasukan', styles: { fontStyle: 'bold', halign: 'right' } },
                { content: 'Pengeluaran', styles: { fontStyle: 'bold', halign: 'right' } },
                { content: 'Saldo', styles: { fontStyle: 'bold', halign: 'right' } }
            ]
        ],
        body: tableData,
        headStyles: {
            fillColor: [51, 51, 51],
            textColor: [255, 255, 255],
            cellPadding: 4,
            fontSize: 10
        },
        bodyStyles: {
            cellPadding: 3,
            fontSize: 9,
            overflow: 'linebreak'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: margin, right: margin },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: "auto", halign: 'right' },
            3: { cellWidth: "auto", halign: 'right' },
            4: { cellWidth: "auto", halign: 'right' }
        },
        didDrawPage: function(data) {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, pageWidth / 2, 285, { align: "center" });
        }
    });
}

// Fungsi untuk menambahkan baris summary
function addSummaryRows(tableData, totalIncome, totalExpense, finalBalance) {
    // Baris kosong untuk spacing
    tableData.push(['', '', '', '', '']);
    
    // Total Pemasukan
    tableData.push([
        { content: 'TOTAL PEMASUKAN', colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: `Rp${formatCurrency(totalIncome)}`, styles: { fontStyle: 'bold', textColor: [0, 100, 0] } },
        '',
        ''
    ]);
    
    // Total Pengeluaran
    tableData.push([
        { content: 'TOTAL PENGELUARAN', colSpan: 2, styles: { fontStyle: 'bold' } },
        '',
        { content: `Rp${formatCurrency(totalExpense)}`, styles: { fontStyle: 'bold', textColor: [200, 0, 0] } },
        ''
    ]);
    
    // Saldo Akhir
    tableData.push([
        { content: 'SALDO AKHIR', colSpan: 4, styles: { fontStyle: 'bold' } },
        { content: `Rp${formatCurrency(finalBalance)}`, styles: { 
            fontStyle: 'bold',
            textColor: finalBalance >= 0 ? [0, 100, 0] : [200, 0, 0]
        }}
    ]);
}

// Fungsi untuk memformat tanggal
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

// Fungsi untuk memformat mata uang (support BigInt)
function formatCurrency(amount) {
    if (typeof amount === 'bigint') {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return new Intl.NumberFormat('id-ID').format(amount);
}

function addHeader(doc, userData, minDate, maxDate) {
    // Add logo
    doc.addImage("https://via.placeholder.com/150x50?text=Bank+Logo", "JPEG", 15, 10, 40, 15);
    
    // Bank info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("LAPORAN TRANSAKSI KEUANGAN", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
    
    // Period info (below title)
    doc.setFontSize(10);
    doc.text(`Periode: ${formatDate(minDate)} - ${formatDate(maxDate)}`, 
             doc.internal.pageSize.getWidth() / 2, 30, { align: "center" });
    
    // User info
    doc.text(`Nama: ${userData.name}`, 15, 40);
    doc.text(`Rekapan: ${getMonthName(minDate)} ${minDate.getFullYear()}`, 15, 45);

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 55, doc.internal.pageSize.getWidth() - 15, 55);
}

// Helper functions
async function loadPDFLibraries() {
    if (typeof jsPDF !== 'undefined' && typeof window.jspdf !== 'undefined') return;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            const autotableScript = document.createElement('script');
            autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
            autotableScript.onload = resolve;
            autotableScript.onerror = reject;
            document.head.appendChild(autotableScript);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function addFooter(doc, userData) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Dapatkan transaksi untuk menentukan periode
    const transactions = loadTransactions();
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    doc.text(`Tanggal Cetak: ${formatDateTime(new Date())}`,15, 270);
    
    doc.text(`Nama: ${userData.name}`, 15, 280);
    doc.text(`Periode: ${getMonthName(minDate)} ${minDate.getFullYear()}`, 15, 285);
    
    doc.text("Notaku", pageWidth - 15, 280, { align: "right" });
    doc.text("Catat, Rapi, Tenang", pageWidth - 15, 285, { align: "right" });
}

// Fungsi untuk mendapatkan nama bulan dalam bahasa Indonesia
function getMonthName(date) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[date.getMonth()];
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(date) {
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Auto-load function when page loads
function initializeFinanceApp() {
    // Load transactions and display
    const transactions = loadTransactions();
    if (transactions.length > 0) {
        console.log("Data transaksi berhasil dimuat:", transactions.length, "transaksi");
    }
    
    // Set initial balance if not exists
    if (!localStorage.getItem('initialBalance')) {
        localStorage.setItem('initialBalance', '0');
    }
}

// Run when page loads
window.addEventListener('DOMContentLoaded', initializeFinanceApp);
window.exportToPDF = exportToPDF;