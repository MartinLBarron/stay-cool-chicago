// EN/ES string tables — all UI copy lives here.
// Center names, addresses, and phone numbers are proper nouns and are not translated.

const copy = {
  en: {
    // App identity
    appName: 'Stay Cool Chicago',
    tagline: 'Free places to cool down, near you.',
    taglineOffSeason: 'Find a cool place near you.',
    aboutLink:    'A neighbor-built service',
    cityDataLink: 'City of Chicago data',

    // Heat advisory
    advisoryLabel: 'Heat advisory',
    warningLabel: 'Heat watch',
    emergencyLabel: 'Extreme heat emergency',
    feelsLike: 'Feels like',
    through: 'Through',

    // Welcome screen
    welcomeHeadline: 'Free places to cool down, near you.',
    welcomeSub: 'Free, air-conditioned places to rest and hydrate — open across Chicago.',
    findNearest: 'Find nearest cooling center',
    findNearestSub: 'Uses your location',
    searchCenter:    'Search for cooling center',
    searchCenterSub: 'By address or neighborhood',
    viewMap: 'See all cooling centers',
    viewMapSub: '120+ locations across the city',
    needRide: 'Need assistance? Call 311',

    // Home / nearest center
    nearYou: 'Near',
    findRest: 'Find a cool place.',
    findRestSub: 'A safe, free place to rest indoors.',
    openNow: 'Open now',
    openUntil: 'Open until',
    closedNow: 'Closed now',
    minWalk: 'min walk',
    minTransit: 'min by transit',
    transit: 'Transit',
    miAway: 'mi away',
    getDirections: 'Get directions',
    copied: 'Link copied!',
    callCenter: 'Call',
    share: 'Share',
    othersNearby: 'Others nearby',
    seeAll: 'See all centers',
    noCentersOpen: 'No centers are open right now.',
    noCentersOpenSub: 'Call 311 for assistance finding shelter.',
    call311: 'Call 311',

    // Search screen
    searchHeadline: 'Where are you?',
    searchSub: 'Type a street, ZIP, or pick a neighborhood.',
    searchPlaceholder: 'Street, ZIP code, or landmark',
    searchBtn: 'Search',
    searching: 'Searching…',
    geocodeError: 'Location not found.',
    geocodeErrorSub: 'Try a specific street, ZIP code, or pick a neighborhood below.',
    pickNeighborhood: 'Or pick a neighborhood',

    // Map screen
    mapTitle: 'Cooling centers',
    centersOpen: 'open now',
    nearestCenter: 'Nearest open center',
    locateMe: 'Locate me',

    // List screen
    listTitle: 'All cooling centers',
    viewMapBtn: 'View map',
    filterAll: 'All types',
    sortedByDistance: 'Sorted by distance',
    sortedByName: 'Sorted by name',
    noResults: 'No centers match that filter.',

    // Center detail
    hoursToday: 'Hours today',
    hoursLabel: 'Hours',
    closedToday: 'Closed today',
    opensAt: 'Opens at',
    amenities: 'What\'s available',
    noAmenityData: 'Call center to confirm available amenities.',

    // Amenity labels
    wheelchair: 'Wheelchair accessible',
    pets: 'Pets OK',
    wifi: 'Wi-Fi',
    water: 'Free water',
    restrooms: 'Restrooms',
    seating: 'Seating',

    // Language toggle
    langToggle: 'Español',
    langCode: 'en',

    // Neighborhoods
    neighborhoods: [
      { label: 'Pilsen',         lat: 41.8536, lng: -87.6665 },
      { label: 'Little Village', lat: 41.8498, lng: -87.7182 },
      { label: 'Englewood',      lat: 41.7788, lng: -87.6455 },
      { label: 'Austin',         lat: 41.8980, lng: -87.7668 },
      { label: 'Humboldt Park',  lat: 41.9003, lng: -87.7220 },
      { label: 'Uptown',         lat: 41.9653, lng: -87.6537 },
      { label: 'South Shore',    lat: 41.7614, lng: -87.5760 },
      { label: 'Hyde Park',      lat: 41.7943, lng: -87.5907 },
    ],
  },

  es: {
    // App identity
    appName: 'Chicago Fresco',
    tagline: 'Lugares gratuitos para refrescarte, cerca de ti.',
    taglineOffSeason: 'Encuentra un lugar fresco cerca de ti.',
    aboutLink:    'Un servicio comunitario',
    cityDataLink: 'Datos de la Ciudad de Chicago',

    // Heat advisory
    advisoryLabel: 'Aviso de calor',
    warningLabel: 'Vigilancia de calor',
    emergencyLabel: 'Emergencia de calor extremo',
    feelsLike: 'Sensación',
    through: 'Hasta',

    // Welcome screen
    welcomeHeadline: 'Lugares gratis para refrescarte, cerca de ti.',
    welcomeSub: 'Lugares con aire acondicionado para descansar e hidratarse, abiertos en todo Chicago.',
    findNearest: 'Encontrar centro más cercano',
    findNearestSub: 'Usa tu ubicación',
    searchCenter:    'Buscar centro de enfriamiento',
    searchCenterSub: 'Por dirección o vecindario',
    viewMap: 'Ver todos los centros',
    viewMapSub: 'Más de 120 lugares en la ciudad',
    needRide: '¿Necesita ayuda? Llame al 311',

    // Home / nearest center
    nearYou: 'Cerca de',
    findRest: 'Encuentra un lugar fresco.',
    findRestSub: 'Un lugar seguro y gratuito para descansar.',
    openNow: 'Abierto ahora',
    openUntil: 'Abierto hasta',
    closedNow: 'Cerrado ahora',
    minWalk: 'min caminando',
    minTransit: 'min en transporte',
    transit: 'Transporte',
    miAway: 'millas',
    getDirections: 'Cómo llegar',
    copied: '¡Enlace copiado!',
    callCenter: 'Llamar',
    share: 'Compartir',
    othersNearby: 'Otros cercanos',
    seeAll: 'Ver todos los centros',
    noCentersOpen: 'Ningún centro está abierto ahora.',
    noCentersOpenSub: 'Llame al 311 para obtener ayuda.',
    call311: 'Llamar al 311',

    // Search screen
    searchHeadline: '¿Dónde estás?',
    searchSub: 'Escribe una calle, código postal o elige un barrio.',
    searchPlaceholder: 'Calle, código postal o lugar',
    searchBtn: 'Buscar',
    searching: 'Buscando…',
    geocodeError: 'Ubicación no encontrada.',
    geocodeErrorSub: 'Intente con una calle, código postal, o elija un barrio abajo.',
    pickNeighborhood: 'O elige un barrio',
    skipToMap: 'Saltar y ver el mapa',

    // Map screen
    mapTitle: 'Centros de enfriamiento',
    centersOpen: 'abiertos ahora',
    nearestCenter: 'Centro abierto más cercano',
    locateMe: 'Mi ubicación',

    // List screen
    listTitle: 'Todos los centros',
    viewMapBtn: 'Ver mapa',
    filterAll: 'Todos',
    sortedByDistance: 'Ordenados por distancia',
    sortedByName: 'Ordenados por nombre',
    noResults: 'Ningún centro coincide con ese filtro.',

    // Center detail
    hoursToday: 'Horario de hoy',
    hoursLabel: 'Horario',
    closedToday: 'Cerrado hoy',
    opensAt: 'Abre a las',
    amenities: 'Qué hay disponible',
    noAmenityData: 'Llame al centro para confirmar los servicios disponibles.',

    // Amenity labels
    wheelchair: 'Accesible en silla de ruedas',
    pets: 'Mascotas permitidas',
    wifi: 'Wi-Fi',
    water: 'Agua gratis',
    restrooms: 'Baños',
    seating: 'Asientos',

    // Language toggle
    langToggle: 'English',
    langCode: 'es',

    // Neighborhoods
    neighborhoods: [
      { label: 'Pilsen',         lat: 41.8536, lng: -87.6665 },
      { label: 'La Villita',     lat: 41.8498, lng: -87.7182 },
      { label: 'Englewood',      lat: 41.7788, lng: -87.6455 },
      { label: 'Austin',         lat: 41.8980, lng: -87.7668 },
      { label: 'Humboldt Park',  lat: 41.9003, lng: -87.7220 },
      { label: 'Uptown',         lat: 41.9653, lng: -87.6537 },
      { label: 'South Shore',    lat: 41.7614, lng: -87.5760 },
      { label: 'Hyde Park',      lat: 41.7943, lng: -87.5907 },
    ],
  },
};

export default copy;
