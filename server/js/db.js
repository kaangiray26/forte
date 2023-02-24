// db.js
const path = require('path')
const fs = require('fs')
var readlineSync = require('readline-sync');
const axios = require('axios')
const crypto = require('crypto')

const mime = require('mime-types')

const mm = require('music-metadata')
const { exit } = require('process')

const pgp = require('pg-promise')()
const db = pgp('postgres://forte@localhost:5432/forte')

module.exports = {
    add_friend: _add_friend,
    add_history: _add_history,
    add_track_to_playlist: _add_track_to_playlist,
    add_user: _add_user,
    admin_login: _admin_login,
    admin_session: _admin_session,
    auth: _auth,
    check_friends: _check_friends,
    create_playlist: _create_playlist,
    delete_playlist: _delete_playlist,
    delete_track_to_playlist: _delete_track_to_playlist,
    get_album: _get_album,
    get_album_loved: _get_album_loved,
    get_album_tracks: _get_album_tracks,
    get_all_albums: _get_all_albums,
    get_artist: _get_artist,
    get_artist_loved: _get_artist_loved,
    get_config: _get_config,
    get_friends: _get_friends,
    get_history: _get_history,
    get_lyrics: _get_lyrics,
    get_playlist: _get_playlist,
    get_playlist_loved: _get_playlist_loved,
    get_playlist_tracks: _get_playlist_tracks,
    get_profile: _get_profile,
    get_profile_albums: _get_profile_albums,
    get_profile_artists: _get_profile_artists,
    get_profile_playlists: _get_profile_playlists,
    get_profile_tracks: _get_profile_tracks,
    get_random_track: _get_random_track,
    get_random_tracks: _get_random_tracks,
    get_track: _get_track,
    get_track_basic: _get_track_basic,
    get_track_loved: _get_track_loved,
    get_user: _get_user,
    get_user_albums: _get_user_albums,
    get_user_artists: _get_user_artists,
    get_user_friends: _get_user_friends,
    get_user_history: _get_user_history,
    get_user_playlists: _get_user_playlists,
    get_user_tracks: _get_user_tracks,
    get_users: _get_users,
    init: _init,
    is_authenticated: _is_authenticated,
    lastfm_auth: _lastfm_auth,
    get_lastfm_auth: _get_lastfm_auth,
    lastfm_scrobble: _lastfm_scrobble,
    get_lastfm_profile: _get_lastfm_profile,
    love_album: _love_album,
    love_artist: _love_artist,
    love_track: _love_track,
    remove_friend: _remove_friend,
    remove_user: _remove_user,
    search: _search,
    search_album: _search_album,
    search_artist: _search_artist,
    search_track: _search_track,
    session: _session,
    stream: _stream,
    unlove_album: _unlove_album,
    unlove_artist: _unlove_artist,
    unlove_track: _unlove_track,
    update_album: _update_album,
    update_artist: _update_artist,
    update_config: _update_config,
    update_track: _update_track,
    upload_cover: _upload_cover,
}

