// store.js

import { reactive } from 'vue';

function isFav(type, id) {
    return JSON.parse(localStorage.getItem('fav_' + type)).includes(id);
}

const store = reactive({
    playing: {
        loaded: false,
        is_playing: false,
        muted: false,
        id: null,
        title: null,
        artist: null,
        album: null,
        cover: null,
        seek: 0,
        duration: 0,
        progress: 0,
    },
    queue: [],
    queue_index: 0,
    selected_track_id: null,
});

export { store, isFav }