var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server); 

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

// Open the connection to the server
 var db = new Db('local', new Server('localhost', 27017));

server.listen(8080);
var express=require('express');
app.configure(function () {
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use('/js', express.static(__dirname + '/js'));
    app.use(app.router);    
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/task.html');
});

app.post('/addComment', function(req, res){
  db.open(function(err, db) {
    assert.equal(null, err);
    db.collection('iptvbeats', function(err, collection) {
      collection.ensureIndex({"_id":1}, {unique:true}, function(err, indexName) {
        collection.insert({category_id: req.body.category_id, user_id: req.body.user_id, comment: req.body.comment, date_time: new Date()});
        db.close();
        res.send({successful: true});
      });

     
    });
  });

});

io.sockets.on('connection', function (socket) {
  socket.emit('comments', getComments(socket));
  var commentsTimer = setInterval(function () {
    getComments(socket);
  }, 5000);

  socket.on('disconnect', function () {
    clearInterval(commentsTimer);
  });

  socket.on('addedComment', function () {
    socket.emit('comments', getComments(socket));
  });

});

function sortByDate(a, b) {
    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
}

function getComments(socket) {
  try {
    db.open(function(err, db) {
      assert.equal(null, err);
      db.collection('iptvbeats', function(err, collection) {
        collection.group(
            { "category_id": true },
            { "category_id": { $exists: true}},
            {
              count: 0,
              comments: []
            },
            function(item, summaries){
              summaries.count++;
              summaries.comments[summaries.comments.length] = item;
            },
            true,  
            function(err, results){ 
                //sort comments
                for (var i in results) {
                  category = results[i];
                  category.comments.sort(sortByDate);
                }
              
              socket.emit('comments', results);
              db.close();
            }
        );
      });
    });
  } catch(e) {
    db.close();
    getComments(socket);
  }    
}