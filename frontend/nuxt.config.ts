export default defineNuxtConfig({
  devtools: { enabled: true },
  // NOTE: this would allow moving everything into src!
  // srcDir: "src/",
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: '',
      appBase: '',
      supabaseUrl: '',
      supabaseAnonKey: '',
    },
  },
  routeRules: {
    '/': { static: true },
    '/**': { ssr: false },
    '/docs': {
      proxy: 'http://127.0.0.1:8000/docs',
    },
    '/openapi.json': {
      proxy: 'http://127.0.0.1:8000/openapi.json',
    },
  },
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/'],
      cookieRedirect: true,
    },
  },
});
