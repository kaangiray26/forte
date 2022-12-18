// app.js
import { createSSRApp } from 'vue'
import { createStore } from './store.js'

// called on each request
export function createApp() {
    const app = createSSRApp(/* ... */)
    // create new instance of store per request
    const store = createStore(/* ... */)
    // provide store at the app level
    app.provide('store', store)
    // also expose store for hydration purposes
    return { app, store }
}