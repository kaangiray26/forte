// ft.js
// Forte Javascript Library

import { Howl } from 'howler';
import { store } from './store'

class Forte {
    constructor() {
        this.server = "http://192.168.178.20:3000";
        this.track = null;

        this.player = new Howl({
            src: [null],
            format: ['flac'],
            preload: true,
            html5: true,
            volume: 0.5,
        });

        this.player.on('load', this.track_loaded)
    }

    async API(query) {
        let response = await fetch(this.server + '/api' + query, {
            method: 'GET',
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async load_track(track) {
        store.playing.id = track.id;
        store.playing.type = track.type;
        store.playing.title = track.title;
        store.playing.cover = track.cover;
        store.playing.loaded = true;
    }

    async track_loaded() {
        store.playing.duration = this.duration();
        this.play();
        store.playing.is_playing = true;
    }

    async addToQueueStart(tracks) {
        store.queue.unshift(...tracks);
    }

    async addToQueue(tracks) {
        store.queue.push(...tracks);
    }

    /**
     * Plays the track from its ID
     * @param {number} track_id ID of the track
     */
    async playTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.load_track(response.track);
            this.player.unload();
            this.player._src = [ft.server + '/api/stream/' + response.track.id];
            this.player.load();
            this.addToQueueStart([response.track]);
        })
    }

    /**
     * Plays the album from its ID
     * @param {number} album_id ID of the album
     */
    async playAlbum(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            this.load_track(response.tracks[0]);
            this.player.unload();
            this.player._src = [ft.server + '/api/stream/' + response.tracks[0].id];
            this.player.load();
            this.addToQueueStart(response.tracks);
        })
    }

    async queueTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueue([response.track]);
        })
    }
}

window.ft = new Forte()