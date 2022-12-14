// store.js

import { reactive } from 'vue';

const store = reactive({
    playing: {
        loaded: false,
        is_playing: false,
        id: null,
        title: null,
        artist: null,
        album: null,
        cover: null,
        duration: 0
    }
});

export { store }