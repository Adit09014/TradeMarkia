"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Grid, { SheetData, Cell } from "@/components/Grid";
import { evaluateCell } from "@/lib/formula";


export default function EditorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<SheetData>({});

  const getCellValue = useCallback((col: string, row: number): string => {
    return data[`${col}${row}`]?.computed || "";
  }, [data]);

  const handleChange = useCallback((cellId: string, raw: string) => {
    const computed = raw.startsWith("=")
      ? evaluateCell(raw, getCellValue)
      : raw;

    setData((prev) => ({
      ...prev,
      [cellId]: { ...(prev[cellId] || {}), raw, computed } as Cell,
    }));
  }, [getCellValue]);

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-black">
        <span className="font-semibold text-sm">Untitled Spreadsheet</span>
        <span className="text-xs text-gray-400 ml-auto">Doc: {id}</span>
        {user && (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: user.color }}
          >
            {user.name?.[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <Grid data={data} onChange={handleChange} />
      </div>
    </div>
  );
}