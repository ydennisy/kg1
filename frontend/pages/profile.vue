<script setup lang="ts">
interface Profile {
  name: string;
}

interface Profile {
  id: string;
  email: string;
  app_email_alias: string;
}

const profile = ref<Profile>({
  id: '',
  email: '',
  app_email_alias: '',
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
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Profile</h1>
    <p class="text-lg mb-2"><strong>Email:</strong> {{ profile.email }}</p>
    <p class="text-lg"><strong>App Email Alias:</strong> {{ profile.app_email_alias }}</p>
  </div>
</template>
