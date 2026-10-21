import { Transaction, Account, Category, BudgetGoal, CloudBackupSnapshot } from '../types/finance';
import { StorageBox, ProductItem, StockMovement, AppRole } from '../types/inventory';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_BUDGETS } from '../data/seedData';
import { INITIAL_BOXES, INITIAL_PRODUCTS, INITIAL_MOVEMENTS } from '../data/inventorySeed';

const STORAGE_KEYS = {
  TRANSACTIONS: 'kontro_transactions_v1',
  ACCOUNTS: 'kontro_accounts_v1',
  CATEGORIES: 'kontro_categories_v1',
  BUDGETS: 'kontro_budgets_v1',
  BOXES: 'kontro_boxes_v1',
  PRODUCTS: 'kontro_products_v1',
  MOVEMENTS: 'kontro_movements_v1',
  APP_ROLE: 'kontro_app_role_v1',
  MANAGER_PIN: 'kontro_manager_pin_v1',
  CLOUD_BACKUPS: 'kontro_cloud_backups_v1',
  CLOUD_SYNC_KEY: 'kontro_cloud_sync_key_v1',
  AUTO_BACKUP_ENABLED: 'kontro_auto_backup_enabled_v1',
  LAST_BACKUP_TIME: 'kontro_last_backup_time_v1',
};

export interface AppStateData {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: BudgetGoal[];
  boxes: StorageBox[];
  products: ProductItem[];
  movements: StockMovement[];
  appRole: AppRole;
  managerPin: string;
}

