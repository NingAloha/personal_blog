import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

import { initLocale } from './i18n'

initLocale()

createApp(App).use(router).mount('#app')
