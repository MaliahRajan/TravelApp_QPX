/*
 Apache License
 
Copyright (c) 2015 MaliahRajan

*/
var app = angular.module('app',['ngMaterial','ngMessages','app.filters','ui.bootstrap']).filter('time', function() {
  var conversions = {
    'ss': angular.identity,
          'mm': function(value) {
      return value * 60;
    }
    ,
          'hh': function(value) {
      return value * 3600;
    }
  }
  ;
  var padding = function(value, length) {
    var zeroes = length - ('' + (value)).length,
              pad = '';
    while(zeroes-- > 0) pad += '0';
    return pad + value;
  }
  ;
  return function(value, unit, format, isPadded) {
    var totalSeconds = conversions[unit || 'ss'](value),
              hh = Math.floor(totalSeconds / 3600),
              mm = Math.floor((totalSeconds % 3600) / 60),
              ss = totalSeconds % 60;
    format = format || 'hh:mm:ss';
    isPadded = angular.isDefined(isPadded)? isPadded: true;
    hh = isPadded? padding(hh, 2): hh;
    mm = isPadded? padding(mm, 2): mm;
    ss = isPadded? padding(ss, 2): ss;
    return format.replace(/hh/, hh).replace(/mm/, mm).replace(/ss/, ss);
  }
  ;
}
);
app.controller('test',['$scope','$http','$interval','$q', function test($scope,$http,$interval,$q) {
  //Genera scope variables declaration
  $scope.searchError = false;
  $scope.loader = false;
  $scope.oneWayAPISearchComplete = false;

  $scope.airlines = [];
  $scope.temp = [];
  $scope.tempCities = [];
  $scope.oneWayFlightData = [];
  $scope.filteredOneWayFlightData = [];
  $scope.minPriceValue;
  $scope.maxPriceValue;
  $scope.totalItems;

  $scope.departurePoint = null;
  $scope.arrivalPoint = null;
  $scope.citySelected = null;
  $scope.selectedAirline = null;
  $scope.departureDate;
  $scope.passengerCount;

  //Code For loader
  var j= 0, counter = 0;
  $interval(function() {
    if ( counter++ % 4 == 0 ) j++;
    // Show the indicator in the "Used within Containers" after 200ms delay
    if ( j == 2 ) this.contained = "indeterminate";
  }
  , 100, 0, true);

  // Code for fillter variables
  $scope.filter = {
                    airlines: null,
                    stops:null,
                    price:null
                  };

  $scope.stops = [
                  {
                    value:0,
                    name:'No-Stops'
                  },
                  {
                    value:1,
                    name:'1 Stop'
                  },
                  {
                    value:2,
                    name:'2 Stops'
                  }
                ];

  $scope.passengers =  [
                          {
                            value:1
                          },
                          {
                            value:2
                          },
                          {
                            value:3
                          },
                          {
                            value:4
                          },
                          {
                            value:5
                          },
                          {
                            value:6
                          },
                          {
                            value:7
                          },
                          {
                            value:8
                          },
                          {
                            value:9
                          }
                        ];

  //Function to monitor changes in filter 
  $scope.isAnyFilter = function() {
    var f = $scope.filter;
    if (f.airlines||f.price||f.stops) {
      if($scope.filteredOneWayFlightData.length > 0) {
        $scope.totalItems = $scope.filteredOneWayFlightData.length;
        return true;
      }
      return true;
    } else {
      $scope.totalItems = $scope.oneWayFlightData.length;
      return false;
    }
  };

  //Function to remove all filter
  $scope.removeAllFilter = function() {
    $scope.filter = {
      airlines: null,
              price: null,
              departureTime: null
    }
    ;
    $scope.selectedAirline = null;
  };
 
   //Get the list of cities with their iata code
  $http.get('data/cities_data.json').success(function(data) {
    $scope.cities_data = data;
  });

  //This part goes for auto complete in city search 
  $scope.isAnyCitySelected = function(city) {
    if(angular.isUndefined(city)) {
      return;
    }
    if($scope.citySelected) {
      $scope.cities_data.push($scope.citySelected);
      $scope.citySelected = null;
      $scope.tempCities = [];
      return;
    }
    if(city != null) {
      $scope.citySelected = city;
      angular.forEach($scope.cities_data, function (row) {
        if(parseInt($scope.citySelected.id) == parseInt(row.id)) {
          return;
        }
        $scope.tempCities.push(row);
      }
      );
      $scope.citySelected = null;
      return;
    } else {
      return;
    }
  }
  $scope.searchCity = function(query) {
    var results;
    if(($scope.tempCities).length>0) {
      results = query ? $scope.createFilterForCity(query,$scope.tempCities) : $scope.tempCities;
      $scope.temp = [];
      return results;
    } else {
      results = query ? $scope.createFilterForCity(query,$scope.cities_data) : $scope.cities_data;
      $scope.temp = [];
      return results;
    }
  }
  $scope.createFilterForCity =  function(query,cities) {
    var query = query.toLowerCase();
    angular.forEach(cities, function (row) {
      var city_name = (row.city_name).toLowerCase();
      if(city_name.indexOf(query) === 0) {
        $scope.temp.push(row);
      }
    }
    );
    return $scope.temp;
  }
  $scope.airlinesName = function(airlinesName) {
    $scope.selectedAirline = null;
    $scope.selectedAirline = airlinesName;
  }

  //To get min date to tbe choosen in datepicker
  var date = new Date();
  date.setDate(date.getDate() - 1);
  $scope.minDate = date;
  //# => Thu Mar 31 2011 11:14:50 GMT+0200 (CEST)
  //This part Goes for Pagenation
  $scope.viewby = 6;
  $scope.currentPage = 1;
  $scope.itemsPerPage = $scope.viewby;
  $scope.maxSize = 5;

  //Number of pager buttons to show
  $scope.setPage = function (pageNo) {
    $scope.currentPage = pageNo;
  };
  $scope.pageChanged = function() {
    console.log('Page changed to: ' + $scope.currentPage);
  };
  $scope.setItemsPerPage = function(num) {
    $scope.itemsPerPage = num;
    $scope.currentPage = 1;
    //reset to first paghe
  };

  //call the api and get data
  $scope.searchOneWayAPI = function() {
    if($scope.departurePoint && $scope.arrivalPoint && $scope.departureDate && $scope.passengerCount) {
      if($scope.searchError == true) {
        $scope.searchError = false
      }
      $scope.loader = true;
      var origin = ($scope.departurePoint.iata_code).trim();
      var destination = ($scope.arrivalPoint.iata_code).trim();
      var day = ($scope.departureDate).getDate();
      var month = (($scope.departureDate).getMonth())+1;
      var year = ($scope.departureDate).getFullYear();
      var date = year+'-'+month+'-'+day;
      var adultCount = parseInt($scope.passengerCount);
      var req = {
             method: 'POST',
             //QPX api key here//
             url: 'https://www.googleapis.com/qpxExpress/v1/trips/search?key=AIzaSyB0ShYhakYY4jCvCbK2_moJ5FELP86_P-g',
             headers: {
               'Content-Type': 'application/json'
             },
             data: {
                  "request": {
                    "slice": [
                      {
                        "origin": ""+origin,
                        "destination": ""+destination,
                        "date": ""+date
                      }
                    ],
                    "passengers": {
                      "adultCount": adultCount,
                      "infantInLapCount": 0,
                      "infantInSeatCount": 0,
                      "childCount": 0,
                      "seniorCount": 0
                    },
                    "solutions": 500,
                    "refundable": false
                  }
                }
            }
      $http(req).success(function(data) {
        $scope.oneWayFlightData = data.trips.tripOption;
        $scope.airlines = data.trips.data.carrier;
        var length = ($scope.oneWayFlightData).length;
        $scope.totalItems = length;
        $scope.minPriceValue = parseInt($scope.oneWayFlightData[0].saleTotal.replace("INR", ""));
        $scope.maxPriceValue = parseInt($scope.oneWayFlightData[(length-1)].saleTotal.replace("INR", ""));
        $scope.loader = false;
        $scope.oneWayAPISearchComplete = true;
      });
    } else {
      $scope.searchError = true;
    }
  }
}]);

//Filter for data in Ng-Repeat
angular.module('app.filters', []).filter('flightsFilter', [function () {
  return function (finalFlightData,filter) {
    var tempFlights = [];
    if (filter.airlines || filter.price || filter.stops ) {
      angular.forEach(finalFlightData, function (row) {
        if(filter.airlines  && (filter.airlines !== row.slice[0].segment[0].flight.carrier)) {
          return;
        }
        if(filter.stops && (parseInt(filter.stops) !== (parseInt(row.slice[0].segment.length)-1))) {
          return;
        }
        if(filter.price && parseInt(filter.price) < parseInt(row.saleTotal.replace("INR", ""))) {
          return;
        }
        tempFlights.push(row);
      });
      return tempFlights;
    } else {
      return finalFlightData;
    }
  };
}]);