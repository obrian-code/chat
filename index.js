const path =require('path');
const express = require('express');
const app = express();
var http = require('http');
var fs = require('fs')

//settings
app.set('port', process.env.PORT || 3000 );


//archivos estaticos
app.use(express.static(path.join(__dirname, 'Publico')));


//esto es para inicaizar el servidor
//npm run dev

const server = app.listen(app.get('port'),()=> {
    console.log('server on port', app.get('port'));

});


//websockets
const SocketIO= require('socket.io');
const io = SocketIO(server);


io.on('connection', (socket) =>{
   socket.on('chat:name', (data) =>{
    io.sockets.emit('chat:is_online', '🔵 <i>' + data + '</i>');
    // io.emit('chat:is_online', '🔵 <i>' + data + ' join the chat..</i>');
    });

    socket.on('chat:disconnect', (data) =>{
     io.emit('chat:is_online', '🔴 <i>' + data + '</i>');
    });

    socket.on('chat:message', (data)=>{
        io.sockets.emit('chat:message', data);

    });

    socket.on('chat:typing', (data)=> {
        socket.broadcast.emit('chat:typing', data);
    });
    
    socket.on('chat:user_image',(data)=> {
      socket.broadcast.emit('chat:user_image', data);
    });
    
});