async function _init(args) {
    if (args.includes('--reset')) {
        let answer = readlineSync.question("Do you really want to reset? (y/n)");
        if (answer === 'y') {
            console.log("Resetting tables...");
            await db.none("DROP VIEW IF EXISTS fuzzy");
            await db.none("DROP TABLE IF EXISTS artists, albums, playlists, tracks, library, auth, users");

            console.log("\nRemoving uploads...");
            fs.readdir(path.join(__dirname, "../uploads"), (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(path.join(__dirname, "../uploads", file), (err) => {
                        if (err) throw err;
                    });
                }
            });
            console.log("OK\n")
        }
    }

    db.tx('creating_tables', t => {
        console.log("Checking tables...");
        return t.batch([
            t.none("CREATE TABLE IF NOT EXISTS config (id SERIAL PRIMARY KEY, name TEXT NOT NULL, value TEXT NOT NULL, UNIQUE(name))"),
            t.none("CREATE TABLE IF NOT EXISTS artists (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'artist', title TEXT NOT NULL, cover TEXT, UNIQUE(title))"),
            t.none("CREATE TABLE IF NOT EXISTS albums (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'album', title TEXT NOT NULL, cover TEXT, artist SERIAL, nb_tracks SMALLINT, genre TEXT[], year SMALLINT, date DATE, UNIQUE(title, artist))"),
            t.none("CREATE TABLE IF NOT EXISTS playlists(id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'playlist', title TEXT NOT NULL, cover TEXT, author TEXT, tracks INTEGER[], UNIQUE(title, author))"),
            t.none("CREATE TABLE IF NOT EXISTS tracks (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'track', title TEXT NOT NULL, cover TEXT, artist SERIAL, album SERIAL, track_position SMALLINT, disc_number SMALLINT, path TEXT NOT NULL, UNIQUE(title, artist, album))"),
            t.none("CREATE TABLE IF NOT EXISTS library (id SERIAL PRIMARY KEY, folders VARCHAR[])"),
            t.none("CREATE TABLE IF NOT EXISTS auth (id SERIAL PRIMARY KEY, username TEXT NOT NULL, hash TEXT NOT NULL, UNIQUE(username))"),
            t.none("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT NOT NULL, token TEXT NOT NULL, session TEXT DEFAULT 'null', cover TEXT, history INTEGER[10], fav_tracks INTEGER[], fav_albums INTEGER[], fav_artists INTEGER[], fav_playlists INTEGER[], fav_stations INTEGER[], friends VARCHAR[], lastfm TEXT, UNIQUE(username, token, session))"),
            t.none("CREATE OR REPLACE VIEW fuzzy AS SELECT artists.id id, artists.type type, artists.title title, artists.cover cover FROM artists UNION SELECT albums.id, albums.type, albums.title, albums.cover FROM albums UNION SELECT tracks.id, tracks.type, tracks.title, tracks.cover FROM tracks UNION SELECT playlists.id, playlists.type, playlists.title, playlists.cover FROM playlists UNION SELECT users.id, 'user', users.username, users.cover FROM users;"),
        ])
    }).then(() => {
        db.manyOrNone("SELECT * from config")
            .then(async function (data) {
                if (!data) {
                    await db.none("INSERT INTO config(name, value) VALUES ('password', 'a04fe4e390a7c7d5d4583f85d24e164d')")
                    await db.none("INSERT INTO config(name, value) VALUES ('library_path', '/home/forte/Music')")
                    await db.none("INSERT INTO config(name, value) VALUES ('genius_token', 'TOKEN')")
                    await db.none("INSERT INTO config(name, value) VALUES ('lastfm_api_key', 'TOKEN')")
                    await db.none("INSERT INTO config(name, value) VALUES ('lastfm_api_secret', 'TOKEN')")
                }
            })
        refresh_library()
    }).catch(error => {
        console.log("An error occured.\n")
        console.log(error)
        exit(1)
    })
}

function update_library(library_path) {
    let folders = fs.readdirSync(library_path);
    db.oneOrNone("SELECT folders from library")
        .then(async function (data) {

            if (!data) {
                await walk_folders(folders, library_path);
                await db.none("INSERT INTO library(folders) VALUES ($1)", [folders])
                console.log("\n==> Added a new total of " + folders.length + " folders.");
                return;
            }

            if (folders.length != data.folders.length) {
                console.log("==> The library has changed.");
            }

            // Find out which folders have been added
            let changes = folders.filter(folder => !data.folders.includes(folder));
            if (!changes.length) {
                console.log("==> (Add) No changes in the library.")
            } else {
                await walk_folders(changes, library_path);
                await db.none("UPDATE library SET folders = $1", [folders])
                console.log("\n==> Added a new total of " + changes.length + " folders.");
            }

            // Find out which folders have been removed
            changes = data.folders.filter(folder => !folders.includes(folder));
            if (!changes.length) {
                console.log("==> (Remove) No changes in the library.")
            } else {
                console.log("Folders to remove:", changes)
                await remove_folders(changes);
                await db.none("UPDATE library SET folders = $1", [folders])
                console.log("\n==> Removed a total of " + changes.length + " folders.");
            }
        })
}

async function refresh_library() {
    console.log("Checking for any changes...");
    console.log("This may take a while.\n");

    let library_path = await db.one("SELECT value FROM config WHERE name = 'library_path'");
    update_library(library_path.value);

    // Watch for changes
    console.log("Watching for changes...");
    fs.watch(library_path.value, async function (event) {
        if (event === 'rename') {
            update_library(library_path.value);
        }
    })
}

async function remove_folders(folders) {
    for (let i = 0; i < folders.length; i++) {
        let folder = folders[i];

        db.task(async t => {
            let album = await t.oneOrNone("SELECT * FROM albums WHERE (title % $1) AND similarity(title, $1) > 0.2 LIMIT 1", [folder]);
            let artist_albums = await t.any("SELECT * FROM albums WHERE artist = $1", [album.artist]);

            // If the artist has only one album, remove it
            if (artist_albums.length === 1) {
                await t.none("DELETE FROM artists WHERE id = $1", [album.artist]);
            }

            // Remove the album
            await t.none("DELETE FROM albums WHERE id = $1", [album.id]);

            // Remove the tracks
            await t.none("DELETE FROM tracks WHERE album = $1", [album.id]);
        })
    }
}

