// db.js
const path = require('path')
const fs = require('fs')
const axios = require('axios');

const configParser = require('./configParser')
const mime = require('mime-types')

const mm = require('music-metadata')
const { exit } = require('process')

const pgp = require('pg-promise')()
const db = pgp('postgres://forte@localhost:5432/forte')

var config = configParser.read();

module.exports = {
    init: _init,
    search: _search,
    get_track: _get_track,
}

async function _init(args) {
    if (args.includes('--reset')) {
        console.log("Resetting tables...");
        await db.none("DROP VIEW IF EXISTS fuzzy");
        await db.none("DROP TABLE IF EXISTS artists, albums, tracks, library");
    }

    db.tx('creating_tables', t => {
        console.log("Checking tables...");
        return t.batch([
            t.none("CREATE TABLE IF NOT EXISTS artists (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'artist', title VARCHAR NOT NULL, cover VARCHAR, UNIQUE(title))"),
            t.none("CREATE TABLE IF NOT EXISTS albums (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'album', title VARCHAR NOT NULL, cover VARCHAR, artist SERIAL, nb_tracks SMALLINT, UNIQUE(title, artist))"),
            t.none("CREATE TABLE IF NOT EXISTS tracks (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'track', title VARCHAR NOT NULL, cover VARCHAR, artist SERIAL, album SERIAL, track_position SMALLINT, disc_number SMALLINT, path VARCHAR NOT NULL, UNIQUE(title, artist, album))"),
            t.none("CREATE TABLE IF NOT EXISTS library (id SERIAL PRIMARY KEY, folders VARCHAR[])"),
            t.none("CREATE OR REPLACE VIEW fuzzy AS SELECT artists.id id, artists.type type, artists.title title, artists.cover cover FROM artists UNION SELECT albums.id, albums.type, albums.title, albums.cover FROM albums UNION SELECT tracks.id, tracks.type, tracks.title, tracks.cover FROM tracks;")
        ])
    }).then(() => {
        refresh_library()
    }).catch(error => {
        console.log("An error occured.\n")
        console.log(error)
        exit(1)
    })
}

async function refresh_library() {
    console.log("Checking for any changes...\n");
    let folders = fs.readdirSync(config.library_path);
    db.oneOrNone("SELECT folders from library")
        .then(async function (data) {
            if (!data) {
                await walk_folders(folders);
                await db.none("INSERT INTO library(folders) VALUES ($1)", [folders])
                console.log("\n==> Added a new total of " + folders.length + " folders.");
                console.log("==> Ready.");
                return;
            }

            let changes = folders.filter(folder => !data.folders.includes(folder));
            if (!changes.length) {
                console.log("==> No changes in the library.")
                console.log("==> Ready.");
                return
            }

            await walk_folders(changes);
            await db.none("INSERT INTO library(folders) VALUES ($1)", [folders])
            console.log("\n==> Added a new total of " + changes.length + " folders.");
            console.log("==> Ready.");
        })
    return;
}

async function walk_folders(folders) {
    let cs_artists = new pgp.helpers.ColumnSet(['title', 'cover'], { table: 'artists' });
    let cs_albums = new pgp.helpers.ColumnSet(['title', 'cover', 'artist', 'nb_tracks'], { table: 'albums' });
    let cs_tracks = new pgp.helpers.ColumnSet(['title', 'cover', 'artist', 'album', 'track_position', 'disc_number', 'path'], { table: 'tracks' });

    for (let i = 0; i < folders.length; i++) {
        console.log(`    Adding folder ${i + 1}/${folders.length}...`);
        let folder = folders[i];

        // Get tags
        let tags = await get_tags(path.join(config.library_path, folder));

        // Get tracks
        let tracks = await get_tracks(path.join(config.library_path, folder), tags.album_cover);

        // Insert artist record
        let artist = await get_artist(tags.artist, tags.artist_cover);
        let artist_id = await db.one(pgp.helpers.insert(artist, cs_artists) + ' ON CONFLICT (title) DO UPDATE SET id = artists.id RETURNING id');

        // Insert album records
        let album = await get_album(tags.album, artist_id.id, tracks.length, tags.album_cover);
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
                "date": metadata.common.date,
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

async function get_album(album_title, artist_id, nb_tracks, cover) {
    return { "title": album_title, "artist": artist_id, "nb_tracks": nb_tracks, "cover": cover }
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

async function _search(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.sendStatus(400);
        return;
    }
    console.log("Query:", query);

    db.any("SELECT * FROM fuzzy WHERE (title % $1) ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _get_track(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.sendStatus(400);
        return;
    }
    console.log("Get Track:", id);

    db.oneOrNone("SELECT path FROM tracks WHERE id = $1", [id])
        .then(function (data) {
            res.status(200)
                .sendFile(data.path)
        })
}