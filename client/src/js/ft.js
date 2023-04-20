// ft.js
// Forte Javascript Library

import { Howl } from 'howler';
import { store } from './store'

class Forte {
    constructor() {
        this.ready = null;
        this.token = null;
        this.server = null;
        this.username = null;
        this.session = null;

        this.track = null;
        this.player = new Howl({
            src: [null],
            format: ['flac', 'mp3', 'ogg', 'wav', 'aac', 'm4a', 'opus', 'webm'],
            preload: true,
            html5: true,
            volume: 1,
        });

        this.player.on('load', () => {
            this.track_loaded()
            this.listen_progress()
            this.track_quality()
            this.track_lyrics()
        });

        this.player.on('end', () => {
            this.track_finished()
        });
    }

    async init() {
        let token = JSON.parse(localStorage.getItem('token'));
        let server = JSON.parse(localStorage.getItem('server'));
        let username = JSON.parse(localStorage.getItem('username'));
        let session = JSON.parse(localStorage.getItem('session'));

        // Set scrobbling
        if (JSON.parse(localStorage.getItem('scrobbling'))) {
            store.scrobbling = true;
        }

        // Get federated servers
        this.get_federated_servers();

        // Check if all data is present
        if (!token || !server || !username) {
            this.ready = false;
            localStorage.setItem('init', JSON.stringify(false));
            return
        }

        this.token = token;
        this.server = server;
        this.username = username;

        // Check session
        if (session) {
            let response = await this.check_session(session);
            if (response.status == "success") {
                this.ready = true;
                this.session = session;
                localStorage.setItem('init', JSON.stringify(true));
                return
            }
        }

        // Create session
        await this.connect(this.server, this.username, this.token);
    }

