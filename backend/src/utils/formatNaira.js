/** Format amounts as Nigerian Naira with thousands separators (en-NG). */
function formatNaira(amount) {
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(n)) return '₦0.00';
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

module.exports = { formatNaira };
