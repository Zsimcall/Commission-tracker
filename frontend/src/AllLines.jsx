import React from 'react';

export default function AllLines({ lines, onSelect, search, setSearch }) {
  const filtered = Object.entries(lines).filter(([mdn]) => mdn.includes(search));

  return (
    <div className="mt-4">
      <input
        className="border rounded px-2 py-1 mb-2"
        placeholder="Search MDN"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table className="w-full table-auto text-sm bg-white shadow rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">MDN</th>
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Plan</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">History</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(([mdn, line]) => (
            <tr key={mdn}>
              <td className="p-2 border">{mdn}</td>
              <td className="p-2 border">{line.customerName}</td>
              <td className="p-2 border">{line.plan}</td>
              <td className="p-2 border">{line.status}</td>
              <td className="p-2 border text-center">{line.history.length}</td>
              <td className="p-2 border text-center">
                <button
                  className="text-blue-600 underline"
                  onClick={() => onSelect(mdn)}
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
