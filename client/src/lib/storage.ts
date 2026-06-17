/**
 * Client-side storage helper — uploads audio blob to the server's storage proxy
 * and returns the public URL for the stored file.
 */
export async function storagePut(key: string, data: Blob, contentType: string): Promise<string> {
  const res = await fetch(`/api/storage/upload-raw?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: data,
  });

  if (!res.ok) {
    throw new Error("Storage upload failed: " + res.statusText);
  }

  const json = await res.json();
  return json.url as string;
}
