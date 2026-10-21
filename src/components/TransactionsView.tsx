import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, CheckCircle2, Clock, QrCode, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Transaction, Category, Account } from '../types/finance';
import { formatBRL, formatDateBR, getMonthNameBR } from '../utils/formatters';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onExportCSV: () => void;
}

export const TransactionsView: React.FC<Props> = ({
  transactions,
  categories,
  accounts,
  selectedMonth,
  onMonthChange,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
  onExportCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [filterByMonth, setFilterByMonth] = useState<boolean>(true);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Month
      if (filterByMonth && !t.date.startsWith(selectedMonth)) {
        return false;
      }
      // Type
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }
      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      // Category
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) {
        return false;
      }
      // Account
      if (accountFilter !== 'all' && t.accountId !== accountFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(query);
        const notesMatch = t.notes?.toLowerCase().includes(query);
        const codeMatch = t.barcodeOrQrCode?.toLowerCase().includes(query);
        const catName = categoryMap.get(t.categoryId)?.name.toLowerCase() || '';
        return descMatch || notesMatch || codeMatch || catName.includes(query);
      }
      return true;
    }).sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  }, [transactions, selectedMonth, filterByMonth, typeFilter, statusFilter, categoryFilter, accountFilter, searchQuery, categoryMap]);

  // Calculations on filtered set
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netDelta = totalIncome - totalExpense;

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Extrato de Transações
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} lançamentos encontrados {filterByMonth && `em ${getMonthNameBR(selectedMonth)}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Planilha (CSV)</span>
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search box (5 cols) */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por descrição, cupom fiscal, tag..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white"
            />
          </div>

          {/* Type tabs (4 cols) */}
          <div className="sm:col-span-4 flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                typeFilter === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Receitas
            </button>
          </div>

          {/* Month switch & date picker (3 cols) */}
          <div className="sm:col-span-3 flex items-center gap-2">
            <input
              type="month"
              disabled={!filterByMonth}
              value={selectedMonth}
              onChange={e => onMonthChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono disabled:opacity-40"
            />
            <button
              type="button"
              onClick={() => setFilterByMonth(!filterByMonth)}
              title={filterByMonth ? 'Ver histórico de todos os meses' : 'Filtrar pelo mês atual'}
              className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors shrink-0 ${
                !filterByMonth
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {!filterByMonth ? 'Todos Meses' : 'Filtrar Mês'}
            </button>
          </div>
        </div>

        {/* Secondary dropdown row */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-xs"
            >
              <option value="all">Todos</option>
              <option value="completed">Concluídos / Pagos</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-xs max-w-[150px] truncate"
            >
              <option value="all">Todas</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Conta:</span>
            <select
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-xs max-w-[150px] truncate"
            >
              <option value="all">Todas as Contas</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters if active */}
          {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || accountFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setStatusFilter('all');
                setCategoryFilter('all');
                setAccountFilter('all');
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline ml-auto"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Filtered Balance Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Receitas filtradas:</span>
            <span className="font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              +{formatBRL(totalIncome)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Despesas filtradas:</span>
            <span className="font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              -{formatBRL(totalExpense)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Balanço líquido:</span>
          <span className={`font-bold font-mono tabular-nums ${netDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {netDelta >= 0 ? `+${formatBRL(netDelta)}` : formatBRL(netDelta)}
          </span>
        </div>
      </div>

      {/* Transactions Data Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nenhuma transação encontrada com os filtros selecionados
            </p>
            <p className="text-xs text-slate-500">
              Tente alterar os termos de busca ou adicionar um novo lançamento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(tx => {
              const cat = categoryMap.get(tx.categoryId);
              const acc = accountMap.get(tx.accountId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => onToggleStatus(tx.id)}
                      title={tx.status === 'completed' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        tx.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                      }`}
                    >
                      {tx.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </p>
                        {tx.codeType && (
                          <span
                            title={tx.barcodeOrQrCode}
                            className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-0.5"
                          >
                            <QrCode className="w-3 h-3 inline" />
                            {tx.codeType === 'danfe_nfce' ? 'NFC-e' : tx.codeType === 'boleto' ? 'Boleto' : 'PIX'}
                          </span>
                        )}
                        {tx.installments && tx.installments.total > 1 && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                            {tx.installments.current}/{tx.installments.total}x
                          </span>
                        )}
                      </div>

                      {/* Zero-pill metadata text with separators */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span style={{ color: cat?.color }}>{cat?.name || 'Geral'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{acc?.name || 'Conta'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{formatDateBR(tx.date)}</span>
                        {tx.paymentMethod && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="uppercase">{tx.paymentMethod}</span>
                          </>
                        )}
                        {tx.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="italic truncate max-w-[150px]">{tx.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount and actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {isIncome ? `+${formatBRL(tx.amount)}` : `-${formatBRL(tx.amount)}`}
                      </span>
                      <span className={`block text-[10px] ${tx.status === 'completed' ? 'text-slate-400' : 'text-amber-500 font-medium'}`}>
                        {tx.status === 'completed' ? 'Liquidado' : 'Pendente'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        title="Editar lançamento"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir "${tx.description}"?`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        title="Excluir lançamento"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
