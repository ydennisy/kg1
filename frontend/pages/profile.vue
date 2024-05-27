<script setup lang="ts">
interface Profile {
  name: string;
}

const profile = ref<Profile>({
  name: '',
});

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const fetchProfile = async () => {
  const token = useSupabaseSession().value?.access_token;
  // TODO: handle re-auth
  if (!token) return;
  const { data } = await useFetch<Profile>(`${apiBase}/api/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (data.value) {
    profile.value = data.value;
  }
};

onMounted(async () => {
  await fetchProfile();
});
</script>

<template>
  <p>{{ profile.name }}</p>
</template>
