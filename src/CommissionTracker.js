import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import dayjs from "dayjs";

export default function CommissionTracker() {
  const [csvFile, setCsvFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [linesData, setLinesData] = useState({});
  const [selectedLine, setSelectedLine] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const storedData = localStorage.getItem("commissionTrackerLines");
    if (storedData) {
      setLinesData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("commissionTrackerLines", JSON.stringify(linesData));
  }, [linesData]);

  const handleFileUpload = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const parseCSV = () => {
    if (!csvFile) return;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const updatedLines = { ...linesData };

        for (let row of data) {
          const serviceNumber = row.ServiceNumber.trim();
          const partnerComp = parseFloat(row["Partner Comp"].replace(/[$,]/g, ""));

          const transaction = {
            amount: partnerComp,
            type: row.ActivityType,
            description: row.ProdCatDescription || "",
            date: row.TRN_DATE,
          };

          if (!updatedLines[serviceNumber]) {
            updatedLines[serviceNumber] = {
              customerName: row["Customer Name"],
              plan: row.ActivityType === "ACT" ? row.ProdCatDescription : "",
              status: row.ActivityType === "DEACT" ? "Inactive" : "Active",
              activationDate: row.TRN_DATE,
              history: [transaction],
            };
          } else {
            updatedLines[serviceNumber].history.push(transaction);
          }
        }

        setLinesData(updatedLines);
        setUploadSuccess(true);
      },
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(linesData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "commission_data.json";
    link.click();
  };

  const exportToCSV = () => {
    const rows = [];
    for (const [mdn, line] of Object.entries(linesData)) {
      line.history.forEach((tx) => {
        rows.push({
          ServiceNumber: mdn,
          CustomerName: line.customerName,
          Plan: line.plan,
          Status: line.status,
          ActivationDate: line.activationDate,
          TransactionDate: tx.date,
          Type: tx.type,
          Description: tx.description,
          Amount: tx.amount,
        });
      });
    }
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "commission_data.csv";
    link.click();
  };

  const clearData = () => {
    if (window.confirm("Are you sure you want to clear all saved data?")) {
      localStorage.removeItem("commissionTrackerLines");
      setLinesData({});
      setSelectedLine(null);
      setUploadSuccess(false);
    }
  };

  const filteredLines = Object.entries(linesData).filter(([mdn]) =>
    mdn.includes(searchQuery)
  );

  const getKPIs = () => {
    let upfront = 0,
      monthly = 0,
      chargeback = 0;
    let activeLines = 0;

    Object.values(linesData).forEach((line) => {
      if (line.status === "Active") activeLines++;
      line.history.forEach((tx) => {
        if (tx.type === "ACT") upfront += tx.amount;
        else if (tx.type === "RESIDUAL") monthly += tx.amount;
        else if (tx.type === "DEACT") chargeback += tx.amount;
      });
    });
    return { upfront, monthly, chargeback, activeLines };
  };

  const { upfront, monthly, chargeback, activeLines } = getKPIs();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Wireless Commission Tracker</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input type="file" accept=".csv" onChange={handleFileUpload} />
          <Button className="mt-2 mr-2" onClick={parseCSV} disabled={!csvFile}>Upload Report</Button>
          <Button className="mt-2 mr-2" onClick={exportToJSON}>Export JSON</Button>
          <Button className="mt-2 mr-2" onClick={exportToCSV}>Export CSV</Button>
          <Button className="mt-2" variant="destructive" onClick={clearData}>Clear All Data</Button>
          {uploadSuccess && <p className="text-green-600 mt-2">Report uploaded successfully!</p>}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><strong>Total Upfront:</strong><br/>${upfront.toFixed(2)}</div>
          <div><strong>Total Monthly:</strong><br/>${monthly.toFixed(2)}</div>
          <div><strong>Total Chargebacks:</strong><br/>${chargeback.toFixed(2)}</div>
          <div><strong>Active Lines:</strong><br/>{activeLines}</div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-2">All Lines</h2>
          <Input
            className="mb-2"
            placeholder="Search by phone number (MDN)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <table className="table-auto w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">MDN</th>
                <th className="px-2 py-1 border">Customer</th>
                <th className="px-2 py-1 border">Plan</th>
                <th className="px-2 py-1 border">Status</th>
                <th className="px-2 py-1 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map(([mdn, line]) => (
                <tr key={mdn}>
                  <td className="border px-2 py-1">{mdn}</td>
                  <td className="border px-2 py-1">{line.customerName}</td>
                  <td className="border px-2 py-1">{line.plan}</td>
                  <td className="border px-2 py-1">{line.status}</td>
                  <td className="border px-2 py-1">
                    <Button onClick={() => setSelectedLine({ mdn, ...line })} size="sm">Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedLine && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Line Detail: {selectedLine.mdn}</h2>
            <p><strong>Customer:</strong> {selectedLine.customerName}</p>
            <p><strong>Plan:</strong> {selectedLine.plan}</p>
            <p><strong>Status:</strong> {selectedLine.status}</p>
            <p><strong>Activation Date:</strong> {selectedLine.activationDate}</p>

            <h3 className="text-lg font-semibold mt-4">Monthly Activity</h3>
            {Object.entries(
              selectedLine.history.reduce((acc, tx) => {
                const month = dayjs(tx.date).format("MMMM YYYY");
                acc[month] = acc[month] || [];
                acc[month].push(tx);
                return acc;
              }, {})
            ).map(([month, txns]) => (
              <div key={month} className="mb-4">
                <h4 className="font-semibold mt-2">{month} (${txns.reduce((s, t) => s + t.amount, 0).toFixed(2)})</h4>
                <table className="table-auto w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 border">Date</th>
                      <th className="px-2 py-1 border">Type</th>
                      <th className="px-2 py-1 border">Description</th>
                      <th className="px-2 py-1 border">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((tx, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{tx.date}</td>
                        <td className="border px-2 py-1">{tx.type}</td>
                        <td className="border px-2 py-1">{tx.description}</td>
                        <td className="border px-2 py-1">${tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            <Button className="mt-4" onClick={() => setSelectedLine(null)}>Back to All Lines</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
