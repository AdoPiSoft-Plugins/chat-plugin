(function() {
  "use strict";
  var App = angular.module("Plugins");
  App.controller("ChatPluginSettingsCtrl", function($scope, ChatService, CatchHttpError, toastr, Upload) {
    ChatService.getSettings().then(function(cfg) {
        var {config,icon_filename} = cfg.data;
        $scope.hide_portal_button = config.hide_portal_button;
        $scope.icon = icon_filename
    });
    $scope.submit = function() {      
      var cfg = {
        hide_portal_button: $scope.hide_portal_button
      };
      ChatService.updateSettings(cfg).then(function() {
        toastr.success("Plugin settings successfully saved")
      }).catch(CatchHttpError)
    };

    $scope.uploadIcon = (file) => {
      return Upload.upload({
        url: '/chat-plugin/setting/icon',
        data: {file}
      }).then((res) => {
        $scope.icon = res.data.icon_filename;
        toastr.success("Icon successfully changed")
      })
      .catch(CatchHttpError)
    }

    $scope.restoreIcon = () => {
      ChatService.restoreIconSettings().then((res) => {
        $scope.icon = res.data.icon_filename
        toastr.success("Icon successfully reset")
      }).catch(CatchHttpError)
    }
  })
})();