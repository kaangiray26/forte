// db.js
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3')
const configParser = require('./configParser')

let config = configParser.read();
let db = null;

module.exports = {
    init: function () {
        fs.readFile(path.join(__dirname, '../database'), function (err, data) {
            if (err && err.code == 'ENOENT') {
                console.log("Building database...")
                create_database();
            }
        })
    }
}

function list_items() {
    fs.readdir(config.library_path, (err, files) => {
        files.forEach(function (file) {
            let arr = file.split(' - ');
        })
    });
}

function create_database() {
    db = new sqlite3.Database(path.join(__dirname, '../database'));
    // db.run("CREATE TABLE tracks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, duration INTEGER, artist , album)");
    // db.run("CREATE TABLE albums (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, nb_tracks INTEGER, artist )");
    // db.run("CREATE TABLE artists (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, nb_tracks INTEGER, artist )");
    list_items();
}

function query() {
    //
}