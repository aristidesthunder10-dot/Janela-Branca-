import React from 'react';
import { ArrowDownRight, ArrowUpRight, Wallet, QrCode, Plus, CloudCheck, TrendingUp, CreditCard, ChevronRight } from 'lucide-react';
import { Transaction, Account, Category, BudgetGoal } from '../types/finance';
import { formatBRL, formatDateBR, getMonthNameBR } from '../utils/formatters';
import { InteractiveDonutChart } from './InteractiveDonutChart';
import { CashFlowBarChart } from './CashFlowBarChart';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: BudgetGoal[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onOpenScanner: () => void;
  onOpenNewTransaction: (type?: 'expense' | 'income') => void;
  onSelectCategoryFilter: (categoryId: string | null) => void;
  selectedCategoryFilter: string | null;
  onNavigateTab: (tab: 'transactions' | 'analytics' | 'budgets' | 'cloud') => void;
  onToggleStatus: (id: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  transactions,
  accounts,
  categories,
  budgets,
  selectedMonth,
  onMonthChange,
  onOpenScanner,
  onOpenNewTransaction,
  onSelectCategoryFilter,
  selectedCategoryFilter,
  onNavigateTab,
  onToggleStatus,
}) => {
  // Filter transactions in selected month
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  const totalBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);

  const completedIncome = monthTransactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const completedExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthNet = completedIncome - completedExpense;
  const savingsRate = completedIncome > 0 ? (monthNet / completedIncome) * 100 : 0;

  // Categories map
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  // Recent 6 transactions
  const recentTransactions = [...monthTransactions]
    .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Month Selector & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel Financeiro
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Mês de referência: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{getMonthNameBR(selectedMonth)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => onMonthChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />

          <button
            onClick={onOpenScanner}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Ler Código</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Patrimônio / Saldo Geral</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {formatBRL(totalBalance)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>{accounts.length} contas cadastradas</span>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Receitas Realizadas</span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatBRL(completedIncome)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>{monthTransactions.filter(t => t.type === 'income').length} entradas no mês</span>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Despesas Realizadas</span>
            <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-2">
            -{formatBRL(completedExpense)}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{pendingExpense > 0 ? `Pendentes: ${formatBRL(pendingExpense)}` : 'Tudo em dia'}</span>
          </div>
        </div>

        {/* Net Savings & Rate */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Saldo Líquido / Economia</span>
            <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-2xl font-bold font-mono tabular-nums mt-2 ${monthNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {monthNet >= 0 ? `+${formatBRL(monthNet)}` : formatBRL(monthNet)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>Taxa de poupança:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{savingsRate.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Main Charts Split: Left Donut (Despesas por Categoria), Right Cash Flow (Fluxo Diário) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Donut Chart (7 cols) */}
        <div className="lg:col-span-6 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Distribuição de Despesas
              </h3>
              <p className="text-xs text-slate-500">Por categoria no mês</p>
            </div>
            {selectedCategoryFilter && (
              <button
                onClick={() => onSelectCategoryFilter(null)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Limpar Filtro
              </button>
            )}
          </div>
          <InteractiveDonutChart
            transactions={monthTransactions}
            categories={categories}
            selectedCategoryId={selectedCategoryFilter}
            onSelectCategory={onSelectCategoryFilter}
          />
        </div>

        {/* Daily Cash Flow Bar Chart (5 cols) */}
        <div className="lg:col-span-6 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Fluxo de Caixa Diário
              </h3>
              <p className="text-xs text-slate-500">Entradas e saídas por dia</p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Relatório Completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <CashFlowBarChart
            transactions={transactions}
            monthKey={selectedMonth}
          />
        </div>
      </div>

      {/* Accounts & Cards Strip */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            Contas & Carteiras
          </h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Total Disponível: <strong>{formatBRL(totalBalance)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                  {acc.name}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: acc.color }}
                />
              </div>
              <p className={`text-sm font-bold font-mono tabular-nums ${acc.currentBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {formatBRL(acc.currentBalance)}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 truncate">
                {acc.institution}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions List with Actionable rows */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Últimos Lançamentos
            </h3>
            <p className="text-xs text-slate-500">Transações mais recentes de {getMonthNameBR(selectedMonth)}</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Ver Todas ({monthTransactions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhuma transação lançada neste mês. Clique em <strong>+ Novo Lançamento</strong> ou <strong>Escanear</strong> para começar.
            </div>
          ) : (
            recentTransactions.map(tx => {
              const cat = categoryMap.get(tx.categoryId);
              const acc = accountMap.get(tx.accountId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      {/* Unboxed metadata text with typographic separators strictly adhering to zero-pill rule */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{cat?.name || 'Geral'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{acc?.name || 'Conta'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{formatDateBR(tx.date)}</span>
                        {tx.codeType && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {tx.codeType === 'danfe_nfce' ? 'NFC-e' : tx.codeType === 'boleto' ? 'Boleto' : tx.codeType === 'pix' ? 'PIX' : 'EAN'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <span className={`text-xs font-bold font-mono tabular-nums ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isIncome ? `+${formatBRL(tx.amount)}` : `-${formatBRL(tx.amount)}`}
                      </span>
                      <span className={`block text-[10px] ${tx.status === 'completed' ? 'text-slate-400' : 'text-amber-500 font-medium'}`}>
                        {tx.status === 'completed' ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleStatus(tx.id)}
                      title={tx.status === 'completed' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-colors ${
                        tx.status === 'completed'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
