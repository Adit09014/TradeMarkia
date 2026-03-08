"use client";

import { useState, useCallback, useRef } from "react";

const COLS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const ROWS = Array.from({ length: 50 }, (_, i) => i + 1);

export interface Cell{
    raw: string;
    computed: string;
    bold?: boolean;
    italic?: boolean;
    color?: string;
}

export type SheetData=Record<string,Cell>;



export interface GridProps{
    data: SheetData,
    onChange: (cellId: string, raw: string) => void;
    onFormat: (cellId: string, format: Partial<Cell>) => void;
    onExport: () => void;
}



export default function Grid({ data, onChange,onFormat,onExport }: GridProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const getCellId = (col: string, row: number) => `${col}${row}`;

  const startEdit = useCallback((cellId: string) => {
    setEditingCell(cellId);
    setEditValue(data[cellId]?.raw || "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [data]);

  const commitEdit = useCallback((cellId: string) => {
    onChange(cellId, editValue);
    setEditingCell(null);
  }, [editValue, onChange]);

  const selectedCellData = selectedCell ? data[selectedCell] : null;

  

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1 border-b bg-black text-sm">
        <button
          onClick={() => selectedCell && onFormat(selectedCell, { bold: !selectedCellData?.bold })}
          className={`px-2 py-1 rounded font-bold border ${selectedCellData?.bold ? "bg-gray-200" : "hover:bg-gray-100"}`}
          title="Bold"
        >B</button>
        <button
          onClick={() => selectedCell && onFormat(selectedCell, { italic: !selectedCellData?.italic })}
          className={`px-2 py-1 rounded italic border ${selectedCellData?.italic ? "bg-gray-200" : "hover:bg-gray-100"}`}
          title="Italic"
        >I</button>
        <input
          type="color"
          title="Text color"
          value={selectedCellData?.color || "#000000"}
          onChange={(e) => selectedCell && onFormat(selectedCell, { color: e.target.value })}
          className="w-7 h-7 rounded border cursor-pointer"
        />
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <button
          onClick={onExport}
          className="px-3 py-1 rounded border hover:bg-gray-100 text-xs"
        >
          Export CSV
        </button>
      </div>
      {/* Formula bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b bg-black text-sm">
        <span className="text-gray-400 w-12 text-center font-mono border rounded px-1">
          {selectedCell || ""}
        </span>
        <span className="text-gray-300">fx</span>
        <span className="text-gray-700 font-mono">
          {selectedCell ? (data[selectedCell]?.raw || "") : ""}
        </span>
      </div>

      {/* Grid */}
      <div className="overflow-auto flex-1">
        <table className="border-collapse text-sm" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="w-10 min-w-10 bg-gray-100 border border-gray-300 sticky top-0 z-10" />
              {COLS.map((col) => (
                <th
                  key={col}
                  className="w-24 min-w-24 bg-gray-100 border border-gray-300 text-center font-medium text-black sticky top-0 z-10 py-1"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row}>
                <td className="bg-gray-100 border border-gray-300 text-center text-black text-xs w-10 min-w-10 select-none">
                  {row}
                </td>
                {COLS.map((col) => {
                  const cellId = getCellId(col, row);
                  const cell = data[cellId];
                  const isSelected = selectedCell === cellId;
                  const isEditing = editingCell === cellId;

                  return (
                    <td
                      key={cellId}
                      className={`border border-gray-200 p-0 h-7 relative cursor-cell bg-white ${
                        isSelected ? "outline-2 outline-blue-500 z-10" : ""
                      }`}
                      onClick={() => { setSelectedCell(cellId); if (!isEditing) startEdit(cellId); }}
                      tabIndex={0}
                      style={{
                        fontWeight: cell?.bold ? "bold" : undefined,
                        fontStyle: cell?.italic ? "italic" : undefined,
                        color: cell?.color || undefined,
                      }}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(cellId)}
                          className="w-full h-full px-1 outline-none border-none bg-gray-400 font-mono text-sm absolute inset-0 text-black"
                        />
                      ) : (
                        <span className="px-1 truncate block w-full h-full leading-7" 
                        style={{color: cell?.color || "black"}}>
                          {cell?.computed || ""}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}