import React from 'react';

export default function LineDetail({ line }) {
  if (!line) return null;

  // Group transactions by YYYY-MM
  const grouped = {};
  line.history.forEach(tx => {
    const month = tx.date.slice(0, 7); // assume YYYY-MM-DD
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(tx);
  });

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Line Detail: {line.customerName} ({line.status})</h2>
      {Object.entries(grouped).map(([month, txs]) => (
        <div key={month} className="mb-4">
          <details className="border rounded p-2 bg-gray-50">
            <summary className="font-medium cursor-pointer">{month} ({txs.length} records)</summary>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr>
                  <th className="text-left p-1">Date</th>
                  <th className="text-left p-1">Description</th>
                  <th className="text-right p-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx, idx) => (
                  <tr key={idx}>
                    <td className="p-1">{tx.date}</td>
                    <td className="p-1">{tx.description}</td>
                    <td className="p-1 text-right">${tx.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      ))}
    </div>
  );
}
