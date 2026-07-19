import { BukuAmal, Transaction, SchoolSettings } from '../types';

/**
 * Service to communicate with Google Apps Script Web App
 */

export async function fetchFromAppsScript(url: string): Promise<{
  books: BukuAmal[];
  transactions: Transaction[];
  settings: Partial<SchoolSettings>;
}> {
  // Simple fetch GET request
  const response = await fetch(`${url}?action=fetchAll`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Apps Script responded with status: ${response.status}`);
  }

  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message || 'Error fetching data from Google Sheets');
  }

  // Parse types properly (ensure numbers are numbers) and deduplicate keys/IDs
  const uniqueBookIds = new Set<string>();
  const books: BukuAmal[] = (data.books || [])
    .map((b: any) => ({
      id: String(b.id || '').trim(),
      nama: String(b.nama || '').trim(),
    }))
    .filter((b: BukuAmal) => {
      if (!b.id || !b.nama) return false;
      if (uniqueBookIds.has(b.id)) return false;
      uniqueBookIds.add(b.id);
      return true;
    });

  const uniqueTxIds = new Set<string>();
  const transactions: Transaction[] = (data.transactions || [])
    .map((t: any) => ({
      id: String(t.id || '').trim(),
      tanggal: String(t.tanggal || '').trim(),
      bukuAmalId: String(t.bukuAmalId || '').trim(),
      tipe: t.tipe === 'pengeluaran' ? 'pengeluaran' : 'pemasukan',
      kategori: String(t.kategori || '').trim(),
      jumlah: Number(t.jumlah || 0),
      keterangan: String(t.keterangan || '').trim(),
    }))
    .filter((t: Transaction) => {
      if (!t.id || !t.tanggal || !t.bukuAmalId) return false;
      if (uniqueTxIds.has(t.id)) return false;
      uniqueTxIds.add(t.id);
      return true;
    });

  const settings: Partial<SchoolSettings> = {};
  if (Array.isArray(data.settings)) {
    data.settings.forEach((item: any) => {
      if (item.Key) {
        (settings as any)[item.Key] = item.Value;
      }
    });
  } else if (data.settings && typeof data.settings === 'object') {
    Object.assign(settings, data.settings);
  }

  return { books, transactions, settings };
}

export async function saveToAppsScript(
  url: string,
  payload: {
    books?: BukuAmal[];
    transactions?: Transaction[];
    settings?: SchoolSettings;
    action: 'saveAll' | 'saveBooks' | 'saveTransactions' | 'saveSettings';
  }
): Promise<void> {
  // Convert payload settings to not include heavy fields
  let dataToSend: any = { ...payload };
  if (payload.settings) {
    const { logoSekolah, kopSekolah, ...cleanSettings } = payload.settings;
    dataToSend.settings = cleanSettings;
  }

  // Determine the 'data' field to be fully compatible with Google Apps Script doPost handler which reads 'payload.data'
  let dataField: any = undefined;
  if (payload.action === 'saveBooks') {
    dataField = payload.books;
  } else if (payload.action === 'saveTransactions') {
    dataField = payload.transactions;
  } else if (payload.action === 'saveSettings') {
    dataField = dataToSend.settings;
  }

  // Google Apps Script doPost redirects (302). fetch with redirect: 'follow' handles this automatically in modern browsers.
  const response = await fetch(url, {
    method: 'POST',
    mode: 'no-cors', // Using no-cors handles the redirection without CORS errors
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: payload.action,
      data: dataField,
      books: payload.books,
      transactions: payload.transactions,
      settings: dataToSend.settings,
    }),
  });

  // Since mode is 'no-cors', the response type is 'opaque', meaning we can't inspect the status,
  // but it successfully posts the data. If we want to inspect response status, we can try 'cors',
  // but 'no-cors' is extremely reliable for fire-and-forget/silent writes to Apps Script.
  // We'll trust that if it didn't throw a network error, it succeeded.
}
