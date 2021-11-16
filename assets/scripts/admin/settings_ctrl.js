(function () {
  'use strict';
  var App = angular.module('Plugins')
  App.controller('ChatPluginSettingsCtrl', function($scope, ChatService, Upload, CatchHttpError, toastr){
    var default_apk = '/public/plugins/chat-plugin/captive-portal.apk'
    ChatService.getSettings().then(function(cfg){
      var data = cfg.data
      $scope.apk_download_prompt = data.apk_download_prompt || "We have an Android App for you to conveniently open the captive portal and to receive notifications. Click the download button below to install it. Disregard this message if you already installed it."
      $scope.apk_link = data.apk_link || default_apk
      $scope.hide_portal_button = data.hide_portal_button
      $scope.apk_type = ($scope.apk_link == default_apk || $scope.apk_link.includes("http"))? 'link' : 'upload_file'
      $scope.apk_file = null
    })
    $scope.submit = function(){
      var cfg = {
        apk_download_prompt: $scope.apk_download_prompt,
        facebook: $scope.facebook,
        apk_link: $scope.apk_link,
        hide_portal_button: $scope.hide_portal_button,
      }
      ChatService.updateSettings(cfg).then(function(){
        toastr.success("Plugin settings successfully saved")
      })  
    }
    
    $scope.uploadApk = function(file){
      if(file){
        Upload.upload({
          url: '/chat-plugin/upload-apk',
          data: {
            file: file
          }
        }).then(function(res){
          $scope.apk_link = (res.data||{}).apk_link
        }).catch(CatchHttpError)
      }
    }
    
    $scope.resetApk = function(){
      $("input[name='apk_file']").val('')
      $scope.apk_link = default_apk
      $scope.apk_type = 'link'
      return $scope.submit()
    }
  })
})();
