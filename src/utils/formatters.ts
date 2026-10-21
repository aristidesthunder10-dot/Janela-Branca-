export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactBRL(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  }
  if (Math.abs(value) >= 10_000) {
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  }
  return formatBRL(value);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }
  return dateStr;
}

export function formatDateLongBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
  return dateStr;
}

export function getMonthNameBR(monthKey: string): string {
  // monthKey: YYYY-MM
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const date = new Date(year, month, 1);
    const str = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return monthKey;
}

export function parseSafeFloat(input: string): number {
  if (!input) return 0;
  // If user typed formula like 25.50 + 10 or 25,50 + 10
  const sanitized = input.replace(/\s+/g, '').replace(',', '.');
  try {
    // Only allow digits, dot, +, -, *, /, (, )
    if (/^[0-9+\-*/.()]+$/.test(sanitized)) {
      // Safe math evaluation without eval()
      const tokens = sanitized.match(/(\d+(\.\d+)?|[+\-*/()])/g);
      if (!tokens) return 0;
      // Simple evaluator
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${sanitized})`)();
      return typeof result === 'number' && !isNaN(result) ? Math.max(0, result) : 0;
    }
  } catch {
    // fallback
  }
  const clean = input.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