async function walk_folders(folders, library_path) {
    let cs_artists = new pgp.helpers.ColumnSet(['title', 'cover'], { table: 'artists' });
    let cs_albums = new pgp.helpers.ColumnSet(['title', 'cover', 'artist', 'nb_tracks', 'genre', 'year', 'date'], { table: 'albums' });
    let cs_tracks = new pgp.helpers.ColumnSet(['title', 'cover', 'artist', 'album', 'track_position', 'disc_number', 'path'], { table: 'tracks' });

    for (let i = 0; i < folders.length; i++) {
        console.log(`    Adding folder ${i + 1}/${folders.length}...`);
        let folder = folders[i];

        // Get tags
        let tags = await get_tags(path.join(library_path, folder));

        // Get tracks
        let tracks = await get_tracks(path.join(library_path, folder), tags.album_cover);

        // Insert artist record
        let artist = await get_artist(tags.artist, tags.artist_cover);
        let artist_id = await db.one(pgp.helpers.insert(artist, cs_artists) + ' ON CONFLICT (title) DO UPDATE SET id = artists.id RETURNING id');

        // Insert album records
        let album = await get_album(tags.album, artist_id.id, tracks.length, tags.album_cover, tags.genre, tags.year, tags.date);
        let album_id = await db.one(pgp.helpers.insert(album, cs_albums) + ' ON CONFLICT (title, artist) DO UPDATE SET id = albums.id RETURNING id');

        // Insert track records
        tracks = update_tracks(tracks, album_id.id, artist_id.id);
        await db.none(pgp.helpers.insert(tracks, cs_tracks) + ' ON CONFLICT (title, artist, album) DO NOTHING');
    }
}

async function get_tags(folderpath) {
    let files = fs.readdirSync(folderpath);

    // Return null if the folder is empty
    if (!files.length) {
        return {};
    }

    // Check for CDs
    let cds = files.filter(f => f.startsWith('CD'));

    // Do CD routine
    if (cds.length) {
        let cd_files = fs.readdirSync(path.join(folderpath, cds[0]));
        return await check_files_for_metadata(cd_files, path.join(folderpath, cds[0]));
    }

    // Do normal routine
    return await check_files_for_metadata(files, folderpath);
}

async function check_files_for_metadata(files, folderpath) {
    for (let file of files) {
        if (mime.lookup(file) && mime.lookup(file).startsWith('audio')) {
            const metadata = await mm.parseFile(path.join(folderpath, file));

            let album_cover = null;
            let artist_cover = null;
            let data = await axios.get(`https://api.deezer.com/search/track?q=${metadata.common.album.toLowerCase() + ' ' + metadata.common.title.toLowerCase()}`);

            if (typeof data.data.data[0] !== "undefined") {
                album_cover = data.data.data[0].album.cover_medium
                artist_cover = data.data.data[0].artist.picture_medium
            }

            return ({
                "artist": metadata.common.artist,
                "album": metadata.common.album,
                "genre": metadata.common.genre,
                "year": metadata.common.year,
                "date": format_date(metadata.common.date),
                "album_cover": album_cover,
                "artist_cover": artist_cover
            })
        }
    }
    return {}
}

function update_tracks(tracks, album_id, artist_id) {
    for (let track of tracks) {
        track.album = album_id;
        track.artist = artist_id;
    }
    return tracks
}

async function get_artist(artist_title, cover) {
    return { "title": artist_title, "cover": cover }
}

async function get_album(album_title, artist_id, nb_tracks, cover, genre, year, date) {
    return { "title": album_title, "artist": artist_id, "nb_tracks": nb_tracks, "cover": cover, "genre": genre, "year": year, "date": date }
}

async function get_tracks(folderpath, cover) {
    let tracks = [];
    let files = fs.readdirSync(folderpath);

    // Return null if the folder is empty
    if (!files.length) {
        return null;
    }

    // Check for CDs
    let cds = files.filter(f => f.startsWith('CD'));

    // Do CD routine
    if (cds.length) {
        // Check for cover
        for (let cd of cds) {
            let cd_files = fs.readdirSync(path.join(folderpath, cd));
            await get_tracks_from(cd_files, tracks, path.join(folderpath, cd), cover);
        }
        return tracks;
    }

    // Do normal routine
    await get_tracks_from(files, tracks, folderpath, cover);
    return tracks;
}

async function get_tracks_from(files, tracks, folderpath, cover) {
    for (let file of files) {
        if (mime.lookup(file) && mime.lookup(file).startsWith('audio')) {
            const metadata = await mm.parseFile(path.join(folderpath, file));
            tracks.push({
                "title": metadata.common.title,
                "track_position": metadata.common.track.no,
                "disc_number": metadata.common.disk.no,
                "path": path.join(folderpath, file),
                "cover": cover
            })
        }
    }
}
/**
 * Formats a year string into the DATE format.
 * @example
 * // returns 2022-01-01
 * format_date(2022)
 * @param {string} dt A string representing a year or a DATE
 * @returns {string} DATE
 */
function format_date(dt) {
    if (new RegExp('^[0-9]{4}$').test(dt)) {
        return dt + "-01-01"
    }
    return dt
}

// API Methods

async function _is_authenticated(session) {
    let user = await db.oneOrNone("SELECT * from users WHERE session = $1", [session]);
    if (!user) {
        return false;
    }

    return true;
}

