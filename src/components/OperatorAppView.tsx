import React, { useState } from 'react';
import { Package, CheckCircle2, AlertTriangle, XCircle, Search, QrCode, ArrowDownRight, BellRing, Box, Layers, Filter, Check, Eye } from 'lucide-react';
import { StorageBox, ProductItem } from '../types/inventory';
import { formatBRL } from '../utils/formatters';

interface Props {
  boxes: StorageBox[];
  products: ProductItem[];
  onConsumeProduct: (productId: string, quantity: number, reason: string) => void;
  onRequestRestock: (productName: string, boxName: string) => void;
  onOpenScannerForProductCheck: () => void;
}

export const OperatorAppView: React.FC<Props> = ({
  boxes,
  products,
  onConsumeProduct,
  onRequestRestock,
  onOpenScannerForProductCheck,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'missing' | 'low'>('available');
  const [selectedBoxId, setSelectedBoxId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Consume modal state
  const [consumingProduct, setConsumingProduct] = useState<ProductItem | null>(null);
  const [consumeQty, setConsumeQty] = useState('1');
  const [consumeReason, setConsumeReason] = useState('Consumo / Atendimento');
  const [notificationSent, setNotificationSent] = useState<string | null>(null);

  const boxMap = new Map(boxes.map(b => [b.id, b]));

  // Categorize products into:
  // 1. Available (> 0)
  // 2. Missing / Out of Stock (= 0)
  // 3. Low stock (<= minQuantity and > 0)
  const availableProducts = products.filter(p => p.quantity > 0);
  const missingProducts = products.filter(p => p.quantity <= 0);
  const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= p.minQuantity);

  // Active list based on tab
  const baseList =
    activeTab === 'available'
      ? availableProducts
      : activeTab === 'missing'
      ? missingProducts
      : lowStockProducts;

  // Apply filters
  const filteredList = baseList.filter(p => {
    if (selectedBoxId !== 'all' && p.boxId !== selectedBoxId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  const handleConfirmConsume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumingProduct) return;
    const qty = parseInt(consumeQty, 10) || 1;
    if (qty <= 0) return;

    if (qty > consumingProduct.quantity) {
      alert(`Quantidade indisponível na caixa. Só há ${consumingProduct.quantity} unidades disponíveis.`);
      return;
    }

    onConsumeProduct(consumingProduct.id, qty, consumeReason);
    setConsumingProduct(null);
  };

  const handleRequestNotify = (prod: ProductItem) => {
    const box = boxMap.get(prod.boxId);
    onRequestRestock(prod.name, box?.name || 'Caixa Geral');
    setNotificationSent(prod.id);
    setTimeout(() => setNotificationSent(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded">
              Aplicativo Executável
            </span>
            <span className="text-xs text-slate-500">· Modo Operador (Ponto de Uso)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Consulta & Saída de Estoque
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize o que está disponível nas caixas, identifique o que está em falta e registre retiradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScannerForProductCheck}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>Consultar por Barcode / QR</span>
          </button>
        </div>
      </div>

      {/* 3 Status Filter Buttons (What exists vs What is missing) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('available')}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'available'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">O Que Temos</span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {availableProducts.length} itens
              </span>
            </div>
          </div>
          <span className="text-xs text-emerald-600 font-semibold">Disponíveis</span>
        </button>

        <button
          onClick={() => setActiveTab('missing')}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'missing'
              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">O Que Falta</span>
              <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {missingProducts.length} itens
              </span>
            </div>
          </div>
          <span className="text-xs text-rose-600 font-semibold">Esgotados</span>
        </button>

        <button
          onClick={() => setActiveTab('low')}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'low'
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Estoque Baixo</span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {lowStockProducts.length} itens
              </span>
            </div>
          </div>
          <span className="text-xs text-amber-600 font-semibold">Repor logo</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome do produto, código EAN..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/60"
          />
        </div>

        {/* Box Selector for the Operator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Ver Caixa:</span>
          <select
            value={selectedBoxId}
            onChange={e => setSelectedBoxId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          >
            <option value="all">Todas as Caixas ({products.length} produtos)</option>
            {boxes.map(box => (
              <option key={box.id} value={box.id}>
                {box.name} ({box.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operator Stock List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 space-y-1">
            <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhum produto encontrado neste filtro
            </p>
            <p className="text-xs text-slate-500">
              {activeTab === 'missing'
                ? 'Excelente! Não há nenhum item em falta no momento.'
                : 'Verifique a busca ou selecione outra caixa de armazenamento.'}
            </p>
          </div>
        ) : (
          filteredList.map(prod => {
            const box = boxMap.get(prod.boxId);
            const isZero = prod.quantity <= 0;
            const isLow = prod.quantity <= prod.minQuantity && prod.quantity > 0;

            return (
              <div
                key={prod.id}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
              >
                <div>
                  {/* Top line with box tag and status */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: box?.color || '#64748B' }} />
                      <span className="font-semibold truncate max-w-[150px]">{box?.name || 'Caixa'}</span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isZero
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        : isLow
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}>
                      {isZero ? 'Em Falta' : isLow ? 'Estoque Baixo' : 'Disponível'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {prod.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>{prod.category}</span>
                    {prod.barcode && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400">EAN: {prod.barcode}</span>
                      </>
                    )}
                  </div>

                  {/* Quantity and location card */}
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Quantidade Atual</span>
                      <span className={`text-xl font-bold font-mono tabular-nums ${isZero ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {prod.quantity} <span className="text-xs font-normal text-slate-500">{prod.unit}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Localização</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block max-w-[120px] truncate">
                        {box?.location || 'Almoxarifado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operator Actions (Register Consumption or Request Restock) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {isZero ? (
                    <button
                      onClick={() => handleRequestNotify(prod)}
                      className="w-full py-2 px-3 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      {notificationSent === prod.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Solicitação Enviada ao Gestor!</span>
                        </>
                      ) : (
                        <>
                          <BellRing className="w-3.5 h-3.5" />
                          <span>Notificar Falta ao Gestor</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setConsumingProduct(prod);
                        setConsumeQty('1');
                      }}
                      className="w-full py-2 px-3 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Retirar / Dar Baixa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Operator Safety Notice */}
      <div className="p-4 bg-slate-100/70 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>
          ℹ️ <strong>Modo Operador:</strong> Você tem permissão para consultar o que há nas caixas e registrar retiradas. O cadastro de novos produtos e caixas é controlado exclusivamente pelo Gestor.
        </span>
      </div>

      {/* CONSUME / USAGE MODAL */}
      {consumingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Registrar Saída de Estoque
            </h3>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">{consumingProduct.name}</p>
              <p className="text-slate-500">Caixa: {boxMap.get(consumingProduct.boxId)?.name}</p>
              <p className="text-slate-500 font-mono">Disponível: {consumingProduct.quantity} {consumingProduct.unit}</p>
            </div>

            <form onSubmit={handleConfirmConsume} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Quantidade a Retirar</label>
                <input
                  type="number"
                  min="1"
                  max={consumingProduct.quantity}
                  required
                  value={consumeQty}
                  onChange={e => setConsumeQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Motivo da Retirada</label>
                <select
                  value={consumeReason}
                  onChange={e => setConsumeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="Consumo / Atendimento">Consumo / Atendimento no Balcão</option>
                  <option value="Venda ao Cliente">Venda ao Cliente</option>
                  <option value="Uso Interno Operacional">Uso Interno Operacional</option>
                  <option value="Avaria / Produto Danificado">Avaria / Produto Danificado</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConsumingProduct(null)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
