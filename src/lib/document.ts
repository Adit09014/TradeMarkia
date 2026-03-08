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
        where("OwnderId","==",ownerId),
        orderBy("lastModified","desc")
    );
    const snap=await getDocs(q);
    return snap.docs.map((doc)=>({ id: doc.id, ...doc.data() } as File));
}