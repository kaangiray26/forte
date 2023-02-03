const express = require('express')
const session = require('express-session')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

const cors = require('cors')
const path = require('path')
const crypto = require('crypto')
const db = require('./js/db.js')

const app = express()

app.use(cors({ credentials: true, origin: true }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
}))

app.use(express.static('public/assets'))
app.use(express.static('uploads'))

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user == 'forte') next()
    else next('route')
}

function isAuthenticated(req, res, next) {
    console.log(req.session.id, req.originalUrl);
    db.is_authenticated(req.session.id).then((ok) => {
        if (ok) next()
        else res.status(401).json({ "error": "session expired." })
    })
}

app.get("/", isAdmin, (req, res, next) => {
    res.sendFile(path.join(__dirname, '/public/index.html'))
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html'))
})

app.post("/login", db.login)

app.get("/log_off", (req, res, next) => {
    req.session.user = null
    res.sendStatus(200)
})

app.get("/get_users", isAdmin, db.get_users)

app.post("/add_user", isAdmin, db.add_user)

app.post("/remove_user", isAdmin, db.remove_user)

// API

app.get("/api/test", isAuthenticated, (req, res, next) => {
    res.status(200).json({ "success": "session up to date." })
})

app.get("/api/auth", db.auth)
app.get("/api/session", db.session)

app.post("/api/cover", isAuthenticated, upload.single('cover'), db.upload_cover)

app.get("/api/search/:query", isAuthenticated, db.search)
app.get("/api/stream/:id", isAuthenticated, db.stream)

app.get("/api/profile/", isAuthenticated, db.get_profile)
app.get("/api/profile/history", isAuthenticated, db.get_history)
app.post("/api/profile/history/add", isAuthenticated, db.add_history)
app.get("/api/profile/tracks/:offset", isAuthenticated, db.get_profile_tracks)
app.get("/api/profile/albums/:offset", isAuthenticated, db.get_profile_albums)
app.get("/api/profile/artists/:offset", isAuthenticated, db.get_profile_artists)
app.get("/api/profile/playlists", isAuthenticated, db.get_profile_playlists)
app.post("/api/profile/create_playlist", isAuthenticated, upload.single('cover'), db.create_playlist)

app.get("/api/user/:id", isAuthenticated, db.get_user)

app.get("/api/track/:id", isAuthenticated, db.get_track)
app.get("/api/track/:id/basic", isAuthenticated, db.get_track_basic)
app.get("/api/track/:id/love", isAuthenticated, db.love_track)
app.get("/api/track/:id/unlove", isAuthenticated, db.unlove_track)
app.get("/api/track/:id/loved", isAuthenticated, db.get_track_loved)

app.get("/api/artist/:id", isAuthenticated, db.get_artist)
app.get("/api/artist/:id/love", isAuthenticated, db.love_artist)
app.get("/api/artist/:id/unlove", isAuthenticated, db.unlove_artist)
app.get("/api/artist/:id/loved", isAuthenticated, db.get_artist_loved)

app.get("/api/album/:id", isAuthenticated, db.get_album)
app.get("/api/album/:id/tracks", isAuthenticated, db.get_album_tracks)
app.get("/api/album/:id/love", isAuthenticated, db.love_album)
app.get("/api/album/:id/unlove", isAuthenticated, db.unlove_album)
app.get("/api/album/:id/loved", isAuthenticated, db.get_album_loved)

app.get("/api/all/albums", isAuthenticated, db.get_all_albums)
app.get("/api/random/tracks", isAuthenticated, db.get_random_tracks)

app.get("/api/friends", isAuthenticated, db.get_friends)
app.post("/api/friends/add", isAuthenticated, db.add_friend)

app.get("/api/playlist/:id", isAuthenticated, db.get_playlist)
app.get("/api/playlist/:id/delete", isAuthenticated, db.delete_playlist)
app.get("/api/playlist/:id/tracks", isAuthenticated, db.get_playlist_tracks)
app.post("/api/playlist/:id/add_track", isAuthenticated, db.add_track_to_playlist)
app.post("/api/playlist/:id/delete_track", isAuthenticated, db.delete_track_to_playlist)
app.get("/api/playlist/:id/loved", isAuthenticated, db.get_playlist_loved)

app.post("/api/lyrics", isAuthenticated, db.get_lyrics)

//

app.listen(3000, 'localhost', () => {
    db.init(process.argv.slice(2))
    console.log(`Server:    http://localhost:3000/`)
});