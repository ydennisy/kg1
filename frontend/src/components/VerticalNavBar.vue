<script setup lang="ts">
const navLinks = [
  { to: '/search', text: 'Search' },
  { to: '/ask', text: 'Ask' },
  { to: '/index', text: 'Index' },
  { to: '/list', text: 'List' },
  { to: '/explore', text: 'Explore' },
  { to: '/chat', text: 'Chat' },
  { to: '/fts', text: 'FTS' },
  { to: '/graph', text: 'Graph' },
];

const route = useRoute();
const supabaseClient = useSupabaseClient();

const isCollapsed = ref(false);

const isActive = (path: string) => {
  return route.path === path
    ? 'bg-gray-900 text-white'
    : 'text-gray-300 hover:bg-gray-700 hover:text-white';
};

const toggleNavbar = () => {
  isCollapsed.value = !isCollapsed.value;
};

// TODO: this behaviour is buggy, we cannot logout if we are logged out!
const logout = async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error(error);
    return;
  }

  await navigateTo('/');
};
</script>

<template>
  <nav
    :class="[
      'bg-gray-800 h-screen fixed left-0 top-0 flex flex-col transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64',
    ]"
  >
    <div class="px-4 py-5 flex items-center justify-between">
      <a href="/" v-show="!isCollapsed">
        <img class="h-8 w-auto" src="/public/kg1.svg" alt="KG1" />
      </a>
      <button
        @click="toggleNavbar"
        class="text-white p-2 rounded-md hover:bg-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>
    </div>
    <div class="flex-grow overflow-y-auto">
      <div class="mt-5 flex flex-col space-y-2">
        <NuxtLink
          v-for="(link, index) in navLinks"
          :key="index"
          :to="link.to"
          :class="[isActive(link.to), isCollapsed ? 'justify-center' : '']"
          class="px-4 py-2 text-sm font-medium rounded-md flex items-center"
        >
          <span v-if="!isCollapsed">{{ link.text }}</span>
          <span v-else class="text-xl">{{ link.text[0] }}</span>
        </NuxtLink>
      </div>
    </div>
    <div class="mt-auto p-4">
      <button
        @click="logout"
        :class="[isCollapsed ? 'justify-center' : '']"
        class="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md flex items-center"
      >
        <span v-if="!isCollapsed">Logout</span>
        <span v-else class="text-xl">L</span>
      </button>
    </div>
  </nav>
</template>
