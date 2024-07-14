<script setup lang="ts">
const props = defineProps({
  options: {
    type: Array as PropType<string[]>,
    required: true,
  },
  defaultOption: {
    type: String,
    required: true,
  },
});

const selectedOption = ref(props.defaultOption);

const emit = defineEmits(['selected']);

const handleChange = () => {
  emit('selected', selectedOption.value);
};

onMounted(() => {
  emit('selected', selectedOption.value);
});
</script>

<template>
  <div class="absolute inset-y-0 right-0 flex items-center pr-3">
    <select
      @change="handleChange"
      v-model="selectedOption"
      class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 pl-4 pr-8 rounded-md appearance-none"
    >
      <option v-for="option in props.options" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6 text-gray-700"
    >
      <svg
        class="fill-current h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path
          d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
        />
      </svg>
    </div>
  </div>
</template>
