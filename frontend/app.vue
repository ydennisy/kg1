<script setup lang="ts">
import { useUserStore } from './stores/userStore';

const userStore = useUserStore();

onMounted(async () => {
  await userStore.fetchUserData();
});
</script>