interface ProfileResponse {
  id: string;
  email: string;
  app_email_alias: string;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    id: '',
    email: '',
    appEmailAlias: '',
    isLoaded: false,
  }),

  actions: {
    async load() {
      if (this.isLoaded) {
        return;
      }
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const token = useSupabaseSession().value?.access_token;
      if (!token) return;
      const { data } = await useFetch<ProfileResponse>(`${apiBase}/api/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.value) {
        this.id = data.value.id;
        this.email = data.value.email;
        this.appEmailAlias = data.value.app_email_alias;
        this.isLoaded = true;
      }
    },
  },
});