export const StorageService = {
  loadState(): AppStateData {
    try {
      const txs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const accs = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      const cats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const bdgs = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      const boxes = localStorage.getItem(STORAGE_KEYS.BOXES);
      const prods = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const movs = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      const role = localStorage.getItem(STORAGE_KEYS.APP_ROLE) as AppRole | null;
      const pin = localStorage.getItem(STORAGE_KEYS.MANAGER_PIN);

      return {
        transactions: txs ? JSON.parse(txs) : INITIAL_TRANSACTIONS,
        accounts: accs ? JSON.parse(accs) : INITIAL_ACCOUNTS,
        categories: cats ? JSON.parse(cats) : INITIAL_CATEGORIES,
        budgets: bdgs ? JSON.parse(bdgs) : INITIAL_BUDGETS,
        boxes: boxes ? JSON.parse(boxes) : INITIAL_BOXES,
        products: prods ? JSON.parse(prods) : INITIAL_PRODUCTS,
        movements: movs ? JSON.parse(movs) : INITIAL_MOVEMENTS,
        appRole: role || 'manager',
        managerPin: pin || '1234',
      };
    } catch (err) {
      console.error('Erro ao carregar dados do armazenamento local:', err);
      return {
        transactions: INITIAL_TRANSACTIONS,
        accounts: INITIAL_ACCOUNTS,
        categories: INITIAL_CATEGORIES,
        budgets: INITIAL_BUDGETS,
        boxes: INITIAL_BOXES,
        products: INITIAL_PRODUCTS,
        movements: INITIAL_MOVEMENTS,
        appRole: 'manager',
        managerPin: '1234',
      };
    }
  },

  saveState(state: AppStateData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(state.accounts));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.budgets));
      localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(state.boxes));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(state.products));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(state.movements));
      localStorage.setItem(STORAGE_KEYS.APP_ROLE, state.appRole);
      localStorage.setItem(STORAGE_KEYS.MANAGER_PIN, state.managerPin);
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
    }
  },

  getCloudSyncKey(): string {
    let key = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC_KEY);
    if (!key) {
      key = `KTR-${Math.floor(1000 + Math.random() * 9000)}-BR`;
      localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC_KEY, key);
    }
    return key;
  },

  setCloudSyncKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC_KEY, key.toUpperCase().trim());
  },

  getCloudBackups(): CloudBackupSnapshot[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CLOUD_BACKUPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getLastBackupTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_TIME);
  },

  isAutoBackupEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_BACKUP_ENABLED);
    return val !== 'false'; // default true
  },

  setAutoBackupEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTO_BACKUP_ENABLED, String(enabled));
  },

  createCloudBackup(state: AppStateData, deviceLabel = 'Navegador Web / Mobile'): CloudBackupSnapshot {
    const syncKey = this.getCloudSyncKey();
    const timestamp = new Date().toISOString();
    
    const netWorth = state.accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    const dataHash = `hash-${Date.now().toString(36)}-${state.transactions.length}-${state.products.length}`;

    const snapshot: CloudBackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp,
      device: deviceLabel,
      transactionCount: state.transactions.length,
      accountCount: state.accounts.length,
      categoryCount: state.categories.length,
      budgetCount: state.budgets.length,
      totalNetWorth: netWorth,
      dataHash,
      cloudSyncKey: syncKey,
      payload: {
        transactions: state.transactions,
        accounts: state.accounts,
        categories: state.categories,
        budgets: state.budgets,
        version: '2.0.0',
        ...({
          boxes: state.boxes,
          products: state.products,
          movements: state.movements,
        }),
      } as any,
    };

    const existing = this.getCloudBackups();
    const updated = [snapshot, ...existing].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.CLOUD_BACKUPS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_TIME, timestamp);

    return snapshot;
  },

  restoreBackup(snapshot: CloudBackupSnapshot, currentRole: AppRole = 'manager', currentPin = '1234'): AppStateData {
    const payload = snapshot.payload as any;
    const restored: AppStateData = {
      transactions: payload.transactions || [],
      accounts: payload.accounts || [],
      categories: payload.categories || [],
      budgets: payload.budgets || [],
      boxes: payload.boxes || INITIAL_BOXES,
      products: payload.products || INITIAL_PRODUCTS,
      movements: payload.movements || INITIAL_MOVEMENTS,
      appRole: currentRole,
      managerPin: currentPin,
    };
    this.saveState(restored);
    return restored;
  },

  deleteBackup(snapshotId: string): void {
    const existing = this.getCloudBackups();
    const filtered = existing.filter(b => b.id !== snapshotId);
    localStorage.setItem(STORAGE_KEYS.CLOUD_BACKUPS, JSON.stringify(filtered));
  },

  exportToJsonFile(state: AppStateData): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      appName: 'Janela Branca · Gestão Financeira & Base de Dados',
      exportDate: new Date().toISOString(),
      syncKey: this.getCloudSyncKey(),
      ...state,
    }, null, 2));

    const dateSlug = new Date().toISOString().split('T')[0];
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `janela_branca_backup_${dateSlug}.json`);
    dlAnchor.click();
    dlAnchor.remove();
  },

  exportToCSV(state: AppStateData): void {
    const headers = [
      'ID',
      'Data',
      'Descrição',
      'Tipo',
      'Categoria',
      'Conta',
      'Forma de Pagamento',
      'Valor (R$)',
      'Status',
      'Código de Barras / QR',
      'Observações',
    ];

    const categoryMap = new Map(state.categories.map(c => [c.id, c.name]));
    const accountMap = new Map(state.accounts.map(a => [a.id, a.name]));

    const rows = state.transactions.map(tx => [
      tx.id,
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type === 'expense' ? 'Despesa' : tx.type === 'income' ? 'Receita' : 'Transferência',
      `"${categoryMap.get(tx.categoryId) || 'Outros'}"`,
      `"${accountMap.get(tx.accountId) || 'Conta'}"`,
      tx.paymentMethod.toUpperCase(),
      tx.amount.toFixed(2).replace('.', ','),
      tx.status === 'completed' ? 'Pago' : 'Pendente',
      tx.barcodeOrQrCode ? `"${tx.barcodeOrQrCode.replace(/"/g, '""')}"` : '',
      tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateSlug = new Date().toISOString().split('T')[0];

    const a = document.createElement('a');
    a.href = url;
    a.download = `janela_branca_extrato_${dateSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  },

  parseImportJson(jsonText: string): AppStateData {
    const parsed = JSON.parse(jsonText);
    const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : INITIAL_ACCOUNTS;
    const categories = Array.isArray(parsed.categories) ? parsed.categories : INITIAL_CATEGORIES;
    const budgets = Array.isArray(parsed.budgets) ? parsed.budgets : INITIAL_BUDGETS;
    const boxes = Array.isArray(parsed.boxes) ? parsed.boxes : INITIAL_BOXES;
    const products = Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS;
    const movements = Array.isArray(parsed.movements) ? parsed.movements : INITIAL_MOVEMENTS;
    const appRole = parsed.appRole || 'manager';
    const managerPin = parsed.managerPin || '1234';

    return { transactions, accounts, categories, budgets, boxes, products, movements, appRole, managerPin };
  },

  resetToDefault(): AppStateData {
    const initial: AppStateData = {
      transactions: INITIAL_TRANSACTIONS,
      accounts: INITIAL_ACCOUNTS,
      categories: INITIAL_CATEGORIES,
      budgets: INITIAL_BUDGETS,
      boxes: INITIAL_BOXES,
      products: INITIAL_PRODUCTS,
      movements: INITIAL_MOVEMENTS,
      appRole: 'manager',
      managerPin: '1234',
    };
    this.saveState(initial);
    return initial;
  },
};
