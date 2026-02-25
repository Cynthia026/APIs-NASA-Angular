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


// Modelo Eventos Naturales (EONET)


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
