<script setup lang="ts">
definePageMeta({ path: '/', layout: 'home' });
useHead({ title: 'KG1 - AI powered KMS' });
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- HEADER -->
    <header class="bg-gray-800 text-white py-12 flex-1">
      <div class="container mx-auto text-center">
        <h1 class="text-5xl font-bold">KG1</h1>
        <p class="text-xl mt-2 py-6">
          An early prototype of a social knowledge management system,
          <br />powered by AI.
        </p>
      </div>
    </header>

    <!-- WARNING -->
    <section class="bg-yellow-100 p-6">
      <div class="container mx-auto text-center">
        <h2 class="text-2xl font-semibold">Warning</h2>
        <p class="mt-2">
          This is a very early prototype, with no accounts or long term
          guarantees on persistence of data. <br />
          Do not yet rely on KG1 in any way!
        </p>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-white p-6 flex-1">
      <div class="container mx-auto text-center">
        <h2 class="text-2xl font-semibold">Give it a try!</h2>
        <p class="mt-2">
          You can <a href="/search" class="font-bold">search</a>,
          <a href="/ask" class="font-bold">ask</a> a question or
          <a href="/index" class="font-bold">index</a> new URLs.
        </p>
        <button
          onclick="location.href='/search';"
          class="mt-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
        >
          Go on I dare you!
        </button>
      </div>
    </section>

    <!-- LEARN MORE -->
    <footer class="bg-gray-800 text-white p-6">
      <div class="container mx-auto text-center">
        <h2 class="text-2xl font-semibold">Learn More</h2>
        <div class="max-w-lg mx-auto py-8">
          <a
            href="https://www.loom.com/share/b7276f09c3fd4f63b7bc359804a4c141"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://cdn.loom.com/sessions/thumbnails/b7276f09c3fd4f63b7bc359804a4c141-00001.gif"
              class="w-full h-auto block"
              alt="KG1 video demo thumbnail"
            />
          </a>
        </div>
        <p class="mt-2">
          Follow progress on
          <a href="https://github.com/ydennisy/kg1" class="font-bold">Github</a>
          or
          <a href="https://twitter.com/den__dog" class="font-bold">Twitter/X</a>
          as we
          <a
            href="https://twitter.com/hashtag/buildinpublic?src=hashtag_click"
            class="font-bold"
            >#buildinpublic</a
          >.
        </p>
      </div>
    </footer>
  </div>
</template>
