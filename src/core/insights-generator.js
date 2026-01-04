// InsightsGenerator: provides Top Movers and Timeline comparison utilities
const InsightsGenerator = {
  // transactions: array of {id, date, amount, category, account}
  // Returns top N movers by absolute amount (descending).
  topMovers(transactions, n = 5) {
    if (!Array.isArray(transactions)) return [];
    const byCategory = new Map();
    for (const tx of transactions) {
      const cat = tx.category || 'Uncategorized';
      const amt = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;
      const entry = byCategory.get(cat) || { category: cat, total: 0, count: 0 };
      entry.total += amt;
      entry.count += 1;
      byCategory.set(cat, entry);
    }
    const arr = Array.from(byCategory.values());
    arr.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    return arr.slice(0, n).map(item => ({
      category: item.category,
      total: item.total,
      count: item.count,
    }));
  },

  // Compare two time series (arrays of {period, value}) and return differences
  // currentSeries and previousSeries should be arrays sorted by period.
  // Returns array of {period, current, previous, absoluteChange, percentChange}
  timelineComparison(currentSeries, previousSeries) {
    const prevByPeriod = new Map();
    for (const p of (previousSeries || [])) {
      prevByPeriod.set(p.period, typeof p.value === 'number' ? p.value : Number(p.value) || 0);
    }
    const result = [];
    for (const cur of (currentSeries || [])) {
      const period = cur.period;
      const current = typeof cur.value === 'number' ? cur.value : Number(cur.value) || 0;
      const previous = prevByPeriod.get(period) ?? 0;
      const absoluteChange = current - previous;
      const percentChange = previous === 0 ? (current === 0 ? 0 : Infinity) : (absoluteChange / Math.abs(previous)) * 100;
      result.push({ period, current, previous, absoluteChange, percentChange });
    }
    return result;
  }
};

export { InsightsGenerator };
export default InsightsGenerator;