async function _search(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    db.any("SELECT * FROM fuzzy WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _search_artist(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    db.any("SELECT * FROM artists WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _search_album(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    db.any("SELECT * FROM albums WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _search_track(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    db.any("SELECT * FROM tracks WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _stream(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.oneOrNone("SELECT path FROM tracks WHERE id = $1", [id])
        .then(function (data) {
            res.status(200)
                .sendFile(data.path)
        })
}

async function _get_artist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [id]);
        let albums = await t.manyOrNone("SELECT * FROM albums wHERE artist = $1", [id]);
        res.status(200)
            .send(JSON.stringify({
                "artist": artist,
                "albums": albums
            }))
    })
}

async function _get_config(req, res, next) {
    db.task(async t => {
        let config = await t.manyOrNone("SELECT * FROM config WHERE name != 'password'");
        res.status(200)
            .json({
                "config": config,
            })
    })
}

async function _update_config(req, res, next) {
    if (!['name', 'value'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "name and value are not given."
            });
        return;
    }

    db.task(async t => {
        await t.none("UPDATE config SET value = $1 WHERE name = $2", [req.body.value, req.body.name]);
        res.status(200)
            .json({
                "success": "Config updated."
            })
    })
}

async function _get_album(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let album = await t.oneOrNone("SELECT * FROM albums WHERE id = $1", [id]);
        let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [album.artist]);
        let tracks = await t.manyOrNone("SELECT * FROM tracks wHERE album = $1", [id]);
        res.status(200)
            .send(JSON.stringify({
                "album": album,
                "artist": artist,
                "tracks": tracks
            }))
    })
}

async function _get_album_tracks(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE album = $1", [id]);
        res.status(200)
            .send(JSON.stringify({
                "tracks": tracks
            }))
    })
}

async function _get_track(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [id]);
        let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [track.artist]);
        let album = await t.oneOrNone("SELECT * FROM albums WHERE id = $1", [track.album]);
        res.status(200)
            .send(JSON.stringify({
                "track": track,
                "artist": artist,
                "album": album
            }))
    })
}

async function _get_track_basic(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [id]);
        res.status(200)
            .send(JSON.stringify({
                "track": track
            }))
    })
}

async function _get_track_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_tracks)", [req.session.id, id]);
        if (!loved) {
            res.status(200).json({
                "loved": false
            })
            return;
        }
        res.status(200).json({
            "loved": true
        })
    })
}

async function _get_artist_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_artists)", [req.session.id, id]);
        if (!loved) {
            res.status(200).json({
                "loved": false
            })
            return;
        }
        res.status(200).json({
            "loved": true
        })
    })
}

async function _get_album_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_albums)", [req.session.id, id]);
        if (!loved) {
            res.status(200).json({
                "loved": false
            })
            return;
        }
        res.status(200).json({
            "loved": true
        })
    })
}

async function _get_playlist_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_playlists)", [req.session.id, id]);
        if (!loved) {
            res.status(200).json({
                "loved": false
            })
            return;
        }
        res.status(200).json({
            "loved": true
        })
    })
}

async function _admin_login(req, res, next) {
    if (!['username', 'password'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Not authorized."
            }));
        return;
    }
    let username = req.body.username;
    if (username != "forte") {
        res.status(400)
            .json({
                "error": "Not authorized."
            });
        return;
    }

    let hash = crypto.createHash('md5').update(req.body.password).digest("hex")

    db.task(async t => {
        let user = await t.oneOrNone("SELECT value FROM config WHERE name = 'password' AND value = $1", [hash]);
        if (!user) {
            res.status(400)
                .send(JSON.stringify({
                    "error": "Not authorized."
                }));
            return;
        }
        req.session.user = username;
        res.status(200)
            .send(JSON.stringify({
                "success": username
            }));
    })
}

async function _admin_session(req, res, next) {
    if (!req.session.hasOwnProperty('user')) {
        res.status(400).json({
            "error": "Not authorized."
        })
        return;
    }
    res.status(200).json({
        "username": req.session.user
    })
}

async function _get_users(req, res, next) {
    db.task(async t => {
        let users = await t.manyOrNone("SELECT username, cover FROM users");
        res.status(200)
            .send(JSON.stringify({
                "users": users
            }));
    })
}

async function _add_history(req, res, next) {
    if (!['track'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400).json({
            "error": "Track not given."
        });
        return;
    }
    db.task(async t => {
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track]);
        if (!track) {
            res.status(400).json({
                "error": "Track not found."
            });
            return;
        }
        await t.oneOrNone("UPDATE users SET history = array_prepend($1, history[0:9]) WHERE session = $2", [req.body.track, req.session.id]);
        res.status(200)
            .json({
                "success": "History updated."
            });
    })
}

async function _get_history(req, res, next) {
    db.task(async t => {
        let user = await t.oneOrNone("SELECT history FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({
                "error": "User not found."
            });
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [user.history]);
        res.status(200).json({
            "tracks": tracks
        });
    })
}

