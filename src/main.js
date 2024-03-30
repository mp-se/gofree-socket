import "bootstrap/dist/css/bootstrap.min.css"
import "@popperjs/core/dist/umd/popper.min.js"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import { createApp } from 'vue'
import App from '@/App.vue'
import '@/registerServiceWorker'

const app = createApp(App)
app.mount('#app')