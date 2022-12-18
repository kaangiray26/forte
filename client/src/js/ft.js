// ft.js
// Forte Javascript Library

import { Howl } from 'howler';
import { getTransitionRawChildren } from 'vue';
import { store } from './store'

class Forte {
    constructor() {
        this.token = null;
        this.server = null;
        this.username = null;

        this.track = null;
        this.player = new Howl({
            src: [null],
            format: ['flac'],
            preload: true,
            html5: true,
            volume: 0.5,
        });

        this.player.on('load', () => {
            this.track_loaded()
        })
        this.player.on('end', () => {
            this.track_finished()
        })
    }

    async init() {
        let token = localStorage.getItem('token');
        let server = localStorage.getItem('server');
        let username = localStorage.getItem('username');

        if (!token || !server || !username) {
            console.log("Not authorized.")
            window.dispatchEvent(new CustomEvent('login', { detail: null }));
            return false;
        }

        this.token = token;
        this.server = server;
        this.username = username;

        let test = await ft.API("/test");
        if (test.hasOwnProperty("error")) {
            await this.reconnect();
        }
        return true;
    }

    async API(query) {
        let response = await fetch(this.server + '/api' + query, {
            method: 'GET',
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async reconnect() {
        let auth = btoa(this.username + ":" + this.token);
        await fetch(this.server + '/api/save_session', {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + auth
            },
            credentials: "include"
        })

        return false
    }

    async connect(server, username, token) {
        let auth = btoa(username + ":" + token);
        let response = await fetch(server + '/api/auth', {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + auth
            },
            credentials: "include"
        }).then((response) => {
            return response.json();
        })

        if (response.hasOwnProperty('success')) {
            localStorage.setItem('server', server);
            localStorage.setItem('username', username);
            localStorage.setItem('token', token);
            localStorage.setItem('volume', '0.5');
            return true
        }

        return false
    }

    async load_track(track) {
        store.playing.id = track.id;
        store.playing.type = track.type;
        store.playing.title = track.title;
        store.playing.cover = track.cover;
        store.playing.loaded = true;
        this.player.unload();
        this.player._src = [ft.server + '/api/stream/' + track.id];
        this.player.load();
    }

    async track_loaded() {
        store.playing.duration = this.player.duration();
        this.player.play();
        store.playing.is_playing = true;
    }

    async track_finished() {
        // At the end of the queue
        if (store.queue_index + 1 == store.queue.length) {
            store.queue_index = 0;
            return;
        }

        // Somewhere in the queue
        store.queue_index += 1;
        this.load_track(store.queue[store.queue_index]);
    }

    async mute() {
        store.playing.muted = !store.playing.muted;
        ft.player.mute(store.playing.muted);
    }

    async play() {
        if (!store.playing.loaded) {
            return;
        }

        if (store.playing.is_playing) {
            this.player.pause();
            store.playing.is_playing = false;
            return;
        }

        this.player.play();
        store.playing.is_playing = true;
    }

    async play_previous() {
        if (!store.playing.loaded) {
            return;
        }

        // At the start of the queue
        if (store.queue_index == 0) {
            return;
        }

        // Somewhere in the queue
        store.queue_index -= 1;
        this.load_track(store.queue[store.queue_index]);
    }

    async play_next() {
        if (!store.playing.loaded) {
            return;
        }

        // At the end of the queue
        if (store.queue_index + 1 == store.queue.length) {
            return;
        }

        // Somewhere in the queue
        store.queue_index += 1;
        this.load_track(store.queue[store.queue_index]);
    }

    async addToQueueStart(tracks) {
        store.queue.unshift(...tracks);
    }

    async addToQueueNext(tracks) {
        store.queue.splice(1, 0, ...tracks);
    }

    async addToQueue(tracks) {
        store.queue.push(...tracks);
    }

    async playTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.load_track(response.track);
            this.addToQueueStart([response.track]);
        })
    }

    async playTrackNext(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueueNext([response.track]);
        })
    }

    async playAlbum(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            this.load_track(response.tracks[0]);
            this.addToQueueStart(response.tracks);
        })
    }

    async playAlbumNext(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            this.addToQueueNext(response.tracks);
        })
    }

    async queueTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueue([response.track]);
        })
    }
}

window.ft = new Forte()