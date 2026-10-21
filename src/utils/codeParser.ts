import { ParsedCodeResult, CodeScannerType, PaymentMethod, TransactionType } from '../types/finance';

const KNOWN_BRAZILIAN_BANKS: Record<string, string> = {
  '001': 'Banco do Brasil',
  '033': 'Santander',
  '104': 'Caixa Econômica Federal',
  '237': 'Bradesco',
  '260': 'Nubank',
  '341': 'Itaú Unibanco',
  '077': 'Banco Inter',
  '212': 'Banco Original',
  '336': 'C6 Bank',
  '422': 'Banco Safra',
  '756': 'Sicoob',
  '748': 'Sicredi',
};

// Common Brazilian EAN-13 product catalog for immediate recognition
const KNOWN_EAN13_PRODUCTS: Record<string, { name: string; category: string; estPrice: number }> = {
  '7891000100103': { name: 'Café Solúvel Nescafé 100g', category: 'Supermercado', estPrice: 18.90 },
  '7894900011517': { name: 'Refrigerante Coca-Cola 2L', category: 'Supermercado', estPrice: 10.50 },
  '7896005800114': { name: 'Café Torrado e Moído Pilão 500g', category: 'Supermercado', estPrice: 24.90 },
  '7898080640017': { name: 'Óleo de Soja Lisa 900ml', category: 'Supermercado', estPrice: 8.75 },
  '7891024132050': { name: 'Sabão em Pó OMO Lavagem Perfeita 1.6kg', category: 'Supermercado', estPrice: 27.90 },
  '7891000053508': { name: 'Leite Condensado Moça Lata 395g', category: 'Supermercado', estPrice: 8.99 },
  '7891079012354': { name: 'Arroz Tipo 1 Camil 5kg', category: 'Supermercado', estPrice: 32.50 },
  '7891079013214': { name: 'Feijão Carioca Camil 1kg', category: 'Supermercado', estPrice: 9.80 },
  '7891008121049': { name: 'Biscoito Recheado Passatempo 130g', category: 'Supermercado', estPrice: 3.89 },
  '7891038072120': { name: 'Cerveja Heineken Puro Malte 350ml', category: 'Lazer', estPrice: 5.99 },
  '7891150004566': { name: 'Detergente Líquido Ypê Neutro 500ml', category: 'Supermercado', estPrice: 2.89 },
  '7891055312308': { name: 'Shampoo Seda Ceramidas 325ml', category: 'Saúde', estPrice: 14.50 },
  '7896004701238': { name: 'Creme Dental Colgate Total 12 90g', category: 'Saúde', estPrice: 7.90 },
  '7898357410012': { name: 'Azeite de Oliva Extra Virgem 500ml', category: 'Supermercado', estPrice: 42.00 },
};

/**
 * Parses EMVCo PIX payload (BR Code)
 * Starts with 000201...
 */
function parsePixPayload(raw: string): Partial<ParsedCodeResult> | null {
  if (!raw.startsWith('000201')) return null;

  let amount: number | null = null;
  let name = 'Pagamento PIX';
  let city = '';
  let pixKey = '';
  let txid = '';

  let idx = 0;
  while (idx < raw.length) {
    const id = raw.slice(idx, idx + 2);
    const lenStr = raw.slice(idx + 2, idx + 4);
    const len = parseInt(lenStr, 10);
    if (isNaN(len)) break;

    const val = raw.slice(idx + 4, idx + 4 + len);
    idx += 4 + len;

    if (id === '54') {
      // Transaction Amount
      const num = parseFloat(val);
      if (!isNaN(num)) amount = num;
    } else if (id === '59') {
      // Merchant Name
      name = `PIX: ${val.trim()}`;
    } else if (id === '60') {
      // Merchant City
      city = val.trim();
    } else if (id === '26') {
      // Merchant Account Info
      // Try to extract subtag 01 (pix key)
      const subKeyMatch = val.match(/01\d{2}(.+)/);
      if (subKeyMatch) {
        pixKey = subKeyMatch[1];
      }
    } else if (id === '62') {
      // Additional Data Field
      const txMatch = val.match(/05\d{2}([A-Za-z0-9_-]+)/);
      if (txMatch) txid = txMatch[1];
    }
  }

  return {
    codeType: 'pix',
    extractedTitle: name,
    suggestedAmount: amount,
    suggestedCategory: 'Serviços',
    suggestedPaymentMethod: 'pix',
    suggestedType: 'expense',
    extraDetails: {
      'Tipo de Código': 'PIX QR Code (BR Code)',
      'Beneficiário': name.replace('PIX: ', ''),
      ...(city ? { 'Cidade': city } : {}),
      ...(pixKey ? { 'Chave PIX': pixKey } : {}),
      ...(txid ? { 'ID Transação (TXID)': txid } : {}),
    },
  };
}

