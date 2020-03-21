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
