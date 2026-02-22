// Modelo Foto del dia (APOD)


// Modelo Clima en Marte 


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
