/* global google Bacon Handlebars */
let map, heatmap, serviceData, types, serviceTypes;
let points = [], markers = [];
const filters = $('.mdl-layout__drawer .types');
const circle = {
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: 'red',
  fillOpacity: .4,
  scale: 4,
  strokeWeight: 0
};

const source = $("#filter-template").html();
const template = Handlebars.compile(source);

/**
 * Initializes map.
 */
(function() {
  // i18n
  $.i18n.init({
    debug: false,
    fallbackLng: 'fi',
    load: 'unspecific'
  }, function() {
    $('html').i18n();
    $('a.language.' + $.i18n.lng()).addClass('active');
  });
  // Load data.
  $.getJSON('http://opendata.navici.com/tampere/opendata/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=opendata:HAMMASHOITOLAT,KIRJASTOT,NEUVOLAT,NUORTEN_TILAT,PAIVAKODIT,TERVEYSASEMAT,UIMAHALLIT,PALVELUKESKUKSET,PAIVAKESKUKSET&outputFormat=json&srsName=EPSG:4326', function(data) {
    // Get unique array of available services and render each as checkbox.
    serviceTypes = [...new Set(data.features.map(service => service.properties.PALVELU))];
    serviceTypes.forEach(type => filters.append(template({'type': type, 'type_i18n': $.t(type)})));

    // Create model for filter values.
    types = Bacon.$.checkBoxGroupValue($('input'), []);

    // Update heatmap when filters change.
    types.onValue(updatePoints);

    // Get service data.
    serviceData = data;
  });

  // Map options.
  let options = {
    zoom: 11,
    center: new google.maps.LatLng(61.493543,23.77951),
    mapTypeId: google.maps.MapTypeId.ROAD,
    disableDefaultUI: true
  };

  // Initialize map.
  map = new google.maps.Map(document.getElementById('map'), options);

  // Initialize heatmap
  heatmap = new google.maps.visualization.HeatmapLayer({ data: points });
  heatmap.setMap(map);
  heatmap.set('opacity', 0.7);
  heatmap.set('radius', 30);
  heatmap.set('maxIntensity', 5);
})();


/**
 * Updates point data on map.
 */
const updatePoints = function() {
  if (!serviceData) {
    return;
  }

  // Reset markers.
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  // Reset points.
  points = [];

  // Filter services based on user selection.
  const filtered = serviceData.features.filter(item => types.get().some(type => type === item.properties.PALVELU));

  // Get data from filtered services.
  let marker, position;
  filtered.forEach(function(service) {
    position = new google.maps.LatLng(service.geometry.coordinates[1], service.geometry.coordinates[0]);
    points.push({location: position, weight: 1.0});

    // Marker for each service.
    marker = new google.maps.Marker({
      position: position,
      title: service.properties.NIMI,
      icon: circle
    });

    markers.push(marker);
    marker.setMap(map);
  });

  // Set heatmap data.
  heatmap.setData(points);
};


// Bind buttons.
$('button#all').on('click', function() {
  $('label').addClass('active');
  types.set(serviceTypes);
});

$('button#none').on('click', function() {
  $('label').removeClass('active');
  types.set([]);
});


// Close navigation.
$('#close').on('click', function() {
  $('#drawer').removeClass('is-visible');
});

// Change language.
$('a.language').on('click', function(e) {
  e.preventDefault();

  // Get selected language.
  var lang = $(this).data('lang');

  // Remove current active language class.
  $('a.language.active').removeClass('active');

  // Add active class to new language.
  $(this).addClass('active');

  // Set new language and reload.
  $.i18n.setLng(lang);
  location.reload();
});

// Toggle label classes.
filters.on('change', 'input', function(event) {
  $(event.target.parentElement).toggleClass('active');
});