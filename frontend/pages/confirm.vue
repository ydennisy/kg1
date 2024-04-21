<script setup lang="ts">
const redirectToPreviousPath = async () => {
  const redirectPath = useCookie('sb-redirect-path');
  console.log('I am trying to redirect!!!', redirectPath);
  if (!redirectPath) {
    await navigateTo('/');
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
