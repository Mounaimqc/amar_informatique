/**
 * Tool 6 : webSearch
 * Recherche web externe d'informations techniques (nouveautés matérielles, compatibilités récentes).
 * N'est utilisée QUE pour les informations non présentes dans la base de données du site.
 */
export async function webSearch({ query }) {
  if (!query) return { success: false, error: "Aucune requête de recherche fournie." };

  console.log(`🌐 [Web Search Tool Exécuté] : "${query}"`);

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (response.ok) {
      const htmlText = await response.text();
      const matches = htmlText.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/g);
      if (matches && matches.length > 0) {
        const snippets = matches.slice(0, 3).map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        if (snippets.length > 0) {
          return {
            query,
            snippets,
            summary: snippets.join(' \n\n ')
          };
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Échec de la recherche web DuckDuckGo:", err.message);
  }

  // Ne jamais inventer une réponse ou de faux snippets
  return {
    success: false,
    error: "WEB_SEARCH_UNAVAILABLE"
  };
}
