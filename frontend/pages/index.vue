<script setup lang="ts">
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const { data, pending, error, refresh } = await useFetch<Post[]>(
  'https://jsonplaceholder.typicode.com/posts',
);
</script>

<template>
  <!--   <h3
    class="text-slate-900 dark:text-white mt-5 text-base font-medium tracking-tight"
  >
    Writes Upside-Down
  </h3>
  <span
    class="inline-flex items-center justify-center p-2 bg-indigo-500 rounded-md shadow-lg"
  >
  </span>
  <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm">
    The Zero Gravity Pen can be used to write in any orientation, including
    upside-down. It even works in outer space.
  </p> -->

  <textarea
    class="resize-none border-0 bg-transparent text-white placeholder-gray-500 focus:outline-none w-full h-full"
    placeholder="Nothing but thoughts..."
    autofocus
  ></textarea>
</template>