/**
 * Parses Brazilian Boleto Bancário (Linha Digitável / Barcode)
 */
function parseBoleto(digitsRaw: string): Partial<ParsedCodeResult> | null {
  const digits = digitsRaw.replace(/[^\d]/g, '');

  // 47 digits: Linha digitável de título bancário comum
  // 48 digits: Concessionária / Tributos (energia, água, telefone)
  // 44 digits: Código de barras febraban
  if (digits.length !== 47 && digits.length !== 48 && digits.length !== 44) {
    return null;
  }

  let bankCode = '';
  let bankName = 'Boleto Bancário';
  let amount: number | null = null;
  let dueDate: string | null = null;
  let type: 'tributo' | 'bancario' = 'bancario';

  if (digits.length === 47) {
    // Linha digitável bancária
    // Campo 1: AAABC.CCCCX -> AAA = Código do Banco
    bankCode = digits.slice(0, 3);
    bankName = KNOWN_BRAZILIAN_BANKS[bankCode] ? `Boleto ${KNOWN_BRAZILIAN_BANKS[bankCode]}` : `Boleto Banco ${bankCode}`;

    // Campo 5: UUUUVVVVVVVVVV -> UUUU = Fator de vencimento, VVVVVVVVVV = Valor
    const fatorVencimentoStr = digits.slice(33, 37);
    const valorStr = digits.slice(37, 47);

    const fator = parseInt(fatorVencimentoStr, 10);
    if (!isNaN(fator) && fator > 0) {
      // Data base Febraban: 07/10/1997
      // Note: fator 1000 = 03/07/2000
      const baseDate = new Date(1997, 9, 7);
      baseDate.setDate(baseDate.getDate() + fator);
      dueDate = baseDate.toISOString().split('T')[0];
    }

    const valorCentavos = parseInt(valorStr, 10);
    if (!isNaN(valorCentavos) && valorCentavos > 0) {
      amount = valorCentavos / 100;
    }
  } else if (digits.length === 48) {
    // Concessionárias de serviços públicos / Contas de consumo
    type = 'tributo';
    // O valor fica nas posições 5 a 15 do código (depende do dígito de moeda)
    const valorStr = digits.slice(4, 15);
    const valorCentavos = parseInt(valorStr, 10);
    if (!isNaN(valorCentavos) && valorCentavos > 0) {
      amount = valorCentavos / 100;
    }
    const segmento = digits[1];
    let segDesc = 'Conta de Consumo';
    if (segmento === '1') segDesc = 'Prefeitura / IPTU';
    if (segmento === '2') segDesc = 'Saneamento / Água';
    if (segmento === '3') segDesc = 'Energia Elétrica';
    if (segmento === '4') segDesc = 'Telecomunicações / Internet';
    if (segmento === '5') segDesc = 'Órgãos Governamentais';
    bankName = `Pagamento ${segDesc}`;
  } else if (digits.length === 44) {
    // Código de barras Febraban direto
    bankCode = digits.slice(0, 3);
    bankName = KNOWN_BRAZILIAN_BANKS[bankCode] ? `Boleto ${KNOWN_BRAZILIAN_BANKS[bankCode]}` : 'Boleto Bancário';
    const fatorVenc = parseInt(digits.slice(5, 9), 10);
    if (fatorVenc > 0) {
      const baseDate = new Date(1997, 9, 7);
      baseDate.setDate(baseDate.getDate() + fatorVenc);
      dueDate = baseDate.toISOString().split('T')[0];
    }
    const valorCentavos = parseInt(digits.slice(9, 19), 10);
    if (valorCentavos > 0) {
      amount = valorCentavos / 100;
    }
  }

  return {
    codeType: 'boleto',
    extractedTitle: bankName,
    suggestedAmount: amount,
    suggestedDate: dueDate,
    suggestedCategory: type === 'tributo' ? 'Moradia' : 'Serviços',
    suggestedPaymentMethod: 'boleto',
    suggestedType: 'expense',
    extraDetails: {
      'Linha Digitável': digits,
      'Tipo': type === 'tributo' ? 'Concessionária / Água / Luz / Tributo' : 'Boleto Bancário Febraban',
      ...(bankCode ? { 'Código do Banco': bankCode } : {}),
      ...(dueDate ? { 'Vencimento Calculado': dueDate } : {}),
    },
  };
}

