const express = require('express')
const cors = require('cors')
const path = require('path')
const configParser = require('./js/configParser')
const db = require('./js/db.js')

const app = express()
const config = configParser.read()

app.use(cors())

app.get("/api/search/:query", db.search)

app.get("/api/track/:id", (req, res) => {
    if (req.params.id == '1') {
        let filepath = path.join(__dirname, '/library/sample.flac')
        res.sendFile(filepath)
        return
    }
    res.send({ "chunk": "Hello World!" })
})

app.listen(config.port, config.host, () => {
    db.init(process.argv.slice(2))
    console.log(`Server:    http://${config.host + ':' + config.port}/`)
});