    async API(query) {
        if (!this.ready) return null;

        let response = await fetch(this.server + '/api' + query + `?session=${this.session}`, {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async fAPI(domain, query) {
        if (!this.ready) return null;

        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;

        let response = await fetch(this.server + '/f/api' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "domain": domain,
                "query": query,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => response.json());

        if (response.hasOwnProperty('error') && response.error == "Federation failed.") {
            localStorage.removeItem(`@${domain}`);
            return this.fAPI(domain, query);
        }

        // Save challenge
        if (response.hasOwnProperty('challenge')) {
            localStorage.setItem(`@${domain}`, JSON.stringify(response.challenge));
        }

        return response;
    }

    async get_user(username, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + `/api/user/${username}/basic?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": username,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async get_federated_tracks(domain, ids) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;

        let response = await fetch(this.server + '/f/api/tracks/basic' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "ids": ids,
                "domain": domain,
                "challenge": challenge,
            }),
            credentials: "include"
        }).then((response) => response.json());

        return response;
    }

    async get_federated_albums(domain, ids) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;

        let response = await fetch(this.server + '/f/api/albums/basic' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "ids": ids,
                "domain": domain,
                "challenge": challenge,
            }),
            credentials: "include"
        }).then((response) => response.json());

        return response;
    }

    async get_federated_artists(domain, ids) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;

        let response = await fetch(this.server + '/f/api/artists/basic' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "ids": ids,
                "domain": domain,
                "challenge": challenge,
            }),
            credentials: "include"
        }).then((response) => response.json());

        return response;
    }

    async get_federated_playlists(domain, ids) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;

        let response = await fetch(this.server + '/f/api/playlists/basic' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "ids": ids,
                "domain": domain,
                "challenge": challenge,
            }),
            credentials: "include"
        }).then((response) => response.json());

        return response;
    }

    async add_friend(username, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + '/api/friends/add' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "id": username,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async remove_friend(username, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + '/api/friends/remove' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "id": username,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async create_playlist(data) {
        let response = await fetch(this.server + '/api/profile/create_playlist' + `?session=${this.session}`, {
            method: "POST",
            body: data,
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async upload_cover(data) {
        let response = await fetch(this.server + '/api/cover' + `?session=${this.session}`, {
            method: "POST",
            body: data,
            credentials: "include"
        }).then((response) => {
            return response.json();
        })
        return response;
    }

    async add_comment(username, type, id, uuid = null, comment) {
        let response = await fetch(this.server + '/api/comments' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": username,
                "type": type,
                "id": id,
                "uuid": uuid,
                "comment": comment
            }),
            credentials: "include"
        })
            .then(response => response.json())
            .catch(error => null);
        return response;
    }

    async add_federated_comment(domain, username, type, id, uuid = null, comment) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;

        let response = await fetch(this.server + '/f/api/comments' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "domain": domain,
                "challenge": challenge,
                "username": username,
                "type": type,
                "id": id,
                "uuid": uuid,
                "comment": comment
            }),
            credentials: "include"
        }).then(response => response.json());

        if (response.hasOwnProperty('error') && response.error == "Federation failed.") {
            localStorage.removeItem(`@${domain}`);
            return this.add_federated_comment(domain, username, type, id, uuid, comment);
        }

        // Save challenge
        if (response.hasOwnProperty('challenge')) {
            localStorage.setItem(`@${domain}`, JSON.stringify(response.challenge));
        }

        return response;
    }

    async check_session(session) {
        return await fetch(this.server + `/api/session/check?session=${session}`)
            .then((response) => {
                localStorage.setItem('offline', JSON.stringify(false));
                return response.json();
            })
            .catch(error => {
                if (error.message.startsWith('NetworkError')) {
                    localStorage.setItem('offline', JSON.stringify(true));
                    return { "status": "error", "message": "Server is down." }
                }
                return { "status": "error" }
            });
    }

    async get_session(server, username, token) {
        let auth = btoa(username + ":" + token);
        return await fetch(server + '/api/session', {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + auth
            }
        }).then((response) => {
            localStorage.setItem('offline', JSON.stringify(false));
            return response.json();
        }).catch((error) => {
            // Check if NetworkError
            if (error.message.startsWith('NetworkError')) {
                localStorage.setItem('offline', JSON.stringify(true));
                return { "status": "error", "message": "Server is down." }
            }
            return { "status": "error" }
        });
    }

    async connect(server, username, token) {
        let response = await this.get_session(server, username, token);
        if (response.status == 'success') {
            this.ready = true;
            this.session = response.session;

            localStorage.setItem('init', JSON.stringify(true));
            localStorage.setItem('session', JSON.stringify(response.session));
            localStorage.setItem('server', JSON.stringify(server));
            localStorage.setItem('username', JSON.stringify(username));
            localStorage.setItem('token', JSON.stringify(token));
            localStorage.setItem('volume', JSON.stringify('1'));
            localStorage.setItem('groupSession', JSON.stringify([]));
            localStorage.setItem('groupSessionID', JSON.stringify(''));
            localStorage.setItem('followed', JSON.stringify([]));
            return true
        }

        if (response.status == 'error') {
            this.ready = false;
            localStorage.setItem('init', JSON.stringify(false));
        }
        return false
    }

    get_cover(cover) {
        if (!cover) {
            return "/images/track.svg"
        }

        if (cover.startsWith("http")) {
            return cover;
        }

        return ft.server + '/' + cover;
    }

    async load_station(station) {
        store.playing.type = 'station';
        store.playing.id = station.guide_id
        store.playing.title = station.text;
        store.playing.cover = station.image;
        store.playing.loaded = true;

        // mediaSession metadata
        navigator.mediaSession.metadata = new MediaMetadata({
            title: station.text,
            artwork: [
                { src: store.playing.cover, sizes: '250x250', type: 'image/jpeg' },
            ]
        });

        // Get station url
        let response = await this.API(`/station/${station.guide_id}/url`);
        if (!response || !response.url) return;

        this.player.unload();
        this.player._src = [response.url];
        this.player.load();
        document.title = station.text;
    }

    async load_track(track) {
        store.playing.id = track.id;
        store.playing.type = track.type;
        store.playing.title = track.title;
        store.playing.cover = track.cover;
        store.playing.album = track.album;
        store.playing.artist = track.artist;
        store.playing.server = null;
        store.playing.loaded = true;

        // Cover
        let cover = this.get_cover(store.playing.cover);

        // mediaSession metadata
        navigator.mediaSession.metadata = new MediaMetadata({
            title: store.playing.title,
            artwork: [
                { src: cover, sizes: '250x250', type: 'image/png' },
            ]
        });

        this.player.unload();
        this.player._src = [ft.server + '/api/stream/' + track.id + `?session=${this.session}`];
        this.player.load();
        document.title = track.title;
    }

    async load_federated_track(track) {
        store.playing.id = track.id;
        store.playing.type = track.type;
        store.playing.title = track.title;
        store.playing.cover = track.cover;
        store.playing.album = track.album;
        store.playing.artist = track.artist;
        store.playing.server = track.server;
        store.playing.loaded = true;

        // Cover
        let cover = this.get_cover(store.playing.cover);

        // mediaSession metadata
        navigator.mediaSession.metadata = new MediaMetadata({
            title: store.playing.title,
            artwork: [
                { src: cover, sizes: '250x250', type: 'image/png' },
            ]
        });

        // Get server address
        let address = await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${track.server}`)
            .then(response => response.json())
            .then(data => data.address)
            .catch(() => null);

        // If server address is not found, return error
        if (!address) {
            return;
        }

        let challenge = JSON.parse(localStorage.getItem(`@${track.server}`));

        this.player.unload();
        this.player._src = [`${address}/f/api/stream/${track.id}?challenge=${challenge}`];
        this.player.load();
        document.title = track.title;
    }

    async track_loaded() {
        store.playing.duration = this.player.duration();
        this.player.play();
        store.playing.is_playing = true;
    }

    async listen_progress() {
        this.player._sounds[0]._node.addEventListener('timeupdate', () => {
            store.playing.seek = ft.player.seek();
            store.playing.progress = (store.playing.seek / store.playing.duration) * 100;
        });
    }

    async track_quality() {
        if (store.playing.type == 'station') {
            store.playing.format = 'audio/mpeg';
            store.playing.bitrate = 128;
            store.playing.quality = 'LQ';
            return;
        }

        let response = await fetch(this.server + `/api/stream/${store.playing.id}` + `?session=${this.session}`, {
            method: "HEAD",
            credentials: "include"
        })

        let length = response.headers.get("content-length");
        let duration = store.playing.duration;
        let kbit = (length * 8) / 1000;

        store.playing.format = response.headers.get("content-type");;
        store.playing.bitrate = Math.round(kbit / duration);;

        if (store.playing.bitrate <= 160) {
            store.playing.quality = "LQ";
            return;
        }
        if (store.playing.bitrate <= 320) {
            store.playing.quality = "SQ";
            return;
        }
        if (store.playing.bitrate <= 1411) {
            store.playing.quality = "HQ";
            return;
        }
        store.playing.quality = "Hi-Res";
    }

    async track_lyrics() {
        if (store.playing.type == 'station') return;
        window.dispatchEvent(new CustomEvent('lyrics'));
    }

    async track_finished() {
        if (store.playing.type == 'station') {
            store.queue_index = 0;
            this.player._sounds[0]._node.pause();
            store.playing.is_playing = false;
            navigator.mediaSession.playbackState = "paused";

            if (store.queue.length) {
                store.queue[0].server ? this.load_federated_track(store.queue[0]) : this.load_track(store.queue[0]);
            }
            return
        }

        let queue = this.getCurrentQueue();
        let track = queue[store.queue_index];

        // With federation
        if (track.server) {
            this.addTrackToHistory(`${track.id}@${track.server}`, track.server);
            this.scrobble(`${track.id}@${track.server}`);
        }
        // Without federation
        else {
            this.addTrackToHistory(track.id);
            this.scrobble(track.id);
        }

        // At the end of the queue
        if (store.queue_index + 1 == queue.length) {
            // Repeat queue
            if (store.playing.repeat == 1) {
                store.queue_index = 0;
                queue[0].server ? this.load_federated_track(queue[0]) : this.load_track(queue[0]);
                return;
            }
            // Repeat track
            if (store.playing.repeat == 2) {
                queue[store.queue_index].server ? this.load_federated_track(queue[store.queue_index]) : this.load_track(queue[store.queue_index]);
                return;
            }
            // Radio
            this.API('/random/track').then((response) => {
                this.load_track(response.track);
                this.addToQueue([response.track]);
                store.queue_index += 1;
            })
            return;
        }

        // Somewhere in the queue
        // Repeat track
        if (store.playing.repeat == 2) {
            queue[store.queue_index].server ? this.load_federated_track(queue[store.queue_index]) : this.load_track(queue[store.queue_index]);
            return;
        }
        store.queue_index += 1;
        queue[store.queue_index].server ? this.load_federated_track(queue[store.queue_index]) : this.load_track(queue[store.queue_index]);
    }

    async mute() {
        store.playing.muted = !store.playing.muted;
        ft.player.mute(store.playing.muted);
    }

    async repeat() {
        store.playing.repeat = (store.playing.repeat + 1) % 3;
    }

    async play() {
        if (!store.playing.loaded) {
            return;
        }

        if (store.playing.is_playing) {
            // howler is inconsistent, using this instead
            this.player._sounds[0]._node.pause();
            //
            store.playing.is_playing = false;
            navigator.mediaSession.playbackState = "paused";
            return;
        }

        // howler is inconsistent, using this instead
        this.player._sounds[0]._node.play();
        //
        store.playing.is_playing = true;
        navigator.mediaSession.playbackState = "playing";
    }

    async play_previous() {
        if (!store.playing.loaded) {
            return;
        }

        // At the start of the queue
        if (store.queue_index == 0) {
            this.seek(0);
            return;
        }

        // Somewhere in the queue
        store.queue_index -= 1;
        let queue = this.getCurrentQueue();
        this.load_track(queue[store.queue_index]);
    }

    async play_next() {
        if (!store.playing.loaded) {
            return;
        }

        // Emit track finished
        this.track_finished();
    }

    async addToQueueStart(tracks) {
        let q = this.getCurrentQueue();
        q.unshift(...tracks);
        this.setCurrentQueue(q);
    }

    async addToQueueNext(tracks) {
        let q = this.getCurrentQueue();
        q.splice(store.queue_index + 1, 0, ...tracks);
        this.setCurrentQueue(q);
    }

    async addToQueue(tracks) {
        let q = this.getCurrentQueue();
        q.push(...tracks);
        this.setCurrentQueue(q);
    }

    async addTrackToPlaylist(track_id, playlist_id, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/add_track` + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "track": track_id,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async addTrackToHistory(track, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + `/api/profile/history/add` + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "track": track,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async scrobble(track, domain = null) {
        if (!store.scrobbling) {
            return;
        }

        let sk = JSON.parse(localStorage.getItem("lastfm_key"));
        if (!sk) {
            return;
        }

        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + '/api/lastfm/scrobble' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "track": track,
                "sk": JSON.parse(sk),
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        }
        );
        return response;
    }

    async playStation(station) {
        store.queue_index = 0;
        this.load_station(station);
    }

    async playTrack(track_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/track/${track_id}/basic`).then((response) => {
                store.queue_index = 0;
                response.track.server = domain;
                this.load_federated_track(response.track);
                this.addToQueueStart([response.track]);
            })
            return;
        }

        this.API(`/track/${track_id}/basic`).then((response) => {
            store.queue_index = 0;
            this.load_track(response.track);
            this.addToQueueStart([response.track]);
        })
    }

