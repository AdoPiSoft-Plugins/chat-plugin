(function () {
  'use strict';

  var App = angular.module('Plugins')

  App.component('chats', {
    controller: 'ChatsCtrl',
    templateUrl: '/plugins/chat-plugin/views/admin/chats.html',
    bindings: {
      contact: '='
    }
  })
  .controller('ChatsCtrl', function($scope, ChatService, toastr, CatchHttpError, $timeout, $ngConfirm, Socket){
    var socket = Socket.getSocket();
    var _this = this
    var scrollToBottom = function(){
      $timeout(function(){
        var scroll=$('.conversation')
        scroll.animate({scrollTop: scroll.prop("scrollHeight")})
      })
      $timeout(function(){
        $(".conversation .message").css("border", "")
      }, 1500)
    }

    $scope.page = 1
    this.$doCheck = function () {
      if (!angular.equals($scope.contact, _this.contact)) {
        $scope.page = 1
        $scope.contact = angular.copy(_this.contact);
        var opts = {
          page: $scope.page
        }
        $scope.has_more = false
        ChatService.getClientMessages($scope.contact.id, opts).then(function(res){
          var data = res.data || {}
          $scope.chats = (data.chats || []).reverse()
          $scope.has_more = data.total_count > $scope.chats.length
          scrollToBottom()
        }).finally(function(){
          $scope.loadingMessages = false;
        })
      };
    }
    $scope.loadMore = function(){
      $scope.page += 1
      var opts = {
        page: $scope.page
      }
      ChatService.getClientMessages($scope.contact.id, opts).then(function(res){
        var data = res.data || {}
        var chats = ((data.chats || []).reverse()).concat($scope.chats)
        $scope.chats = _.uniqBy(chats, function(i){ return i.id })
        $scope.has_more = data.total_count > $scope.chats.length
      })
    }

    $scope.closeChat = function(){
      $scope.$parent.closeChat()
    }

    $scope.send = function(e){
      e.preventDefault();
      var opts = {
        message: $scope.msg
      }
      $scope.sending = true
      ChatService.sendToClient($scope.contact.id, opts).then(function(res){
        $scope.msg = ""
        scrollToBottom()
      }).finally(function(){
        $scope.sending = false
      })
    }

    $scope.deleteConversation = function(){
      if($scope.chats.length <= 0 ) return;
      $ngConfirm({
        title: 'Confirm',
        content: 'Are you sure you want to delete this conversation?',
        escapeKey: 'close',
        buttons: {
          ok: {
            text: 'Yes',
            btnClass: 'btn-danger',
            keys: ['enter'],
            action: function () {
              $scope.deleting = true
              ChatService.deleteConversation($scope.contact.id).then(function(res){
                $scope.chats = []
                $scope.has_more = false
                $scope.page = 1
              }).finally(function(){
                $scope.deleting = false
              })
            }
          },
          close: {
            text: 'Cancel',
            keys: ['escape'],
            btnClass: 'btn-default'
          }
        }
      });
    }

    socket.on('chat', function(chat){
      if($scope.contact && chat.mobile_device_id == $scope.contact.id){
        var exists = _.findIndex($scope.chats, function(c){ return c.id == chat.id }) >= 0
        if(exists) return
        $scope.chats.push(chat)
        scrollToBottom()
        $timeout(function(){
          $(".conversation .message:last:not(.placeholder)").css("border", "5px solid #209e91")
          if($(`.conversation.device-${_this.contact.id}`).is(":visible")){
            _this.contact.has_unread = false
          }
        })
      }
    })
  })

})();
