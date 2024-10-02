interface SearchResult {
  id: string;
  title: string;
  url: string;
  score: number;
}

type SearchModes = 'hybrid' | 'dense' | 'llm';

const getApiBase = () => {
  return useRuntimeConfig().public.apiBase;
};

const getAuthToken = () => {
  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  // if (!token) return;
  return token;
};

const search = async (query: string, searchMode: SearchModes = 'hybrid') => {
  try {
    const result = await $fetch<SearchResult[]>(`${getApiBase()}/api/search`, {
      method: 'GET',
      query: { q: query, mode: searchMode },
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const chat = async function* (query: string, nodes?: string[]) {
  let apiUrl = `${getApiBase()}/api/ask?q=${encodeURIComponent(query)}`;

  if (nodes) {
    for (const id of nodes) {
      apiUrl += `&id=${id}`;
    }
  }

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });

  if (response.status === 404) {
    return 'Sorry, there are no relevant documents in the knowledge graph and I am not at liberty to answer based on my own opinions. Please [index](/index) some documents!';
  } else if (!response.ok) {
    return 'Sorry, an unexpected error occured, please try again.';
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return 'Sorry, an unexpected error occured, please try again.';
  }
  const decoder = new TextDecoder();

  let isContextReceived = false;
  let contextBuffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const textChunk = decoder.decode(value, { stream: true });

    // TODO: this does not return the context
    if (isContextReceived === false) {
      contextBuffer += textChunk;
      if (contextBuffer.includes('<END_OF_CONTEXT>')) {
        const [contextChunks, ..._] = contextBuffer.split('<END_OF_CONTEXT>');
        //const { context: parsedContext } = JSON.parse(contextChunks);
        //context.value = parsedContext;
        isContextReceived = true;
      }
    } else {
      yield textChunk;
    }
  }
};

export const api = { search, chat };
