// Invoking IIFE for profile view

(function() {

    'use strict';

    angular
        .module('evalai')
        .controller('profileCtrl', profileCtrl);

    profileCtrl.$inject = ['utilities','loaderService', '$rootScope','$http', '$scope', '$mdDialog', 'moment'];

    function profileCtrl(utilities,loaderService, $rootScope,$http, $scope, $mdDialog, moment) {
        var vm = this;

        // show loader
        vm.startLoader = loaderService.startLoader;
        // stop loader
        vm.stopLoader = loaderService.stopLoader;

        vm.user = {};
        vm.countLeft = 0;
        vm.compPerc = 0;
        var count = 0;
        vm.inputType = 'password';
        vm.status = 'Show';
        vm.token = '';
        vm.expiresAt = '';

        utilities.hideLoader();

        vm.imgUrlObj = {
            profilePic: "dist/images/spaceman.png"
        };

        var hasImage = utilities.getData('avatar');
        if (!hasImage) {
            vm.imgUrl = _.sample(vm.imgUrlObj);
            utilities.storeData('avatar', vm.imgUrl);
        } else {
            vm.imgUrl = utilities.getData('avatar');
        }

        // get token
        var userKey = utilities.getData('userKey');

        var parameters = {};
        parameters.url = 'auth/user/';
        parameters.method = 'GET';
        parameters.token = userKey;
        parameters.callback = {
            onSuccess: function(response) {
                var status = response.status;
                var result = response.data;
                if (status == 200) {
                    for (var i in result) {
                        if (result[i] === "" || result[i] === undefined || result[i] === null) {
                            if (i === "linkedin_url" || i === "github_url" || i === "google_scholar_url") {
                                result[i] = "";
                            } else {
                                result[i] = "-";
                            }
                            vm.countLeft = vm.countLeft + 1;
                        }
                        count = count + 1;
                    }
                    vm.compPerc = parseInt((vm.countLeft / count) * 100);

                    vm.user = result;
                    vm.user.complete = 100 - vm.compPerc;

                }
            },
            onError: function(response) {
                var details = response.data;
                $rootScope.notify("error", details.error);
            }
        };

        utilities.sendRequest(parameters);

        parameters.url = 'challenges/challenges/participated/present';
        parameters.method = 'GET';
        parameters.token = userKey;
        parameters.callback = {
            onSuccess: function(response) {
                var status = response.status;
                var result = response.data;
                if (status == 200) {
                    vm.present = result;
                    if (result.count === 0) {
                        vm.present.showPagination = false;
                        vm.present.paginationMsg = "No present challenge for now. Start by participating in one!";
                    }
                    else {
                        vm.present.showPagination = true;
                        vm.present.paginationMsg = "Present Challenges";
                    }
                    if (vm.present.next === null) {
                        vm.present.isNext = 'disabled';
                    } else {
                        vm.present.isNext = '';
                    }

                    if (vm.present.previous === null) {
                        vm.present.isPrev = 'disabled';
                    } else {
                        vm.present.isPrev = '';
                    }
                    if (vm.present.next != null) {
                        vm.present.currentPage = vm.present.next.split('page=')[1] - 1;
                    } else {
                        vm.present.currentPage = 1;
                    }
                     vm.present.isExistLoader = true;
                }
            },
            onError: function(response) {
                var details = response.data;
                $rootScope.notify("error", details['detail']);
            }
        };

        utilities.sendRequest(parameters);

        parameters.url = 'challenges/challenges/participated/past';
        parameters.method = 'GET';
        parameters.token = userKey;
        parameters.callback = {
            onSuccess: function(response) {
                var status = response.status;
                var result = response.data;
                if (status == 200) {
                    vm.past = result;
                    if (result.count === 0) {
                        vm.past.showPagination = false;
                        vm.past.paginationMsg = "No past challenges for now";
                    }
                    else {
                        vm.past.showPagination = true;
                        vm.past.paginationMsg = "Past Challenges";
                    }
                    if (vm.past.next === null) {
                        vm.past.isNext = 'disabled';
                    } else {
                        vm.past.isNext = '';
                    }

                    if (vm.past.previous === null) {
                        vm.past.isPrev = 'disabled';
                    } else {
                        vm.past.isPrev = '';
                    }
                    if (vm.past.next != null) {
                        vm.past.currentPage = vm.past.next.split('page=')[1] - 1;
                    } else {
                        vm.past.currentPage = 1;
                    }
                     vm.past.isExistLoader = true;
                }
            },
            onError: function(response) {
                var details = response.data;
                $rootScope.notify("error", details['detail']);
            }
        };

        utilities.sendRequest(parameters);


        vm.load = function(url , category) {

            // loader for challenge history
            // url has pagination's next url
            // category would be either present or past

            vm.isExistLoader = true;
            vm.loaderTitle = '';
            vm.loaderContainer = angular.element('.exist-team-card');

            vm.startLoader("Loading Challenges");

            if (url !== null) {
                //store the header data in a variable
                var headers = {
                    'Authorization': "Token " + userKey
                };

                //Add headers with in your request
                $http.get(url, { headers: headers }).then(function(response) {
                    // reinitialized data
                    var details = response.data;
                    vm[category] = details;
                    // condition for pagination
                    if (vm[category]['next'] === null) {
                        vm[category]['isNext'] = 'disabled';
                        vm[category]['currentPage'] = vm[category]['count'] / 4;
                    } else {
                        vm[category]['isNext'] = '';
                        vm[category]['currentPage'] = parseInt(vm[category]['next'].split('page=')[1] - 1);
                    }

                    if (vm[category]['previous'] === null) {
                        vm[category]['isPrev'] = 'disabled';
                    } else {
                        vm[category]['isPrev'] = '';
                    }
                    vm[category]['showPagination'] = true;

                    vm.stopLoader();
                });
            }
        };

        parameters.url = 'accounts/user/get_auth_token';
        parameters.method = 'GET';
        parameters.token = userKey;
        parameters.callback = {
            onSuccess: function(response) {
                vm.jsonResponse = response.data;
                vm.token = response.data['token'];
                vm.expiresAt = moment.utc(response.data['expires_at']).local().format("MMM D, YYYY h:mm:ss A");
                let expiresAtOffset = new Date(vm.expiresAt).getTimezoneOffset();
                var timezone = moment.tz.guess();
                vm.expiresAtTimezone = moment.tz.zone(timezone).abbr(expiresAtOffset);
            },
            onError: function(response) {
                var details = response.data;
                $rootScope.notify("error", details['detail']);
            }
        };

        utilities.sendRequest(parameters);

        // Hide & show token function
        vm.hideShowPassword = function(){
            if (vm.inputType == 'password'){
                vm.inputType = 'text';
                vm.status = 'Hide';
            }
            else{
                vm.inputType = 'password';
                vm.status = 'Show';
            }
        };

        // Hide & show token function
        vm.showConfirmation = function(){
            $rootScope.notify("success", "Token copied to your clipboard.");
        };

        // Get token
        vm.getAuthTokenDialog = function(ev) {
            vm.titleInput = "";
            $mdDialog.show({
                scope: $scope,
                preserveScope: true,
                targetEvent: ev,
                templateUrl: 'dist/views/web/auth/get-token.html',
                escapeToClose: false
            });
        };

        vm.getAuthToken = function(getTokenForm) {
            if(!getTokenForm){
                vm.inputType = 'password';
                vm.status = 'Show';
                $mdDialog.hide();
            }
        };

        vm.downloadToken = function() {
            var anchor = angular.element('<a/>');
            anchor.attr({
                href: 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vm.jsonResponse)),
                download: 'token.json'
            });

            // Create Event
            var ev = document.createEvent("MouseEvents");
                ev.initMouseEvent("click", true, false, self, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                // Fire event
                anchor[0].dispatchEvent(ev);

        };

        vm.refreshToken = function() {
            parameters.url = 'accounts/user/refresh_auth_token';
            parameters.method = 'GET';
            parameters.token = userKey;
            parameters.callback = {
                onSuccess: function(response) {
                    vm.jsonResponse = response.data;
                    vm.token = response.data['token'];
                    utilities.storeData('refreshJWT', vm.token);
                    $rootScope.notify("success", "Token generated successfully.");
                },
                onError: function(response) {
                    var details = response.data;
                    $rootScope.notify("error", details['detail']);
                }
            };
            utilities.sendRequest(parameters);
        };
    }
})();