"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createDoc, getUserDocs, File ,loadCells,saveCells} from "@/lib/document";
import { handleClientScriptLoad } from "next/script";


export default function Dashboard(){
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [docs, setDocs] = useState<File[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);


    useEffect(()=>{
        if(user){
            getUserDocs(user.uid).then((d) => {
                setDocs(d);
                setFetching(false);
            });
        }
    },[user])

    const handleCreateDoc=async()=>{
        if(!user){
            return;
        }
        console.log("Creating a document.")
        const id=await createDoc(user.uid,user.name);
        console.log("Document created",id);
        router.push(`/doc/${id}`);
    }

    if (loading || fetching) {
        return (
        <div className="flex items-center justify-center h-screen text-gray-400">
            Loading...
        </div>
        );
    }

    return(
        <div className="min-h-screen bg-black">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-black">CollabSheet</h1>
                <div className="flex items-center gap-3">   
                <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: user?.color }}
                >
                    {user?.name?.[0]?.toUpperCase()}
                </span>
                <span className="text-sm text-gray-900">{user?.name}</span>
                <button
                    onClick={logout}
                    className="px-6 py-3 text-sm text-white hover:text-gray-400 rounded-xl bg-black"
                >
                    Logout
                </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-semibold text-lg">
                        Your Sheets
                    </h2>
                    <button onClick={handleCreateDoc} className="px-6 py-3 rounded-xl bg-gray-300 text-black hover:text-gray-200">
                        Add Sheets
                    </button>
                </div>
                    {docs.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <p className="text-4xl mb-3">📄</p>
                            <p>No spreadsheets yet. Create one to get started.</p>
                        </div>
                        ) : (
                        <div className="grid gap-3">
                            {docs.map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => router.push(`/doc/${doc.id}`)}
                                className="bg-black border border-white rounded-lg px-5 py-4 flex items-center justify-between cursor-pointer hover:shadow-md shadow-white transition mb-6"
                            >
                                <div className="w-full">
                                <p className="font-medium">{doc.Title}</p>
                                <div className="flex justify-between text-md text-gray-400 w-full">
                                    <span>By {doc.OwnerName}</span>
                                    <span>
                                        {doc.lastModified?.toDate
                                        ? doc.lastModified.toDate().toLocaleDateString()
                                        : "Just now"}
                                    </span>
                                </div>
                                </div>
                                <span className="ml-1 text-gray-300 text-xl">→</span>
                            </div>
                    ))}
          </div>
        )}
            </div>
        </div>

    )

}