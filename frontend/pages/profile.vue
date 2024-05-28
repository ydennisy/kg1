<script setup lang="ts">
interface Profile {
  id: string;
  email: string;
  app_email_alias: string;
}

import { useUserStore } from '~/stores/userStore';

const userStore = useUserStore();

const profile = computed(() => ({
  id: userStore.id,
  email: userStore.email,
  app_email_alias: userStore.app_email_alias,
}));
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4 text-slate-700">Profile</h1>
    <p class="text-lg mb-2 text-slate-800">
      <strong>Email:</strong> {{ userStore.email }}
    </p>
    <p class="text-lg text-slate-800">
      <strong>App Email Alias:</strong> {{ userStore.app_email_alias }}
    </p>
  </div>
</template>
