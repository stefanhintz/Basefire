var layer = ga.layer.create('ch.swisstopo.pixelkarte-farbe');
proj4.defs("EPSG:21781", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs");

// Recognition
var recognition = new webkitSpeechRecognition();
recognition.lang = "en-GB";

$("#send").click(function() {
  recognition.start();
})

var map = new ga.Map({
  target: 'bigBap',
  layers: [layer],
  view: new ol.View({
    resolution: 500,
    center: [670000, 160000]
  })
  
});

recognition.onresult = function(event) {
  var text = event.results[0][0].transcript;
  console.log(text);
  $('#textarea').val($('#textarea').val() + " " + text);
  alchemyText(text);
}

// Manual Submit
$("form").submit(function(event) {
  event.preventDefault();
  var text = $('#textarea').val();
  alchemyText(text);
});

function alchemyText(text) {
  var index = $("#sections li").size();
  $("#sections").prepend(" <li id='post-" + index + "'><div class='mapContainer'><div class='mapWrapper'><div id='post-map-" + index + "' class='map'></div></div></div><div class='textContainer'><h2>...</h2><p>" + text + "</p></div></li>");

  var body = {
    apikey: "ce08de21d4dcb55ec243f77482316b0f859d85a1",
    outputMode: "json",
    extract: "",
    sentiment: "3",
    maxRetrieve: "3",
    url: "https://www.ibm.com/us-en/",
    text: text
  }

  var alchemy = $.post("https://gateway-a.watsonplatform.net/calls/text/TextGetCombinedData", body)
    .done(function(data) {
      console.log(data);
      var city = null;
      var entities = data.entities
      for (var i = 0; i < entities.length; i++) {
        if (entities[i].type === "City") {
          city = entities[i].text;
        }
      }

      if (city !== null) {
        var index = $("#sections li").size();
        buidPost(text, city, index)
        $.get("https://api3.geo.admin.ch/rest/services/api/SearchServer", { searchText: city, type: "locations" })
          .done(function(data) {
            console.log(data);
            var lon = data.results[0].attrs.lon;
            var lat = data.results[0].attrs.lat;
            //console.log(data);
            var coordinates = proj4('EPSG:21781', [lon, lat]);
            var mapID = "post-map-" + index;
            var map = new ga.Map({
              target: mapID,
              layers: [layer],
              view: new ol.View({
                resolution: 20,
                center: coordinates
              })
            });
          });
      } else {
        var index = $("#sections li").size() - 1;
        var oldtext = $("#post-" + index + " p").text();
        $("#post-" + index + " p").text(oldtext + " " + text);
      }



      /*
      var keywords = data.keywords
      for (var i = 0; i < keywords.length; i++) {
        var keyword = keywords[i].text;
        console.log(keyword);
        $('#tags').prepend('<span>' + keyword + '</span>')
        var body = {
          api_key: "7e5e2e44707e134d3b65c89f8c7008c5",
          method: "flickr.photos.search",
          nojsoncallback: 1,
          format: "json",
          text: keyword,
          per_page: 2,
          page: 1
        }
        $.post("https://api.flickr.com/services/rest/", body)
          .done(function(data) {
            console.log(data);
            var photos = data.photos.photo;
            for (var i = 0; i < photos.length; i++) {
              var url = "https://farm" + photos[i].farm + ".staticflickr.com/" + photos[i].server + "/" + photos[i].id + "_" + photos[i].secret + "_q.jpg";
              $('#images').prepend('<img src=' + url + '/>')
            }
          }).fail(function(event) {
            console.log(event);
          });
      } 
      */
    })
    .fail(function() {
      console.log("error");
    })
    .always(function() {
      // finished
    });
}

function buidPost(text, city, index) {
  $("#sections").append(" <li id='post-" + index + "'><div class='mapContainer'><div class='mapWrapper'><div id='post-map-" + index + "' class='map'></div></div></div><div class='textContainer'><h2>When i was in " + city + "</h2><p>" + text + "</p></div></li>");
}
