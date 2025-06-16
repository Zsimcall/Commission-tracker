import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";

export default function CommissionTracker() {
  const [csvFile, setCsvFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [linesData, setLinesData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef();

  useEffect(() => {
    const storedData = localStorage.getItem("commissionTrackerLines");
    if (storedData) setLinesData(JSON.parse(storedData));
  }, []);

  useEffect(() => {
    localStorage.setItem("commissionTrackerLines", JSON.stringify(linesData));
  }, [linesData]);

  const parseCSV = () => {
    if (!csvFile) return;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const updatedLines = { ...linesData };

        for (let row of data) {
          const serviceNumber = row.ServiceNumber?.trim();
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

  const getKPIs = () => {
    let upfront = 0, monthly = 0, chargeback = 0, activeLines = 0;
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

  const handleDownloadPDF = () => {
    if (printRef.current) {
      html2pdf().set({
        margin: 0.5,
        filename: "commission_report.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      }).from(printRef.current).save();
    }
  };

  const { upfront, monthly, chargeback, activeLines } = getKPIs();

  const filteredLines = Object.entries(linesData).filter(([mdn]) =>
    mdn.includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Wireless Commission Tracker</h1>

      <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="mb-2" />
      <button onClick={parseCSV} className="bg-blue-600 text-white px-4 py-1 rounded mr-2">Upload</button>
      <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-1 rounded mr-2">Export CSV</button>
      <button onClick={handleDownloadPDF} className="bg-purple-600 text-white px-4 py-1 rounded mr-2">Download PDF</button>

      <div className="my-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded shadow">
        <div><strong>Upfront:</strong><br/>${upfront.toFixed(2)}</div>
        <div><strong>Monthly:</strong><br/>${monthly.toFixed(2)}</div>
        <div><strong>Chargebacks:</strong><br/>${chargeback.toFixed(2)}</div>
        <div><strong>Active Lines:</strong><br/>{activeLines}</div>
      </div>

      <input type="text" placeholder="Search MDN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border rounded px-2 py-1 mb-2" />

      <div ref={printRef}>
        <table className="w-full table-auto text-sm bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">MDN</th>
              <th className="p-2 border">Customer</th>
              <th className="p-2 border">Plan</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">History Count</th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.map(([mdn, line]) => (
              <tr key={mdn}>
                <td className="p-2 border">{mdn}</td>
                <td className="p-2 border">{line.customerName}</td>
                <td className="p-2 border">{line.plan}</td>
                <td className="p-2 border">{line.status}</td>
                <td className="p-2 border">{line.history.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
