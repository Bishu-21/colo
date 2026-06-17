import React from "react";
import { getLedgerHistory } from "@/lib/ledger";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const allTransactions = await getLedgerHistory();
  const transactions = allTransactions.reverse(); // Show newest first

  return (
    <main className="pt-24 px-container-padding max-w-[1440px] mx-auto space-y-8 pb-16">
      {/* Header Info */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-carbon pb-4 gap-4">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase flex items-center gap-2">
            <span className="w-2 h-6 bg-primary"></span>
            [FINANCIAL_LEDGER_AUDIT]
          </h1>
          <p className="font-body-md text-secondary italic mt-1">
            *Append-only double-entry cryptographic financial logs.*
          </p>
        </div>
        <Link href="/billing" className="font-metadata text-metadata uppercase px-6 py-2 bg-carbon text-white rounded-full hover:bg-muted-teal transition-all inline-block text-center">
          [RETURN_TO_BILLING]
        </Link>
      </section>

      {/* Main Ledger Table */}
      <section className="border border-carbon bg-white overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-carbon text-white font-metadata text-metadata uppercase border-b border-carbon">
                <th className="p-4 border-r border-outline">TX_ID</th>
                <th className="p-4 border-r border-outline">TIMESTAMP</th>
                <th className="p-4 border-r border-outline">DESCRIPTION</th>
                <th className="p-4 border-r border-outline">BASE_COST</th>
                <th className="p-4 border-r border-outline">TAX (GST 18%)</th>
                <th className="p-4 border-r border-outline">TOTAL</th>
                <th className="p-4 border-r border-outline">PG_REF</th>
                <th className="p-4">BLOCK_LINK_HASH</th>
              </tr>
            </thead>
            <tbody className="font-body-md divide-y divide-carbon">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-secondary uppercase font-metadata">
                    [NO_TRANSACTION_RECORDS_FOUND]
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface-container-low transition-colors group cursor-crosshair">
                    <td className="p-4 border-r border-carbon font-bold text-carbon">{tx.id}</td>
                    <td className="p-4 border-r border-carbon font-metadata text-[11px]">
                      {new Date(tx.timestamp).toLocaleString("en-IN", { timeZone: "IST" })}
                    </td>
                    <td className="p-4 border-r border-carbon font-bold text-primary">{tx.description}</td>
                    <td className="p-4 border-r border-carbon">₹{tx.amount.toFixed(2)}</td>
                    <td className="p-4 border-r border-carbon">₹{tx.tax.toFixed(2)}</td>
                    <td className="p-4 border-r border-carbon font-bold">₹{tx.total.toFixed(2)}</td>
                    <td className="p-4 border-r border-carbon font-metadata text-[11px] text-secondary">
                      {tx.externalRef}
                    </td>
                    <td className="p-4 font-metadata text-[9px] text-secondary max-w-xs truncate" title={tx.hash}>
                      {tx.hash.substring(0, 16)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Block Info */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-carbon bg-white p-6">
          <h3 className="font-label-bold text-label-bold uppercase mb-2">LEDGER_INTEGRITY</h3>
          <p className="font-body-md text-secondary">
            Each entry is SHA-256 encrypted and chained to the previous record hash. Any administrative tampering in the storage block immediately invalidates the ledger chain.
          </p>
        </div>
        <div className="border border-carbon bg-white p-6">
          <h3 className="font-label-bold text-label-bold uppercase mb-2">TAX_COMPLIANCE</h3>
          <p className="font-body-md text-secondary">
            Invoices are formatted in alignment with Central GST rules. All operations are cataloged for automated quarterly tax filings.
          </p>
        </div>
        <div className="border border-carbon bg-white p-6 flex flex-col justify-between">
          <h3 className="font-label-bold text-label-bold uppercase mb-2">AUDIT_STATUS</h3>
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined">verified</span>
            <span className="font-metadata text-metadata">LEDGER_CHAIN_SECURE</span>
          </div>
        </div>
      </section>
    </main>
  );
}
