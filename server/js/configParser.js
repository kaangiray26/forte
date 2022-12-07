// configParser.js
const path = require('path')
const fs = require('fs')

module.exports = {
    read: function () {
        let data = fs.readFileSync(path.join(__dirname, '../config.json'))
        return JSON.parse(data)
    }
}