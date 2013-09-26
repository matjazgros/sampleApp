var app = require('express')(), 
    server = require('http').createServer(app),
    io = require('socket.io').listen(server); 

var mongodb = require('mongodb');
var uri = process.env.DATABASE_URL;
var baza;
mongodb.Db.connect(uri, { server: { auto_reconnect: true } }, function (err, db) {
      baza = db;
});
var port = process.env.PORT || 5000;
server.listen(port);
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
//add comment to database
app.post('/addComment', function(req, res) {
  try {
      baza.collection('iptvbeat', function(err, collection) {
        collection.ensureIndex({"_id":1}, {unique:true}, function(err, indexName) {
          collection.insert({category_id: req.body.category_id, user_id: req.body.user_id, comment: req.body.comment, date_time: new Date()}, function(err, db) {
            res.send({successful: true});
          });
        });
      });
  } catch(e) {
    res.send({successful: false});
  }    
});

io.sockets.on('connection', function (socket) {
  socket.emit('comments', getComments(socket));
  var commentsTimer = setInterval(function () {
    getComments(socket);
  }, 1000);

  socket.on('disconnect', function () {
    clearInterval(commentsTimer);
    //baza.close();
  });

  socket.on('addedComment', function () {
    io.sockets.emit('comments', getComments(socket));
  });

});

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

function sortByDate(a, b) {
    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
}

function getComments(socket) {
  try {

      baza.collection('iptvbeat', function(err, collection) {
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
            }
        );
      });
  } catch(e) {
    getComments(socket);
  }    
}