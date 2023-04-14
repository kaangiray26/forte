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
        repeat: 0,
        duration: 0,
        progress: 0,
        radio: false,
        bitrate: 0,
        format: null,
        quality: 'LQ',
        server: null,
    },
    queue: [],
    queue_index: 0,
    group_queue: [],
    func_stack: [],
    selected_track_id: null,
    peer_status: 'disconnected',
    scrobbling: false,
    notifications_granted: false,
    notifications_enabled: false,
    theme: 'light',
});

export { store, isFav }