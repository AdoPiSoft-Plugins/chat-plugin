var chats_api_url = "/chat-plugin/portal/chats";
var send_api_url = "/chat-plugin/portal/chat"
var device_api_url = "/client/device"
var chatBoxOpened = false
var device

function httpGet(url, cb){
  var xmlhttp
  if (window.XMLHttpRequest)
  {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  }
  else
  {// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange=function()
  {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
    {
      if(cb) cb(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET", url, false );
  xmlhttp.send();
}

function httpPost(url, params, cb){
  var xmlhttp
  if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onload = function() {
    var data = xmlhttp.responseText
    try{
      data = JSON.parse(xmlhttp.responseText);
    }catch(e){}

    if(cb) cb(data);
  }
  xmlhttp.open("POST", url, true );
  xmlhttp.setRequestHeader('Content-Type', 'application/json');
  xmlhttp.send(JSON.stringify(params||{}));
}

function initChatBox(){
  var el = document.querySelector('.chat-box')
  var width = Math.min(450, window.innerWidth-20)
  var height = Math.min(650, window.innerHeight-20)
  el.style.width = width+"px"
  el.style.height = height+"px"

  var textarea = document.querySelector(".chat-plugin .send-msg-con textarea")
  var sendBtn = document.querySelector(".chat-plugin .send-icon")
  sendBtn.style.width = '58px'
  var twidth = width - 58
  textarea.style.width = twidth+'px'
  textarea.style.maxWidth = twidth+'px'
  textarea.style.minWidth = twidth+'px'
}

function resizeConversationCon(){
  document.querySelector(".chat-plugin .conversation").style.height = "100%"
  var conv_con = document.querySelector(".chat-plugin .conversation")
  var send_msg_con = document.querySelector(".chat-plugin .send-msg-con")
  conv_con.style.height = (conv_con.offsetHeight - (send_msg_con.offsetHeight + 4))+"px"
}

function openChatBox(){
  var icon = document.querySelector('.main-icon')
  icon.style.display = 'none'
  var el = document.querySelector('.chat-box')
  el.style.display = ''
  resizeConversationCon()
  scrollToBottom()
  chatBoxOpened = true
}

function closeChatBox(){
  var icon = document.querySelector('.main-icon')
  icon.style.display = ''
  animateIcon()
  var el = document.querySelector('.chat-box')
  el.style.display = 'none'
  chatBoxOpened = false
}

var audio;
function animateIcon(with_sound){
  var icon = document.querySelector('.main-icon')
  icon.style.width = "20px"
  icon.style.height = "20px"
  var max = 60
  var i = 20
  var interval = setInterval(function(){
    i += 1
    icon.style.width = i+"px"
    icon.style.height = i+"px"
    if(i >= max)
      clearInterval(interval);
  })

  if(!audio){
    audio = new Audio();
    audio.src = "/plugins/chat-plugin/assets/sounds/msg.mp3";
    audio.load();
  }

  if(with_sound){
    audio.play();
  }
}

function formatDate(date){
  var date = new Date(date)
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var ampm_str = hours + ':' + minutes + ampm;

  var mm_dd_yy = [
    date.getMonth()+1,
    date.getDate(),
    date.getFullYear()].join('/')

  return mm_dd_yy + ' ' + ampm_str;
}

function capitalize(name){
  return name.substr(0, 1).toUpperCase() + name.substr(1, name.length)
}

function scrollToBottom(el){
  if(!el)
    el = document.querySelector('.conversation');
  el.scrollTop = el.scrollHeight
}

function formatChat(chat){
  var li = document.createElement('li')
  var innerHTML = '<div class="message '+ (chat.sender_id == device.id ? 'sent' : 'received') + '">'
  innerHTML = innerHTML + '<strong class="sender">'+ (capitalize(chat.sender_id == device.id ? ('You (' + (device.hostname || device.mac_address) +')') : chat.admin_username)) + '</strong><br/>'
  innerHTML = innerHTML + '<pre class="text">'+ chat.message.trim() + '</pre>'
  innerHTML = innerHTML + '<small class="time">' + formatDate(chat.created_at) + '</small></div>'
  li.innerHTML = innerHTML
  return li
}

function formatLoadMore(){
  var li = document.createElement('li')
  li.innerHTML = '<li><a class="message load-more" style="border-radius: 5px; display: inline-block; width: 100%; text-align: center;" onclick="loadMore(this)"><span class="text">Load more ...</span></a></li>'
  return li
}

var chats = []
function initChats(){
  var socket = Socket.getInstance()
  httpGet(device_api_url, function(device_data){
    device = JSON.parse(device_data)
    httpGet(chats_api_url, function(data){
      data = JSON.parse(data)
      chats = data.chats
      var ul = document.querySelector(".conversation ul.list")
      ul.innerHTML = "";
      for(var i = 0; i < chats.length; i++){
        var chat = chats[i];
        ul.prepend( formatChat(chat) )
      }
      if(chats.length < data.total_count){
        ul.prepend( formatLoadMore() )
      }

      socket.on('chat', function(chat){
        ul.append( formatChat(chat) )
        setTimeout(function(){
          li.querySelector(".message").style.border = "";
        }, 1000)

        setTimeout(function(){
          scrollToBottom()
        })

        animateIcon( chat.sender_id != device.id )
        setTimeout(function(){
          animateIcon()
        }, 300)
      })
    })
  })
}

var page = 1
function loadMore(el){
  if(el && el.remove)
    el.remove()

  page += 1
  httpGet(chats_api_url+'?page='+page, function(data){
    data = JSON.parse(data)
    var _chats = data.chats
    if(!_chats || _chats.length <= 0) return
    chats = _chats.concat(chats)
    var ul = document.querySelector(".conversation ul.list")

    for(var i = 0; i < _chats.length; i++){
      var chat = _chats[i]
      ul.append( formatChat(chat) )
    }

    if(chats.length < data.total_count){
      ul.prepend( formatLoadMore() )
    }
  })
}

function sendMessage(){
  var input = document.querySelector('#chat_message')
  var msg = input.value
  input.value = ""
  if(!msg) return
  httpPost(send_api_url, { message: msg}, function(res){
    console.log(res)
  })
}

(function () {
  'use strict';

  setTimeout(function(){
    if(!document.getElementById('chat-plugin')){
      var chat_plugin = document.createElement('div')
      chat_plugin.id = "chat-plugin"
      httpGet("/plugins/chat-plugin/views/portal/chat.html", function(html){
        chat_plugin.innerHTML = html
        var body = document.querySelector("body")
        body.append(chat_plugin)
      })
    }
  }, 1000)

  setTimeout(function(){
    initChatBox()
    initChats()
    animateIcon()
  }, 2000)

  window.addEventListener("resize", function(){
    initChatBox()
    if(chatBoxOpened){
      resizeConversationCon()
      scrollToBottom( document.querySelector('.conversation') )
    }
  });

})();
