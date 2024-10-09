<script setup lang="ts">
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/a11y-light.css';
import md from 'markdown-it';
import mdm from '@traptitech/markdown-it-katex';
import hljs from 'highlight.js';

const renderer = md({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        );
      } catch (err) {
        console.error(err);
      }
    }

    return '<pre><code class="hljs">' + str + '</code></pre>';
  },
});

renderer.use(mdm, {
  displayMode: false,
  blockClass: 'math-block',
  errorColor: ' #cc0000',
  output: 'html',
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
  ],
});

const results = ref('');
const context = ref([]);
const isLoading = ref(false);
// TODO: refactor for a more general interface
const isAskWithNode = ref(false);
const isAskWithNodes = ref(false);

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const apiBase = config.public.apiBase;
const nodeId = route.query.id;
const nodeIds = Array.isArray(route.query.ids)
  ? route.query.ids
  : typeof route.query.ids === 'string'
  ? route.query.ids.split(',')
  : [];
const nodeTitle = route.query.title;
isAskWithNode.value = !!nodeId;
isAskWithNodes.value = nodeIds.length > 0;

const chat = async (query: string) => {
  isLoading.value = true;
  results.value = '';
  context.value = [];

  let isContextReceived = false;
  let contextBuffer = '';

  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  let apiUrl = `${apiBase}/api/ask?q=${encodeURIComponent(query)}`;

  if (isAskWithNode.value) {
    apiUrl = `${apiUrl}&id=${nodeId}`;
  }
  // TODO: improve this logic!
  if (isAskWithNodes.value) {
    for (const id of nodeIds) {
      apiUrl += `&id=${id}`;
    }
  }

  const response = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
    results.value =
      'Sorry, there are no relevant documents in the knowledge graph and I am not at liberty to answer based on my own opinions. Please [index](/index) some documents!';
    isLoading.value = false;
    return;
  } else if (!response.ok) {
    results.value = 'Sorry, an unexpected error occured, please try again.';
    isLoading.value = false;
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    results.value = 'Sorry, an unexpected error occured, please try again.';
    return;
  }
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const textChunk = decoder.decode(value, { stream: true });

    if (isContextReceived === false) {
      contextBuffer += textChunk;
      if (contextBuffer.includes('<END_OF_CONTEXT>')) {
        const [contextChunks, ..._] = contextBuffer.split('<END_OF_CONTEXT>');
        const { context: parsedContext } = JSON.parse(contextChunks);
        context.value = parsedContext;
        isContextReceived = true;
      }
    } else {
      results.value += textChunk;
    }
  }

  isLoading.value = false;
};

const clearAskWithNode = async () => {
  await router.replace({});
  isAskWithNode.value = false;
  isAskWithNodes.value = false;
  context.value = [];
};
</script>

<template>
  <div>
    <!-- Search Bar -->
    <SearchBar :is-loading="isLoading" @search="chat" />

    <!-- Notification Banner (single node) -->
    <div
      v-if="isAskWithNode"
      class="bg-gray-100 border border-gray-300 text-slate-600 mt-2 px-4 py-2 rounded-md relative"
      role="alert"
    >
      <span class="block sm:inline text-xs"
        >You are using the document
        <strong class="font-bold text-xs">"{{ nodeTitle }}"</strong> as context
        for your question, to use all documents
        <strong
          class="underline cursor-pointer font-bold text-xs"
          @click="clearAskWithNode"
          >click here</strong
        >.</span
      >
    </div>

    <!-- Notification Banner (multi node) -->
    <div
      v-if="isAskWithNodes"
      class="bg-gray-100 border border-gray-300 text-slate-600 mt-2 px-4 py-2 rounded-md relative"
      role="alert"
    >
      <span class="block sm:inline text-xs"
        >You are using
        <strong class="font-bold text-xs">"{{ nodeIds.length }}"</strong>
        documents as context for your question, to use all documents
        <strong
          class="underline cursor-pointer font-bold text-xs"
          @click="clearAskWithNode"
          >click here</strong
        >.</span
      >
    </div>

    <!-- Context / Chunks Viewer -->
    <div v-show="context.length > 0">
      <ContextViewer :chunks="context" />
    </div>

    <!-- Streamed Markdown Area -->
    <div class="mt-4 markdown-body">
      <p v-html="renderer.render(results)"></p>
    </div>
  </div>
</template>

<style scoped>
.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial,
    sans-serif;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(h1) {
  font-size: 2em;
}
.markdown-body :deep(h2) {
  font-size: 1.5em;
}
.markdown-body :deep(h3) {
  font-size: 1.25em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(li) {
  margin-top: 0.25em;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}
</style>
