<script setup lang="ts">
const props = defineProps({
  on: {
    type: String,
    required: true,
  },
  off: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['toggled']);

const currentState = ref(props.on);

const toggleState = () => {
  currentState.value = currentState.value === props.on ? props.off : props.on;
  emit('toggled', currentState.value);
};

onMounted(() => {
  emit('toggled', currentState.value);
});
</script>

<template>
  <div class="absolute inset-y-0 right-0 flex items-center pr-3">
    <button
      @click="toggleState"
      class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full"
    >
      {{ currentState }}
    </button>
  </div>
</template>
