import React, { useState } from 'react';
import { Database, Box, Plus, Edit2, Trash2, PackagePlus, ArrowUpDown, ShieldCheck, Check, AlertCircle, QrCode, Tag, DollarSign, Search, Layers, RefreshCw } from 'lucide-react';
import { StorageBox, ProductItem, StockMovement } from '../types/inventory';
import { Account, Category } from '../types/finance';
import { formatBRL, formatDateBR, parseSafeFloat } from '../utils/formatters';

interface Props {
  boxes: StorageBox[];
  products: ProductItem[];
  movements: StockMovement[];
  accounts: Account[];
  categories: Category[];
  onAddBox: (box: Omit<StorageBox, 'id' | 'createdAt'>) => void;
  onEditBox: (box: StorageBox) => void;
  onDeleteBox: (boxId: string) => void;
  onAddProduct: (prod: Omit<ProductItem, 'id' | 'updatedAt'>, createExpense?: { accountId: string; categoryId: string }) => void;
  onEditProduct: (prod: ProductItem) => void;
  onDeleteProduct: (prodId: string) => void;
  onRestockProduct: (productId: string, quantity: number, boxId: string, reason: string, createExpense?: { accountId: string; categoryId: string }) => void;
  managerPin: string;
  onUpdatePin: (newPin: string) => void;
  onOpenScanner: () => void;
}

