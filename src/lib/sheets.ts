import { BukuAmal, Transaction, SchoolSettings } from '../types';

export const SPREADSHEET_ID = '18qpMAwqXjXf272wc-6oi-CIdqb9I5roiuhnZy-dawbA';
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Helper to make API requests with Authorization
async function googleSheetsRequest(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const url = `${BASE_URL}/${SPREADSHEET_ID}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Google Sheets API Error [${response.status}]:`, errorText);
    throw new Error(`Google Sheets API error: ${response.statusText || response.status} - ${errorText}`);
  }

  return response.json();
}

// 1. Initialize Sheets: Check if tabs exist, if not, create them. Then verify headers.
export async function initializeSheets(accessToken: string): Promise<void> {
  try {
    // Get spreadsheet info to see existing sheet names
    const spreadsheet = await googleSheetsRequest('', accessToken);
    const existingSheets = spreadsheet.sheets?.map((s: any) => s.properties?.title) || [];

    const requiredSheets = ['Transaksi', 'BukuAmal', 'Settings'];
    const sheetsToCreate = requiredSheets.filter((name) => !existingSheets.includes(name));

    if (sheetsToCreate.length > 0) {
      console.log('Creating missing sheets:', sheetsToCreate);
      const requests = sheetsToCreate.map((name) => ({
        addSheet: {
          properties: {
            title: name,
          },
        },
      }));

      await googleSheetsRequest(':batchUpdate', accessToken, {
        method: 'POST',
        body: JSON.stringify({ requests }),
      });
    }

    // Now write default headers if they don't exist
    await writeHeadersIfMissing(accessToken);
  } catch (error) {
    console.error('Failed to initialize Google Sheets:', error);
    throw error;
  }
}

async function writeHeadersIfMissing(accessToken: string) {
  // Transaksi Headers
  const transHeaders = [['ID', 'Tanggal', 'Buku Amal ID', 'Tipe', 'Kategori', 'Jumlah', 'Keterangan']];
  const bukuHeaders = [['ID', 'Nama Buku Amal']];
  const settingsHeaders = [['Kunci', 'Nilai']];

  // We can write with batchUpdate values
  await googleSheetsRequest('/values/Transaksi!A1:G1?valueInputOption=USER_ENTERED', accessToken, {
    method: 'PUT',
    body: JSON.stringify({ values: transHeaders }),
  });

  await googleSheetsRequest('/values/BukuAmal!A1:B1?valueInputOption=USER_ENTERED', accessToken, {
    method: 'PUT',
    body: JSON.stringify({ values: bukuHeaders }),
  });

  await googleSheetsRequest('/values/Settings!A1:B1?valueInputOption=USER_ENTERED', accessToken, {
    method: 'PUT',
    body: JSON.stringify({ values: settingsHeaders }),
  });
}

// 2. Fetch Buku Amal
export async function fetchBukuAmalFromSheet(accessToken: string): Promise<BukuAmal[]> {
  try {
    const data = await googleSheetsRequest('/values/BukuAmal!A2:B500', accessToken);
    const rows = data.values || [];
    
    const uniqueBookIds = new Set<string>();
    return rows.map((row: any[]) => ({
      id: String(row[0] || '').trim(),
      nama: String(row[1] || '').trim(),
    })).filter((b: BukuAmal) => {
      if (!b.id || !b.nama) return false;
      if (uniqueBookIds.has(b.id)) return false;
      uniqueBookIds.add(b.id);
      return true;
    });
  } catch (error) {
    console.error('Failed to fetch Buku Amal from Google Sheets:', error);
    throw error;
  }
}

// 3. Save Buku Amal (Overwrite sheet)
export async function saveBukuAmalToSheet(accessToken: string, books: BukuAmal[]): Promise<void> {
  try {
    // Clear existing values first to avoid leaving remnants
    await googleSheetsRequest('/values/BukuAmal!A2:B1000:clear', accessToken, {
      method: 'POST',
    });

    const values = books.map((b) => [b.id, b.nama]);
    if (values.length === 0) return;

    await googleSheetsRequest('/values/BukuAmal!A2?valueInputOption=USER_ENTERED', accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  } catch (error) {
    console.error('Failed to save Buku Amal to Google Sheets:', error);
    throw error;
  }
}

// 4. Fetch Transactions
export async function fetchTransactionsFromSheet(accessToken: string): Promise<Transaction[]> {
  try {
    const data = await googleSheetsRequest('/values/Transaksi!A2:G10000', accessToken);
    const rows = data.values || [];

    const uniqueTxIds = new Set<string>();
    return rows.map((row: any[]) => ({
      id: String(row[0] || '').trim(),
      tanggal: String(row[1] || '').trim(),
      bukuAmalId: String(row[2] || '').trim(),
      tipe: (row[3] || 'pemasukan') as 'pemasukan' | 'pengeluaran',
      kategori: String(row[4] || '').trim(),
      jumlah: parseFloat(row[5] || '0') || 0,
      keterangan: String(row[6] || '').trim(),
    })).filter((t: Transaction) => {
      if (!t.id || !t.tanggal || !t.bukuAmalId) return false;
      if (uniqueTxIds.has(t.id)) return false;
      uniqueTxIds.add(t.id);
      return true;
    });
  } catch (error) {
    console.error('Failed to fetch Transactions from Google Sheets:', error);
    throw error;
  }
}

// 5. Save Transactions (Overwrite sheet)
export async function saveTransactionsToSheet(accessToken: string, transactions: Transaction[]): Promise<void> {
  try {
    // Clear existing values first
    await googleSheetsRequest('/values/Transaksi!A2:G10000:clear', accessToken, {
      method: 'POST',
    });

    const values = transactions.map((t) => [
      t.id,
      t.tanggal,
      t.bukuAmalId,
      t.tipe,
      t.kategori,
      t.jumlah.toString(),
      t.keterangan || '',
    ]);

    if (values.length === 0) return;

    await googleSheetsRequest('/values/Transaksi!A2?valueInputOption=USER_ENTERED', accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  } catch (error) {
    console.error('Failed to save Transactions to Google Sheets:', error);
    throw error;
  }
}

// 6. Fetch Settings
export async function fetchSettingsFromSheet(accessToken: string): Promise<Partial<SchoolSettings>> {
  try {
    const data = await googleSheetsRequest('/values/Settings!A2:B100', accessToken);
    const rows = data.values || [];

    const settings: Partial<SchoolSettings> = {};
    rows.forEach((row: any[]) => {
      if (row[0]) {
        const key = row[0] as keyof SchoolSettings;
        settings[key] = row[1] || '';
      }
    });

    return settings;
  } catch (error) {
    console.error('Failed to fetch settings from Google Sheets:', error);
    throw error;
  }
}

// 7. Save Settings
export async function saveSettingsToSheet(accessToken: string, settings: SchoolSettings): Promise<void> {
  try {
    // Convert settings object to rows, excluding heavy base64 strings
    const values = Object.entries(settings)
      .filter(([key]) => key !== 'logoSekolah' && key !== 'kopSekolah')
      .map(([key, val]) => [key, val || '']);

    // Clear existing
    await googleSheetsRequest('/values/Settings!A2:B100:clear', accessToken, {
      method: 'POST',
    });

    await googleSheetsRequest('/values/Settings!A2?valueInputOption=USER_ENTERED', accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  } catch (error) {
    console.error('Failed to save settings to Google Sheets:', error);
    throw error;
  }
}
