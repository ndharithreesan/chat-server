/* 
* @Author: nimi
* @Date:   2015-07-27 05:26:56
* @Last Modified by:   nimi
* @Last Modified time: 2015-07-27 07:56:53
*/

'use strict';

var net = require('net');

// clients object will store username: socket
var clients = {};

// rooms object will store roomname: [client, client, client]
var rooms = {};

function cleanInput(data){
  return data.toString().replace(/(\r\n|\n|\r)/gm,'');
};

function receiveData(socket, user, data){
  var cleanedData = cleanInput(data);
  if (user.username === null){
    if(cleanedData){
      if(clients[cleanedData]){
        socket.write('Sorry, name taken \n Login Name? \n');
      } else {
        user.username = cleanedData;
        clients[cleanedData] = socket;
        socket.write('Welcome ' + user.username + '! \n');
        return user;
      }
    }
  } else if (cleanedData === '/quit'){
    socket.end('BYE \n')

  } else if(cleanedData === '/rooms' ) {
    socket.write('Active rooms are: \n');
    for (var room in rooms){
      if (rooms[room].length !== 0){
        socket.write('* ' + room + ' (' + rooms[room].length + ') \n');
      }
    }
    return user
  } else if(cleanedData.substring(0, 5) === '/join'){
    var roomName = cleanedData.slice(6);
    rooms[roomName] = rooms[roomName] || [];
    var currentRoom = rooms[roomName];
    var client = {
      username: user.username,
      socket: socket
    }
   currentRoom.push(client);
    socket.write('entering room: ' + roomName  + '\n');
    user.room = roomName;
    for(var i = 0; i<currentRoom.length; i++){
      if(currentRoom[i]['username'] === user.username){
        socket.write('* ' + user.username + ' (** this is you) \n')
      } else {
        socket.write('* ' +currentRoom[i]['username'] + '\n');
      }
    };
    socket.write('end of list \n')
    for(var j = 0; i<currentRoom.length; j++) {
      if (currentRoom[j]['username'] !== user.username) {
        currentRoom[j]['socket'].write('* new user has joined chat: ' + user.username + '\n');
      }
    }
    return user;
  } else if(cleanedData === '/leave'){
    var currentRoom = rooms[user.room];
    for( var k = 0; k < currentRoom.length; k++){
      if(currentRoom[k]['username'] === user.username) {
        socket.write('* user has left chat: ' + user.username + ' (** this is you) \n')
        currentRoom.splice(k,1)
      } else {
         currentRoom[k]['socket'].write('*  user has left chat: ' + user.username +'\n');
      }
    }
    return user
  } else {
    var currentRoom = rooms[user.room];
    if(!currentRoom){
      socket.write('Please join a room. View the list of rooms by entering "/rooms"\n')
      return user
    } else {
      for(var h = 0; h < currentRoom.length; h++){
        currentRoom[h]['socket'].write(user.username + ': ' + cleanedData + '\n')
      }
      return user
    }
  }
  return user
};

function closeSocket(user) {
  delete clients[user.username];
}

function newSocket(socket){
  var user = {
    username: null,
    room: null
  }
  socket.write('Welcome to the GungHo test chat server \n Login Name? \n');
  
  socket.on('data', function(data) {
    user = receiveData(socket, user, data);
  })

  socket.on('end', function() {
    closeSocket(user);
  })
}; 

var server = net.createServer(newSocket);

server.listen(9399)