async function _get_user_history(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let user = await t.oneOrNone("SELECT history FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({
                "error": "User not found."
            });
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [user.history]);
        res.status(200).json({
            "tracks": tracks
        });
    })
}

async function _add_user(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Username not given."
            }));
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE username = $1", [req.body.username]);
        if (user) {
            res.send(JSON.stringify({
                "error": "Username exists."
            }))
            return
        }

        let token = crypto.randomBytes(16).toString('hex');
        await db.oneOrNone("INSERT INTO users(username, token) VALUES ($1, $2)", [req.body.username, token])
        res.status(200)
            .send(JSON.stringify({
                "success": token
            }))
    })
}

async function _remove_user(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Username not given."
            }));
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE username = $1", [req.body.username]);
        if (!user) {
            res.status(400)
                .send(JSON.stringify({
                    "error": "Username not found."
                }));
            return;
        }

        await db.none("DELETE FROM users WHERE username = $1", [req.body.username])
        res.status(200)
            .send(JSON.stringify({
                "success": ""
            }))
    })
}

async function _auth(req, res, next) {
    if (!['authorization'].every(key => req.headers.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Basic authorization not given."
            }));
        return;
    }
    console.log(req.session.id, "Auth request.");
    let data = req.headers.authorization.split("Basic ")[1];
    let buff = Buffer.from(data, "base64").toString("ascii").split(":");

    db.task(async t => {
        let user = await t.oneOrNone("SELECT * FROM users WHERE username = $1 AND token = $2", buff);
        if (!user) {
            res.status(400)
                .send(JSON.stringify({
                    "error": "Authorization failed."
                }));
            return;
        }
        await t.none("UPDATE users SET session = $1 WHERE username = $2", [req.session.id, buff[0]]);
        res.status(200)
            .send(JSON.stringify({
                "success": "Authorization successful."
            }))
    })
}

async function _session(req, res, next) {
    let auth = await _is_authenticated(req.session.id);
    if (auth) {
        res.status(200).json({ "success": "session up to date." })
        return;
    }

    if (!['authorization'].every(key => req.headers.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Basic authorization not given."
            }));
        return;
    }
    console.log(req.session.id, "Session request.");
    let data = req.headers.authorization.split("Basic ")[1];
    let buff = Buffer.from(data, "base64").toString("ascii").split(':');

    db.task(async t => {
        await t.none("UPDATE users SET session = $1 WHERE username = $2 AND token = $3", [req.session.id, buff[0], buff[1]]);
        res.status(200)
            .send(JSON.stringify({
                "success": "Session refreshed."
            }))
    })
}

async function _get_profile(req, res, next) {
    db.task(async t => {
        let profile = await t.oneOrNone("SELECT username, cover FROM users WHERE session = $1", [req.session.id]);
        if (!profile) {
            res.status(400)
                .json({
                    "error": "User session not up to date."
                });
            return;
        }
        res.status(200)
            .json({
                "profile": profile
            })
    })
}

async function _get_user(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let user = await t.oneOrNone("SELECT username, cover FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." });
            return
        }
        res.status(200).json({
            "user": user
        })
    })
}

async function _upload_cover(req, res, next) {
    db.task(async t => {
        await t.none("UPDATE users SET cover = $1 WHERE session = $2", [req.file.filename, req.session.id]);
        res.status(200)
            .json({
                "cover": req.file.filename
            })
    })
}

async function _update_artist(req, res, next) {
    if (!['id', 'cover', 'title'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Metadata not given."
            });
        return;
    }

    db.task(async t => {
        await t.none("UPDATE artists SET cover = $1, title = $2 WHERE id = $3", [req.body.cover, req.body.title, req.body.id]);
        res.status(200)
            .json({
                "success": "Artist updated."
            })
    })
}

async function _update_album(req, res, next) {
    if (!['id', 'cover', 'title', 'date', 'year', 'genre'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Metadata not given."
            });
        return;
    }

    console.log(req.body.genre)

    db.task(async t => {
        await t.none("UPDATE albums SET cover = $1, title = $2, date = $3, year = $4, genre = ARRAY[$5] WHERE id = $6", [req.body.cover, req.body.title, req.body.date, req.body.year, req.body.genre, req.body.id]);
        await t.none("UPDATE tracks SET cover = $1 WHERE album = $2", [req.body.cover, req.body.id]);
        res.status(200)
            .json({
                "success": "Album updated."
            })
    })
}

async function _update_track(req, res, next) {
    if (!['id', 'cover', 'title'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Metadata not given."
            });
        return;
    }

    db.task(async t => {
        await t.none("UPDATE tracks SET cover = $1, title = $2 WHERE id = $3", [req.body.cover, req.body.title, req.body.id]);
        res.status(200)
            .json({
                "success": "Track updated."
            })
    })
}

