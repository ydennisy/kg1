import { defineStore } from 'pinia';

interface Profile {
  id: string;
  email: string;
  app_email_alias: string;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    id: '',
    email: '',
    app_email_alias: '',
  }),
  actions: {
    async fetchUserData() {
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const token = useSupabaseSession().value?.access_token;
      if (!token) return;
      const { data } = await useFetch<Profile>(`${apiBase}/api/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.value) {
        this.id = data.value.id;
        this.email = data.value.email;
        this.app_email_alias = data.value.app_email_alias;
      }
    },
  },
});