export const ManagerDatabaseView: React.FC<Props> = ({
  boxes,
  products,
  movements,
  accounts,
  categories,
  onAddBox,
  onEditBox,
  onDeleteBox,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRestockProduct,
  managerPin,
  onUpdatePin,
  onOpenScanner,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'boxes' | 'movements' | 'security'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoxFilter, setSelectedBoxFilter] = useState<string>('all');

  // Modals for Manager Actions
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<StorageBox | null>(null);
  const [boxName, setBoxName] = useState('');
  const [boxCode, setBoxCode] = useState('');
  const [boxLocation, setBoxLocation] = useState('');
  const [boxCapacity, setBoxCapacity] = useState('50');
  const [boxColor, setBoxColor] = useState('#10B981');
  const [boxNotes, setBoxNotes] = useState('');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodCategory, setProdCategory] = useState('Alimentação');
  const [prodBoxId, setProdBoxId] = useState(boxes[0]?.id || '');
  const [prodQty, setProdQty] = useState('10');
  const [prodMinQty, setProdMinQty] = useState('3');
  const [prodCost, setProdCost] = useState('15.00');
  const [prodSale, setProdSale] = useState('22.00');
  const [prodUnit, setProdUnit] = useState<'un' | 'cx' | 'kg' | 'lt' | 'pct'>('un');
  const [prodNotes, setProdNotes] = useState('');
  const [createExpenseOnAdd, setCreateExpenseOnAdd] = useState(false);
  const [expenseAccountId, setExpenseAccountId] = useState(accounts[0]?.id || '');

  // Restock Modal
  const [restockProduct, setRestockProduct] = useState<ProductItem | null>(null);
  const [restockQty, setRestockQty] = useState('5');
  const [restockReason, setRestockReason] = useState('Compra de Reposição pelo Gestor');
  const [createExpenseOnRestock, setCreateExpenseOnRestock] = useState(false);

  // PIN settings
  const [currentPinInput, setCurrentPinInput] = useState(managerPin);
  const [pinSavedFeedback, setPinSavedFeedback] = useState(false);

  // Open Add Box
  const handleOpenAddBox = () => {
    setEditingBox(null);
    setBoxName('');
    setBoxCode(`CX-${String(boxes.length + 1).padStart(2, '0')}`);
    setBoxLocation('Almoxarifado Principal');
    setBoxCapacity('50');
    setBoxColor('#10B981');
    setBoxNotes('');
    setIsBoxModalOpen(true);
  };

  const handleSaveBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxName.trim()) return;

    if (editingBox) {
      onEditBox({
        ...editingBox,
        name: boxName.trim(),
        code: boxCode.trim(),
        location: boxLocation.trim(),
        capacity: parseInt(boxCapacity, 10) || 50,
        color: boxColor,
        notes: boxNotes.trim(),
      });
    } else {
      onAddBox({
        name: boxName.trim(),
        code: boxCode.trim() || `CX-${boxes.length + 1}`,
        location: boxLocation.trim(),
        capacity: parseInt(boxCapacity, 10) || 50,
        color: boxColor,
        notes: boxNotes.trim(),
      });
    }
    setIsBoxModalOpen(false);
  };

  // Open Add Product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setProdBarcode('');
    setProdCategory('Alimentação');
    setProdBoxId(boxes[0]?.id || '');
    setProdQty('10');
    setProdMinQty('3');
    setProdCost('10.00');
    setProdSale('15.00');
    setProdUnit('un');
    setProdNotes('');
    setCreateExpenseOnAdd(false);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const cost = parseSafeFloat(prodCost);
    const sale = parseSafeFloat(prodSale);
    const qty = parseInt(prodQty, 10) || 0;
    const minQty = parseInt(prodMinQty, 10) || 1;

    if (editingProduct) {
      onEditProduct({
        ...editingProduct,
        name: prodName.trim(),
        sku: prodSku.trim(),
        barcode: prodBarcode.trim(),
        category: prodCategory,
        boxId: prodBoxId,
        quantity: qty,
        minQuantity: minQty,
        costPrice: cost,
        salePrice: sale,
        unit: prodUnit,
        notes: prodNotes.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddProduct(
        {
          name: prodName.trim(),
          sku: prodSku.trim(),
          barcode: prodBarcode.trim(),
          category: prodCategory,
          boxId: prodBoxId,
          quantity: qty,
          minQuantity: minQty,
          costPrice: cost,
          salePrice: sale,
          unit: prodUnit,
          notes: prodNotes.trim(),
        },
        createExpenseOnAdd
          ? {
              accountId: expenseAccountId,
              categoryId: categories.find(c => c.name.toLowerCase().includes('aliment') || c.name.toLowerCase().includes('outro'))?.id || categories[0]?.id || '',
            }
          : undefined
      );
    }
    setIsProductModalOpen(false);
  };

  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qty = parseInt(restockQty, 10) || 1;

    onRestockProduct(
      restockProduct.id,
      qty,
      restockProduct.boxId,
      restockReason,
      createExpenseOnRestock
        ? {
            accountId: expenseAccountId,
            categoryId: categories[0]?.id || '',
          }
        : undefined
    );
    setRestockProduct(null);
  };

  const boxMap = new Map(boxes.map(b => [b.id, b]));

  const filteredProducts = products.filter(p => {
    if (selectedBoxFilter !== 'all' && p.boxId !== selectedBoxFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  const totalStockValue = products.reduce((s, p) => s + p.quantity * p.costPrice, 0);
  const totalStockUnits = products.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded">
              Base de Dados Master
            </span>
            <span className="text-xs text-slate-500">· Controle Total do Gestor</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Gestão de Estoque & Caixas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastre caixas, adicione e controle produtos e sincronize com os aplicativos executáveis dos operadores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddBox}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Box className="w-3.5 h-3.5 text-indigo-500" />
            <span>+ Nova Caixa</span>
          </button>
          <button
            onClick={handleOpenAddProduct}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Novo Produto na Caixa</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for the Manager */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500">Caixas Ativas de Armazenamento</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {boxes.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Locais de estoque organizados</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500">Produtos Cadastrados</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {products.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalStockUnits} unidades físicas no total</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500">Valor em Custo de Estoque</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBRL(totalStockValue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Patrimônio físico inventariado</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500">Alertas de Reposição</span>
          <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${products.filter(p => p.quantity <= p.minQuantity).length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {products.filter(p => p.quantity <= p.minQuantity).length} itens
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Abaixo do estoque mínimo de segurança</span>
        </div>
      </div>

      {/* Sub Tabs: Produtos, Caixas, Auditoria/Movimentações, Segurança */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-2 transition-colors ${
            activeSubTab === 'products'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Catálogo de Produtos ({products.length})
        </button>
        <button
          onClick={() => setActiveSubTab('boxes')}
          className={`pb-2 transition-colors ${
            activeSubTab === 'boxes'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Caixas de Armazenamento ({boxes.length})
        </button>
        <button
          onClick={() => setActiveSubTab('movements')}
          className={`pb-2 transition-colors ${
            activeSubTab === 'movements'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Histórico de Entradas & Saídas ({movements.length})
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`pb-2 transition-colors ${
            activeSubTab === 'security'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Segurança & PIN do Gestor
        </button>
      </div>

      {/* SUBTAB 1: PRODUCTS TABLE */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Box Filter */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar produto por nome, código de barras, SKU..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/60"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 shrink-0">Filtrar Caixa:</span>
              <select
                value={selectedBoxFilter}
                onChange={e => setSelectedBoxFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="all">Todas as Caixas</option>
                {boxes.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Produto / Descrição</th>
                    <th className="p-3.5">Caixa Localizada</th>
                    <th className="p-3.5 text-center">Quantidade</th>
                    <th className="p-3.5 text-right">Custo Unit.</th>
                    <th className="p-3.5 text-right">Preço Venda</th>
                    <th className="p-3.5 text-center">Ações do Gestor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum produto cadastrado nesta caixa ou filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      const box = boxMap.get(prod.boxId);
                      const isLow = prod.quantity <= prod.minQuantity && prod.quantity > 0;
                      const isZero = prod.quantity <= 0;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 min-w-[200px]">
                            <p className="font-semibold text-slate-900 dark:text-white">{prod.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>SKU: {prod.sku}</span>
                              {prod.barcode && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400">EAN: {prod.barcode}</span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              <span>{prod.category}</span>
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: box?.color || '#64748B' }} />
                              <span className="font-medium text-slate-800 dark:text-slate-200">{box?.name || 'Não alocado'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{box?.location}</span>
                          </td>

                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono tabular-nums ${
                              isZero
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : isLow
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}>
                              {prod.quantity} {prod.unit}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {isZero ? 'ESGOTADO' : isLow ? `Abaixo do mín (${prod.minQuantity})` : `Mín: ${prod.minQuantity}`}
                            </span>
                          </td>

                          <td className="p-3.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                            {formatBRL(prod.costPrice)}
                          </td>

                          <td className="p-3.5 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                            {formatBRL(prod.salePrice)}
                          </td>

                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setRestockProduct(prod);
                                  setRestockQty('5');
                                }}
                                title="Abastecer / Reabastecer Caixa"
                                className="px-2 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                <span>Repor</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setProdName(prod.name);
                                  setProdSku(prod.sku);
                                  setProdBarcode(prod.barcode);
                                  setProdCategory(prod.category);
                                  setProdBoxId(prod.boxId);
                                  setProdQty(prod.quantity.toString());
                                  setProdMinQty(prod.minQuantity.toString());
                                  setProdCost(prod.costPrice.toString());
                                  setProdSale(prod.salePrice.toString());
                                  setProdUnit(prod.unit);
                                  setProdNotes(prod.notes || '');
                                  setCreateExpenseOnAdd(false);
                                  setIsProductModalOpen(true);
                                }}
                                title="Editar produto na base"
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remover "${prod.name}" da base de dados?`)) {
                                    onDeleteProduct(prod.id);
                                  }
                                }}
                                title="Excluir da base de dados"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BOXES MANAGEMENT */}
      {activeSubTab === 'boxes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map(box => {
            const itemsInBox = products.filter(p => p.boxId === box.id);
            const totalUnits = itemsInBox.reduce((s, p) => s + p.quantity, 0);

            return (
              <div
                key={box.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: box.color }} />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{box.name}</h4>
                        <span className="text-xs text-slate-500 font-mono">{box.code} · {box.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBox(box);
                          setBoxName(box.name);
                          setBoxCode(box.code);
                          setBoxLocation(box.location);
                          setBoxCapacity(box.capacity ? box.capacity.toString() : '50');
                          setBoxColor(box.color);
                          setBoxNotes(box.notes || '');
                          setIsBoxModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir ${box.name}? Produtos nesta caixa serão desvinculados.`)) {
                            onDeleteBox(box.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tipos de Produtos:</span>
                      <strong className="text-slate-900 dark:text-white">{itemsInBox.length} itens cadastrados</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unidades Físicas:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">{totalUnits} un.</strong>
                    </div>
                    {box.capacity && (
                      <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                        <span>Capacidade da Caixa:</span>
                        <span>{box.capacity} un.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 italic text-[11px] truncate max-w-[180px]">
                    {box.notes || 'Sem observações'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBoxFilter(box.id);
                      setActiveSubTab('products');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Ver Itens da Caixa →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 3: MOVEMENTS / AUDIT TRAIL */}
      {activeSubTab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Histórico de Movimentações de Estoque
            </h3>
            <p className="text-xs text-slate-500">Registro de todas as entradas feitas pelo Gestor e saídas registradas pelos Operadores</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {movements.map(mov => (
              <div key={mov.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    mov.type === 'in'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                  }`}>
                    {mov.type === 'in' ? '+Ent' : '-Sai'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{mov.productName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{mov.boxName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{new Date(mov.timestamp).toLocaleString('pt-BR')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {mov.authorRole === 'manager' ? 'Ação do Gestor' : 'Ação do Operador'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-bold font-mono tabular-nums ${mov.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {mov.type === 'in' ? `+${mov.quantity}` : `-${mov.quantity}`} un.
                  </span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    Saldo: {mov.previousQty} → {mov.newQty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: PIN & SECURITY SETTINGS */}
      {activeSubTab === 'security' && (
        <div className="max-w-xl p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              PIN de Proteção do Modo Gestor
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Define o código de segurança exigido para acessar o Painel da Base de Dados Master quando alguém estiver usando o Modo Operador:
          </p>

          <div className="flex gap-2 items-center">
            <input
              type="password"
              maxLength={8}
              value={currentPinInput}
              onChange={e => setCurrentPinInput(e.target.value)}
              placeholder="Digite o PIN de 4 a 8 dígitos"
              className="px-3 py-2 text-sm font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            />
            <button
              onClick={() => {
                if (currentPinInput.trim().length >= 4) {
                  onUpdatePin(currentPinInput.trim());
                  setPinSavedFeedback(true);
                  setTimeout(() => setPinSavedFeedback(false), 3000);
                } else {
                  alert('O PIN deve conter pelo menos 4 dígitos.');
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              Salvar PIN
            </button>
          </div>

          {pinSavedFeedback && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> PIN atualizado com sucesso!
            </span>
          )}
        </div>
      )}

      {/* BOX MODAL */}
      {isBoxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingBox ? 'Editar Caixa de Armazenamento' : 'Nova Caixa de Armazenamento'}
            </h3>

            <form onSubmit={handleSaveBox} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Nome da Caixa</label>
                <input
                  type="text"
                  required
                  value={boxName}
                  onChange={e => setBoxName(e.target.value)}
                  placeholder="Ex: Caixa 01 - Balcão Principal"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Código / Tag</label>
                  <input
                    type="text"
                    required
                    value={boxCode}
                    onChange={e => setBoxCode(e.target.value)}
                    placeholder="CX-01"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Capacidade (Unidades)</label>
                  <input
                    type="number"
                    value={boxCapacity}
                    onChange={e => setBoxCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Localização Física</label>
                <input
                  type="text"
                  required
                  value={boxLocation}
                  onChange={e => setBoxLocation(e.target.value)}
                  placeholder="Ex: Almoxarifado Setor A, Prateleira 2"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Cor de Identificação</label>
                <div className="flex gap-2">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#64748B'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setBoxColor(col)}
                      className={`w-7 h-7 rounded-md border-2 transition-transform ${boxColor === col ? 'scale-110 border-slate-900 dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Observações da Caixa</label>
                <textarea
                  rows={2}
                  value={boxNotes}
                  onChange={e => setBoxNotes(e.target.value)}
                  placeholder="Instruções de acesso, temperatura ou conteúdo..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBoxModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Salvar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL (ADD / EDIT BY MANAGER) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingProduct ? 'Editar Produto na Base de Dados' : 'Adicionar Novo Produto na Caixa'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  placeholder="Ex: Café Torrado Pilão 500g"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Código de Barras (EAN / QR)</label>
                  <input
                    type="text"
                    value={prodBarcode}
                    onChange={e => setProdBarcode(e.target.value)}
                    placeholder="789..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Código SKU</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={e => setProdSku(e.target.value)}
                    placeholder="ALIM-001"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Caixa de Destino</label>
                  <select
                    value={prodBoxId}
                    onChange={e => setProdBoxId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    {boxes.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={prodCategory}
                    onChange={e => setProdCategory(e.target.value)}
                    placeholder="Alimentação, Limpeza, etc."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Quantidade Inicial</label>
                  <input
                    type="number"
                    required
                    value={prodQty}
                    onChange={e => setProdQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    required
                    value={prodMinQty}
                    onChange={e => setProdMinQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Unidade</label>
                  <select
                    value={prodUnit}
                    onChange={e => setProdUnit(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="un">un (Unidade)</option>
                    <option value="cx">cx (Caixa)</option>
                    <option value="kg">kg (Quilo)</option>
                    <option value="lt">lt (Litro)</option>
                    <option value="pct">pct (Pacote)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="text"
                    value={prodCost}
                    onChange={e => setProdCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Preço de Venda / Repasse (R$)</label>
                  <input
                    type="text"
                    value={prodSale}
                    onChange={e => setProdSale(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Integration with Financial Flow */}
              {!editingProduct && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createExpenseOnAdd}
                      onChange={e => setCreateExpenseOnAdd(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Lançar despesa de compra automaticamente no Financeiro
                    </span>
                  </label>
                  {createExpenseOnAdd && (
                    <div className="pt-1">
                      <label className="block text-[11px] text-slate-500 mb-1">Debitar da Conta:</label>
                      <select
                        value={expenseAccountId}
                        onChange={e => setExpenseAccountId(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({formatBRL(a.currentBalance)})
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Valor total a debitar: {formatBRL((parseInt(prodQty, 10) || 0) * parseSafeFloat(prodCost))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Observações do Produto</label>
                <textarea
                  rows={2}
                  value={prodNotes}
                  onChange={e => setProdNotes(e.target.value)}
                  placeholder="Lote, data de validade, fornecedor..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs"
                >
                  Salvar na Base de Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Repor Unidades na Caixa
            </h3>
            <p className="text-xs text-slate-500">
              Produto: <strong className="text-slate-800 dark:text-slate-200">{restockProduct.name}</strong>
              <br />
              Caixa atual: <strong>{boxMap.get(restockProduct.boxId)?.name}</strong>
            </p>

            <form onSubmit={handleSaveRestock} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Quantidade a Adicionar</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-base font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Estoque atual: {restockProduct.quantity} → Novo total: {restockProduct.quantity + (parseInt(restockQty, 10) || 0)} {restockProduct.unit}
                </span>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Motivo / Origem</label>
                <input
                  type="text"
                  required
                  value={restockReason}
                  onChange={e => setRestockReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createExpenseOnRestock}
                    onChange={e => setCreateExpenseOnRestock(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Lançar custo ({formatBRL((parseInt(restockQty, 10) || 0) * restockProduct.costPrice)}) no Financeiro
                  </span>
                </label>
                {createExpenseOnRestock && (
                  <select
                    value={expenseAccountId}
                    onChange={e => setExpenseAccountId(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
                >
                  Confirmar Reposição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
