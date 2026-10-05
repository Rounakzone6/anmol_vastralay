const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc';

export async function fetchPublicTrpc<T>(procedure: string, input?: unknown): Promise<T | null> {
  try {
    const query = input === undefined ? '' : `?input=${encodeURIComponent(JSON.stringify(input))}`;
    const response = await fetch(`${apiUrl}/${procedure}${query}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return (payload?.result?.data?.json ?? payload?.result?.data ?? null) as T | null;
  } catch (error) {
    console.error(`Failed to fetch public tRPC procedure ${procedure}`, error);
    return null;
  }
}
