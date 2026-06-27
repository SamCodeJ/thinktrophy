/** Nigerian Naira with thousands separators */
export function formatNaira(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '₦0.00';
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Compact ₦ for chart axes (no decimals) */
export function formatNairaAxis(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₦0';
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

/** Whole naira with grouping (tooltips where decimals are not needed) */
export function formatNairaShort(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '₦0';
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}
