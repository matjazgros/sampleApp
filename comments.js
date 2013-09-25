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

//var moment = require('moment');


// Open the connection to the server
 var db = new Db('local', new Server('localhost', 27017));
  // Establish connection to db
  // var comments;
  // db.open(function(err, db) {
  //   assert.equal(null, err);
  //   comments = { hello: 'world' };
  //   //db.on('close', test.done.bind(test));
  //   db.close();
  // });

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
  var obj = {};
  //console.log('body: ' + JSON.stringify(req.body));
 // res.send(req.body);
  db.open(function(err, db) {
    assert.equal(null, err);
    db.collection('iptvbeats', function(err, collection) {
      collection.ensureIndex({"_id":1}, {unique:true}, function(err, indexName) {
      //   console.log(err);
       //  console.log(indexName);
        collection.insert({category_id: req.body.category_id, user_id: req.body.user_id, comment: req.body.comment, date_time: new Date()});
        db.close();
        res.send(req.body);
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

  //socket.emit('comments', { hello: 'world' });
  // socket.on('my other event', function (data) {
  //   console.log(data);
  // });
});
function custom_sort(a, b) {
    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
}

function getComments(socket) {
    db.open(function(err, db) {
      assert.equal(null, err);
      db.collection('iptvbeats', function(err, collection) {
        // var collection_ = collection;
        var comments_ = Array();

        collection.group(
            { "category_id": true },
            {"category_id":  { $exists: true}},
            {
              count: 0,
              comments: []
            },
            function(item, summaries){
              summaries.count++;
              //if(item.category_id != null)
              summaries.comments[summaries.comments.length] = item;
            },
            true,  // use the group command
            function(err, results){ //self.eventEmitter.emit(doneEvent, results)
              if(results.comments !== undefined) 
                 console.log(results.comments)
              //.sort(custom_sort);
              socket.emit('comments', results);
              db.close();
            }
        );
      });
    });    
}