async function _get_all_albums(req, res, next) {
    let offset = parseInt(req.headers.offset);
    db.task(async t => {
        let albums = await t.manyOrNone("SELECT * FROM albums ORDER BY random() LIMIT 24");
        res.status(200)
            .json({
                "albums": albums
            })
    })
}

async function _get_random_track(req, res, next) {
    db.task(async t => {
        let track = await t.oneOrNone("SELECT * FROM tracks ORDER BY random() LIMIT 1");
        res.status(200)
            .json({
                "track": track
            })
    })
}

async function _get_random_tracks(req, res, next) {
    db.task(async t => {
        let tracks = await t.manyOrNone("SELECT * FROM tracks ORDER BY random() LIMIT 24");
        res.status(200)
            .json({
                "tracks": tracks
            })
    })
}

async function _get_friends(req, res, next) {
    db.task(async t => {
        let data = await t.oneOrNone("SELECT friends FROM users WHERE session = $1", [req.session.id]);
        let friends = await t.manyOrNone("SELECT id, username, cover FROM users WHERE username = ANY($1)", [data.friends]);
        res.status(200).json({
            "friends": friends
        })
    })
}

async function _check_friends(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT friends FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." });
            return
        }

        if (!user.friends) {
            res.status(200).json({
                "friend": false
            })
            return
        }

        let friend = user.friends.includes(id);
        res.status(200).json({
            "friend": friend
        })
    })
}

async function _get_user_friends(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let data = await t.oneOrNone("SELECT friends FROM users WHERE username = $1", [id]);
        let friends = await t.manyOrNone("SELECT id, username, cover FROM users WHERE username = ANY($1)", [data.friends]);
        res.status(200).json({
            "friends": friends
        })
    })
}

async function _add_friend(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Username not given."
            });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT id FROM users WHERE username = $1", [req.body.username]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        await t.none("UPDATE users SET friends = array_append(friends, $1) WHERE session = $2", [req.body.username, req.session.id]);
        res.status(200).json({ "success": "Friend addded." })
    })
}

async function _remove_friend(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Username not given."
            });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT id FROM users WHERE username = $1", [req.body.username]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        await t.none("UPDATE users SET friends = array_remove(friends, $1) WHERE session = $2", [req.body.username, req.session.id]);
        res.status(200).json({ "success": "Friend removed." })
    })
}

async function _get_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let playlist = await t.oneOrNone("SELECT * from playlists WHERE id = $1", [id]);
        if (!playlist) {
            res.status(400).json({ "error": "Playlist not found." })
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [playlist.tracks]);
        res.status(200).json({ "playlist": playlist, "tracks": tracks })
    })
}

async function _get_profile_playlists(req, res, next) {
    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        let playlists = await t.manyOrNone("SELECT * FROM playlists WHERE author = $1", [user.username]);
        res.status(200).json({ "playlists": playlists })
    })
}

async function _get_profile_tracks(req, res, next) {
    db.task(async t => {
        let offset = req.params.offset;
        if (!offset) {
            res.status(400).json({ "error": "Offset parameter not given." });
            return;
        }
        let user = await t.oneOrNone("SELECT fav_tracks FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_tracks) {
            res.status(200).json({ "tracks": [], "total": 0 })
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_tracks, offset]);
        res.status(200).json({ "tracks": tracks, "total": user.fav_tracks.length })
    })
}

async function _get_user_tracks(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT fav_tracks FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_tracks) {
            res.status(200).json({ "tracks": [], "total": 0 })
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_tracks, offset]);
        res.status(200).json({ "tracks": tracks, "total": user.fav_tracks.length })
    })
}

async function _get_user_albums(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT fav_albums FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_albums) {
            res.status(200).json({ "albums": [], "total": 0 })
            return;
        }
        let albums = await t.manyOrNone("SELECT * FROM albums WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_albums, offset]);
        res.status(200).json({ "albums": albums, "total": user.fav_albums.length })
    })
}

async function _get_user_artists(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT fav_artists FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_artists) {
            res.status(200).json({ "artists": [], "total": 0 })
            return;
        }
        let artists = await t.manyOrNone("SELECT * FROM artists WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_artists, offset]);
        res.status(200).json({ "artists": artists, "total": user.fav_artists.length })
    })
}

async function _get_user_playlists(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let playlists = await t.manyOrNone("SELECT * FROM playlists WHERE author = $1", [id]);
        res.status(200).json({ "playlists": playlists })
    })
}

