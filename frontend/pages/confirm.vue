<script setup lang="ts">
const redirectToPreviousPath = async () => {
  const redirectPath = useCookie('sb-redirect-path');
  if (!redirectPath) {
    await navigateTo('/search');
  }
  await navigateTo(redirectPath.value);
};

onMounted(async () => {
  await redirectToPreviousPath();
});
</script>

<template>
  <p>Redirecting...</p>
</template>
