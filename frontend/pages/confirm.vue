<script setup lang="ts">
const redirectToPreviousPath = async () => {
  const redirectPath = useCookie('sb-redirect-path');
  await navigateTo(redirectPath.value);
};

onMounted(async () => {
  await redirectToPreviousPath();
});
</script>
