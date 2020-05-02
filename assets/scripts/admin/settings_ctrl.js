(function () {
  'use strict';
  var App = angular.module('Plugins')
  App.controller('ChatPluginSettingsCtrl', function($scope, ChatService, toastr){
    ChatService.getSettings().then(function(cfg){
      var data = cfg.data
      $scope.apk_download_prompt = data.apk_download_prompt || "We have an Android App for you to conveniently open the captive portal and to receive notifications. Click the download button below to install it. Disregard this message if you already installed it."
      $scope.apk_link = data.apk_link || "/plugins/chat-plugin/assets/captive-portal.apk"
      $scope.hide_portal_button = data.hide_portal_button
      // $scope.captive_portal_ip = data.captive_portal_ip || "10.0.0.1"
    })
    $scope.submit = function(){
      var cfg = {
        apk_download_prompt: $scope.apk_download_prompt,
        facebook: $scope.facebook,
        apk_link: $scope.apk_link,
        hide_portal_button: $scope.hide_portal_button,
        // captive_portal_ip: $scope.captive_portal_ip
      }
      ChatService.updateSettings(cfg).then(function(){
        toastr.success("Plugin settings successfully saved")
      })
    }
  })
})();
