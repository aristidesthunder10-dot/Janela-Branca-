import React from 'react';
import { Plus, QrCode, FileText, Database, Shield, Smartphone } from 'lucide-react';
import { AppRole } from '../types/inventory';

export type NavTab = 'dashboard' | 'transactions' | 'analytics' | 'budgets' | 'inventory' | 'cloud';

interface Props {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewTransaction: () => void;
  onOpenScanner: () => void;
  onOpenPdfReport: () => void;
  appRole: AppRole;
  onToggleRole: () => void;
}

export const Header: React.FC<Props> = ({
  currentTab,
  onTabChange,
  onOpenNewTransaction,
  onOpenScanner,
  onOpenPdfReport,
  appRole,
  onToggleRole,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand wordmark in single element */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 text-left"
          >
            <img
              src="/assets/aistudio/InShot_20261018_101014340_a7751d4d.png"
              alt="Janela Branca"
              className="w-9 h-9 rounded-lg object-cover object-top border border-slate-200 dark:border-slate-700 shadow-xs"
            />
            <span className="font-extrabold tracking-tight">Janela Branca</span>
          </button>

          {/* Quick Dual-App Mode Switcher Button */}
          <button
            onClick={onToggleRole}
            title={appRole === 'manager' ? 'Alternar para o Aplicativo Executável do Operador' : 'Acessar Base de Dados Master do Gestor'}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
              appRole === 'manager'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100'
            }`}
          >
            {appRole === 'manager' ? <Database className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="whitespace-nowrap">
              {appRole === 'manager' ? 'Base Master' : 'App Executável'}
            </span>
          </button>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'dashboard'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => onTabChange('transactions')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'transactions'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Transações
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'analytics'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Gráficos
          </button>
          <button
            onClick={() => onTabChange('inventory')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              currentTab === 'inventory'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{appRole === 'manager' ? 'Base de Estoque' : 'Estoque & Caixas'}</span>
          </button>
          <button
            onClick={() => onTabChange('budgets')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'budgets'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Metas
          </button>
          <button
            onClick={() => onTabChange('cloud')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'cloud'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Backup Nuvem
          </button>
        </nav>

        {/* Zone 3: Primary action buttons (PDF Report, Scanner, New Transaction) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenPdfReport}
            title="Gerar Relatório Resumido em PDF do mês"
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Relatório PDF</span>
          </button>

          <button
            onClick={onOpenScanner}
            title="Escanear Código de Barras / QR Code"
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Escanear</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row for touch accessibility */}
      <div className="md:hidden flex border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 overflow-x-auto gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={onToggleRole}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 font-bold border ${
            appRole === 'manager'
              ? 'bg-indigo-600 text-white border-indigo-700'
              : 'bg-emerald-600 text-white border-emerald-700'
          }`}
        >
          {appRole === 'manager' ? '⚙️ Base Master' : '📱 App Operador'}
        </button>
        <button
          onClick={() => onTabChange('dashboard')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
            currentTab === 'dashboard' ? 'bg-white dark:bg-slate-800 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => onTabChange('inventory')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
            currentTab === 'inventory' ? 'bg-white dark:bg-slate-800 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Estoque & Caixas
        </button>
        <button
          onClick={() => onTabChange('transactions')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
            currentTab === 'transactions' ? 'bg-white dark:bg-slate-800 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Transações
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
            currentTab === 'analytics' ? 'bg-white dark:bg-slate-800 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Gráficos
        </button>
        <button
          onClick={() => onTabChange('budgets')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
            currentTab === 'budgets' ? 'bg-white dark:bg-slate-800 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Metas
        </button>
        <button
          onClick={() => onTabChange('cloud')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
            currentTab === 'cloud' ? 'bg-white dark:bg-slate-800 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Nuvem
        </button>
      </div>
    </header>
  );
};
