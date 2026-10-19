"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { ActivityLog, MenuItem } from "@/lib/kitchen/types";

interface RecordsDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  log: ActivityLog | null;
  menu: MenuItem[];
  isDeleting: boolean;
}

export const RecordsDeleteConfirmModal: React.FC<RecordsDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  log,
  menu,
  isDeleting,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const dish = menu.find((item) => item.id === log.menu_item_id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 bg-forest-dark/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-line-light shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h3 id="delete-dialog-title" className="text-base font-black text-ink">
              Delete Meal Service Record?
            </h3>
            <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
              Are you sure you want to delete the record for{" "}
              <strong className="text-ink">{dish?.name || "this dish"}</strong> on{" "}
              <strong className="text-ink">{log.service_date}</strong> (
              <span className="capitalize">{log.meal_service}</span>)? This action cannot be
              undone.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-canvas border border-line-light text-xs font-semibold text-ink flex items-center justify-around">
            <span>
              Cooked: <strong>{log.prepared}</strong>
            </span>
            <span>
              Served: <strong>{log.served}</strong>
            </span>
            <span>
              Leftover: <strong>{log.leftover}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl border border-line-light bg-white text-xs font-bold text-ink hover:bg-canvas transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{isDeleting ? "Deleting..." : "Delete Record"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
