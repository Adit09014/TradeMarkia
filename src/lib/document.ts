import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";



export interface File{
    id: string,
    OwnderId: string,
    OwnerName:string,
    Title: string,
    lastModified: Timestamp,
}

export async function createDoc(OwnerId: string, OwnerName: string){
    const doc= await addDoc(collection(db, "documents"),{
        title: "Untitle Document",
        OwnerId,
        OwnerName,
        lastModified:serverTimestamp(),
    });
    return doc.id;
}

export async function getUserDocs(ownerId: string): Promise<File[]>{
    const q=query(
        collection(db,"documents"),
        where("OwnerId","==",ownerId),
        orderBy("lastModified","desc")
    );
    const snap=await getDocs(q);
    return snap.docs.map((doc)=>({ id: doc.id, ...doc.data() } as File));
}

export async function saveCells(docId: string, cells: Record<string, any>) {
  await setDoc(doc(db, "cells", docId), { cells });
}

export async function loadCells(docId: string): Promise<Record<string, any>> {
  const snap = await getDoc(doc(db, "cells", docId));
  if (snap.exists()) return snap.data().cells || {};
  return {};
}