const express = require('express')
const cors = require('cors')
const configParser = require('./js/configParser')
const db = require('./js/db.js')

const app = express()
const config = configParser.read()

app.use(cors())

app.get("/api/search/:query", db.search)
app.get("/api/stream/:id", db.stream)

app.get("/api/track/:id", db.get_track)
app.get("/api/track/:id/basic", db.get_track_basic)

app.get("/api/artist/:id", db.get_artist)

app.get("/api/album/:id", db.get_album)
app.get("/api/album/:id/tracks", db.get_album_tracks)

app.listen(config.port, config.host, () => {
    db.init(process.argv.slice(2))
    console.log(`Server:    http://${config.host + ':' + config.port}/`)
});