const express = require('express')
const cors = require('cors')
const configParser = require('./js/configParser')
const db = require('./js/db.js')

const app = express()
const config = configParser.read()

app.use(cors())

app.get("/api/search/:query", db.search)

app.get("/api/track/:id", db.get_track)

app.get("/api/artist/:id", db.get_artist)

app.get("/api/album/:id", db.get_album)

app.listen(config.port, config.host, () => {
    db.init(process.argv.slice(2))
    console.log(`Server:    http://${config.host + ':' + config.port}/`)
});