"use client";

import React, { useEffect, useState } from "react";
import { getFilesFromVault, deleteFileFromVault, VaultFile } from "@/utils/fileVault";
import { showToast } from "@/utils/toast";

interface SandboxVaultProps {
  onLoadFileAction: (file: File) => void;
  activeFileNames?: string[];
}

export default function SandboxVault({ onLoadFileAction, activeFileNames = [] }: SandboxVaultProps) {
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quotaText, setQuotaText] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const updateQuota = async () => {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMb = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
        const quotaGb = ((estimate.quota || 0) / (1024 * 1024 * 1024)).toFixed(1);
        setQuotaText(`(${usageMb} MB / ${quotaGb} GB)`);
      } catch (err) {
        console.error("Quota estimation failed:", err);
      }
    }
  };

  useEffect(() => {
    getFilesFromVault()
      .then(setVaultFiles)
      .catch(err => console.error("Vault load error:", err));
  }, [refreshKey]);

  useEffect(() => {
    const handleVaultChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener("morpee_vault_changed", handleVaultChange);
    return () => window.removeEventListener("morpee_vault_changed", handleVaultChange);
  }, []);

  useEffect(() => {
    updateQuota();
  }, [vaultFiles]);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
    window.dispatchEvent(new Event("morpee_vault_changed"));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingDeleteId === id) {
      // Already confirmed, execute
      try {
        await deleteFileFromVault(id);
        triggerRefresh();
        showToast("File removed from vault.", "success");
      } catch (err) {
        console.error(err);
        showToast("Failed to delete file.", "error");
      }
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(id);
    }
  };

  const handleSelect = (vf: VaultFile) => {
    const blob = new Blob([vf.data], { type: vf.type });
    const file = new File([blob], vf.name, { type: vf.type });
    onLoadFileAction(file);
  };

  const handleSendToTool = (vf: VaultFile, targetPath: string) => {
    sessionStorage.setItem("morpee_autoload_vault_id", vf.id);
    window.location.href = targetPath;
  };

  const handleExport = async () => {
    try {
      const files = await getFilesFromVault();
      const exportList = await Promise.all(
        files.map(async (f) => {
          // Convert ArrayBuffer to Base64 in chunks to avoid stack overflow on huge files
          const uintArray = new Uint8Array(f.data);
          let binary = "";
          const chunk = 8192;
          for (let i = 0; i < uintArray.length; i += chunk) {
            binary += String.fromCharCode.apply(null, uintArray.subarray(i, i + chunk) as unknown as number[]);
          }
          const base64 = btoa(binary);
          return {
            name: f.name,
            type: f.type,
            size: f.size,
            timestamp: f.timestamp,
            data: base64,
          };
        })
      );
      const json = JSON.stringify(exportList, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `morpee_sandbox_vault_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Failed to export vault backup.", "error");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("Invalid backup format");
        
        const { initDb } = await import("@/utils/fileVault");
        const db = await initDb();
        
        for (const item of parsed) {
          if (!item.name || !item.data) continue;
          
          const binaryString = atob(item.data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const vaultFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: item.name,
            type: item.type || "",
            size: item.size || bytes.byteLength,
            data: bytes.buffer,
            timestamp: item.timestamp || Date.now(),
          };
          
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction("files", "readwrite");
            const store = transaction.objectStore("files");
            const request = store.put(vaultFile);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
        }
        
        showToast("Success: Sandbox vault restored from backup!", "success");
        window.dispatchEvent(new Event("morpee_vault_changed"));
      } catch (err) {
        console.error("Import failed:", err);
        showToast("Failed to restore vault backup. Verify file format is correct.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    try {
      const { initDb } = await import("@/utils/fileVault");
      const db = await initDb();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("files", "readwrite");
        const store = transaction.objectStore("files");
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      window.dispatchEvent(new Event("morpee_vault_changed"));
      showToast("Sandbox vault cleared.", "success");
    } catch (err) {
      console.error("Clear vault failed:", err);
      showToast("Failed to clear vault.", "error");
    }
    setConfirmClearAll(false);
  };

  if (vaultFiles.length === 0) {
    return (
      <div className="space-y-3 pt-4 border-t border-carbon/15">
        <div className="flex flex-col gap-2 border-b border-carbon/15 pb-2">
          <div className="flex justify-between items-center">
            <h4 className="font-label-bold text-label-bold uppercase text-carbon text-xs">
              Local Sandbox Vault <span className="font-metadata text-[9px] lowercase text-secondary font-normal">{quotaText}</span>
            </h4>
            <div className="flex gap-1.5">
              <label className="px-1.5 py-0.5 border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-carbon hover:text-white cursor-pointer select-none">
                [Restore]
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>
        </div>
        <div className="border border-carbon/15 p-4 text-center text-secondary font-metadata text-[10px] uppercase bg-white/40">
          Local Sandbox Vault is empty
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4 border-t border-carbon/15">
      <div className="flex flex-col gap-2 border-b border-carbon/15 pb-2">
        <div className="flex justify-between items-center">
          <h4 className="font-label-bold text-label-bold uppercase text-carbon text-xs">
            Local Sandbox Vault <span className="font-metadata text-[9px] lowercase text-secondary font-normal">{quotaText}</span>
          </h4>
          <div className="flex gap-1.5">
            <button
              onClick={handleExport}
              className="px-1.5 py-0.5 border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-carbon hover:text-white"
              title="Backup vault"
            >
              [Backup]
            </button>
            <label className="px-1.5 py-0.5 border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-carbon hover:text-white cursor-pointer select-none">
              [Restore]
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={confirmClearAll ? handleClearAll : () => setConfirmClearAll(true)}
              className={`px-1.5 py-0.5 border rounded-[2px] font-metadata text-[8px] uppercase ${confirmClearAll ? "bg-error text-white border-error" : "border-error/20 text-error hover:bg-error hover:text-white"}`}
              title="Purge vault"
            >
              {confirmClearAll ? "[Confirm Clear]" : "[Clear]"}
            </button>
            {confirmClearAll && (
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-1.5 py-0.5 border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-carbon hover:text-white"
              >
                [Cancel]
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
        {vaultFiles.map(vf => {
          const isActive = activeFileNames.includes(vf.name);
          return (
            <div
              key={vf.id}
              onClick={() => handleSelect(vf)}
              className={`p-2.5 border transition-all text-left cursor-pointer flex flex-col justify-between gap-1.5 ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-carbon/10 hover:border-carbon bg-white"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="truncate flex-grow">
                  <div className="font-label-bold text-[11px] truncate uppercase text-carbon">
                    {vf.name}
                  </div>
                  <div className="font-metadata text-[9px] text-secondary">
                    {(vf.size / 1024).toFixed(1)} KB // {vf.type || "BINARY"}
                  </div>
                </div>
                {pendingDeleteId === vf.id ? (
                  <span className="flex gap-1">
                    <button
                      onClick={(e) => handleDelete(vf.id, e)}
                      className="text-white bg-error px-1 py-0.5 rounded text-[9px] font-metadata uppercase"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDeleteId(null); }}
                      className="text-secondary hover:text-carbon text-[9px] font-metadata uppercase"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={(e) => handleDelete(vf.id, e)}
                    className="text-error hover:text-red-800 text-[10px] font-metadata uppercase"
                    title="Delete from local vault"
                  >
                    [Del]
                  </button>
                )}
              </div>

              {/* Tool router pipeline shortcuts */}
              <div className="flex flex-wrap gap-1 pt-1.5 border-t border-carbon/5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelect(vf); }}
                  className="px-1.5 py-0.5 bg-carbon text-white rounded-[2px] font-metadata text-[8px] uppercase hover:bg-primary"
                >
                  [Load]
                </button>
                {vf.type === "application/pdf" ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendToTool(vf, "/workspace?tool=compress"); }}
                      className="px-1.5 py-0.5 bg-surface-container border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-primary hover:text-white"
                    >
                      [Compress]
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendToTool(vf, "/workspace?tool=watermark"); }}
                      className="px-1.5 py-0.5 bg-surface-container border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-primary hover:text-white"
                    >
                      [Watermark]
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendToTool(vf, "/workspace?tool=organize"); }}
                      className="px-1.5 py-0.5 bg-surface-container border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-primary hover:text-white"
                    >
                      [Organize]
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendToTool(vf, "/workspace?tool=image"); }}
                      className="px-1.5 py-0.5 bg-surface-container border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-primary hover:text-white"
                    >
                      [Resize/Crop]
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendToTool(vf, "/workspace?tool=images-pdf"); }}
                      className="px-1.5 py-0.5 bg-surface-container border border-carbon/10 rounded-[2px] font-metadata text-[8px] uppercase hover:bg-primary hover:text-white"
                    >
                      [To PDF]
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
