<script setup lang="ts">
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Doc {
  id: string;
  url: string;
  title: string;
  text: string;
  summary: string;
}

interface Result {
  docs: Doc[];
  index: { [key: string]: number[] };
}

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const allDocs = ref<Doc[]>([]);
const searchResults = ref<Doc[]>([]);
const searchQuery = ref('');
const ftsIndex = ref<{ [key: string]: number[] }>({});
const searchTime = ref(0);
const isSearchPerformed = ref(false);
const isLoading = ref(true);

const get = async () => {
  isLoading.value = true;
  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  const { data } = await useFetch<Result>(`${apiBase}/api/fts`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (data.value) {
    allDocs.value = data.value.docs;
    searchResults.value = data.value.docs;
    ftsIndex.value = data.value.index;
  }
  isLoading.value = false;
};

onMounted(async () => {
  await get();
});

const search = () => {
  const startTime = performance.now();
  isSearchPerformed.value = true;

  if (!searchQuery.value.trim()) {
    searchResults.value = allDocs.value;
    searchTime.value = performance.now() - startTime;
    return;
  }

  const words = searchQuery.value.toLowerCase().split(/\s+/);
  const matchedIndices = words.flatMap((word) => ftsIndex.value[word] || []);
  const uniqueIndices = [...new Set(matchedIndices)];
  searchResults.value = uniqueIndices.map((index) => allDocs.value[index]);

  searchTime.value = performance.now() - startTime;
};

// Function to truncate text
const truncateText = (text: string, maxLength: number = 200) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Function to format URL for display
const formatUrl = (url: string, maxLength: number = 50) => {
  if (url.length <= maxLength) return url;
  const domain = new URL(url).hostname;
  return (
    domain +
    '/' +
    truncateText(
      url.split('/').slice(3).join('/'),
      maxLength - domain.length - 2
    )
  );
};

const noResultsAsciiMan = `
  ¯\\_(ツ)_/¯
`;
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <div v-if="isLoading" class="mb-6">
      <div class="text-center mb-2">Loading documents...</div>
      <Progress :value="33" class="w-full" />
    </div>
    <div v-else>
      <div class="mb-6">
        <Input
          v-model="searchQuery"
          @input="search"
          type="text"
          placeholder="Search documents..."
          class="w-full"
        />
      </div>
      <div v-if="isSearchPerformed" class="text-sm text-gray-500 mb-4">
        {{ searchResults.length }} results found in
        {{ searchTime.toFixed(2) }} ms
      </div>
      <div v-if="searchResults.length > 0" class="space-y-4">
        <Card v-for="result in searchResults" :key="result.id">
          <CardHeader>
            <CardTitle>
              <a
                :href="result.url"
                target="_blank"
                class="hover:underline text-blue-600"
              >
                {{ result.title }}
              </a>
            </CardTitle>
            <CardDescription>
              <a
                :href="result.url"
                target="_blank"
                class="text-green-700 text-xs hover:underline"
              >
                {{ formatUrl(result.url) }}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-gray-600 text-sm">
              {{ truncateText(result.summary) }}
            </p>
          </CardContent>
        </Card>
      </div>
      <div v-else-if="isSearchPerformed" class="text-center">
        <pre class="text-4xl mb-4">{{ noResultsAsciiMan }}</pre>
        <p class="text-gray-600">
          No results found. Try a different search term!
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove the loading-bar styles as we're using the Spinner component now */
</style>
