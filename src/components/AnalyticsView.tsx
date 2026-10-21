import React from 'react';
import { PieChart, TrendingUp, DollarSign, Calendar, CreditCard, Award } from 'lucide-react';
import { Transaction, Category, Account } from '../types/finance';
import { formatBRL, getMonthNameBR } from '../utils/formatters';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import { InteractiveDonutChart } from './InteractiveDonutChart';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedMonth: string;
}

export const AnalyticsView: React.FC<Props> = ({
  transactions,
  categories,
  selectedMonth,
}) => {
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth) && t.status === 'completed');
  const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
  const monthIncomes = monthTransactions.filter(t => t.type === 'income');

  const totalExpense = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthIncomes.reduce((s, t) => s + t.amount, 0);

  // Top 5 biggest expenses
  const topExpenses = [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Group by payment method
  const methodMap = new Map<string, number>();
  monthExpenses.forEach(t => {
    methodMap.set(t.paymentMethod, (methodMap.get(t.paymentMethod) || 0) + t.amount);
  });

  const methodLabels: Record<string, string> = {
    pix: 'PIX',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    boleto: 'Boleto Bancário',
    cash: 'Dinheiro em Espécie',
    transfer: 'Transferência / TED',
  };

  // Month projection calculations
  const [yStr, mStr] = selectedMonth.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const totalDays = new Date(y, m, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && (today.getMonth() + 1) === m;
  const currentDay = isCurrentMonth ? Math.min(today.getDate(), totalDays) : totalDays;
  const daysRemaining = totalDays - currentDay;

  const dailyBurnRate = currentDay > 0 ? totalExpense / currentDay : 0;
  const projectedTotalExpense = totalExpense + (dailyBurnRate * daysRemaining);
  const projectedSurplus = totalIncome - projectedTotalExpense;

  return (
    <div className="space-y-6">
      {/* View Title */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Inteligência & Relatórios Financeiros
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Análise aprofundada de receitas, gastos e projeções de {getMonthNameBR(selectedMonth)}
        </p>
      </div>

      {/* Monthly Projections Strip */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Projeção de Fechamento do Mês
          </h3>
          <span className="text-xs text-slate-500">
            {isCurrentMonth ? `Dia ${currentDay} de ${totalDays} (${daysRemaining} dias restantes)` : 'Mês encerrado'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Média Diária de Gastos</span>
            <p className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {formatBRL(dailyBurnRate)} / dia
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Despesa Projetada</span>
            <p className="text-lg font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
              {formatBRL(projectedTotalExpense)}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Baseado no ritmo atual de consumo
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Saldo Líquido Estimado</span>
            <p className={`text-lg font-bold font-mono tabular-nums mt-1 ${projectedSurplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {projectedSurplus >= 0 ? `+${formatBRL(projectedSurplus)}` : formatBRL(projectedSurplus)}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {projectedSurplus >= 0 ? 'Meta de poupança viável' : 'Atenção aos próximos gastos'}
            </span>
          </div>
        </div>
      </div>

      {/* Historical 6-Month Comparison */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Evolução Semestral (Últimos 6 Meses)
          </h3>
          <p className="text-xs text-slate-500">Histórico de receitas vs despesas e acumulação de capital</p>
        </div>
        <MonthlyComparisonChart
          transactions={transactions}
          currentMonthKey={selectedMonth}
        />
      </div>

      {/* Two columns: Top 5 Expenses & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Expenses */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Maiores Gastos do Mês
            </h3>
            <span className="text-xs text-slate-400">Top 5 valores</span>
          </div>

          <div className="space-y-3">
            {topExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhum gasto registrado neste mês</p>
            ) : (
              topExpenses.map((exp, index) => {
                const percent = totalExpense > 0 ? (exp.amount / totalExpense) * 100 : 0;
                return (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-slate-400 font-bold text-[11px] w-4">
                          0{index + 1}.
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {exp.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400">{percent.toFixed(1)}%</span>
                        <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {formatBRL(exp.amount)}
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress bar */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 dark:bg-slate-300 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expenses by Payment Method */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Gastos por Forma de Pagamento
            </h3>
            <span className="text-xs text-slate-400">Total: {formatBRL(totalExpense)}</span>
          </div>

          <div className="space-y-3">
            {Array.from(methodMap.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount]) => {
                const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {methodLabels[method] || method.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">{percent.toFixed(1)}%</span>
                        <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                          {formatBRL(amount)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
