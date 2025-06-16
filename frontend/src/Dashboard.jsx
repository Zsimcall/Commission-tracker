import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ summary, monthly }) {
  return (
    <div className="my-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-2 bg-white rounded shadow text-center">
          <div className="text-sm">Total Upfront</div>
          <div className="font-bold">${summary.upfront.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-white rounded shadow text-center">
          <div className="text-sm">Total Monthly</div>
          <div className="font-bold">${summary.monthly.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-white rounded shadow text-center">
          <div className="text-sm">Chargebacks</div>
          <div className="font-bold">${summary.chargeback.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-white rounded shadow text-center">
          <div className="text-sm">Active Lines</div>
          <div className="font-bold">{summary.activeLines}</div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Monthly Summary</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthly}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="upfront" fill="#38bdf8" name="Upfront" />
            <Bar dataKey="monthly" fill="#4ade80" name="Monthly" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
