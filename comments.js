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

io.sockets.on('connection', function (socket) {
  socket.emit('comments', getCommentsCount(socket));
  var commentsTimer = setInterval(function () {
    // getCommentsCount(function (commentsData) {
    //   socket.emit('comments', commentsData);
    // });
  getCommentsCount(socket)

  }, 10000);

  socket.on('disconnect', function () {
    clearInterval(commentsTimer);
  });

  //socket.emit('comments', { hello: 'world' });
  // socket.on('my other event', function (data) {
  //   console.log(data);
  // });
});

function getCommentsCount(socket) {
    db.open(function(err, db) {
    assert.equal(null, err);
    db.collection('iptvbeats', function(err, collection) {
        
        // collection.find({}, function(err, comments) {
        //       if( err || !comments) console.log("No comments found");
        //       else comments.each( function(comment) {
        //         console.log(comment);
        //       } );
        //         db.close();
        //     });

      var comments_ = Array();
      collection.aggregate([
        {$group : {
          '_id' : '$category_id',
          'count' : {$sum : 1}
        }}],
        function (err, items){

          items.forEach(function(item){
            category = {};
            category.total = item.count;
            category.category_id = item._id;
            category.comments =  [{
                    mail: "matjaz@grosek.si",
                    time: "28.9.2013 13:24",
                    comment: "111to je vsebina komentarja"
                  },{
                    mail: "matjaz@grosek.si",
                    time: "28.9.2013 13:24",
                    comment: "222to je vsebina komentarja"
                  },{
                    mail: "matjaz@grosek.si",
                    time: "28.9.2013 13:24",
                    comment: "33to je vsebina komentarja"
                  },{
                    mail: "matjaz@grosek.si",
                    time: "28.9.2013 13:24",
                    comment: "44to je vsebina komentarja"
                  },{
                    mail: "matjaz@grosek.si",
                    time: "28.9.2013 13:24",
                    comment: "156to je vsebina komentarja"
                  }];

            comments_.push(category);
          })
          db.close();
          socket.emit('comments', comments_);
        });
    });
  });    
}