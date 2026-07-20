import React, { useState, useEffect } from 'react';
import { BukuAmal, Transaction, SchoolSettings } from './types';
import { initAuth, googleSignIn, logout as googleLogout, getAccessToken } from './lib/firebase';
import {
  initializeSheets,
  fetchBukuAmalFromSheet,
  saveBukuAmalToSheet,
  fetchTransactionsFromSheet,
  saveTransactionsToSheet,
  fetchSettingsFromSheet,
  saveSettingsToSheet,
} from './lib/sheets';
import { fetchFromAppsScript, saveToAppsScript } from './lib/appsScript';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdBxNQdjHT8uHQDzu53fBhNDWe866Zz4BkOiSZwWJVKFj_UStsxNEV0Wo77TLQaj-ukw/exec';

// Components
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import LaporanBulanan from './components/LaporanBulanan';
import BukuAmalManager from './components/BukuAmalManager';
import SettingsPanel from './components/SettingsPanel';
import AdminLogin from './components/AdminLogin';
import TransactionForm from './components/TransactionForm';
import CetakLaporan from './components/CetakLaporan';

// Icons
import {
  LayoutDashboard,
  ReceiptText,
  CalendarDays,
  BookOpenCheck,
  School,
  Lock,
  Unlock,
  Database,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  User,
} from 'lucide-react';

// --- Default Mock / Initial Data ---
const DEFAULT_BOOKS: BukuAmal[] = [
  { id: 'buku-kelas-1', nama: 'Buku Amal Kelas 1' },
  { id: 'buku-kelas-2a', nama: 'Buku Amal Kelas 2A' },
  { id: 'buku-kelas-2b', nama: 'Buku Amal Kelas 2B' },
  { id: 'buku-kelas-3', nama: 'Buku Amal Kelas 3' },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    tanggal: '2026-07-10',
    bukuAmalId: 'buku-kelas-1',
    tipe: 'pemasukan',
    kategori: "Amal Jum'at",
    jumlah: 150000,
    keterangan: "Penerimaan kotak Amal Jum'at dari siswa kelas 1A",
  },
  {
    id: 'tx-2',
    tanggal: '2026-07-10',
    bukuAmalId: 'buku-kelas-2a',
    tipe: 'pemasukan',
    kategori: "Amal Jum'at",
    jumlah: 180000,
    keterangan: "Penerimaan kotak Amal Jum'at dari siswa kelas 2A",
  },
  {
    id: 'tx-3',
    tanggal: '2026-07-12',
    bukuAmalId: 'buku-kelas-1',
    tipe: 'pengeluaran',
    kategori: 'Jenguk siswa',
    jumlah: 75000,
    keterangan: 'Membeli buah untuk menjenguk Ananda Ahmad kelas 1 yang sakit keras',
  },
  {
    id: 'tx-4',
    tanggal: '2026-07-15',
    bukuAmalId: 'buku-kelas-3',
    tipe: 'pemasukan',
    kategori: 'Uang Takziyah',
    jumlah: 250000,
    keterangan: 'Sumbangan duka cita dari guru & siswa kelas 3',
  },
  {
    id: 'tx-5',
    tanggal: '2026-07-16',
    bukuAmalId: 'buku-kelas-3',
    tipe: 'pengeluaran',
    kategori: 'Uang Takziyah',
    jumlah: 250000,
    keterangan: 'Pemberian santunan duka cita kepada wali murid yang meninggal',
  },
];

const DEFAULT_SETTINGS: SchoolSettings = {
  namaSekolah: 'SD NEGERI 01 MERDEKA BELAJAR',
  alamatSekolah: 'Jl. Pahlawan Pendidikan No. 12, Kecamatan Cerdas, Kota Pintar, Jawa Barat',
  kepalaSekolah: 'Drs. H. Ahmad Fauzi, M.Pd.',
  nipKepalaSekolah: '197508241999031005',
  logoSekolah: '',
  kopSekolah: '',
  kotaSekolah: 'Kota Pintar',
};

