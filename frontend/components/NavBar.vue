<script setup lang="ts">
const route = useRoute();
const supabaseClient = useSupabaseClient();

const isMobileMenuOpen = ref(false);

const isActive = (path: string) => {
  return route.path === path
    ? 'bg-gray-900 text-white'
    : 'text-gray-300 hover:bg-gray-700 hover:text-white';
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
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
  <nav class="bg-gray-800">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <!-- Mobile menu button-->
          <button
            type="button"
            @click="toggleMobileMenu"
            class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-controls="mobile-menu"
            aria-expanded="false"
          >
            <span class="absolute -inset-0.5"></span>
            <span class="sr-only">Open menu</span>
            <!--
            Icon when menu is closed.

            Menu open: "hidden", Menu closed: "block"
          -->
            <svg
              class="block h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            <!--
            Icon when menu is open.

            Menu open: "block", Menu closed: "hidden"
          -->
            <svg
              class="hidden h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div
          class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start"
        >
          <div class="flex flex-shrink-0 items-center">
            <a href="/">
              <img class="h-8 w-auto" src="/public/kg1.svg" alt="KG1" />
            </a>
          </div>
          <div class="hidden sm:ml-6 sm:block">
            <div class="flex space-x-4">
              <NuxtLink
                to="/search"
                :class="isActive('/search')"
                class="rounded-md px-3 py-2 text-sm font-medium"
                aria-current="page"
                >Search</NuxtLink
              >
              <NuxtLink
                to="/ask"
                :class="isActive('/ask')"
                class="rounded-md px-3 py-2 text-sm font-medium"
                >Ask</NuxtLink
              >
              <NuxtLink
                to="/index"
                :class="isActive('/index')"
                class="rounded-md px-3 py-2 text-sm font-medium"
                >Index</NuxtLink
              >
            </div>
          </div>
        </div>
        <div
          class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
        >
          <button
            type="button"
            @click="logout"
            class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Logout
          </button>
          <a
            href="/profile"
            class="rounded-full h-8 w-8 flex items-center justify-center bg-gray-400 hover:bg-gray-500"
            aria-label="Profile"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              class="h-6 w-6 text-white"
            >
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Mobile menu, show/hide based on menu state. -->
    <div v-show="isMobileMenuOpen" class="sm:hidden" id="mobile-menu">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <NuxtLink
          to="/search"
          :class="isActive('/search')"
          class="rounded-md px-3 py-2 text-sm font-medium"
          aria-current="page"
          >Search</NuxtLink
        >
        <NuxtLink
          to="/ask"
          :class="isActive('/ask')"
          class="rounded-md px-3 py-2 text-sm font-medium"
          >Ask</NuxtLink
        >
        <NuxtLink
          to="/index"
          :class="isActive('/index')"
          class="rounded-md px-3 py-2 text-sm font-medium"
          >Index</NuxtLink
        >
      </div>
    </div>
  </nav>
</template>
