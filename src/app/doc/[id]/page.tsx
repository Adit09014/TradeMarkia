"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Grid, { SheetData, Cell } from "@/components/Grid";
import { evaluateCell } from "@/lib/formula";
import { getYjsDoc } from "@/lib/yjsClient";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import {  loadCells,saveCells} from "@/lib/document";
import { doc, onSnapshot, setDoc, getDoc, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";


interface AwarenessUser{
  name: string;
  color: string;
}


export default function EditorPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id as string;
  const { user,loading } = useAuth();
  const [data, setData] = useState<SheetData>({});
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [activeUsers, setActiveUsers] = useState<AwarenessUser[]>([]);
  const yMapRef = useRef<Y.Map<any> | null>(null);
  const providerRef = useRef<any>(null);
  const router=useRouter();
  const [title, setTitle] = useState("Untitled Spreadsheet");
  const [editingTitle, setEditingTitle] = useState(false);
  

  const handleFormat = useCallback((cellId: string, format: Partial<Cell>) => {
    const updatedCell = { ...(data[cellId] || { raw: "", computed: "" }), ...format };
    const updatedData = { ...data, [cellId]: updatedCell };
    setData(updatedData);
    setDoc(doc(db, "cells", id), { cells: updatedData }).catch(console.error);
  }, [data, id]);

const handleExport = useCallback(() => {
  const COLS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const rows = Array.from({ length: 50 }, (_, i) => i + 1);
  const csv = rows.map((row) =>
    COLS.map((col) => {
      const val = data[`${col}${row}`]?.computed || "";
      return val.includes(",") ? `"${val}"` : val;
    }).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "spreadsheet.csv";
  a.click();
  URL.revokeObjectURL(url);
}, [data]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    getDoc(doc(db, "documents", id)).then((snap) => {
      if (snap.exists()) setTitle(snap.data().title || "Untitled Spreadsheet");
    });
  }, [user, loading, router]);

 useEffect(() => {
  if (!user || !id) return;

  let cleanup: (() => void) | undefined;

  // Load from Firestore first
  loadCells(id).then((savedCells) => {
    setData(savedCells);

    getYjsDoc(id, user).then(({ ydoc, provider }) => {
      provider.on("status", (event: any) => {
        console.log("Websocket status:", event.status);
      });
      const yMap = ydoc.getMap("cells");
      yMapRef.current = yMap;
      providerRef.current = provider;

      // Seed Yjs with Firestore data
      if (yMap.size === 0 && Object.keys(savedCells).length > 0) {
        ydoc.transact(() => {
          Object.entries(savedCells).forEach(([key, val]) => {
            yMap.set(key, val);
          });
        });
      }

      const loadData = () => {
        const newData: SheetData = {};
        yMap.forEach((value: any, key: string) => {
          newData[key] = value;
        });
        setData(newData);
      };

      loadData();
      yMap.observe(() => {
        loadData();
        setSaveStatus("saved");
      });

      const updateAwareness = () => {
        const states = Array.from(provider.awareness.getStates().entries());
        console.log("Awareness states:", states); // debug
        const users = states
          .map((entry: any)=> entry[1]?.user)
          .filter(Boolean) as AwarenessUser[];
        console.log("Active users:", users); // debug
        setActiveUsers(users);
      };

      provider.awareness.on("change", updateAwareness);
      provider.awareness.on("update", updateAwareness);
      updateAwareness();

      cleanup = () => {
        provider.awareness.off("change", updateAwareness);
      };
    });
  });

  return () => cleanup?.();
}, [user, id]);

  const getCellValue = useCallback((col: string, row: number): string => {
    return data[`${col}${row}`]?.computed || "";
  }, [data]);

  const handleChange = useCallback((cellId: string, raw: string) => {
  if (!yMapRef.current) return;

  setSaveStatus("saving");

  const computed = raw.startsWith("=")
    ? evaluateCell(raw, getCellValue)
    : raw;

  const cellData: Cell = {
    ...(data[cellId] || {}),
    raw,
    computed,
  };

  yMapRef.current.set(cellId, cellData);

  // Save to Firestore
  const updatedData = { ...data, [cellId]: cellData };
  saveCells(id, updatedData).then(() => setSaveStatus("saved"));
}, [getCellValue, data, id]);

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-black">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Home
        </button>
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEditingTitle(false);
              setDoc(doc(db, "documents", id), { title }, { merge: true });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditingTitle(false);
                setDoc(doc(db, "documents", id), { title }, { merge: true });
              }
            }}
            className="font-semibold text-sm border-b border-gray-400 outline-none bg-transparent"
          />
        ) : (
          <span
            className="font-semibold text-sm cursor-pointer hover:text-gray-500"
            onClick={() => setEditingTitle(true)}
            title="Click to rename"
          >
            {title}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className={`text-xs ${saveStatus === "saving" ? "text-orange-400" : "text-green-500"}`}>
            {saveStatus === "saving" ? "Saving..." : "✓ Saved"}
          </span>
          <div className="flex items-center gap-1">
            {activeUsers.map((u, i) => (
              <div
                key={i}
                title={u.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: u.color }}
              >
                {u.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
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

      {/* Grid */ }
      <div className="flex-1 overflow-hidden">
        <Grid data={data} onChange={handleChange} onFormat={handleFormat} onExport={handleExport} />
      </div>
    </div>
  );
}