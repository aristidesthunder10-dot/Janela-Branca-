import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Check } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus, Category, Account, ParsedCodeResult } from '../types/finance';
import { parseSafeFloat } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>, totalInstallments?: number) => void;
  editingTransaction?: Transaction | null;
  initialFromScanner?: ParsedCodeResult | null;
  categories: Category[];
  accounts: Account[];
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  initialFromScanner,
  categories,
  accounts,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [barcodeOrQrCode, setBarcodeOrQrCode] = useState('');
  const [codeType, setCodeType] = useState<Transaction['codeType']>();

  // Reset or fill form when opening
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmountInput(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '12:00');
      setCategoryId(editingTransaction.categoryId);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setPaymentMethod(editingTransaction.paymentMethod);
      setStatus(editingTransaction.status);
      setInstallmentsCount(editingTransaction.installments?.total || 1);
      setNotes(editingTransaction.notes || '');
      setBarcodeOrQrCode(editingTransaction.barcodeOrQrCode || '');
      setCodeType(editingTransaction.codeType);
    } else if (initialFromScanner) {
      setType(initialFromScanner.suggestedType);
      setDescription(initialFromScanner.extractedTitle);
      setAmountInput(initialFromScanner.suggestedAmount ? initialFromScanner.suggestedAmount.toFixed(2) : '');
      setDate(initialFromScanner.suggestedDate || new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      
      // Try to find matching category by name
      const matchedCat = categories.find(c => 
        c.name.toLowerCase().includes((initialFromScanner.suggestedCategory || '').toLowerCase())
      );
      setCategoryId(matchedCat ? matchedCat.id : (categories.find(c => c.type === 'expense')?.id || ''));
      setAccountId(accounts[0]?.id || '');
      setPaymentMethod(initialFromScanner.suggestedPaymentMethod);
      setStatus('completed');
      setInstallmentsCount(1);
      setNotes(
        Object.entries(initialFromScanner.extraDetails)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
      );
      setBarcodeOrQrCode(initialFromScanner.raw);
      setCodeType(initialFromScanner.codeType === 'text' ? 'other' : initialFromScanner.codeType);
    } else {
      // Clean new form
      setType('expense');
      setDescription('');
      setAmountInput('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      const defaultExpenseCat = categories.find(c => c.type === 'expense');
      setCategoryId(defaultExpenseCat?.id || categories[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      setPaymentMethod('credit');
      setStatus('completed');
      setInstallmentsCount(1);
      setNotes('');
      setBarcodeOrQrCode('');
      setCodeType(undefined);
    }
  }, [isOpen, editingTransaction, initialFromScanner, categories, accounts]);

  // Adjust category if type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'transfer') {
      const matchCat = categories.find(c => c.type === newType);
      if (matchCat) setCategoryId(matchCat.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseSafeFloat(amountInput);
    if (finalAmount <= 0) return;
    if (!description.trim()) return;

    const payload: Partial<Transaction> = {
      description: description.trim(),
      amount: finalAmount,
      date,
      time,
      type,
      categoryId: type === 'transfer' ? '' : categoryId,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      paymentMethod,
      status,
      notes: notes.trim() || undefined,
      barcodeOrQrCode: barcodeOrQrCode || undefined,
      codeType: codeType || undefined,
    };

    onSave(payload, installmentsCount > 1 ? installmentsCount : undefined);
    onClose();
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Transaction Type Segmented Control */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                type === 'transfer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Transferência
            </button>
          </div>

          {/* Amount input with mini calculator support */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold font-mono text-slate-400">
                R$
              </span>
              <input
                type="text"
                required
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                placeholder="0,00 ou ex: 45.90 + 12.00"
                className="w-full pl-10 pr-9 py-2.5 text-lg font-bold font-mono tabular-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Calculator className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {amountInput.includes('+') || amountInput.includes('-') || amountInput.includes('*') ? (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                Cálculo automático: = R$ {parseSafeFloat(amountInput).toFixed(2)}
              </span>
            ) : null}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Descrição / Estabelecimento
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel, Salário Tech..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Category (if not transfer) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Account / Wallet */}
          <div className={type === 'transfer' ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {type === 'transfer' ? 'Conta de Origem' : 'Conta / Carteira'}
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.institution})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Conta de Destino
                </label>
                <select
                  value={toAccountId}
                  onChange={e => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Payment Method & Status */}
          {type !== 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="pix">PIX</option>
                  <option value="credit">Cartão de Crédito</option>
                  <option value="debit">Cartão de Débito</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cash">Dinheiro em Espécie</option>
                  <option value="transfer">Transferência / TED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TransactionStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="completed">Concluído / Pago</option>
                  <option value="pending">Pendente / A Pagar</option>
                </select>
              </div>
            </div>
          )}

          {/* Parcelamento (Installments) for expense */}
          {type === 'expense' && !editingTransaction && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Parcelamento
              </label>
              <select
                value={installmentsCount}
                onChange={e => setInstallmentsCount(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="1">À vista (1x)</option>
                <option value="2">2 parcelas mensais</option>
                <option value="3">3 parcelas mensais</option>
                <option value="4">4 parcelas mensais</option>
                <option value="5">5 parcelas mensais</option>
                <option value="6">6 parcelas mensais</option>
                <option value="10">10 parcelas mensais</option>
                <option value="12">12 parcelas mensais</option>
              </select>
              {installmentsCount > 1 && parseSafeFloat(amountInput) > 0 && (
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  {installmentsCount}x de R$ {(parseSafeFloat(amountInput) / installmentsCount).toFixed(2)} por mês
                </span>
              )}
            </div>
          )}

          {/* Barcode / QR reference if present */}
          {barcodeOrQrCode && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Código Vinculado ({codeType || 'QR/Barcode'})
              </span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate block mt-0.5">
                {barcodeOrQrCode}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Observações / Anotações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalhes adicionais, número de nota, tags..."
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'Atualizar Lançamento' : 'Confirmar e Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
