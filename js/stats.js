/*global $*/
/*eslint-env browser*/
/*eslint "no-console": "off" */


var apiApp = new Vue({
    el: '#apiApp',
    data: {
        picturesData: [],
        ratedPics: [],
        url: "",
        code_and_name: {}, // object of jVectorMap
        hashtags_dict: {},
        hashtags_array: [],
        sorted_hashtags_array: [],
        filterValue: "",
        contries_location: {},
        access_token: "",
        location_response: [],
        country_name: "",
        capital_name: ""
    },

    created: function () {
        if (window.location.href.includes("#access_token")) {
            this.access_token = this.getAccessToken()
            $("#Logindiv").hide()
            $("#startContainer").show()
            this.displayMap();
        }

    },

    methods: {
        getAccessToken: function () {
            return window.location.href.split("#access_token=")[1]
        },

        displayMap: function () { // on load: show map ; on click: show pics, hide map, show button to display map again
            $.getJSON("https://api.myjson.com/bins/ibjif", function (data) {
                apiApp.countries_location = data;
                $('#map').vectorMap({
                    map: 'europe_mill',
                    onRegionClick: function (e, code) {
                        apiApp.countries_location.forEach(function (element) {
                            if (code === "XK") {
                                if (element.CountryCode === "KO") {
                                    apiApp.lat = element.CapitalLatitude
                                    apiApp.long = element.CapitalLongitude
                                    apiApp.country_name = element.CountryName
                                    apiApp.capital_name = element.CapitalName
                                }
                            } else {
                                if (element.CountryCode === code) {
                                    apiApp.lat = element.CapitalLatitude
                                    apiApp.long = element.CapitalLongitude
                                    apiApp.country_name = element.CountryName
                                    apiApp.capital_name = element.CapitalName
                                }
                            }
                        })
                        apiApp.getPictures(apiApp.lat, apiApp.long);
                        apiApp.filterValue = "";
                        apiApp.sorted_hashtags_array = []
                        apiApp.hideMap();
                        $("#map_button").show();
                        $("#waitBox").show(); //i had to do this instead of calling it in the function "please_wait"
                        $("#footer").hide();
                        $("#cityName").html("in " + apiApp.capital_name)
                    }
                })
                apiApp.hide_show_map();
            })

        },

        getPictures: function (lat, long) {
            apiApp.ratedPics = []
            $.getJSON("https://api.instagram.com/v1/locations/search?lat=" + lat + "&lng=" + long + "&access_token=" + apiApp.access_token, function (data) {
                apiApp.location_response = data.data
                apiApp.selected_id = ""
                apiApp.location_response.forEach(function (element) {
                    if (element.name === (apiApp.capital_name + ", " + apiApp.country_name)) {
                        apiApp.selected_id = element.id
                    }
                })

                if (apiApp.selected_id.length === 0) {
                    apiApp.selected_id = apiApp.location_response[1].id
//                    for (var i = 0; i < apiApp.location_response.length; i++) {
//                        if (apiApp.location_response[i].id != 0) {
//                            apiApp.selected_id = apiApp.location_response[i].id;
//                            break;
//                        }

//                    }
                }

                $.getJSON("https://www.instagram.com/explore/locations/" + apiApp.selected_id + "/?__a=1", function (data) {
                    apiApp.picturesData = data.graphql.location.edge_location_to_media.edges;
                    apiApp.ratedPics = apiApp.decreasingOrder(apiApp.picturesData); //this actually puts the elements in a decreasing order

                    apiApp.sorted_hashtags_array = apiApp.getSortedHashtags(apiApp.ratedPics)
                    apiApp.please_wait();
                })






            })

        },

        please_wait: function () {
            if ($("#pic")) {
                $("#waitBox").hide();
                $("#footer").show();
            }
        },

        hide_show_map: function () {
            $("#map_button").click(function () {
                if ($("#map_button").html() == "Hide Map") {
                    apiApp.hideMap();
                } else {
                    apiApp.showMap()
                }
            })
        },

        hideMap: function () { //function to hide the map and show the toggle button
            $("#map").hide(2000);
            $("#map_button").html("Show Map");
            $("#all_filter").show();
            $("#picsContainer").show();
        },

        showMap: function () { // shows the map on button click
            $("#map").show(2000);
            $("#map_button").html("Hide Map");
            $("#all_filter").show();
            $("#picsContainer").hide();

            apiApp.scrollTop();
            //            })
        },

        decreasingOrder: function (array) {
            var array_copy = array.slice()
            array_copy.sort(function (a, b) {
                return b.node.edge_liked_by.count - a.node.edge_liked_by.count
            });
            return array_copy
        },


        scrollTop: function () { // to go at the beginning of the page each time I show the map again
            $('html,body').animate({ // it will animate all html body 
                scrollTop: $('#startContainer').offset().top
            }, 'slow'); // get the other id where you want the page to scroll to. then offset the page and slow the animation.the only options available to offset are top and left for some reason. 


        },

        getSortedHashtags: function (picsArray) {
            apiApp.hashtags_dict = {}
            apiApp.hashtags_array = []
            picsArray.forEach(function (element) {
                if (element.node.edge_media_to_caption.edges.length != 0) {
                    var text = element.node.edge_media_to_caption.edges[0].node.text
                    var matches = text.match(/#\w+/g)
                    if (matches != null) {
                        matches.forEach(function (item) {
                            if (item in apiApp.hashtags_dict) {
                                apiApp.hashtags_dict[item] += 1
                            } else {
                                apiApp.hashtags_dict[item] = 1
                            }
                        })
                    }
                }
                element.node.edge_media_to_caption.edges.push({
                    "node": {
                        "text": ""
                    }
                })

            })
            for (var key in apiApp.hashtags_dict) {
                apiApp.hashtags_array.push({
                    "value": key,
                    "count": apiApp.hashtags_dict[key]
                })
            }

            return apiApp.hashtags_array.sort(function (a, b) {
                return b.count - a.count
            })

        },

        hashtagFilter: function (event) {
            apiApp.filterValue = $(event.target).val();

            // make the map disappear when clicking on the ashtag button:
            $("#map").hide(2000);
            $("#map_button").html("Show Map")
            $("#picsContainer").show();

        }

    },


})
