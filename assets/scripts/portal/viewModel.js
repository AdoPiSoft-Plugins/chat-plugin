define([
  'knockout',
  'howler',
  'app/services/toast',
  'core/services/http'
], function (ko, howler, toast, http) {

  var Howl = howler.Howl;
  var chats_api_url = "/chat-plugin/portal/chats";
  var send_api_url = "/chat-plugin/portal/chat";
  var device_api_url = "/portal/device";
  var settings_api_url = "/chat-plugin/setting";
  var apk_download_prompt = "We have an Android App for you to conveniently open the captive portal and to receive notifications. Click the download button below to install it. Disregard this message if you already installed it.";
  var apk_link = "/public/plugins/chat-plugin/captive-portal.apk";
  var mark_read_api_url = "/chat-plugin/portal/mark-read"
  var audio_url = "/public/plugins/chat-plugin/sounds/msg.mp3";

  var chatBoxOpened = false
  var device
  var os;
  var hide_portal_button = false;

  var audio = new Howl({
    src: [audio_url],
    loop: false,
    buffer: false,
    preload: true
  });

  function notify(msg) {
    if(typeof(AndroidFunction) != 'undefined' && AndroidFunction.showNotification){
      AndroidFunction.showNotification(msg)
    }

    if (!window.Notification) {
      return false
    }
    else if (Notification.permission === "granted") {
      var notification = new Notification(msg);
    }
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          var notification = new Notification(msg);
        }
      });
    } else {
      toast.success(msg);
    }
  }

  return function ChatPluginVM (params, elem) {
    var self = this;

    self.device = ko.observable({});
    self.chats = ko.observableArray([]);
    self.settings = ko.observable({});
    self.chatBoxStyle = ko.observable({display: 'none'});
    self.textAreaStyle = ko.observable({});
    self.mainIconStyle = ko.observable({});
    self.faIconStyle = ko.observable({fontSize: '0px'});
    self.newChat = ko.observable({});
    self.unreadIndicatorStyle = ko.observable({display: 'none'});
    self.message = ko.observable('');
    self.loadingMore = ko.observable(false);
    self.showLoadMore = ko.observable(false);
    self.totalChats = ko.observable(0);

    self.scrollToBottom = function (el) {
      if (!el) el = elem.querySelector('.conversation');
      el.scrollTop = el.scrollHeight
    };

    self.formatSender = function (chat) {
      var device = self.device();
      return chat.sender_id === device.id ? ('You (' + (device.hostname || device.mac_address) + ')') : chat.admin_username;
    };

    self.messageClass = function (chat) {
      var device = self.device();
      return chat.sender_id === device.id ? 'sent' : 'received';
    };

    self.formatDate = function (date) {
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
    };

    self.sendMessage = function () {
      var msg = self.message();
      if (!msg) return;
      http.post(send_api_url, {message: msg}, function (err) {
        if (err) self.disconnected();
      });
    };

    self.disconnected = function () {
      console.log('disconnected!');
    };

    self.reconnected = function () {
      console.log('reconnected!');
    };

    self.mute = function () {
      console.log('mute()');
    };

    self.unmute = function () {
      console.log('unmuted');
    };

    self.initSettings = function (cb) {
      http.get(settings_api_url, function (err, data) {
        self.settings(data);
        if (cb) cb();
      });
    };

    self.initChatBox = function () {
      var width = Math.min(450, window.innerWidth-20)
      var height = Math.min(650, window.innerHeight-20)
      var twidth = width - 58
      self.chatBoxStyle({
        width: width + 'px',
        height: height + 'px'
      });
      self.textAreaStyle({
        width: twidth + 'px',
        maxWidth: twidth + 'px',
        minWidth: twidth + 'px'
      });
    };

    self.initChats = function () {
      var socket = Socket.getInstance();
      if (socket.disconnected) self.disconnected();

      socket.on('connection', function () {
        self.reconnected();
      })

      socket.on('disconnect', function () {
        self.disconnected();
      })

      socket.on('chat:mute', function () {
        self.mute();
        self.reconnected();
      })

      socket.on('chat:unmute', function () {
        self.unmute();
        self.reconnected();
      })

      http.get(device_api_url, function (err, data) {
        self.device(data);
        http.get(chats_api_url, function (err, data) {
          self.chats(data.chats);
          self.totalChats(data.total_count);

          socket.on('chat', function (chat) {
            chat.new = true
            self.newChat(chat);
            self.chats.push(self.newChat);
            var device = self.device();
            var from_admin = chat.sender_id != device.id
            self.animateIcon( from_admin )
            if (from_admin) {
              self.unreadIndicatorStyle({display: ''});
              notify(chat.admin_username + ': ' + chat.message);
            }
            setTimeout(function () {
              self.scrollToBottom();
            });

            setTimeout(function () {
              chat.new = false
              self.newChat(chat);
            }, 3000);
          });
        });
      })
    };

    var page = 1
    self.loadMore = function () {
      if (!self.loadingMore()) {
        self.loadingMore(true);
        http.get(chats_api_url+'?page='+page+"&ref="+(Math.random()), function (err, data) {
          var chats = self.chats().concat(data.chats)
          self.chats(chats);
          self.totalChats(data.total_count);
        })
      }
    };

    self.animateIcon = function (with_sound) {
      var max = 60
      var i = 1
      var interval = setInterval(function(){
        i += 1
        self.faIconStyle({fontSize: i + 'px'});
        if(i >= max)
          clearInterval(interval);
      }, 3);

      if (with_sound) {
        audio.play();
      }
    };

    self.openChatBox = function () {
      self.unreadIndicatorStyle({display: 'none'});
      self.mainIconStyle({display: 'none'});
      self.chatBoxStyle({display: ''});
      var msgr = document.getElementById('wh-widget-send-button')
      if (msgr) msgr.style.display = 'none';
      chatBoxOpened = true
    };

    self.closeChatBox = function () {
      self.mainIconStyle({display: ''});
      self.animateIcon();
      self.chatBoxStyle({display: 'none'});
      var msgr = document.getElementById("wh-widget-send-button")
      if(msgr) msgr.style.display = "";
      chatBoxOpened = true
    };

    self.koDescendantsComplete = function () {
      self.initSettings(function () {
        self.initChatBox();
        self.initChats();
        self.animateIcon();
      });
    };

  };
});
