var app = require('express')(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs'),
    request = require('request');
    var longitude;
    var latitude;
    var destLng;
    var destLat;

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function(pseudo) {
      pseudo = ent.encode(pseudo);
      socket.pseudo = pseudo;
      socket.broadcast.emit('nouveau_client', pseudo);

    });
    socket.on('msgYtb', function (message) {
      var keyWord = message.substr(9);
      request({
        url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + keyWord + '&key=AIzaSyBHUsxQvMVXD95PK5ewUz6xw7ZCes2QnIk', json: true
      }, function(err, res, json) {
        if (err) {
          throw err;
        } else {
          var test = json.items;
          var idYoutube = [];

          for(var j=0; j < test.length; j++){
           socket.emit('msgYtb', test[j].id.videoId);

         }   
       }
     });
    });

    socket.on('uber', function (message) {

      const callDestPosition = (query, callback) => {
        const destinations = [];
        const params = {
          url: 'https://maps.googleapis.com/maps/api/geocode/json?address=paris+14&key=AIzaSyD_cHHLJDfVdhAMorhXUu_-CEJu9FcJGrc', 
          json: true
        }

        request(params, (err, res, json) => {
          if (err) {
            throw err;
          }

          for (let i = 0; i <1 ; i += 1){
            destinations.push(json.results[0].geometry.location);
          }
          console.log("destinations:  " + destinations);
          callback(destinations);
        });

        return;
      }

      callDestPosition('yoda', destinations => {
        console.log('dessssss' + destinations[0].lat);
        var options = {
          method: 'GET',
          url: 'https://api.uber.com/v1.2/estimates/price',
          qs: {
            start_longitude: message[1],
            start_latitude: message[0], 
            end_latitude: destinations[0].lat,
            end_longitude: destinations[0].lng
          },
          headers:{
            'Authorization': 'Token ' + 'aBxZ-6xJF5xCegAjjXXSMNCy_fI0SCKXbPq86PkZ',
            'Accept-Language': 'en_US',
            'Content-Type':  'application/json'
          } 
        };

        request(options, function (error, response, body) {
          if (error) return  console.error('Failed: %s', error.message);

          else {
            let jsonUber = JSON.parse(body);
            console.log(jsonUber);
            console.log('dest ' + destinations);
            let tableau=  [];
            tableau.push(destinations, jsonUber.prices);

            for(var k=0; k < jsonUber.prices.length; k++){

             console.log('for ');

           } 
           console.log('--------------', tableau[0]);
           console.log('111111111111', tableau[1]);

           socket.emit('priceUber', tableau);
         }
       });
      });
      /*request(callback, {
        url: 'https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyD_cHHLJDfVdhAMorhXUu_-CEJu9FcJGrc', json: true
      }, function(err, res, json) {
        if (err) {
          throw err;
        } else {
          socket.emit('destLat', json.results[0].geometry.location.lat);
          console.log(json.results[0].geometry.location);
          var destLng = json.results[0].geometry.location.lng;
          var destLat = json.results[0].geometry.location.lat;

          console.log(destLng);
          console.log(destLat);
          socket.emit('destLng', destLng);
          socket.emit('destLat', destLat);
/*          var test = json.items;
          var idYoutube = [];

          for(var j=0; j < test.length; j++){
           socket.emit('msgYtb', test[j].id.videoId);*/
        /* }   
         callback(destLng, destLat);
       });*/


     });



    socket.on('messageCarrefour', function (message) {

     const appCredentials = {
      "id_client" : "98cc4890-9c5b-4a9c-b2d9-3c9fdf7c4c18",
      "secret"    : "C1yD0eY7sT2yL8sJ4yR4tX5fW7eP7tV1dC6qA7fX4aU1gQ8oX8"
    }

    var options = {
      method: 'GET',
      url: 'https://api.fr.carrefour.io/v1/openapi/stores',
      qs: {
        longitude: message[1],
        latitude: message[0],
        radius: '5000'
      },
      headers:{
        accept: 'application/json',
        'x-ibm-client-secret': appCredentials.secret,
        'x-ibm-client-id':  appCredentials.id_client
      } 
    };

    request(options, function (error, response, body) {
      if (error) return  console.error('Failed: %s', error.message);

      else {
        const json = JSON.parse(body);
        for(var k=0; k < json.list.length; k++){
         socket.emit('messageCarrefour', json.list[k]);
       }   
     }
   });

  });
    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {

     message = ent.encode(message);
     socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});

   });
  }); 

server.listen(8080);