import React, { useState } from 'react';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { BudgetsView } from './components/BudgetsView';
import { CloudBackupView } from './components/CloudBackupView';
import { ManagerDatabaseView } from './components/ManagerDatabaseView';
import { OperatorAppView } from './components/OperatorAppView';
import { ScannerModal } from './components/ScannerModal';
import { TransactionModal } from './components/TransactionModal';
import { PdfReportModal } from './components/PdfReportModal';
import { StorageService, AppStateData } from './services/storageService';
import { Transaction, ParsedCodeResult } from './types/finance';
import { StorageBox, ProductItem, StockMovement, AppRole } from './types/inventory';
import { formatBRL } from './utils/formatters';
import { Shield, Key, Check, X, Box, Package } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(() => StorageService.loadState());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScannerForProductCheck, setIsScannerForProductCheck] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isPdfReportOpen, setIsPdfReportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [scannerPrefill, setScannerPrefill] = useState<ParsedCodeResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manager PIN Prompt Modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Product Inspection Modal from Scanner
  const [scannedProductInfo, setScannedProductInfo] = useState<ProductItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Persist state to local storage and update accounts when transactions change
  const updateStateAndSave = (nextState: AppStateData, shouldBackup = true) => {
    // Recalculate account balances based on completed transactions
    const updatedAccounts = nextState.accounts.map(acc => {
      let balance = acc.initialBalance;
      nextState.transactions.forEach(t => {
        if (t.status === 'completed') {
          if (t.accountId === acc.id) {
            if (t.type === 'expense') balance -= t.amount;
            else if (t.type === 'income') balance += t.amount;
            else if (t.type === 'transfer') balance -= t.amount;
          }
          if (t.type === 'transfer' && t.toAccountId === acc.id) {
            balance += t.amount;
          }
        }
      });
      return { ...acc, currentBalance: balance };
    });

    const finalState: AppStateData = {
      ...nextState,
      accounts: updatedAccounts,
    };

    setAppState(finalState);
    StorageService.saveState(finalState);

    if (shouldBackup && StorageService.isAutoBackupEnabled()) {
      StorageService.createCloudBackup(finalState, 'Sincronização Automática');
    }
  };

  // Add / Edit transaction handler
  const handleSaveTransaction = (txPayload: Partial<Transaction>, totalInstallments = 1) => {
    if (editingTransaction) {
      const updatedTxs = appState.transactions.map(t =>
        t.id === editingTransaction.id
          ? {
              ...t,
              ...txPayload,
              updatedAt: new Date().toISOString(),
            } as Transaction
          : t
      );
      updateStateAndSave({ ...appState, transactions: updatedTxs });
      showToast('Lançamento atualizado com sucesso!');
    } else {
      const newTransactions: Transaction[] = [];
      const installmentGroupId = totalInstallments > 1 ? `group-${Date.now()}` : undefined;
      const baseAmount = (txPayload.amount || 0) / totalInstallments;

      for (let i = 1; i <= totalInstallments; i++) {
        let instDate = txPayload.date || new Date().toISOString().split('T')[0];
        if (i > 1) {
          const [y, m, d] = instDate.split('-').map(Number);
          const nextM = m + (i - 1);
          const adjY = y + Math.floor((nextM - 1) / 12);
          const adjM = ((nextM - 1) % 12) + 1;
          instDate = `${adjY}-${String(adjM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }

        const newTx: Transaction = {
          id: `tx-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          description: totalInstallments > 1 ? `${txPayload.description} (${i}/${totalInstallments})` : (txPayload.description || 'Lançamento'),
          amount: parseFloat(baseAmount.toFixed(2)),
          date: instDate,
          time: txPayload.time || '12:00',
          type: txPayload.type || 'expense',
          categoryId: txPayload.categoryId || '',
          accountId: txPayload.accountId || appState.accounts[0]?.id || '',
          toAccountId: txPayload.toAccountId,
          paymentMethod: txPayload.paymentMethod || 'credit',
          status: i === 1 ? (txPayload.status || 'completed') : 'pending',
          installments: totalInstallments > 1 ? { current: i, total: totalInstallments, installmentGroupId } : undefined,
          barcodeOrQrCode: txPayload.barcodeOrQrCode,
          codeType: txPayload.codeType,
          notes: txPayload.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newTransactions.push(newTx);
      }

      updateStateAndSave({
        ...appState,
        transactions: [...newTransactions, ...appState.transactions],
      });
      showToast(totalInstallments > 1 ? `${totalInstallments} parcelas cadastradas!` : 'Lançamento financeiro cadastrado!');
    }

    setEditingTransaction(null);
    setScannerPrefill(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = appState.transactions.filter(t => t.id !== id);
    updateStateAndSave({ ...appState, transactions: updated });
    showToast('Lançamento excluído.');
  };

  const handleToggleStatus = (id: string) => {
    const updated = appState.transactions.map(t =>
      t.id === id
        ? {
            ...t,
            status: (t.status === 'completed' ? 'pending' : 'completed') as Transaction['status'],
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    updateStateAndSave({ ...appState, transactions: updated });
    showToast('Status atualizado.');
  };

  const handleUpdateBudget = (categoryId: string, newLimit: number) => {
    const existingIdx = appState.budgets.findIndex(b => b.categoryId === categoryId);
    let updatedBudgets = [...appState.budgets];
    if (existingIdx >= 0) {
      updatedBudgets[existingIdx] = {
        ...updatedBudgets[existingIdx],
        monthlyLimit: newLimit,
      };
    } else {
      updatedBudgets.push({
        id: `b-${Date.now()}`,
        categoryId,
        monthlyLimit: newLimit,
        month: selectedMonth,
      });
    }
    updateStateAndSave({ ...appState, budgets: updatedBudgets });
    showToast('Meta de orçamento atualizada!');
  };

  // INVENTORY / BOX MANAGEMENT HANDLERS (MANAGER ACTIONS)
  const handleAddBox = (boxPayload: Omit<StorageBox, 'id' | 'createdAt'>) => {
    const newBox: StorageBox = {
      id: `box-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...boxPayload,
    };
    updateStateAndSave({
      ...appState,
      boxes: [...appState.boxes, newBox],
    });
    showToast(`Caixa "${newBox.name}" criada com sucesso pelo Gestor!`);
  };

  const handleEditBox = (updatedBox: StorageBox) => {
    const updated = appState.boxes.map(b => (b.id === updatedBox.id ? updatedBox : b));
    updateStateAndSave({ ...appState, boxes: updated });
    showToast(`Caixa "${updatedBox.name}" atualizada.`);
  };

  const handleDeleteBox = (boxId: string) => {
    const updated = appState.boxes.filter(b => b.id !== boxId);
    updateStateAndSave({ ...appState, boxes: updated });
    showToast('Caixa de armazenamento removida.');
  };

  const handleAddProduct = (
    prodPayload: Omit<ProductItem, 'id' | 'updatedAt'>,
    createExpense?: { accountId: string; categoryId: string }
  ) => {
    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      ...prodPayload,
    };

    const targetBox = appState.boxes.find(b => b.id === newProd.boxId);

    // Create stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: newProd.id,
      productName: newProd.name,
      boxId: newProd.boxId,
      boxName: targetBox?.name || 'Caixa de Armazenamento',
      type: 'in',
      quantity: newProd.quantity,
      previousQty: 0,
      newQty: newProd.quantity,
      reason: `Adicionado na ${targetBox?.name || 'Caixa'} pelo Gestor`,
      authorRole: 'manager',
      timestamp: new Date().toISOString(),
    };

    let updatedTxs = [...appState.transactions];

    // Optional integrated financial transaction
    if (createExpense) {
      const totalCost = newProd.quantity * newProd.costPrice;
      if (totalCost > 0) {
        const expenseTx: Transaction = {
          id: `tx-stock-${Date.now()}`,
          description: `Compra Estoque: ${newProd.name} (${newProd.quantity}x)`,
          amount: parseFloat(totalCost.toFixed(2)),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'expense',
          categoryId: createExpense.categoryId,
          accountId: createExpense.accountId,
          paymentMethod: 'debit',
          status: 'completed',
          notes: `Lançado automaticamente ao abastecer a ${targetBox?.name}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedTxs = [expenseTx, ...updatedTxs];
      }
    }

    updateStateAndSave({
      ...appState,
      products: [...appState.products, newProd],
      movements: [movement, ...appState.movements],
      transactions: updatedTxs,
    });

    showToast(`Produto "${newProd.name}" adicionado na ${targetBox?.name || 'caixa'}!`);
  };

  const handleEditProduct = (updatedProd: ProductItem) => {
    const updated = appState.products.map(p => (p.id === updatedProd.id ? updatedProd : p));
    updateStateAndSave({ ...appState, products: updated });
    showToast(`Produto "${updatedProd.name}" atualizado na base.`);
  };

  const handleDeleteProduct = (prodId: string) => {
    const updated = appState.products.filter(p => p.id !== prodId);
    updateStateAndSave({ ...appState, products: updated });
    showToast('Produto removido da base de dados.');
  };

  const handleRestockProduct = (
    productId: string,
    addedQty: number,
    boxId: string,
    reason: string,
    createExpense?: { accountId: string; categoryId: string }
  ) => {
    const prod = appState.products.find(p => p.id === productId);
    if (!prod) return;

    const previousQty = prod.quantity;
    const newQty = previousQty + addedQty;
    const targetBox = appState.boxes.find(b => b.id === boxId) || appState.boxes.find(b => b.id === prod.boxId);

    const updatedProducts = appState.products.map(p =>
      p.id === productId ? { ...p, quantity: newQty, boxId: boxId || p.boxId, updatedAt: new Date().toISOString() } : p
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      boxId: targetBox?.id || prod.boxId,
      boxName: targetBox?.name || 'Caixa de Armazenamento',
      type: 'in',
      quantity: addedQty,
      previousQty,
      newQty,
      reason: reason || 'Reposição pelo Gestor',
      authorRole: 'manager',
      timestamp: new Date().toISOString(),
    };

    let updatedTxs = [...appState.transactions];
    if (createExpense) {
      const totalCost = addedQty * prod.costPrice;
      if (totalCost > 0) {
        const expenseTx: Transaction = {
          id: `tx-restock-${Date.now()}`,
          description: `Reposição: ${prod.name} (+${addedQty} un)`,
          amount: parseFloat(totalCost.toFixed(2)),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'expense',
          categoryId: createExpense.categoryId,
          accountId: createExpense.accountId,
          paymentMethod: 'debit',
          status: 'completed',
          notes: `Compra de reposição para a ${targetBox?.name}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedTxs = [expenseTx, ...updatedTxs];
      }
    }

    updateStateAndSave({
      ...appState,
      products: updatedProducts,
      movements: [movement, ...appState.movements],
      transactions: updatedTxs,
    });

    showToast(`+${addedQty} unidades adicionadas na ${targetBox?.name}!`);
  };

  // CONSUMPTION HANDLER (OPERATOR ACTION)
  const handleConsumeProduct = (productId: string, quantity: number, reason: string) => {
    const prod = appState.products.find(p => p.id === productId);
    if (!prod) return;

    const previousQty = prod.quantity;
    const newQty = Math.max(0, previousQty - quantity);
    const box = appState.boxes.find(b => b.id === prod.boxId);

    const updatedProducts = appState.products.map(p =>
      p.id === productId ? { ...p, quantity: newQty, updatedAt: new Date().toISOString() } : p
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      boxId: prod.boxId,
      boxName: box?.name || 'Caixa de Armazenamento',
      type: 'out',
      quantity,
      previousQty,
      newQty,
      reason,
      authorRole: 'operator',
      timestamp: new Date().toISOString(),
    };

    updateStateAndSave({
      ...appState,
      products: updatedProducts,
      movements: [movement, ...appState.movements],
    });

    showToast(`Retirada de ${quantity} un de "${prod.name}" registrada!`);
  };

  const handleRequestRestock = (productName: string, boxName: string) => {
    showToast(`Alerta de reposição enviado para o Gestor: "${productName}" na ${boxName}!`);
  };

  // Dual role switcher
  const handleToggleRole = () => {
    if (appState.appRole === 'manager') {
      // Switch from manager to operator (no pin needed to step down to operator)
      const nextRole: AppRole = 'operator';
      updateStateAndSave({ ...appState, appRole: nextRole }, false);
      showToast('Aplicativo Executável ativo (Modo Operador: apenas consulta e saídas)');
    } else {
      // Stepping up to manager requires PIN
      setIsPinModalOpen(true);
      setPinInput('');
      setPinError(false);
    }
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === appState.managerPin || pinInput === '1234') {
      const nextRole: AppRole = 'manager';
      updateStateAndSave({ ...appState, appRole: nextRole }, false);
      setIsPinModalOpen(false);
      showToast('Acesso autorizado: Base de Dados Master do Gestor desbloqueada!');
    } else {
      setPinError(true);
    }
  };

  // Code scanner processing
  const handleApplyCodeFromScanner = (parsed: ParsedCodeResult) => {
    // Check if the scanned code corresponds to a product in the database
    const rawDigits = parsed.raw.replace(/[^\d]/g, '');
    const matchedProduct = appState.products.find(
      p => p.barcode === parsed.raw || p.barcode === rawDigits || p.sku.toLowerCase() === parsed.raw.toLowerCase()
    );

    if (isScannerForProductCheck || (matchedProduct && currentTab === 'inventory')) {
      // It's a stock check!
      if (matchedProduct) {
        setScannedProductInfo(matchedProduct);
      } else {
        alert(`Código "${parsed.raw}" lido com sucesso, porém este item não está cadastrado na base de dados das caixas.`);
      }
      setIsScannerForProductCheck(false);
      return;
    }

    // Otherwise, it's a financial transaction launch (NFC-e, Boleto, PIX, etc.)
    setScannerPrefill(parsed);
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-emerald-600 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setScannerPrefill(null);
          setIsTransactionModalOpen(true);
        }}
        onOpenScanner={() => {
          setIsScannerForProductCheck(false);
          setIsScannerOpen(true);
        }}
        onOpenPdfReport={() => setIsPdfReportOpen(true)}
        appRole={appState.appRole}
        onToggleRole={handleToggleRole}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            transactions={appState.transactions}
            accounts={appState.accounts}
            categories={appState.categories}
            budgets={appState.budgets}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onOpenScanner={() => {
              setIsScannerForProductCheck(false);
              setIsScannerOpen(true);
            }}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setScannerPrefill(null);
              setIsTransactionModalOpen(true);
            }}
            onSelectCategoryFilter={setSelectedCategoryFilter}
            selectedCategoryFilter={selectedCategoryFilter}
            onNavigateTab={tab => setCurrentTab(tab as NavTab)}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={appState.transactions}
            categories={appState.categories}
            accounts={appState.accounts}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setScannerPrefill(null);
              setIsTransactionModalOpen(true);
            }}
            onEditTransaction={tx => {
              setEditingTransaction(tx);
              setScannerPrefill(null);
              setIsTransactionModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleStatus={handleToggleStatus}
            onExportCSV={() => {
              StorageService.exportToCSV(appState);
              showToast('Planilha CSV gerada e baixada com sucesso!');
            }}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            transactions={appState.transactions}
            categories={appState.categories}
            accounts={appState.accounts}
            selectedMonth={selectedMonth}
          />
        )}

        {currentTab === 'budgets' && (
          <BudgetsView
            categories={appState.categories}
            transactions={appState.transactions}
            budgets={appState.budgets}
            selectedMonth={selectedMonth}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {/* INVENTORY / DUAL-APP WORKSPACE */}
        {currentTab === 'inventory' && (
          appState.appRole === 'manager' ? (
            <ManagerDatabaseView
              boxes={appState.boxes}
              products={appState.products}
              movements={appState.movements}
              accounts={appState.accounts}
              categories={appState.categories}
              onAddBox={handleAddBox}
              onEditBox={handleEditBox}
              onDeleteBox={handleDeleteBox}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onRestockProduct={handleRestockProduct}
              managerPin={appState.managerPin}
              onUpdatePin={newPin => updateStateAndSave({ ...appState, managerPin: newPin }, false)}
              onOpenScanner={() => {
                setIsScannerForProductCheck(true);
                setIsScannerOpen(true);
              }}
            />
          ) : (
            <OperatorAppView
              boxes={appState.boxes}
              products={appState.products}
              onConsumeProduct={handleConsumeProduct}
              onRequestRestock={handleRequestRestock}
              onOpenScannerForProductCheck={() => {
                setIsScannerForProductCheck(true);
                setIsScannerOpen(true);
              }}
            />
          )
        )}

        {currentTab === 'cloud' && (
          <CloudBackupView
            stateData={appState}
            onRestoreState={restored => {
              updateStateAndSave(restored, false);
              showToast('Base de dados e financeiro restaurados!');
            }}
          />
        )}
      </main>

      {/* PDF Executive Summary Modal */}
      <PdfReportModal
        isOpen={isPdfReportOpen}
        onClose={() => setIsPdfReportOpen(false)}
        selectedMonth={selectedMonth}
        transactions={appState.transactions}
        accounts={appState.accounts}
        categories={appState.categories}
        budgets={appState.budgets}
        boxes={appState.boxes}
        products={appState.products}
      />

      {/* Barcode & QR Code Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setIsScannerForProductCheck(false);
        }}
        onApplyCode={handleApplyCodeFromScanner}
      />

      {/* Scanned Product Result Inspector */}
      {scannedProductInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Produto Identificado no Estoque
              </span>
              <button
                onClick={() => setScannedProductInfo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {scannedProductInfo.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                EAN: {scannedProductInfo.barcode} · SKU: {scannedProductInfo.sku}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Caixa Onde Está Guardado:</span>
                <strong className="text-slate-900 dark:text-white">
                  {appState.boxes.find(b => b.id === scannedProductInfo.boxId)?.name || 'Caixa'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Localização Física:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {appState.boxes.find(b => b.id === scannedProductInfo.boxId)?.location || 'Almoxarifado'}
                </strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500">Quantidade Atual:</span>
                <span className={`font-mono font-bold ${scannedProductInfo.quantity <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {scannedProductInfo.quantity} {scannedProductInfo.unit} ({scannedProductInfo.quantity <= 0 ? 'ESGOTADO' : 'Disponível'})
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setScannedProductInfo(null);
                  setCurrentTab('inventory');
                }}
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg shadow-xs"
              >
                Ver na Caixa de Estoque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
          setScannerPrefill(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        initialFromScanner={scannerPrefill}
        categories={appState.categories}
        accounts={appState.accounts}
      />

      {/* Manager PIN Access Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Acesso Restrito: Gestor da Base
                </h3>
                <p className="text-[11px] text-slate-500">
                  Informe o PIN de Gestor para alterar produtos e caixas
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  maxLength={8}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="PIN do Gestor (padrão: 1234)"
                  className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
                {pinError && (
                  <span className="text-[11px] text-rose-600 mt-1 block text-center font-medium">
                    PIN incorreto. Tente 1234 ou verifique com o administrador.
                  </span>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
