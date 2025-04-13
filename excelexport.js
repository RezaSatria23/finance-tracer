// Main export function - guaranteed working
function exportToExcel() {
    try {
        // 1. Get current filters and transactions
        const selectedMonth = document.getElementById('month-filter').value;
        const selectedType = document.getElementById('type-filter').value;
        const transactions = loadTransactions();
        
        // 2. Filter transactions
        let filteredTransactions = filterTransactions(transactions, selectedMonth, selectedType);
        
        if (filteredTransactions.length === 0) {
            alert("Tidak ada transaksi untuk diekspor!");
            return;
        }

        // 3. Prepare Excel data
        const excelData = prepareExcelData(filteredTransactions);
        
        // 4. Create workbook
        const wb = XLSX.utils.book_new();
        
        // 5. Create worksheet with proper formatting
        const ws = createFormattedWorksheet(excelData);
        
        // 6. Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        
        // 7. Export to Excel
        XLSX.writeFile(wb, `Laporan_Keuangan_${getCurrentDateString()}.xlsx`);
        
    } catch (error) {
        console.error("Excel Export Error:", error);
        alert("Terjadi kesalahan saat mengekspor ke Excel. Silakan coba lagi.");
    }
}

// Helper functions

function loadTransactions() {
    try {
        const transactions = localStorage.getItem('transactions');
        return transactions ? JSON.parse(transactions) : [];
    } catch (e) {
        console.error("Error loading transactions:", e);
        return [];
    }
}

function filterTransactions(transactions, monthFilter, typeFilter) {
    try {
        let result = [...transactions];
        
        // Filter by month if not 'all'
        if (monthFilter !== 'all') {
            result = result.filter(t => {
                const date = new Date(t.date);
                return (date.getMonth() + 1) === parseInt(monthFilter);
            });
        }
        
        // Filter by type if not 'all'
        if (typeFilter !== 'all') {
            result = result.filter(t => t.type === typeFilter);
        }
        
        // Sort by date (ascending)
        return result.sort((a, b) => new Date(a.date) - new Date(b.date));
        
    } catch (e) {
        console.error("Error filtering transactions:", e);
        return [];
    }
}

function prepareExcelData(transactions) {
    const user = getCurrentUser();
    let runningBalance = 0;
    
    // Prepare header
    const header = [
        ["LAPORAN KEUANGAN"],
        [`Nama: ${user.fullname || "Pengguna"}`],
        [`Periode: ${getPeriodText(transactions)}`],
        [], // Empty row
        ["No", "Tanggal", "Keterangan", "Jenis", "Kategori", "Jumlah (Rp)", "Saldo (Rp)"]
    ];
    
    // Prepare transaction rows
    const rows = transactions.map((t, index) => {
        const amount = parseFloat(t.amount) || 0;
        const isIncome = t.type === 'income';
        
        // Update running balance
        runningBalance = isIncome ? runningBalance + amount : runningBalance - amount;
        
        return [
            index + 1,
            formatExcelDate(t.date),
            t.description || '-',
            isIncome ? 'Pemasukan' : 'Pengeluaran',
            getTransactionCategory(t),
            amount,
            runningBalance
        ];
    });
    
    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    // Prepare footer
    const footer = [
        [], // Empty row
        ["", "", "TOTAL PEMASUKAN:", "", "", totalIncome, ""],
        ["", "", "TOTAL PENGELUARAN:", "", "", "", totalExpense],
        ["", "", "SALDO AKHIR:", "", "", "", runningBalance]
    ];
    
    return [...header, ...rows, ...footer];
}

function createFormattedWorksheet(data) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 12 }, // Tanggal
        { wch: 30 }, // Keterangan
        { wch: 12 }, // Jenis
        { wch: 20 }, // Kategori
        { wch: 15 }, // Jumlah
        { wch: 15 }  // Saldo
    ];
    
    // Set merge ranges for title and headers
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Name
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }  // Period
    ];
    
     // Apply Indonesian Rupiah format to amount and balance columns
     const range = XLSX.utils.decode_range(ws['!ref']);
     for (let row = 4; row <= range.e.r; row++) { // Mulai dari baris 4 (setelah header)
         // Format kolom Jumlah (Rp) (kolom 5)
         const amountCell = ws[XLSX.utils.encode_cell({r: row, c: 5})];
         if (amountCell && amountCell.v !== undefined && amountCell.v !== "") {
             amountCell.z = '"Rp"#,##0.00;[Red]"Rp"#,##0.00'; // Format dengan Rp dan 2 desimal
         }
         
         // Format kolom Saldo (Rp) (kolom 6)
         const balanceCell = ws[XLSX.utils.encode_cell({r: row, c: 6})];
         if (balanceCell && balanceCell.v !== undefined && balanceCell.v !== "") {
             balanceCell.z = '"Rp"#,##0.00;[Red]"Rp"#,##0.00'; // Format dengan Rp dan 2 desimal
         }
     }

    return ws;
}

function getCurrentUser() {
    try {
        const user = localStorage.getItem('currentFinanceUser');
        return user ? JSON.parse(user) : { fullname: "Pengguna" };
    } catch (e) {
        return { fullname: "Pengguna" };
    }
}

function getPeriodText(transactions) {
    if (transactions.length === 0) return "-";
    
    const selectedMonth = document.getElementById('month-filter').value;
    if (selectedMonth !== 'all') {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                          "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const monthIndex = new Date(transactions[0].date).getMonth();
        return `${monthNames[monthIndex]} ${new Date().getFullYear()}`;
    }
    
    const firstDate = formatExcelDate(transactions[0].date);
    const lastDate = formatExcelDate(transactions[transactions.length-1].date);
    return `${firstDate} - ${lastDate}`;
}

function formatExcelDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return '-';
    }
}

function getTransactionCategory(transaction) {
    if (transaction.type === 'income') {
        return transaction.incomeType || 'Pemasukan';
    } else {
        return transaction.category || 'Pengeluaran';
    }
}

function getCurrentDateString() {
    const now = new Date();
    return now.toISOString().slice(0, 10).replace(/-/g, '');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-excel-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
});

// Make function available globally
window.exportToExcel = exportToExcel;