async function _get_profile_albums(req, res, next) {
    db.task(async t => {
        let offset = req.params.offset;
        if (!offset) {
            res.status(400).json({ "error": "Offset parameter not given." });
            return;
        }
        let user = await t.oneOrNone("SELECT fav_albums FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_albums) {
            res.status(200).json({ "albums": [], "total": 0 })
            return;
        }
        let albums = await t.manyOrNone("SELECT * FROM albums WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_albums, offset]);
        res.status(200).json({ "albums": albums, "total": user.fav_albums.length })
    })
}

async function _get_profile_artists(req, res, next) {
    db.task(async t => {
        let offset = req.params.offset;
        if (!offset) {
            res.status(400).json({ "error": "Offset parameter not given." });
            return;
        }
        let user = await t.oneOrNone("SELECT fav_artists FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_artists) {
            res.status(200).json({ "artists": [], "total": 0 })
            return;
        }
        let artists = await t.manyOrNone("SELECT * FROM artists WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_artists, offset]);
        res.status(200).json({ "artists": artists, "total": user.fav_artists.length })
    })
}

async function _create_playlist(req, res, next) {
    let body = JSON.parse(JSON.stringify(req.body));
    let cover = req.file ? req.file.filename : null;

    if (!['title'].every(key => body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Playlist name not given."
            }));
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        let playlist = await t.oneOrNone("SELECT id FROM playlists WHERE title = $1 AND author = $2", [body.title, user.username]);
        if (playlist) {
            res.status(400).json({ "error": "Playlist exists." })
            return;
        }

        let response = await t.oneOrNone("INSERT INTO playlists (title, cover, author) VALUES ($1, $2, $3) RETURNING id", [body.title, cover, user.username]);
        res.status(200).json({ "playlist_id": response.id })
    })
}

async function _add_track_to_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    if (!['track'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Track not given."
            }));
        return;
    }

    db.task(async t => {
        // Checking if the track exists
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track]);
        if (!track) {
            res.status(400).json({ "error": "Track not found." })
            return;
        }

        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Add to playlist
        await t.none("UPDATE playlists SET tracks = array_append(tracks, $1) WHERE id = $2 AND author = $3", [req.body.track, id, user.username]);
        res.status(200).json({ "success": "Track addded." })
    })
}

async function _delete_track_to_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    if (!['track'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Track not given."
            }));
        return;
    }

    db.task(async t => {
        // Checking if the track exists
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track]);
        if (!track) {
            res.status(400).json({ "error": "Track not found." })
            return;
        }

        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Add to playlist
        await t.none("UPDATE playlists SET tracks = array_remove(tracks, $1) WHERE id = $2 AND author = $3", [req.body.track, id, user.username]);
        res.status(200).json({ "success": "Track removed." })
    })
}

async function _get_playlist_tracks(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let playlist = await t.oneOrNone("SELECT * from playlists WHERE id = $1", [id]);
        if (!playlist) {
            res.status(400).json({ "error": "Playlist not found." })
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [playlist.tracks]);
        res.status(200)
            .send(JSON.stringify({
                "tracks": tracks
            }))
    })
}

async function _delete_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Delete playlist
        await t.none("DELETE FROM playlists WHERE id = $1 AND author = $2", [id, user.username]);
        res.status(200).json({ "success": "Playlist deleted." })
    })
}

async function _love_track(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Get track
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [id]);
        if (!track) {
            res.status(400).json({ "error": "Track not found." })
            return;
        }

        // Add track to loved
        await t.none("UPDATE users SET fav_tracks = array_append(fav_tracks, $1) WHERE username = $2", [id, user.username]);
        res.status(200).json({ "success": "Track added to loved." })
    })
}

async function _unlove_track(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Get track
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [id]);
        if (!track) {
            res.status(400).json({ "error": "Track not found." })
            return;
        }

        // Add track to loved
        await t.none("UPDATE users SET fav_tracks = array_remove(fav_tracks, $1) WHERE username = $2", [id, user.username]);
        res.status(200).json({ "success": "Track removed from loved." })
    })
}

async function _love_artist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Get artist
        let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [id]);
        if (!artist) {
            res.status(400).json({ "error": "Artist not found." })
            return;
        }

        // Add artist to loved
        await t.none("UPDATE users SET fav_artists = array_append(fav_artists, $1) WHERE username = $2", [id, user.username]);
        res.status(200).json({ "success": "Artist added to loved." })
    })
}

async function _unlove_artist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Get artist
        let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [id]);
        if (!artist) {
            res.status(400).json({ "error": "Artist not found." })
            return;
        }

        // Remove artist from loved
        await t.none("UPDATE users SET fav_artists = array_remove(fav_artists, $1) WHERE username = $2", [id, user.username]);
        res.status(200).json({ "success": "Artist removed from loved." })
    })
}

async function _love_album(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Get album
        let album = await t.oneOrNone("SELECT * FROM albums WHERE id = $1", [id]);
        if (!album) {
            res.status(400).json({ "error": "Album not found." })
            return;
        }

        // Add album to loved
        await t.none("UPDATE users SET fav_albums = array_append(fav_albums, $1) WHERE username = $2", [id, user.username]);
        res.status(200).json({ "success": "Album added to loved." })
    })
}

