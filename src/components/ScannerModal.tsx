import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, X, Check, RefreshCw, Barcode, QrCode, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { parseScannedCode } from '../utils/codeParser';
import { ParsedCodeResult } from '../types/finance';
import { formatBRL } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyCode: (parsed: ParsedCodeResult) => void;
}

// Preset samples for fast one-click testing
const TEST_SAMPLES = [
  {
    label: 'Cupom NFC-e Supermercado (R$ 142,50)',
    type: 'danfe_nfce',
    icon: FileText,
    code: 'https://www.sefaz.sp.gov.br/nfce/qrcode?p=35261012345678000190650010000123451000123456|2|1|1|142.50|31323334',
  },
  {
    label: 'Boleto Bancário Itaú (R$ 480,00)',
    type: 'boleto',
    icon: Barcode,
    code: '34191790010104351004791020150008998620000048000',
  },
  {
    label: 'PIX Copia e Cola / QR Code (R$ 150,00)',
    type: 'pix',
    icon: QrCode,
    code: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865406150.005802BR5918SUPERMERCADO CENTRAL6009SAO PAULO62070503***6304ABCD',
  },
  {
    label: 'Código de Barras EAN-13 (Café Pilão)',
    type: 'ean13',
    icon: Barcode,
    code: '7896005800114',
  },
];

export const ScannerModal: React.FC<Props> = ({ isOpen, onClose, onApplyCode }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ParsedCodeResult | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5qr-code-full-region';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError(null);
    } else {
      if (activeTab === 'camera') {
        startCamera();
      }
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch (err) {
      console.warn('Erro ao parar câmera:', err);
    } finally {
      scannerRef.current = null;
      setCameraActive(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode },
        config,
        (decodedText, decodedResult) => {
          // Success callback
          const parsed = parseScannedCode(decodedText, decodedResult.result.format?.formatName || 'QR_CODE');
          setScannedResult(parsed);
          // Play haptic feedback if supported
          if (navigator.vibrate) {
            navigator.vibrate(80);
          }
          stopCamera();
        },
        (errorMessage) => {
          // Scanning frame error, ignore
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error('Falha ao iniciar câmera:', err);
      setCameraActive(false);
      setCameraError(
        err?.message?.includes('Permission')
          ? 'Permissão de câmera negada. Você pode usar a aba de Enviar Foto ou os Exemplos de Teste.'
          : 'Não foi possível acessar a câmera. Verifique se o dispositivo possui câmera disponível.'
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decoded = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();

      const parsed = parseScannedCode(decoded, 'IMAGE_FILE');
      setScannedResult(parsed);
    } catch (err) {
      console.error('Erro na leitura da imagem:', err);
      setCameraError('Nenhum código de barras ou QR Code nítido foi encontrado nesta imagem. Tente uma foto mais iluminada ou reta.');
    }
  };

  const handleApplyPreset = (code: string) => {
    const parsed = parseScannedCode(code, 'PRESET_SAMPLE');
    setScannedResult(parsed);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    const parsed = parseScannedCode(manualCodeInput.trim(), 'MANUAL_ENTRY');
    setScannedResult(parsed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Leitor Barcode & QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Lê NFC-e, boletos bancários, PIX e produtos EAN-13
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 gap-1.5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            Câmera ao Vivo
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Enviar Foto
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('samples');
            }}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'samples'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            Testes Rápidos
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[280px]">
                <div id={readerElementId} className="w-full" />
                
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-56 h-56 border-2 border-emerald-500/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Laser scanner line effect */}
                      <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse top-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-white text-xs bg-black/60 px-3 py-1 rounded-full mt-4 font-medium backdrop-blur-xs">
                      Aponte para o Cupom Fiscal, Boleto ou Código
                    </span>
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 text-center max-w-xs space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-white leading-relaxed">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
                    </button>
                  </div>
                )}
              </div>

              {cameraActive && (
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Modo leitor ativo</span>
                  <button
                    type="button"
                    onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Alternar Câmera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Carregar imagem do código ou cupom
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Formatos suportados: PNG, JPG, JPEG ou WEBP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Manual Digitation fallback */}
              <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ou digite / cole o código manualmente:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={e => setManualCodeInput(e.target.value)}
                    placeholder="Cole a linha do boleto, URL NFC-e ou chave PIX..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 rounded-lg shrink-0"
                  >
                    Decodificar
                  </button>
                </div>
              </form>
              <div id="file-scanner-temp" className="hidden" />
            </div>
          )}

          {/* SAMPLES TAB */}
          {activeTab === 'samples' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione um exemplo abaixo para simular a leitura instantânea de cupons fiscais, boletos ou PIX brasileiros:
              </p>
              <div className="grid gap-2">
                {TEST_SAMPLES.map((sample, idx) => {
                  const Icon = sample.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(sample.code)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-800/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {sample.label}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono truncate block mt-0.5">
                            {sample.code.slice(0, 36)}...
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DETECTED / PARSED RESULT CARD */}
          {scannedResult && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Código Reconhecido com Sucesso
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {scannedResult.extractedTitle}
                    </h4>
                  </div>
                </div>
                {scannedResult.suggestedAmount !== null && (
                  <span className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatBRL(scannedResult.suggestedAmount)}
                  </span>
                )}
              </div>

              {/* Details table */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-500/20">
                {scannedResult.suggestedCategory && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Categoria Sugerida</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{scannedResult.suggestedCategory}</span>
                  </div>
                )}
                {scannedResult.suggestedPaymentMethod && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Forma de Pagamento</span>
                    <span className="font-medium uppercase text-slate-800 dark:text-slate-200">{scannedResult.suggestedPaymentMethod}</span>
                  </div>
                )}
                {scannedResult.suggestedDate && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Data / Vencimento</span>
                    <span className="font-medium font-mono text-slate-800 dark:text-slate-200">{scannedResult.suggestedDate}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block text-[11px]">Tipo de Item</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {scannedResult.suggestedType === 'expense' ? 'Despesa' : 'Receita'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  onApplyCode(scannedResult);
                  stopCamera();
                  onClose();
                }}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Lançar Transação com este Código</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
