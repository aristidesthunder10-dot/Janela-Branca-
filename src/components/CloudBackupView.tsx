import React, { useState } from 'react';
import { Cloud, CloudCheck, Download, Upload, RefreshCw, Key, ShieldCheck, History, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { CloudBackupSnapshot, Transaction, Account, Category, BudgetGoal } from '../types/finance';
import { StorageService, AppStateData } from '../services/storageService';
import { formatBRL, formatDateBR } from '../utils/formatters';

interface Props {
  stateData: AppStateData;
  onRestoreState: (state: AppStateData) => void;
}

export const CloudBackupView: React.FC<Props> = ({ stateData, onRestoreState }) => {
  const [backups, setBackups] = useState<CloudBackupSnapshot[]>(() => StorageService.getCloudBackups());
  const [syncKey, setSyncKey] = useState<string>(() => StorageService.getCloudSyncKey());
  const [inputSyncKey, setInputSyncKey] = useState<string>('');
  const [autoBackup, setAutoBackup] = useState<boolean>(() => StorageService.isAutoBackupEnabled());
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => StorageService.getLastBackupTime());
  const [copiedKey, setCopiedKey] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalBalance = stateData.accounts.reduce((s, a) => s + a.currentBalance, 0);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleManualBackup = () => {
    const snap = StorageService.createCloudBackup(stateData);
    setBackups(StorageService.getCloudBackups());
    setLastBackupTime(snap.timestamp);
    showNotification('Backup na nuvem gerado e sincronizado com sucesso!');
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleConnectSyncKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSyncKey.trim()) return;
    StorageService.setCloudSyncKey(inputSyncKey.trim());
    setSyncKey(inputSyncKey.trim().toUpperCase());
    setInputSyncKey('');
    showNotification(`Dispositivo conectado à chave de nuvem ${inputSyncKey.trim().toUpperCase()}`);
  };

  const handleExportJSON = () => {
    StorageService.exportToJsonFile(stateData);
    showNotification('Arquivo de backup JSON baixado com sucesso!');
  };

  const handleExportCSV = () => {
    StorageService.exportToCSV(stateData);
    showNotification('Extrato CSV para Excel baixado com sucesso!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsedState = StorageService.parseImportJson(text);
        if (confirm(`Restaurar backup com ${parsedState.transactions.length} transações e ${parsedState.accounts.length} contas? Isso atualizará seus dados atuais.`)) {
          onRestoreState(parsedState);
          // also create a backup snapshot
          StorageService.createCloudBackup(parsedState, 'Importação Manual JSON');
          setBackups(StorageService.getCloudBackups());
          showNotification('Dados restaurados com sucesso a partir do arquivo JSON!');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo de backup. Verifique se é um arquivo JSON válido exportado pelo Janela Branca.');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreSnapshot = (snapshot: CloudBackupSnapshot) => {
    if (confirm(`Restaurar versão do backup de ${new Date(snapshot.timestamp).toLocaleString('pt-BR')} com ${snapshot.transactionCount} lançamentos?`)) {
      const restored = StorageService.restoreBackup(snapshot);
      onRestoreState(restored);
      showNotification('Versão do backup restaurada com sucesso!');
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    StorageService.deleteBackup(id);
    setBackups(StorageService.getCloudBackups());
    showNotification('Versão excluída do histórico.');
  };

  const handleToggleAutoBackup = () => {
    const nextVal = !autoBackup;
    setAutoBackup(nextVal);
    StorageService.setAutoBackupEnabled(nextVal);
    showNotification(nextVal ? 'Backup automático ativado.' : 'Backup automático pausado.');
  };

  const handleResetDemo = () => {
    if (confirm('Deseja restaurar os dados de demonstração originais?')) {
      const initial = StorageService.resetToDefault();
      onRestoreState(initial);
      showNotification('Dados de demonstração restaurados.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Backup na Nuvem & Sincronização
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Mantenha seus lançamentos protegidos, sincronize entre múltiplos dispositivos e exporte seus relatórios
        </p>
      </div>

      {/* Success alert message */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cloud Status Card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CloudCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Status da Proteção na Nuvem
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  · Ativo & Protegido
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Última sincronização:{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {lastBackupTime ? new Date(lastBackupTime).toLocaleString('pt-BR') : 'Nunca realizado'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleManualBackup}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 self-stretch sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Fazer Backup na Nuvem Agora</span>
          </button>
        </div>

        {/* Protected metrics summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Lançamentos Salvos</span>
            <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stateData.transactions.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Contas & Carteiras</span>
            <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stateData.accounts.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Categorias & Metas</span>
            <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stateData.categories.length} / {stateData.budgets.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Patrimônio Assegurado</span>
            <span className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatBRL(totalBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Sync Key & Multi-Device Pairing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Sync Key */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Chave de Nuvem (Multi-Dispositivos)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Use esta chave para emparelhar e sincronizar este cofre financeiro com o aplicativo no seu smartphone, tablet ou outro computador:
          </p>

          <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white justify-between">
            <span>{syncKey}</span>
            <button
              onClick={handleCopyKey}
              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
            >
              {copiedKey ? 'Copiado!' : 'Copiar Chave'}
            </button>
          </div>

          {/* Connect to existing key */}
          <form onSubmit={handleConnectSyncKey} className="pt-2 flex gap-2">
            <input
              type="text"
              value={inputSyncKey}
              onChange={e => setInputSyncKey(e.target.value)}
              placeholder="Inserir chave de outro aparelho (ex: KTR-1234-BR)..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 shrink-0"
            >
              Conectar
            </button>
          </form>
        </div>

        {/* Local File Export & Import */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Exportação e Importação de Arquivos
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Baixe cópias físicas dos seus dados para guardar offline ou importar em planilhas:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleExportJSON}
              className="p-3 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-left bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500 mb-1" />
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Exportar JSON</span>
              <span className="text-[11px] text-slate-500">Backup completo do app</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="p-3 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-left bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500 mb-1" />
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Exportar CSV</span>
              <span className="text-[11px] text-slate-500">Planilha para Excel/Sheets</span>
            </button>
          </div>

          {/* Import JSON button */}
          <label className="w-full py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar de Arquivo JSON do Computador</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Cloud Backup Version History */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Histórico de Versões na Nuvem
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {backups.length} pontos de restauração salvos
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhum ponto de restauração anterior ainda. Clique em <strong>"Fazer Backup na Nuvem Agora"</strong> acima para criar seu primeiro ponto.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {backups.map(snap => (
              <div
                key={snap.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {new Date(snap.timestamp).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      · {snap.device}
                    </span>
                  </div>
                  {/* Zero-pill metadata text */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{snap.transactionCount} lançamentos</span>
                    <span aria-hidden="true">·</span>
                    <span>{snap.accountCount} contas</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatBRL(snap.totalNetWorth)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRestoreSnapshot(snap)}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-600" />
                    <span>Restaurar Esta Versão</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Excluir este ponto de restauração"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences & Reset */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white block">
            Backup Automático em Segundo Plano
          </span>
          <span className="text-xs text-slate-500">
            Cria automaticamente um ponto de backup local e em nuvem ao cadastrar ou alterar transações
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAutoBackup}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              autoBackup
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {autoBackup ? 'Ativado' : 'Desativado'}
          </button>
          <button
            onClick={handleResetDemo}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors"
          >
            Restaurar Dados Demo
          </button>
        </div>
      </div>
    </div>
  );
};