/**
 * Parses Brazilian NFC-e / Cupom Fiscal QR Code
 * SEFAZ standard links contain:
 * ?p=CHAVE_44_DIGITOS|2|1|1|HASH
 * or ?chNFe=...&vNF=142.50&...
 */
function parseNFCeQrCode(url: string): Partial<ParsedCodeResult> | null {
  if (!url.toLowerCase().includes('nfce') && !url.toLowerCase().includes('sefaz') && !url.toLowerCase().includes('fazenda') && !url.includes('p=')) {
    return null;
  }

  let amount: number | null = null;
  let chNFe = '';
  let dateStr: string | null = null;
  let state = 'SEFAZ';

  // Check state from domain
  const stateMatch = url.match(/sefaz\.([a-z]{2})\.gov\.br|fazenda\.([a-z]{2})\.gov\.br/i);
  if (stateMatch) {
    state = (stateMatch[1] || stateMatch[2] || '').toUpperCase();
  }

  // Check vNF parameter if directly exposed
  const vNFMatch = url.match(/[?&]vNF=([0-9.]+)/i);
  if (vNFMatch) {
    amount = parseFloat(vNFMatch[1]);
  }

  // Check chNFe parameter
  const chMatch = url.match(/[?&]chNFe=([0-9]{44})/i);
  if (chMatch) {
    chNFe = chMatch[1];
  }

  // Check ?p= parameter format
  const pParam = url.match(/[?&]p=([^&]+)/i);
  if (pParam) {
    const rawP = decodeURIComponent(pParam[1]);
    const parts = rawP.split('|');
    if (parts.length > 0 && parts[0].length >= 44) {
      chNFe = parts[0].slice(0, 44);
    }
    // Some states put value in later tokens (e.g. parts[2] or parts[3] or parts[4])
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (/^\d+\.\d{2}$/.test(part)) {
        amount = parseFloat(part);
        break;
      }
    }
  }

  // If chNFe has 44 digits:
  // Positions 2-4: YYMM of emission
  // Positions 6-19: CNPJ of the merchant
  let cnpj = '';
  if (chNFe.length === 44) {
    const year = '20' + chNFe.slice(2, 4);
    const month = chNFe.slice(4, 6);
    dateStr = `${year}-${month}-01`;
    cnpj = chNFe.slice(6, 20);
  }

  return {
    codeType: 'danfe_nfce',
    extractedTitle: `Cupom Fiscal NFC-e (${state})`,
    suggestedAmount: amount,
    suggestedDate: dateStr,
    suggestedCategory: 'Supermercado',
    suggestedPaymentMethod: 'credit',
    suggestedType: 'expense',
    extraDetails: {
      'Documento': 'Nota Fiscal do Consumidor Eletrônica',
      'Estado SEFAZ': state,
      ...(chNFe ? { 'Chave de Acesso': chNFe } : {}),
      ...(cnpj ? { 'CNPJ Emissor': cnpj } : {}),
      'URL SEFAZ': url,
    },
  };
}

/**
 * Parses EAN-13 / UPC Product Barcodes
 */
