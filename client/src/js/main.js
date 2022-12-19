import { createApp } from 'vue'
import App from '/components/App.vue'
import router from '/router'
import { Forte } from '/js/ft.js'

// Import our custom CSS
import '/scss/styles.scss'
import '/assets/styles.css'

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("/serviceworker.js");
}

window.ft = new Forte();
window.ft.init().then(() => {
    console.log("Forte initialized.");
    createApp(App).use(router).mount('#app');
})
