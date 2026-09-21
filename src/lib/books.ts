export type Book = {
  id: number;
  title: string;
  author: string;
  description: string;
};
export async function getBooks(): Promise<Book[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  const endpoint = new URL("/rest/v1/books", url);
  endpoint.searchParams.set("select", "id,title,author,description");
  endpoint.searchParams.set("order", "id.asc");
  const response = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  return response.json();
}