function parseProductBarcode(digitsRaw: string): Partial<ParsedCodeResult> | null {
  const digits = digitsRaw.replace(/[^\d]/g, '');
  if (digits.length !== 8 && digits.length !== 12 && digits.length !== 13 && digits.length !== 14) {
    return null;
  }

  const known = KNOWN_EAN13_PRODUCTS[digits];
  if (known) {
    return {
      codeType: 'ean13',
      extractedTitle: known.name,
      suggestedAmount: known.estPrice,
      suggestedCategory: known.category,
      suggestedPaymentMethod: 'debit',
      suggestedType: 'expense',
      extraDetails: {
        'Tipo de Código': 'Código de Barras EAN-13',
        'Código de Barras': digits,
        'Produto Reconhecido': known.name,
      },
    };
  }

  // Brazilian prefixes 789 or 790
  const isBrazilian = digits.startsWith('789') || digits.startsWith('790');
  return {
    codeType: 'ean13',
    extractedTitle: isBrazilian ? `Produto Nacional (${digits})` : `Item Código de Barras (${digits})`,
    suggestedAmount: null,
    suggestedCategory: 'Supermercado',
    suggestedPaymentMethod: 'credit',
    suggestedType: 'expense',
    extraDetails: {
      'Código de Barras': digits,
      'Origem': isBrazilian ? 'Brasil (Prefixo GS1 789/790)' : 'Internacional',
    },
  };
}

/**
 * Master parser for any decoded Barcode or QR Code
 */
export function parseScannedCode(rawText: string, format = 'UNKNOWN'): ParsedCodeResult {
  const trimmed = rawText.trim();

  // 1. Try NFC-e URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const nfce = parseNFCeQrCode(trimmed);
    if (nfce) {
      return {
        raw: trimmed,
        format,
        codeType: 'danfe_nfce',
        extractedTitle: nfce.extractedTitle || 'Cupom Fiscal NFC-e',
        suggestedAmount: nfce.suggestedAmount ?? null,
        suggestedCategory: nfce.suggestedCategory || 'Supermercado',
        suggestedDate: nfce.suggestedDate || new Date().toISOString().split('T')[0],
        suggestedPaymentMethod: nfce.suggestedPaymentMethod || 'credit',
        suggestedType: nfce.suggestedType || 'expense',
        extraDetails: nfce.extraDetails || {},
      };
    }
  }

  // 2. Try PIX QR Code
  const pix = parsePixPayload(trimmed);
  if (pix) {
    return {
      raw: trimmed,
      format,
      codeType: 'pix',
      extractedTitle: pix.extractedTitle || 'Pagamento PIX',
      suggestedAmount: pix.suggestedAmount ?? null,
      suggestedCategory: pix.suggestedCategory || 'Serviços',
      suggestedDate: new Date().toISOString().split('T')[0],
      suggestedPaymentMethod: 'pix',
      suggestedType: 'expense',
      extraDetails: pix.extraDetails || {},
    };
  }

  // 3. Try Boleto Bancário
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (digitsOnly.length === 44 || digitsOnly.length === 47 || digitsOnly.length === 48) {
    const boleto = parseBoleto(trimmed);
    if (boleto) {
      return {
        raw: trimmed,
        format,
        codeType: 'boleto',
        extractedTitle: boleto.extractedTitle || 'Boleto Bancário',
        suggestedAmount: boleto.suggestedAmount ?? null,
        suggestedCategory: boleto.suggestedCategory || 'Moradia',
        suggestedDate: boleto.suggestedDate || new Date().toISOString().split('T')[0],
        suggestedPaymentMethod: 'boleto',
        suggestedType: 'expense',
        extraDetails: boleto.extraDetails || {},
      };
    }
  }

  // 4. Try EAN-13 Product Barcode
  if (digitsOnly.length >= 8 && digitsOnly.length <= 14) {
    const prod = parseProductBarcode(trimmed);
    if (prod) {
      return {
        raw: trimmed,
        format,
        codeType: 'ean13',
        extractedTitle: prod.extractedTitle || `Produto (${digitsOnly})`,
        suggestedAmount: prod.suggestedAmount ?? null,
        suggestedCategory: prod.suggestedCategory || 'Supermercado',
        suggestedDate: new Date().toISOString().split('T')[0],
        suggestedPaymentMethod: prod.suggestedPaymentMethod || 'credit',
        suggestedType: 'expense',
        extraDetails: prod.extraDetails || {},
      };
    }
  }

  // 5. Fallback generic text
  return {
    raw: trimmed,
    format,
    codeType: 'text',
    extractedTitle: trimmed.length > 40 ? trimmed.slice(0, 37) + '...' : trimmed,
    suggestedAmount: null,
    suggestedCategory: 'Outros',
    suggestedDate: new Date().toISOString().split('T')[0],
    suggestedPaymentMethod: 'credit',
    suggestedType: 'expense',
    extraDetails: {
      'Conteúdo Lido': trimmed,
      'Formato': format,
    },
  };
}
