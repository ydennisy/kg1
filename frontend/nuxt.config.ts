export default defineNuxtConfig({
  devtools: { enabled: true },
  // NOTE: this would allow moving everything into src!
  // srcDir: "src/",
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@pinia/nuxt'],
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
  alias: {
    // https://stackoverflow.com/questions/74003458/cannot-find-module-pinia-dist-pinia-mjs-when-using-run-dev
    pinia: '/node_modules/@pinia/nuxt/node_modules/pinia/dist/pinia.mjs',
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
