// Modelo Foto del dia (APOD)
export interface ApodResponse {
  date: string;
  explanation: string;
  url: string;
  title: string;
  media_type: string;
}

// Modelo Clima en Marte modelo nadia//
export interface InsightWeatherResponse {
  sol_keys: string[];
  [key: string]: any;
}

// Modelo Asteriores (NEO)
export interface NeoResponse {
  element_count: number;
  near_earth_objects: {
    [key: string]: {
      id: string; name: string; is_potentially_hazardous_asteroid: boolean;
      estimated_diameter: { kilometers: { estimated_diameter_max: number }; };
    }[];
  };
}

// Modelo Eventos Naturales (EONET)
export interface EonetResponse {
  events: {
    id: string; title: string;
    categories: { title: string }[];
    geometries: { date: string }[];
  }[];
}

// Modelo Buscador de Imagene
export interface NasaSearchResponse {
  collection: {
    items: {
      data: { title: string; description?: string; media_type: string }[];
      links?: { href: string }[];
    }[];
  };
}

// Modelo Clima Solar
export interface DonkiResponse {
  flrID: string; beginTime: string; peakTime: string; classType: string;
}
