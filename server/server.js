const express = require('express')
const session = require('express-session')

const cors = require('cors')
const path = require('path')
const crypto = require('crypto')

const configParser = require('./js/configParser')
const db = require('./js/db.js')

const app = express()
const config = configParser.read()

app.use(cors({ credentials: true, origin: true }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
}))

app.use(express.static('public/assets'))

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user == 'forte') next()
    else next('route')
}

function isAuthenticated(req, res, next) {
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

app.get("/api/search/:query", isAuthenticated, db.search)
app.get("/api/stream/:id", isAuthenticated, db.stream)

app.get("/api/auth", db.auth)
app.get("/api/save_session", db.auth)

app.get("/api/track/:id", isAuthenticated, db.get_track)
app.get("/api/track/:id/basic", isAuthenticated, db.get_track_basic)

app.get("/api/artist/:id", isAuthenticated, db.get_artist)

app.get("/api/album/:id", isAuthenticated, db.get_album)
app.get("/api/album/:id/tracks", isAuthenticated, db.get_album_tracks)

app.listen(config.port, config.host, () => {
    db.init(process.argv.slice(2))
    console.log(`Server:    http://${config.host + ':' + config.port}/`)
});