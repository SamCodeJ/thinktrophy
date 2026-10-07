function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

const DEFAULT_DEPOSIT_FEE_RATE = 0.0015;

function depositFeeRate(rate) {
  if (rate == null || rate === '') return DEFAULT_DEPOSIT_FEE_RATE;
  const parsed = Number(rate);
  return Number.isFinite(parsed) ? parsed : DEFAULT_DEPOSIT_FEE_RATE;
}

/** Flutterwave collection fee. The user is still credited the full deposit. */
function depositCollectionFee(amount, rate) {
  const gross = roundMoney(amount);
  const feeRate = depositFeeRate(rate);
  if (!(gross > 0) || !(feeRate > 0)) return 0;
  const fee = roundMoney(gross * feeRate);
  if (!(fee > 0) || fee >= gross) return 0;
  return fee;
}

/**
 * How a settled stake is split.
 * 10/10 (gross > stake): expense is only the profit above the stake.
 * 9/10 (0 < gross < stake): the unreturned part is forfeited-stake revenue.
 * Loss (gross = 0): the whole stake is forfeited-stake revenue.
 * The stake itself is released from Stakes Held in Play and is not income.
 */
function settlementLegs({ stake, grossPayout = 0, taxAmount = 0, netAmount = 0 } = {}) {
  const stakeAmount = roundMoney(stake);
  const gross = roundMoney(grossPayout);
  const tax = roundMoney(taxAmount);
  const net = roundMoney(netAmount);
  const winningsExpense = gross > stakeAmount ? roundMoney(gross - stakeAmount) : 0;
  const forfeitedRevenue = gross < stakeAmount ? roundMoney(stakeAmount - gross) : 0;
  const debit = roundMoney(stakeAmount + winningsExpense);
  const credit = roundMoney(net + tax + forfeitedRevenue);
  return {
    stakeAmount,
    gross,
    tax,
    net,
    winningsExpense,
    forfeitedRevenue,
    balanced: Math.abs(debit - credit) < 0.001,
  };
}

/** 10% of the first taxable win: profit on 10/10, amount returned on 9/10. */
function computeReferralBonus(taxableWinnings, rate) {
  const base = roundMoney(taxableWinnings);
  const share = Number(rate);
  if (!(base > 0) || !(share > 0)) return 0;
  return roundMoney(base * share);
}

module.exports = {
  roundMoney,
  DEFAULT_DEPOSIT_FEE_RATE,
  depositFeeRate,
  depositCollectionFee,
  settlementLegs,
  computeReferralBonus,
};
