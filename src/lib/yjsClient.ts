import * as Y from "yjs";

const docs = new Map<string, { ydoc: Y.Doc; provider: any }>();

export async function getYjsDoc(docId: string, user: { name: string; color: string }) {
  if (docs.has(docId)) return docs.get(docId)!;

  const ydoc = new Y.Doc();
  const { WebsocketProvider } = await import("y-websocket");

  const provider = new WebsocketProvider(
    "http://localhost:1234/",
    `collabsheet-${docId}`,
    ydoc
  );

  provider.awareness.setLocalStateField("user", {
    name: user.name,
    color: user.color,
  });

  const result = { ydoc, provider };
  docs.set(docId, result);
  return result;
}