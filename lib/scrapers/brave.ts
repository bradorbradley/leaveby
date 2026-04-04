const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

export interface BraveResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  extraSnippets?: string[];
}

export async function searchBrave(query: string) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("Missing BRAVE_SEARCH_API_KEY");
  }

  const params = new URLSearchParams({
    q: query,
    text_decorations: "false",
    result_filter: "web",
    count: "5",
  });

  const response = await fetch(`${BRAVE_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Brave search failed with ${response.status}`);
  }

  const json = await response.json();
  return ((json.web?.results ?? []) as BraveResult[]).map((result) => ({
    title: result.title,
    url: result.url,
    description: result.description,
    age: result.age,
    extraSnippets: result.extraSnippets ?? [],
  }));
}

export function flattenResultText(results: BraveResult[]) {
  return results
    .flatMap((result) => [result.title, result.description, ...(result.extraSnippets ?? [])])
    .join(" \n ");
}
