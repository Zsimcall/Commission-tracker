import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import html2pdf from "html2pdf.js";
import Dashboard from "./Dashboard";
import AllLines from "./AllLines";
import LineDetail from "./LineDetail";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

export default function CommissionTracker() {
  const [csvFile, setCsvFile] = useState(null);
  const [linesData, setLinesData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMdn, setSelectedMdn] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    async function fetchLines() {
      const snapshot = await getDocs(collection(db, "lines"));
      const data = {};
      snapshot.forEach((docSnap) => {
        data[docSnap.id] = docSnap.data();
      });
      setLinesData(data);
    }
    fetchLines();
  }, []);

  const parseCSV = () => {
    if (!csvFile) return;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
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

        for (const [mdn, line] of Object.entries(updatedLines)) {
          await setDoc(doc(db, "lines", mdn), line);
        }

        setLinesData(updatedLines);
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

  const getMonthlyData = () => {
    const months = {};
    Object.values(linesData).forEach((line) => {
      line.history.forEach((tx) => {
        const m = tx.date.slice(0, 7); // YYYY-MM
        if (!months[m]) months[m] = { upfront: 0, monthly: 0 };
        if (tx.type === "ACT") months[m].upfront += tx.amount;
        if (tx.type === "RESIDUAL") months[m].monthly += tx.amount;
      });
    });
    return Object.entries(months).map(([month, values]) => ({ month, ...values }));
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
  const monthlyData = getMonthlyData();

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">Wireless Commission Tracker</h1>

      <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="mb-2" />
      <button onClick={parseCSV} className="bg-blue-600 text-white px-4 py-1 rounded mr-2">Upload</button>
      <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-1 rounded mr-2">Export CSV</button>
      <button onClick={handleDownloadPDF} className="bg-purple-600 text-white px-4 py-1 rounded mr-2">Download PDF</button>

      <Dashboard summary={{ upfront, monthly, chargeback, activeLines }} monthly={monthlyData} />

      {selectedMdn ? (
        <div>
          <button className="text-blue-600 underline mb-2" onClick={() => setSelectedMdn(null)}>Back to all lines</button>
          <LineDetail line={linesData[selectedMdn]} />
        </div>
      ) : (
        <AllLines
          lines={linesData}
          onSelect={setSelectedMdn}
          search={searchQuery}
          setSearch={setSearchQuery}
        />
      )}
    </div>
  );
}
