<script setup lang="ts">
const userStore = useUserStore();

onMounted(async () => {
  await userStore.load();
});
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4 text-slate-700">Profile</h1>
    <p class="text-lg mb-2 text-slate-800">
      <strong>Email:</strong> {{ userStore.email }}
    </p>
    <p class="text-lg text-slate-800">
      <strong>App Email Alias:</strong> {{ userStore.appEmailAlias }}
    </p>
  </div>
</template>
