<script setup lang="ts">
definePageMeta({ path: '/', layout: 'home' });
useHead({ title: 'KG1 - AI powered KMS' });
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white text-gray-900">
    <!-- HEADER -->
    <header class="py-20 flex-1">
      <div class="container mx-auto text-center px-4">
        <h1 class="text-6xl font-extrabold tracking-tight mb-4 text-gray-900">
          KG1
        </h1>
        <p class="text-2xl text-gray-600 max-w-2xl mx-auto">
          An early prototype of a social knowledge management system, powered by
          AI.
        </p>
        <button
          @click="$router.push('/search')"
          class="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
        >
          Get Started
        </button>
      </div>
    </header>

    <!-- WARNING -->
    <section class="bg-gray-100 text-gray-900 py-4">
      <div class="container mx-auto text-center px-4">
        <p class="font-medium">
          ⚠️ Early prototype: Data persistence not guaranteed. Do not rely on
          KG1 yet!
        </p>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto text-center px-4">
        <h2 class="text-3xl font-bold mb-8 text-gray-900">Core Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-6 bg-white rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-2 text-gray-900">Search</h3>
            <p class="text-gray-600">
              Effortlessly find the information you need.
            </p>
          </div>
          <div class="p-6 bg-white rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-2 text-gray-900">Ask</h3>
            <p class="text-gray-600">
              Get answers to your questions instantly.
            </p>
          </div>
          <div class="p-6 bg-white rounded-lg shadow-lg">
            <h3 class="text-xl font-semibold mb-2 text-gray-900">Index</h3>
            <p class="text-gray-600">
              Add new URLs to expand the knowledge base.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- LEARN MORE -->
    <footer class="py-16 bg-gray-900 text-white">
      <div class="container mx-auto text-center px-4">
        <h2 class="text-3xl font-bold mb-8">Learn More</h2>
        <div class="max-w-2xl mx-auto mb-8">
          <a
            href="https://www.loom.com/share/b7276f09c3fd4f63b7bc359804a4c141"
            target="_blank"
            rel="noopener noreferrer"
            class="block rounded-lg overflow-hidden shadow-lg hover:opacity-90 transition duration-300"
          >
            <img
              src="https://cdn.loom.com/sessions/thumbnails/b7276f09c3fd4f63b7bc359804a4c141-00001.gif"
              class="w-full h-auto"
              alt="KG1 video demo thumbnail"
            />
          </a>
        </div>
        <p class="text-gray-300">
          Follow our progress on
          <a
            href="https://github.com/ydennisy/kg1"
            class="text-blue-400 hover:underline"
            >Github</a
          >
          or
          <a
            href="https://twitter.com/den__dog"
            class="text-blue-400 hover:underline"
            >Twitter/X</a
          >
          as we
          <a
            href="https://twitter.com/hashtag/buildinpublic?src=hashtag_click"
            class="text-blue-400 hover:underline"
            >#buildinpublic</a
          >.
        </p>
      </div>
    </footer>
  </div>
</template>