    async playTrackNext(track_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/track/${track_id}/basic`).then((response) => {
                response.track.server = domain;
                this.addToQueueNext([response.track]);
            })
            return;
        }

        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueueNext([response.track]);
        })
    }

    async playAlbum(album_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/album/${album_id}/tracks`).then((response => {
                store.queue_index = 0;
                let tracks = response.tracks;
                tracks.map(track => track.server = domain);
                tracks.sort((a, b) => a.track_position - b.track_position);
                tracks.sort((a, b) => a.disc_number - b.disc_number);
                this.load_federated_track(tracks[0]);
                this.addToQueueStart(tracks);
            }))
            return;
        }

        this.API(`/album/${album_id}/tracks`).then((response) => {
            store.queue_index = 0;
            let tracks = response.tracks;
            tracks.sort((a, b) => a.track_position - b.track_position);
            tracks.sort((a, b) => a.disc_number - b.disc_number);
            this.load_track(tracks[0]);
            this.addToQueueStart(tracks);
        })
    }

    async playAlbumNext(album_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/album/${album_id}/tracks`).then((response) => {
                let tracks = response.tracks;
                tracks.map(track => track.server = domain);
                tracks.sort((a, b) => a.track_position - b.track_position);
                tracks.sort((a, b) => a.disc_number - b.disc_number);
                this.addToQueueNext(tracks);
            })
            return
        }

        this.API(`/album/${album_id}/tracks`).then((response) => {
            let tracks = response.tracks;
            tracks.sort((a, b) => a.track_position - b.track_position);
            tracks.sort((a, b) => a.disc_number - b.disc_number);
            this.addToQueueNext(tracks);
        })
    }

    async playPlaylist(playlist_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/playlist/${playlist_id}/tracks`).then((response) => {
                if (!response.tracks.length) return;
                store.queue_index = 0;
                let tracks = response.tracks;
                tracks.map(track => track.server = domain);
                this.load_track(response.tracks[0]);
                this.addToQueueStart(response.tracks);
            })
            return
        }

        this.API(`/playlist/${playlist_id}/tracks`).then((response) => {
            if (!response.tracks.length) return;
            store.queue_index = 0;
            this.load_track(response.tracks[0]);
            this.addToQueueStart(response.tracks);
        })
    }

    async playPlaylistNext(playlist_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/playlist/${playlist_id}/tracks`).then((response) => {
                this.addToQueueNext(response.tracks);
            })
            return
        }

        this.API(`/playlist/${playlist_id}/tracks`).then((response) => {
            this.addToQueueNext(response.tracks);
        })
    }

    async queueTrack(track_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/track/${track_id}/basic`).then((response) => {
                response.track.server = domain;
                this.addToQueue([response.track]);
            })
            return
        }

        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueue([response.track]);
        })
    }

    async queueAlbum(album_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/album/${album_id}/tracks`).then((response) => {
                let tracks = response.tracks;
                tracks.map(track => track.server = domain);
                tracks.sort((a, b) => a.track_position - b.track_position);
                tracks.sort((a, b) => a.disc_number - b.disc_number);
                this.addToQueue(tracks);
            })
            return
        }

        this.API(`/album/${album_id}/tracks`).then((response) => {
            let tracks = response.tracks;
            tracks.sort((a, b) => a.track_position - b.track_position);
            tracks.sort((a, b) => a.disc_number - b.disc_number);
            this.addToQueue(tracks);
        })
    }

    async queuePlaylist(playlist_id, domain = null) {
        // Federated
        if (domain) {
            this.fAPI(domain, `/playlist/${playlist_id}/tracks`).then((response) => {
                this.addToQueue(response.tracks);
            })
            return
        }

        this.API(`/playlist/${playlist_id}/tracks`).then((response) => {
            this.addToQueue(response.tracks);
        })
    }

    async removeQueueTrack(index) {
        let q = this.getCurrentQueue();
        q.splice(index, 1)
        this.setCurrentQueue(q);
    }

    async downloadTrack(track_id, domain = null) {
        if (!this.ready) return null;

        // Federated
        if (domain) {
            // Get server address
            let address = await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${domain}`)
                .then(response => response.json())
                .then(data => data.address)
                .catch(() => null);

            // If server address is not found, return error
            if (!address) {
                return;
            }

            let challenge = JSON.parse(localStorage.getItem(`@${domain}`));

            let response = await fetch(address + '/f/api/stream/' + track_id + `?session=${challenge}`, {
                method: "GET",
                credentials: "include"
            }).then((response) => {
                return response.blob();
            });
            return response;
        }

        let response = await fetch(this.server + '/api/stream/' + track_id + `?session=${this.session}`, {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            return response.blob();
        });
        return response;
    }

    async deletePlaylist(playlist_id) {
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/delete` + `?session=${this.session}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async deleteTrackFromPlaylist(playlist_id, index) {
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/delete_track` + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "index": index
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async love(type, id, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + `/api/${type}/love` + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "id": id,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async unlove(type, id, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + `/api/${type}/unlove` + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "id": id,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async lyrics(artist_id, title, domain = null) {
        // Check for saved challenge
        let challenge = localStorage.getItem(`@${domain}`) ? JSON.parse(localStorage.getItem(`@${domain}`)) : null;
        let response = await fetch(this.server + '/api/lyrics' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "artist": artist_id,
                "title": title,
                "challenge": challenge
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async lastfm_artist_page(artist) {
        let response = await fetch(this.server + '/api/lastfm/artist' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "artist": artist
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async radio() {
        // Disable radio in groupSession
        if (this.inGroupSession()) {
            window.dispatchEvent(new CustomEvent('notify', {
                detail: {
                    "title": "You can't use radio while in a group session."
                }
            }));
            return
        }

        store.playing.radio = !store.playing.radio;
        if (!store.playing.radio) {
            return
        }

        let queue = this.getCurrentQueue();
        if (queue.length == 0) {
            this.API('/random/track').then((response) => {
                this.load_track(response.track);
                this.addToQueue([response.track]);
            });
        }
    }

    // howler is inconsistent, using this instead
    async seek(time) {
        this.player._sounds[0]._node.currentTime = time;
    }

    getCurrentQueue() {
        let queue_key = (store.peer_status == 'connected') ? 'group_queue' : 'queue';
        return store[queue_key];
    }

    inGroupSession() {
        return store.peer_status == 'connected';
    }

    getStore() {
        return store;
    }

    setCurrentQueue(q) {
        let queue_key = (store.peer_status == 'connected') ? 'group_queue' : 'queue';
        store[queue_key] = q;
    }

    reset() {
        store.playing.is_playing = false;
        store.playing.loaded = false;
        store.playing.seek = 0;
        store.playing.progress = 0;
        this.player.unload();

    }

    async lastfm_auth(token) {
        let response = await fetch(this.server + `/api/lastfm/auth` + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "token": token
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async get_address(hostname) {
        return await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${hostname}`)
            .then(response => response.json())
            .then(data => {
                return data.address;
            })
            .catch(() => null);
    }

    async get_federated_servers() {
        // Get federated servers from GitHub
        let url = await fetch("https://api.github.com/repos/kaangiray26/forte/git/trees/servers")
            .then(res => res.json())
            .then(data => data.tree)
            .then(data => data.filter(server => server.path == 'hostnames'))
            .then(data => data[0].url)
            .catch(() => null);
        if (!url) return null;

        let servers = await fetch(url)
            .then(res => res.json())
            .then(data => data.tree)
            .then(data => data.map(server => server.path))
            .catch(() => null);
        if (!servers) return null;

        localStorage.setItem('federated_servers', JSON.stringify(servers));
    }
}

export { Forte }