export default function App() {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transaksi' | 'laporan' | 'buku' | 'seting'>('dashboard');

  // Application Data States
  const [books, setBooks] = useState<BukuAmal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>({
    ...DEFAULT_SETTINGS,
    appsScriptUrl: APPS_SCRIPT_URL,
  });

  // Authentication states
  const [isAdmin, setIsAdmin] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Connection & Sync States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('syncing');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals visibility states
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTransactions, setPrintTransactions] = useState<Transaction[]>([]);
  const [printReportTitle, setPrintReportTitle] = useState('');

  // --- 1. Load Data from Online Google Sheets via Apps Script on Mount ---
  useEffect(() => {
    // Local admin session check
    const adminSession = localStorage.getItem('amal_admin_session') === 'true';
    setIsAdmin(adminSession);

    // Load logo/kop from localStorage cache if available (since base64 is heavy and kept locally in browser)
    const localSettingsStr = localStorage.getItem('amal_settings');
    let cachedLogo = '';
    let cachedKop = '';
    if (localSettingsStr) {
      try {
        const parsed = JSON.parse(localSettingsStr);
        cachedLogo = parsed.logoSekolah || '';
        cachedKop = parsed.kopSekolah || '';
      } catch (e) {}
    }

    const initFetch = async () => {
      setIsInitialLoading(true);
      setSyncStatus('syncing');
      setErrorMessage('');
      try {
        const data = await fetchFromAppsScript(APPS_SCRIPT_URL);
        
        // Populate states
        setBooks(data.books);
        setTransactions(data.transactions);
        
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...data.settings,
          logoSekolah: cachedLogo || data.settings.logoSekolah || '',
          kopSekolah: cachedKop || data.settings.kopSekolah || '',
          appsScriptUrl: APPS_SCRIPT_URL,
        };
        setSettings(mergedSettings);
        
        // Keep logo/kop cached in localStorage
        localStorage.setItem('amal_settings', JSON.stringify(mergedSettings));
        setSyncStatus('synced');
      } catch (err: any) {
        console.error('Initial Apps Script Fetch Error:', err);
        setSyncStatus('error');
        setErrorMessage(err.message || 'Gagal terhubung ke database online Google Sheets.');
        
        // If it fails, default to empty arrays or fallbacks
        setBooks([]);
        setTransactions([]);
        setSettings({
          ...DEFAULT_SETTINGS,
          logoSekolah: cachedLogo,
          kopSekolah: cachedKop,
          appsScriptUrl: APPS_SCRIPT_URL,
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    initFetch();
  }, []);

  // --- Synchronize with Google Apps Script ---
  const syncWithAppsScript = async (url: string = APPS_SCRIPT_URL, isInitialLoad = false) => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorMessage('');

    try {
      const data = await fetchFromAppsScript(url);
      setBooks(data.books);
      setTransactions(data.transactions);

      const localSettingsStr = localStorage.getItem('amal_settings');
      const localSettings = localSettingsStr ? JSON.parse(localSettingsStr) : {};
      const mergedSettings = {
        ...DEFAULT_SETTINGS,
        ...data.settings,
        logoSekolah: localSettings.logoSekolah || '',
        kopSekolah: localSettings.kopSekolah || '',
        appsScriptUrl: url,
      };
      setSettings(mergedSettings);
      localStorage.setItem('amal_settings', JSON.stringify(mergedSettings));
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Apps Script Sync Error:', err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'Gagal tersambung dengan database online Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to push updates to Apps Script (strictly online)
  const pushDataToSync = async (
    options: {
      books?: BukuAmal[];
      transactions?: Transaction[];
      settings?: SchoolSettings;
      action: 'saveBooks' | 'saveTransactions' | 'saveSettings' | 'saveAll';
    }
  ) => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorMessage('');
    try {
      await saveToAppsScript(APPS_SCRIPT_URL, options);
      setSyncStatus('synced');
      return true;
    } catch (err: any) {
      console.error('Apps Script Sync Error:', err);
      setSyncStatus('error');
      setErrorMessage('Gagal menyimpan perubahan ke database online Google Sheets.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // --- 2. Synchronize with Google Sheets ---
  const syncWithGoogleSheets = async (token: string, isInitialLoad = false) => {
    if (!token) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorMessage('');

    try {
      // Step A: Initialize Sheets & Tabs
      await initializeSheets(token);

      // Step B: Fetch current spreadsheets data
      const sheetsBooks = await fetchBukuAmalFromSheet(token);
      const sheetsTrans = await fetchTransactionsFromSheet(token);
      const sheetsSettings = await fetchSettingsFromSheet(token);

      const hasSheetsData = sheetsBooks.length > 0 || sheetsTrans.length > 0;

      if (!hasSheetsData && isInitialLoad) {
        // Sheet is completely empty! Let's write current local state (e.g. example defaults) into Google Sheets
        console.log('Google Sheets is empty. Uploading current local state to Google Sheets...');
        
        // Load latest from local storage just to be safe
        const localB = localStorage.getItem('amal_books') ? JSON.parse(localStorage.getItem('amal_books')!) : books;
        const localT = localStorage.getItem('amal_transactions') ? JSON.parse(localStorage.getItem('amal_transactions')!) : transactions;
        const localS = localStorage.getItem('amal_settings') ? JSON.parse(localStorage.getItem('amal_settings')!) : settings;

        await saveBukuAmalToSheet(token, localB);
        await saveTransactionsToSheet(token, localT);
        await saveSettingsToSheet(token, localS);

        setSyncStatus('synced');
      } else {
        // Sheets contain data! Replace local storage data with sheets data (Sheets is Source of Truth)
        if (sheetsBooks.length > 0) {
          setBooks(sheetsBooks);
          localStorage.setItem('amal_books', JSON.stringify(sheetsBooks));
        }
        if (sheetsTrans.length > 0) {
          setTransactions(sheetsTrans);
          localStorage.setItem('amal_transactions', JSON.stringify(sheetsTrans));
        }
        if (Object.keys(sheetsSettings).length > 0) {
          const localSettingsStr = localStorage.getItem('amal_settings');
          const localSettings = localSettingsStr ? JSON.parse(localSettingsStr) : {};
          const mergedSettings = {
            ...DEFAULT_SETTINGS,
            ...sheetsSettings,
            logoSekolah: localSettings.logoSekolah || '',
            kopSekolah: localSettings.kopSekolah || '',
          };
          setSettings(mergedSettings);
          localStorage.setItem('amal_settings', JSON.stringify(mergedSettings));
        }
        setSyncStatus('synced');
      }
    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'Gagal tersambung dengan Google Sheets API.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (settings.appsScriptUrl) {
      await syncWithAppsScript(settings.appsScriptUrl, false);
      return;
    }

    if (googleToken) {
      await syncWithGoogleSheets(googleToken);
    } else {
      // Trigger sign in
      try {
        const result = await googleSignIn();
        if (result) {
          setGoogleUser(result.user);
          setGoogleToken(result.accessToken);
          await syncWithGoogleSheets(result.accessToken, true);
        }
      } catch (err: any) {
        setSyncStatus('error');
        setErrorMessage('Gagal masuk menggunakan Akun Google.');
      }
    }
  };

  // --- 3. CRUD: Transaction Operations ---
  const handleSaveTransaction = async (data: Omit<Transaction, 'id'> & { id?: string }) => {
    let updatedTrans: Transaction[];

    if (data.id) {
      // Edit
      updatedTrans = transactions.map((t) =>
        t.id === data.id ? { ...t, ...data } as Transaction : t
      );
    } else {
      // Add
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      updatedTrans = [newTx, ...transactions];
    }

    // Update state immediately for rapid feedback
    setTransactions(updatedTrans);

    // Strictly push to online Google Sheet
    await pushDataToSync({
      action: 'saveTransactions',
      transactions: updatedTrans,
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    const updatedTrans = transactions.filter((t) => t.id !== id);

    setTransactions(updatedTrans);

    // Strictly push to online Google Sheet
    await pushDataToSync({
      action: 'saveTransactions',
      transactions: updatedTrans,
    });
  };

  // --- 4. CRUD: Buku Amal Operations ---
  const handleAddBook = async (nama: string) => {
    const newBook: BukuAmal = {
      id: `buku-${Date.now()}`,
      nama,
    };
    const updatedBooks = [...books, newBook];

    setBooks(updatedBooks);

    // Strictly push to online Google Sheet
    await pushDataToSync({
      action: 'saveBooks',
      books: updatedBooks,
    });
  };

  const handleEditBook = async (id: string, nama: string) => {
    const updatedBooks = books.map((b) => (b.id === id ? { ...b, nama } : b));

    setBooks(updatedBooks);

    // Strictly push to online Google Sheet
    await pushDataToSync({
      action: 'saveBooks',
      books: updatedBooks,
    });
  };

  const handleDeleteBook = async (id: string) => {
    const updatedBooks = books.filter((b) => b.id !== id);
    const updatedTrans = transactions.filter((t) => t.bukuAmalId !== id);

    setBooks(updatedBooks);
    setTransactions(updatedTrans);

    // Strictly push to online Google Sheet (saveAll)
    await pushDataToSync({
      action: 'saveAll',
      books: updatedBooks,
      transactions: updatedTrans,
    });
  };

  // --- 5. School Settings Operations ---
  const handleSaveSettings = async (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    // Keep heavy logo/kop base64 cached locally in browser
    localStorage.setItem('amal_settings', JSON.stringify(newSettings));

    // Strictly push settings fields to online Google Sheet
    await pushDataToSync({
      action: 'saveSettings',
      settings: newSettings,
    });
  };

  // --- 6. Admin Authentication toggles ---
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    localStorage.setItem('amal_admin_session', 'true');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.setItem('amal_admin_session', 'false');
  };

  // --- 7. Transaction counts helper for Book deletion ---
  const getTransactionCountByBook = () => {
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      counts[t.bukuAmalId] = (counts[t.bukuAmalId] || 0) + 1;
    });
    return counts;
  };

  // --- 8. Printing trigger handlers ---
  const handleOpenPrintList = (filtered: Transaction[]) => {
    setPrintTransactions(filtered);
    setPrintReportTitle("DAFTAR TRANSAKSI AMAL JUM'AT");
    setIsPrintModalOpen(true);
  };

  const handleOpenPrintReport = (filtered: Transaction[], title: string) => {
    setPrintTransactions(filtered);
    setPrintReportTitle(title);
    setIsPrintModalOpen(true);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100/40">
            <School className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-950">Menghubungkan...</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sedang memuat data transaksi & buku amal langsung dari Google Sheets secara real-time. Mohon tunggu sebentar.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-xs">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Memuat database online</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col pb-12">
      
      {/* 1. Header Banner / Navigation Bar */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg border border-indigo-100 shrink-0">
              {settings.logoSekolah ? (
                <img src={settings.logoSekolah} alt="Logo" referrerPolicy="no-referrer" className="w-7 h-7 object-contain" />
              ) : (
                <School className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                Amal Jum'at & Sosial
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                {settings.namaSekolah || 'IDENTITAS SEKOLAH BELUM DIATUR'}
              </span>
            </div>
          </div>

          {/* Sync & Admin State actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Google sheets connection status */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : syncStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {syncStatus === 'synced' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>Online (Google Sheets)</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span>Sinkronisasi...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                  <span>Koneksi Putus</span>
                </>
              )}
            </div>

            {/* Admin toggle badge */}
            {isAdmin ? (
              <button
                id="admin-logout-header"
                onClick={handleAdminLogout}
                className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800 text-emerald-700 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1"
                title="Sesi Admin Aktif. Klik untuk logout"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Admin Aktif</span>
              </button>
            ) : (
              <button
                id="admin-login-header"
                onClick={() => setIsAdminLoginOpen(true)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Login Admin</span>
              </button>
            )}

          </div>

        </div>

        {/* 2. Top-bar Tab Navigation */}
        <div className="bg-slate-50/50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 py-2 overflow-x-auto scrollbar-none">
              
              {/* Tab: Dashboard */}
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ringkasan Dashboard</span>
              </button>

              {/* Tab: Transaksi */}
              <button
                id="nav-tab-transaksi"
                onClick={() => setActiveTab('transaksi')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'transaksi'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <ReceiptText className="w-4 h-4" />
                <span>Mutasi Transaksi</span>
              </button>

              {/* Tab: Laporan Bulanan */}
              <button
                id="nav-tab-laporan"
                onClick={() => setActiveTab('laporan')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'laporan'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Laporan Bulanan</span>
              </button>

              {/* Tab: Kelola Buku Amal (Admin Only visible) */}
              <button
                id="nav-tab-buku"
                onClick={() => setActiveTab('buku')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'buku'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <BookOpenCheck className="w-4 h-4" />
                <span>Kelola Buku Amal</span>
                {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
              </button>

              {/* Tab: Identitas Sekolah (Admin Only visible) */}
              <button
                id="nav-tab-seting"
                onClick={() => setActiveTab('seting')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'seting'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <School className="w-4 h-4" />
                <span>Identitas Sekolah</span>
                {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
              </button>

            </nav>
          </div>
        </div>
      </header>

      {/* 2. Main Content Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full no-print">
        
        {/* Error message floating banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-sm text-red-800 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Kesalahan Sinkronisasi Google Sheets</p>
              <p className="text-red-600 text-xs">{errorMessage}</p>
              <p className="text-[10px] text-slate-400 mt-1">Data Anda tetap tersimpan dengan aman secara lokal di browser ini.</p>
            </div>
          </div>
        )}

        {/* Tab View Switcher */}
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            books={books}
            isSyncing={isSyncing}
            isAdmin={isAdmin}
            onSync={() => syncWithAppsScript()}
          />
        )}

        {activeTab === 'transaksi' && (
          <TransactionList
            transactions={transactions}
            books={books}
            isAdmin={isAdmin}
            onAddClick={() => {
              setEditingTransaction(null);
              setIsTransactionFormOpen(true);
            }}
            onEditClick={(tx) => {
              setEditingTransaction(tx);
              setIsTransactionFormOpen(true);
            }}
            onDeleteClick={handleDeleteTransaction}
            onPrintClick={handleOpenPrintList}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanBulanan
            transactions={transactions}
            books={books}
            settings={settings}
            onPrintClick={handleOpenPrintReport}
          />
        )}

        {activeTab === 'buku' && (
          isAdmin ? (
            <BukuAmalManager
              books={books}
              onAddBook={handleAddBook}
              onEditBook={handleEditBook}
              onDeleteBook={handleDeleteBook}
              transactionCountByBook={getTransactionCountByBook()}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm max-w-md mx-auto text-center my-12">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Halaman Terkunci</h3>
              <p className="text-slate-500 text-xs mt-1 mb-6 leading-relaxed">
                Hanya Administrator terdaftar yang memiliki otoritas untuk memodifikasi, menambah, atau menghapus buku amal.
              </p>
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Login Sebagai Admin
              </button>
            </div>
          )
        )}

        {activeTab === 'seting' && (
          isAdmin ? (
            <SettingsPanel
              settings={settings}
              onSave={handleSaveSettings}
              isSyncing={isSyncing}
            />
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm max-w-md mx-auto text-center my-12">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Halaman Terkunci</h3>
              <p className="text-slate-500 text-xs mt-1 mb-6 leading-relaxed">
                Silakan login sebagai administrator untuk mengubah identitas sekolah, alamat kepala sekolah, logo, dan mengunggah kop surat sekolah.
              </p>
              <button
                onClick={() => setIsAdminLoginOpen(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Login Sebagai Admin
              </button>
            </div>
          )
        )}

      </main>

      {/* --- MODALS STAGE --- */}

      {/* A. Admin Login Modal */}
      <AdminLogin
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        isAdmin={isAdmin}
        onLogout={handleAdminLogout}
      />

      {/* B. Transaction Create/Edit Form Modal */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => {
          setIsTransactionFormOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        books={books}
        editingTransaction={editingTransaction}
      />

      {/* C. Printable Document Modal */}
      <CetakLaporan
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={printTransactions}
        books={books}
        settings={settings}
        title={printReportTitle}
      />

    </div>
  );
}
