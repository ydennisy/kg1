<script setup lang="ts">
type ChatMessage = {
  sender: string;
  content: string;
  isSearchMode?: boolean;
};

type RetrievedDocument = {
  id: string;
  title: string;
  url: string;
  score: number;
  text: string;
  selected: boolean;
};

const messages = ref<ChatMessage[]>([]);
const retrievedDocuments = ref<RetrievedDocument[]>([]);
const chatContainer = ref<HTMLElement | null>(null);

const selectedDocuments = computed(() =>
  retrievedDocuments.value.filter((doc) => doc.selected)
);

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const removeDocument = (id: string) => {
  const doc = retrievedDocuments.value.find((d) => d.id === id);
  if (doc) {
    doc.selected = false;
  }
};

const handleChatInputSubmit = async (data: {
  text: string;
  isSearchMode: boolean;
}) => {
  messages.value.push({
    sender: 'You',
    content: data.text,
    isSearchMode: data.isSearchMode,
  });
  scrollToBottom();

  if (data.isSearchMode) {
    const results = await api.search(data.text);
    retrievedDocuments.value = results.map((doc) => ({
      ...doc,
      // TODO: this is temp until the backend returns the text.
      text: `${doc.title} - ${doc.url}`,
      selected: false,
    }));
  } else {
    const aiMessage: ChatMessage = {
      sender: 'KG1',
      content: '',
    };
    messages.value.push(aiMessage);

    const selectedNodeIds = selectedDocuments.value.map((doc) => doc.id);

    for await (const chunk of api.chat(data.text, selectedNodeIds)) {
      // TODO: check if there is a nicer way to have a reactive pointer to the
      // message which was pushed `aiMessage` above.
      messages.value[messages.value.length - 1].content += chunk;
      scrollToBottom();
    }
  }
};
</script>

<template>
  <div class="flex h-screen">
    <!-- Documents Section -->
    <div class="w-1/3 border-r border-gray-300 flex flex-col">
      <!-- Retrieved Documents -->
      <div class="h-2/3 flex flex-col border-b border-gray-300">
        <div class="sticky top-0 z-10 pb-2">
          <h2 class="mb-4 mt-4">Retrieved Documents</h2>
        </div>
        <div class="overflow-y-auto flex-grow">
          <ul>
            <li
              v-for="doc in retrievedDocuments"
              :key="doc.id"
              class="mb-4 mr-4 border-b pb-2"
            >
              <div
                class="grid grid-cols-[1fr_auto_auto] items-center gap-2 mb-1"
              >
                <span class="text-sm font-bold truncate">
                  {{ truncateText(doc.title, 30) }}
                </span>
                <span
                  class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                >
                  {{ doc.score.toFixed(2) }}
                </span>
                <div class="flex items-center justify-self-end">
                  <label :for="doc.id" class="text-xs mr-2">Select</label>
                  <input
                    type="checkbox"
                    :id="doc.id"
                    v-model="doc.selected"
                    class="mr-1"
                  />
                </div>
              </div>
              <p class="text-sm line-clamp-5">{{ doc.text }}</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Selected Documents -->
      <div class="h-1/3 overflow-y-auto">
        <div class="sticky top-0 z-10 pb-2">
          <h2 class="mb-4 mt-4">Selected Documents</h2>
        </div>
        <ul>
          <li v-for="doc in selectedDocuments" :key="doc.id" class="mb-2">
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold truncate">{{
                truncateText(doc.title, 30)
              }}</span>
              <button
                @click="removeDocument(doc.id)"
                class="text-red-500 text-xs"
              >
                Remove
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Chat Section -->
    <div class="w-2/3 p-4 flex flex-col">
      <h2 class="mb-4">Chat</h2>

      <!-- Chat Messages Container -->
      <div class="flex-grow overflow-y-auto" ref="chatContainer">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="mb-2 flex text-sm"
        >
          <strong class="w-12 flex-shrink-0 mt-1 text-gray-600">{{
            message.sender
          }}</strong>
          <div class="flex-grow bg-gray-100 rounded-lg p-3 ml-2">
            <div v-if="message.sender !== 'KG1'" class="flex items-center">
              <span
                v-if="message.isSearchMode"
                class="mr-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm ring-1 ring-inset ring-blue-700/10"
              >
                Search
              </span>
              <p>{{ message.content }}</p>
            </div>
            <p v-else v-html="markdown.render(message.content)"></p>
          </div>
        </div>
      </div>

      <!-- Chat Messages Input -->
      <div class="mt-4 sticky bottom-4">
        <ChatInput @submit="handleChatInputSubmit" />
      </div>
    </div>
  </div>
</template>

<style>
.line-clamp-5 {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