async function _unlove_album(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        // Get user
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.session.id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        // Get album
        let album = await t.oneOrNone("SELECT * FROM albums WHERE id = $1", [id]);
        if (!album) {
            res.status(400).json({ "error": "Album not found." })
            return;
        }

        // Remove album from loved
        await t.none("UPDATE users SET fav_albums = array_remove(fav_albums, $1) WHERE username = $2", [id, user.username]);
        res.status(200).json({ "success": "Album removed from loved." })
    })
}

async function _get_lyrics(req, res, next) {
    if (!['artist', 'title'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Parameters not given correctly."
            }));
        return;
    }

    db.task(async t => {
        // Get artist
        let artist = await t.oneOrNone("SELECT title FROM artists WHERE id = $1", [req.body.artist]);
        if (!artist) {
            res.status(400).json({ "error": "Artist not found." })
            return;
        }

        let genius_token = await t.one("SELECT value FROM config WHERE name = 'genius_token'");
        let data = await fetch(`https://api.genius.com/search/?q=${encodeURI([artist.title, req.body.title])}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + genius_token.value
            }
        }).then((res) => res.json());


        if (!data.response.hits.length) {
            res.status(400).json({ "error": "No lyrics found." });
            return
        }

        let lyric = await fetch(data.response.hits[0].result.url, {
            method: 'GET',
        }).then((res) => res.text());

        res.status(200).json({ "lyrics": lyric })
    })
}

async function _lastfm_auth(req, res, next) {
    if (!['token'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Parameters not given correctly."
            }));
        return;
    }

    db.task(async t => {
        let lastfm_api = await t.many("SELECT value FROM config WHERE name = 'lastfm_api_key' OR name = 'lastfm_api_secret'");
        let signature = crypto.createHash('md5').update(
            "api_key" + lastfm_api[0].value + "methodauth.getSessiontoken" + req.body.token + lastfm_api[1].value,
        ).digest("hex");

        let response = await fetch("https://ws.audioscrobbler.com/2.0/?" + new URLSearchParams({
            method: 'auth.getSession',
            format: 'json',
            token: req.body.token,
            api_key: lastfm_api[0].value,
            api_sig: signature
        }), {
            method: 'GET',
        }).then((res) => res.json());

        if (response.hasOwnProperty('session')) {
            await t.none("UPDATE users SET lastfm = $1 WHERE session = $2", [response.session.name, req.session.id]);
            res.status(200).json({
                "key": response.session.key,
                "username": response.session.name
            });
            return
        }

        res.status(400).json({ "error": "Unauthorized" });
    })
}

async function _get_lastfm_auth(req, res, next) {
    db.task(async t => {
        let lastfm = await t.oneOrNone("SELECT value FROM config WHERE name = 'lastfm_api_key'");
        if (!lastfm.value) {
            res.status(400).json({ "error": "Last.fm API key isn't set." })
            return;
        }

        res.status(200).json({ "api_key": lastfm.value });
    })
}

async function _lastfm_scrobble(req, res, next) {
    if (!['track', 'sk'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Parameters not given correctly."
            }));
        return;
    }

    db.task(async t => {
        let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track]);
        if (!track) {
            res.status(400).json({ "error": "Track not found." })
            return;
        }

        let artist = await t.oneOrNone("SELECT title FROM artists WHERE id = $1", [track.artist]);
        if (!artist) {
            res.status(400).json({ "error": "Artist not found." })
            return;
        }

        let lastfm_api = await t.many("SELECT value FROM config WHERE name = 'lastfm_api_key' OR name = 'lastfm_api_secret'");
        let params = {
            method: 'track.scrobble',
            artist: artist.title,
            track: track.title,
            timestamp: Math.floor(Date.now() / 1000),
            api_key: lastfm_api[0].value,
            sk: req.body.sk,
        }

        let sig = get_api_sig(params, lastfm_api[1].value);
        params['api_sig'] = sig;
        params['format'] = 'json';

        let response = await fetch("https://ws.audioscrobbler.com/2.0/", {
            method: 'POST',
            body: new URLSearchParams(params)
        }).then((res) => {
            return res.json()
        });

        if (response.scrobbles['@attr'].accepted) {
            res.status(200).json({ "success": "Scrobbled" });
            return
        }

        res.status(400).json({ "error": "Scrobble failed." });
    })
}

async function _get_lastfm_profile(req, res, next) {
    let username = req.params.username;
    if (!username) {
        res.status(400).json({ "error": "Username parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT lastfm FROM users WHERE username = $1", [username]);
        if (!user) {
            res.status(400).json({ "error": "User not found." });
            return;
        }

        res.status(200).json({ "lastfm": user.lastfm });
    })
}

function get_api_sig(obj, sig) {
    let keys = Object.keys(obj);
    keys.sort();
    let str = '';
    for (let i = 0; i < keys.length; i++) {
        str += keys[i] + obj[keys[i]];
    }
    str += sig;
    return crypto.createHash('md5').update(str).digest("hex");
}