"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { signInWithGoogle, signInWithName, loading } = useAuth();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"choose" | "name">("choose");
  const router = useRouter();

  const handleGoogle= async()=>{
    await signInWithGoogle();
    router.push("/");
  };

  const handleName=async()=>{
    if(!name.trim()) return;
    await signInWithName(name.trim());
    router.push("/");
  };

  if(loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return(
    <div className="flex items-center justify-center h-screen bg-black">
        <div className="bg-gray-700 p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
            <h1 className="text-2xl font-bold text-center">CollabSheet</h1>
            <p className="text-gray-200 text-center text-sm">Real-time collaborative spreadsheets</p>

            {mode==="choose" &&(
                <div className="space-y-3 pt-2">
                    <button onClick={handleGoogle} className="py-3 px-6 w-full bg-black rounded-3xl font-semibold hover:bg-gray-800 transition">Sign In with Google</button>
                    <button onClick={()=> setMode("name")} className="py-3 px-6 w-full bg-black rounded-3xl font-semibold hover:bg-gray-600 transition">Continue with display name</button>
                </div>

            )}
            {mode==="name" &&(
                <div className="space-y-3 pt-2">
                    <input type="text"
                        placeholder="Your display name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleName()}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        autoFocus
                    />
                    <button onClick={handleName} className="w-full bg-black rounded-lg font-semibold hover:bg-gray-600 transition">
                        Continue
                    </button>
                    <button onClick={()=>setMode("choose")} className="w-full bg-black rounded-lg font-semibold hover:bg-gray-600 transition">
                        Back
                    </button>
                </div>
            )}
        </div>
    </div>
  )
  
}