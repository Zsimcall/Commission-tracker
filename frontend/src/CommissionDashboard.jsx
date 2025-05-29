import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CommissionDashboard() {
  const [summary, setSummary] = useState({ total_commission: 0, total_lines: 0, average_commission_per_line: 0 });
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/summary')
      .then(res => res.json())
      .then(data => setSummary(data));

    fetch('/lines')
      .then(res => res.json())
      .then(data => setLines(data));
  }, []);

  const filteredLines = lines.filter(line => line.phone_number.includes(search));

  return (
    <div className="p-6 grid gap-6">
      <h1 className="text-3xl font-bold">Commission Tracker</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Total Commission</h2>
            <p className="text-xl font-bold text-green-600">${summary.total_commission}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Total Lines Activated</h2>
            <p className="text-xl font-bold">{summary.total_lines}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Avg. Commission / Line</h2>
            <p className="text-xl font-bold">${summary.average_commission_per_line}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Search by Phone Number</h2>
        <div className="flex gap-2">
          <Input placeholder="e.g. 5858318715" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Line Commission Table</h2>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Phone</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Carrier</TableCell>
                <TableCell>Activation Date</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Total Commission</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>{line.phone_number}</TableCell>
                  <TableCell>{line.customer}</TableCell>
                  <TableCell>{line.carrier}</TableCell>
                  <TableCell>{line.activation_date}</TableCell>
                  <TableCell>{line.line_description}</TableCell>
                  <TableCell>${line.total_commission}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Monthly Commission Chart (Static Example)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { month: 'Jan', commission: 820 },
            { month: 'Feb', commission: 1340 },
            { month: 'Mar', commission: 910 },
            { month: 'Apr', commission: 1600 },
          ]}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="commission" fill="#4ade80" name="Commission ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
