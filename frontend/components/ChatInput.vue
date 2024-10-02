<script setup lang="ts">
const inputText = ref('');
const isSearchMode = ref(false);

const emit = defineEmits(['submit']);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;

  if (value.startsWith('/s ') || value.startsWith('/search ')) {
    isSearchMode.value = true;
    inputText.value = value.replace(/^\/s(earch)?/, '').trim();
  } else {
    inputText.value = value;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (
    event.key === 'Backspace' &&
    isSearchMode.value &&
    inputText.value === ''
  ) {
    isSearchMode.value = false;
    event.preventDefault();
  }
};

const submitInput = () => {
  emit('submit', { text: inputText.value, isSearchMode: isSearchMode.value });
  inputText.value = '';
  isSearchMode.value = false;
};
</script>

<template>
  <div>
    <form @submit.prevent="submitInput" class="flex">
      <div class="relative w-full">
        <input
          v-model="inputText"
          @input="handleInput"
          @keydown="handleKeydown"
          type="text"
          placeholder="Ask a question or use the (/s) command to search."
          :class="[
            'w-full p-2 border border-gray-300 rounded-md',
            { 'pl-20': isSearchMode },
          ]"
        />
        <span
          v-if="isSearchMode"
          class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm ring-1 ring-inset ring-blue-700/10"
        >
          Search
        </span>
      </div>
      <button
        type="submit"
        class="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Send
      </button>
    </form>
  </div>
</template>
