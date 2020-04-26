var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/bonfire', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', function(err) {
    console.warn('Mongoose error: ', err)
});

module.exports = db;
