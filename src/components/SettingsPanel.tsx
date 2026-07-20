import React, { useState, useEffect } from 'react';
import { SchoolSettings } from '../types';
import { Save, Upload, Check, AlertCircle, RefreshCw, FileText, Copy, Database, HelpCircle } from 'lucide-react';

interface SettingsPanelProps {
  settings: SchoolSettings;
  onSave: (newSettings: SchoolSettings) => Promise<void>;
  isSyncing: boolean;
}

export default function SettingsPanel({ settings, onSave, isSyncing }: SettingsPanelProps) {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [localLogo, setLocalLogo] = useState<string>(settings.logoSekolah || '');
  const [localKop, setLocalKop] = useState<string>(settings.kopSekolah || '');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const appsScriptCode = `function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.openById("18qpMAwqXjXf272wc-6oi-CIdqb9I5roiuhnZy-dawbA");
  
  if (action === "fetchBooks") {
    return getSheetData(sheet, "BukuAmal");
  } else if (action === "fetchTransactions") {
    return getSheetData(sheet, "Transaksi");
  } else if (action === "fetchSettings") {
    return getSheetData(sheet, "Settings");
  } else {
    // Fetch all
    return jsonResponse({
      books: getSheetRows(sheet, "BukuAmal"),
      transactions: getSheetRows(sheet, "Transaksi"),
      settings: getSheetRows(sheet, "Settings")
    });
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    var sheet = SpreadsheetApp.openById("18qpMAwqXjXf272wc-6oi-CIdqb9I5roiuhnZy-dawbA");
    
    if (action === "saveBooks") {
      saveSheetData(sheet, "BukuAmal", data, ["id", "nama"]);
    } else if (action === "saveTransactions") {
      saveSheetData(sheet, "Transaksi", data, ["id", "tanggal", "bukuAmalId", "tipe", "kategori", "jumlah", "keterangan"]);
    } else if (action === "saveSettings") {
      saveSettingsData(sheet, "Settings", data);
    } else if (action === "saveAll") {
      if (payload.books) saveSheetData(sheet, "BukuAmal", payload.books, ["id", "nama"]);
      if (payload.transactions) saveSheetData(sheet, "Transaksi", payload.transactions, ["id", "tanggal", "bukuAmalId", "tipe", "kategori", "jumlah", "keterangan"]);
      if (payload.settings) saveSettingsData(sheet, "Settings", payload.settings);
    }
    
    return jsonResponse({ status: "success" });
  } catch(err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function getSheetRows(sheet, sheetName) {
  var ws = sheet.getSheetByName(sheetName);
  if (!ws) return [];
  var data = ws.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function getSheetData(sheet, sheetName) {
  return jsonResponse(getSheetRows(sheet, sheetName));
}

function saveSheetData(sheet, sheetName, rows, headers) {
  var ws = sheet.getSheetByName(sheetName);
  if (!ws) {
    ws = sheet.insertSheet(sheetName);
  }
  ws.clear();
  
  ws.appendRow(headers);
  if (rows && rows.length > 0) {
    var dataToAppend = [];
    for (var i = 0; i < rows.length; i++) {
      var rowData = [];
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        rowData.push(rows[i][key] !== undefined ? rows[i][key] : "");
      }
      dataToAppend.push(rowData);
    }
    ws.getRange(2, 1, dataToAppend.length, headers.length).setValues(dataToAppend);
  }
}

function saveSettingsData(sheet, sheetName, settingsObj) {
  var ws = sheet.getSheetByName(sheetName);
  if (!ws) {
    ws = sheet.insertSheet(sheetName);
  }
  ws.clear();
  ws.appendRow(["Key", "Value"]);
  
  var entries = Object.keys(settingsObj)
    .filter(function(k) { return k !== "logoSekolah" && k !== "kopSekolah" && k !== "appsScriptUrl"; })
    .map(function(k) { return [k, settingsObj[k] || ""]; });
    
  if (entries.length > 0) {
    ws.getRange(2, 1, entries.length, 2).setValues(entries);
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    setFormData({ ...settings });
    setLocalLogo(settings.logoSekolah || '');
    setLocalKop(settings.kopSekolah || '');
  }, [settings]);

  // Convert File to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'kop') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      setStatus({
        type: 'error',
        message: 'Ukuran file terlalu besar. Maksimal adalah 1.5MB untuk kompatibilitas penyimpanan.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (field === 'logo') {
        setLocalLogo(result);
        setFormData(prev => ({ ...prev, logoSekolah: result }));
      } else {
        setLocalKop(result);
        setFormData(prev => ({ ...prev, kopSekolah: result }));
      }
      setStatus({ type: 'success', message: `${field === 'logo' ? 'Logo' : 'Kop Sekolah'} berhasil dimuat! Klik Simpan.` });
    };
    reader.onerror = () => {
      setStatus({ type: 'error', message: 'Gagal membaca file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: null, message: '' });

    try {
      await onSave({
        ...formData,
        logoSekolah: localLogo,
        kopSekolah: localKop,
      });
      setStatus({ type: 'success', message: 'Identitas dan pengaturan sekolah berhasil disimpan dan disinkronkan!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'Gagal menyimpan data ke Google Sheets. Silakan coba lagi.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="settings-panel-container" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 max-w-4xl mx-auto">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl font-bold text-slate-800">Pengaturan Identitas Sekolah & KOP</h2>
        <p className="text-slate-500 text-sm mt-1">
          Identitas ini akan digunakan sebagai kop laporan dan penandatangan dokumen cetak transaksi Amal Jum'at.
        </p>
      </div>

      {status.type && (
        <div
          id="settings-status-alert"
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 border text-sm ${
            status.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
              : 'bg-red-50 text-red-800 border-red-100'
          }`}
        >
          {status.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          )}
          <div>{status.message}</div>
        </div>
      )}

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: text inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Sekolah</label>
              <input
                id="settings-nama-sekolah"
                type="text"
                name="namaSekolah"
                required
                value={formData.namaSekolah}
                onChange={handleInputChange}
                placeholder="Contoh: SD Negeri 1 Merdeka"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Sekolah</label>
              <textarea
                id="settings-alamat-sekolah"
                name="alamatSekolah"
                required
                rows={3}
                value={formData.alamatSekolah}
                onChange={handleInputChange}
                placeholder="Contoh: Jl. Ki Hajar Dewantara No. 45, Jakarta Selatan"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kota / Kabupaten Sekolah</label>
              <input
                id="settings-kota-sekolah"
                type="text"
                name="kotaSekolah"
                required
                value={formData.kotaSekolah || ''}
                onChange={handleInputChange}
                placeholder="Contoh: Jakarta Selatan"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                <input
                  id="settings-kepala-sekolah"
                  type="text"
                  name="kepalaSekolah"
                  required
                  value={formData.kepalaSekolah}
                  onChange={handleInputChange}
                  placeholder="Nama Lengkap & Gelar"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input
                  id="settings-nip"
                  type="text"
                  name="nipKepalaSekolah"
                  required
                  value={formData.nipKepalaSekolah}
                  onChange={handleInputChange}
                  placeholder="Contoh: 198203112009031002"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Column: upload fields */}
          <div className="space-y-6">
            {/* Logo upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Logo Sekolah</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {localLogo ? (
                    <img src={localLogo} alt="Logo Preview" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-slate-400 text-xs text-center p-1 font-semibold">Belum Ada</span>
                  )}
                </div>
                <div className="grow">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer border border-slate-200 transition-colors">
                    <Upload className="w-4 h-4 text-slate-500" />
                    Pilih Logo (PNG/JPG)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Rekomendasi rasio persegi (1:1) dan ukuran &lt; 500KB.</p>
                </div>
              </div>
            </div>

            {/* Kop Sekolah upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Kop Surat Sekolah (Gambar atau Acuan)</label>
              <div className="space-y-3">
                <div className="w-full h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden relative">
                  {localKop ? (
                    <img src={localKop} alt="Kop Surat Preview" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-4">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <span className="text-slate-400 text-xs">Belum Ada Kop yang Diunggah</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer border border-slate-200 transition-colors">
                    <Upload className="w-4 h-4 text-slate-500" />
                    Unggah Gambar Kop Sekolah
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'kop')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Kop ini akan ditampilkan di bagian atas cetakan transaksi resmi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apps Script Locked Database Connection Status */}
        <div className="border-t border-slate-100 pt-6 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Koneksi Database Google Sheets
            </h3>
          </div>
          
          <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 md:p-5 flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Database Terhubung & Terkunci (Bypass Mode)</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Aplikasi ini dikonfigurasi menggunakan mode sinkronisasi otomatis tanpa login. Seluruh data transaksi disimpan secara online ke Google Sheet dengan ID: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold text-[10px] text-indigo-600">18qpMAwqXjXf272wc-6oi-CIdqb9I5roiuhnZy-dawbA</code>.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>STATUS: AKTIF & ONLINE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
          <button
            id="settings-submit-btn"
            type="submit"
            disabled={isSaving || isSyncing}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-100"
          >
            {isSaving || isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
