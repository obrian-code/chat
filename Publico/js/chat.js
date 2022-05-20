const socket = io();
let message = document.getElementById('message');
let username = document.getElementById('username');
let imagenfile = document.getElementById('imagenfile');
let btn = document.getElementById('send');
let output = document.getElementById('output');
let actions = document.getElementById('actions');
let user=document.getElementById('usuarios');
var time="";

btn.addEventListener('click', function(){
    socket.emit('chat:message', {
        message: message.value,
        username: username.value
    });
        
        
});

username.addEventListener('blur', function(){
        socket.emit('chat:name', username.value);
});

socket.on('chat:user_image',function(data){
     output.innerHTML += '<p><br/><img style="width:200px; height:200px;" src="' + data + '"/></p>';
});

var openFile = function(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function(){
        imag ();
      var dataURL = reader.result;     
      var img = document.getElementById('imagefile');
      img.src = dataURL;
      
     socket.emit('chat:user_image',img.src);
    };
    reader.readAsDataURL(input.files[0]);    
  };

function imag () {
    play();
 actions.innerHTML='file sent';
}

message.addEventListener('keypress', function(){
    console.log(username.value);
        socket.emit('chat:typing',username.value);
        
      
});

socket.on('chat:is_online', function(data) {
      usuarios.innerHTML+=`<li style="list-style:none">${data}</li>`;
            });

function myFunction(){
 socket.emit('chat:disconnect', username.value);
}

socket.on('chat:message', function (data){
   if (username.value!='') {
    output.innerHTML += `<p>
    <strong>&nbsp&nbsp&nbsp<u>${data.username}</strong></u>:&nbsp&nbsp<em> ${data.message}</em></p>&nbsp&nbsp`+actualizar();   
         play();
            disable();
                clear();
                   setTimeout(1000);
               }

});

socket.on('chat:typing', function(data){
    actions.innerHTML=`<p style="color:#28a745"><em>${data}: Esta escribiendo un mensaje.</em></p>`;
});

function clear(){
let inbox = document.getElementById('message').value= '';
}

function disable(){
document.getElementById('username').disabled = true;
}

function play(){
var audio = document.getElementById("audio");
audio.play();
}

function actual() {
    fecha=new Date();
    hora=fecha.getHours(); 
    minuto=fecha.getMinutes(); 
    segundo=fecha.getSeconds(); 
         if (hora<10) { 
             hora="0"+hora;
             }if (minuto<10) {
             minuto="0"+minuto;
             }
         mireloj = hora+":"+minuto; 
         return mireloj; 
}              

function actualizar() { 
        mihora=actual(); 
        mireloj=mihora;
        time=mireloj;
        return time;
     }

setInterval(actualizar,1000);