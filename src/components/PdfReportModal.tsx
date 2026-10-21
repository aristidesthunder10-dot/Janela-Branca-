import React, { useState } from 'react';
import { Printer, Download, Share2, X, Check, FileText, ArrowDownRight, ArrowUpRight, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Transaction, Account, Category, BudgetGoal } from '../types/finance';
import { StorageBox, ProductItem } from '../types/inventory';
import { formatBRL, formatDateBR, getMonthNameBR } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: BudgetGoal[];
  boxes: StorageBox[];
  products: ProductItem[];
}

export const PdfReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedMonth,
  transactions,
  accounts,
  categories,
  budgets,
  boxes,
  products,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  // Filter transactions of the selected month
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const completedIncome = monthTransactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  const completedExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  const pendingExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((s, t) => s + t.amount, 0);

  const netBalance = completedIncome - completedExpense;
  const savingsRate = completedIncome > 0 ? (netBalance / completedIncome) * 100 : 0;
  const totalNetWorth = accounts.reduce((s, a) => s + a.currentBalance, 0);

  // Category breakdown
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const expenseByCat = new Map<string, number>();
  monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .forEach(t => {
      expenseByCat.set(t.categoryId, (expenseByCat.get(t.categoryId) || 0) + t.amount);
    });

  const categoryRows = Array.from(expenseByCat.entries())
    .map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      const percent = completedExpense > 0 ? (amount / completedExpense) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'Outros',
        color: cat?.color || '#64748B',
        amount,
        percent,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Top 5 Expenses
  const topExpenses = [...monthTransactions]
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Inventory situation
  const outOfStockCount = products.filter(p => p.quantity <= 0).length;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minQuantity).length;
  const inStockCount = products.filter(p => p.quantity > p.minQuantity).length;
  const totalStockUnits = products.reduce((s, p) => s + p.quantity, 0);
  const totalStockValuation = products.reduce((s, p) => s + (p.quantity * p.costPrice), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `📊 *JANELA BRANCA | Relatório Executivo - ${getMonthNameBR(selectedMonth)}*
----------------------------------------
💰 *Receitas Realizadas:* ${formatBRL(completedIncome)}
📉 *Despesas Realizadas:* ${formatBRL(completedExpense)}
⚖️ *Resultado Líquido:* ${netBalance >= 0 ? '+' : ''}${formatBRL(netBalance)}
📈 *Taxa de Poupança:* ${savingsRate.toFixed(1)}%
🏛️ *Patrimônio Geral:* ${formatBRL(totalNetWorth)}

📦 *Situação do Estoque:*
- Itens em Estoque: ${inStockCount}
- Itens com Estoque Baixo: ${lowStockCount}
- Itens Esgotados / Em Falta: ${outOfStockCount}
- Valor Total em Estoque: ${formatBRL(totalStockValuation)}

🔍 *Top 3 Maiores Gastos:*
${topExpenses.slice(0, 3).map((e, i) => `${i + 1}. ${e.description} (${formatBRL(e.amount)})`).join('\n')}

_Emitido em: ${new Date().toLocaleDateString('pt-BR')} via Janela Branca_`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // SVG Donut calculation for crisp vector printing
  const size = 160;
  const center = size / 2;
  const radius = 64;
  const innerRadius = 42;

  function polarToCartesian(centerX: number, centerY: number, rad: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  }

  function describeArc(x: number, y: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
    const sweep = endAngle - startAngle;
    const effectiveEnd = sweep >= 359.99 ? startAngle + 359.99 : endAngle;
    const startOuter = polarToCartesian(x, y, rOuter, effectiveEnd);
    const endOuter = polarToCartesian(x, y, rOuter, startAngle);
    const startInner = polarToCartesian(x, y, rInner, startAngle);
    const endInner = polarToCartesian(x, y, rInner, effectiveEnd);
    const largeArcFlag = sweep <= 180 ? '0' : '1';
    return [
      'M', startOuter.x, startOuter.y,
      'A', rOuter, rOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', startInner.x, startInner.y,
      'A', rInner, rInner, 0, largeArcFlag, 1, endInner.x, endInner.y,
      'Z',
    ].join(' ');
  }

  let angleTracker = 0;

  return (
    <div id="printable-report-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Modal Top Bar (hidden when printing) */}
        <div className="no-print px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/InShot_20261018_101014340_a7751d4d.png"
              alt="Janela Branca"
              className="w-8 h-8 rounded-lg object-cover object-top border border-slate-200 dark:border-slate-700 shadow-xs"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Relatório Resumido para Download / PDF
              </h3>
              <p className="text-xs text-slate-500">
                Janela Branca · Mês: {getMonthNameBR(selectedMonth)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copiado!' : 'Compartilhar Texto'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar em PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/50 dark:bg-slate-950/80">
          <div
            id="printable-report-content"
            className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-10 shadow-lg rounded-xl border border-slate-200 space-y-6 text-sm"
          >
            {/* Header Document */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/aistudio/InShot_20261018_101014340_a7751d4d.png"
                    alt="Janela Branca"
                    className="w-10 h-10 rounded-lg object-cover object-top border border-slate-300"
                  />
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    JANELA BRANCA
                  </span>
                </div>
                <h1 className="text-sm font-bold uppercase tracking-wider text-slate-600 mt-1">
                  Relatório Executivo Mensal Consolidado
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mês de Referência: <strong className="text-slate-900 font-bold">{getMonthNameBR(selectedMonth)}</strong>
                </p>
              </div>

              <div className="text-right text-xs text-slate-500">
                <span className="block font-mono">Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
                <span className="block font-mono">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="inline-block mt-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                  CONFIDENCIAL
                </span>
              </div>
            </div>

            {/* 4 Primary KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Patrimônio Geral</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-1 block">
                  {formatBRL(totalNetWorth)}
                </span>
                <span className="text-[10px] text-slate-500">{accounts.length} contas ativas</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Receitas</span>
                <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                  +{formatBRL(completedIncome)}
                </span>
                <span className="text-[10px] text-emerald-600">Entradas liquidadas</span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-800 block">Total Despesas</span>
                <span className="text-base font-bold font-mono text-rose-700 mt-1 block">
                  -{formatBRL(completedExpense)}
                </span>
                <span className="text-[10px] text-rose-600">
                  {pendingExpense > 0 ? `+ ${formatBRL(pendingExpense)} a vencer` : 'Saídas liquidadas'}
                </span>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                <span className="text-[10px] uppercase font-bold text-indigo-800 block">Saldo Líquido</span>
                <span className={`text-base font-bold font-mono mt-1 block ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {netBalance >= 0 ? `+${formatBRL(netBalance)}` : formatBRL(netBalance)}
                </span>
                <span className="text-[10px] text-indigo-700 font-mono">
                  Poupança: {savingsRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Split: Vector Donut Chart & Category Breakdown Table */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                1. Distribuição de Gastos por Categoria
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Vector SVG Donut */}
                <div className="relative shrink-0">
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {categoryRows.map(row => {
                      const sliceAngle = (row.percent / 100) * 360;
                      const path = describeArc(center, center, radius, innerRadius, angleTracker, angleTracker + sliceAngle);
                      angleTracker += sliceAngle;
                      return (
                        <path key={row.id} d={path} fill={row.color} />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Despesas</span>
                    <span className="text-xs font-bold font-mono text-slate-900">{formatBRL(completedExpense)}</span>
                  </div>
                </div>

                {/* Table of categories */}
                <div className="flex-1 w-full overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                        <th className="pb-1">Categoria</th>
                        <th className="pb-1 text-right">Percentual</th>
                        <th className="pb-1 text-right">Valor Gasto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryRows.slice(0, 6).map(row => (
                        <tr key={row.id} className="py-1">
                          <td className="py-1 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: row.color }} />
                            <span className="font-medium text-slate-800">{row.name}</span>
                          </td>
                          <td className="py-1 text-right font-mono text-slate-500">{row.percent.toFixed(1)}%</td>
                          <td className="py-1 text-right font-bold font-mono text-slate-900">{formatBRL(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Top 5 Biggest Expenses & Stock Overview Split */}
            <div className="grid grid-cols-2 gap-4">
              {/* Top Expenses */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                  2. Maiores Despesas do Período
                </h3>
                <div className="space-y-1.5 text-xs">
                  {topExpenses.map((exp, idx) => (
                    <div key={exp.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                      <div className="truncate pr-2">
                        <span className="font-mono text-slate-400 font-bold text-[10px] mr-1.5">0{idx + 1}.</span>
                        <span className="font-medium text-slate-800">{exp.description}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{formatDateBR(exp.date)}</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900 shrink-0">{formatBRL(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory / Storage Box Status */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                  3. Situação do Estoque & Caixas
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Caixas Ativas de Armazenamento:</span>
                    <strong className="font-mono text-slate-900">{boxes.length} caixas</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Itens Regulares em Estoque:</span>
                    <strong className="font-mono text-emerald-700">{inStockCount} produtos</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Itens em Alerta de Estoque Baixo:</span>
                    <strong className="font-mono text-amber-700">{lowStockCount} produtos</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Itens Zerados / Em Falta:</span>
                    <strong className="font-mono text-rose-700">{outOfStockCount} produtos</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-semibold">
                    <span className="text-slate-800">Avaliação do Estoque:</span>
                    <span className="font-mono font-bold text-slate-900">{formatBRL(totalStockValuation)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Transaction Statement table */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
                4. Extrato Analítico dos Lançamentos ({monthTransactions.length} registros)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500 font-semibold">
                      <th className="py-1">Data</th>
                      <th className="py-1">Descrição</th>
                      <th className="py-1">Categoria</th>
                      <th className="py-1">Pagamento</th>
                      <th className="py-1 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthTransactions.slice(0, 15).map(tx => {
                      const cat = categoryMap.get(tx.categoryId);
                      const isInc = tx.type === 'income';

                      return (
                        <tr key={tx.id} className="py-1">
                          <td className="py-1 font-mono text-[11px] text-slate-500">{formatDateBR(tx.date)}</td>
                          <td className="py-1 font-medium text-slate-900 max-w-[200px] truncate">{tx.description}</td>
                          <td className="py-1 text-slate-600">{cat?.name || 'Geral'}</td>
                          <td className="py-1 uppercase text-[10px] text-slate-500 font-mono">{tx.paymentMethod}</td>
                          <td className={`py-1 text-right font-bold font-mono ${isInc ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {isInc ? `+${formatBRL(tx.amount)}` : `-${formatBRL(tx.amount)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {monthTransactions.length > 15 && (
                  <p className="text-[10px] text-slate-400 italic text-center pt-2">
                    Exibindo os primeiros 15 lançamentos. Todos os registros constam no arquivo CSV de backup completo.
                  </p>
                )}
              </div>
            </div>

            {/* Validation & Sign-off footer */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-800">Janela Branca · Gestão & Base de Dados</p>
                <p className="text-[10px]">Autenticado digitalmente · Código de Sincronização Ativo</p>
              </div>

              <div className="w-56 text-center border-t border-slate-400 pt-1">
                <span className="text-[10px] uppercase text-slate-600 font-semibold">Assinatura / Visto do Gestor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
