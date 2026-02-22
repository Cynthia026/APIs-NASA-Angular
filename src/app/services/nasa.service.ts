import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ApodResponse, NeoResponse, NasaSearchResponse, DonkiResponse,
  EonetResponse, InsightWeatherResponse // <--- Importamos la nueva interfaz
} from '../models/nasa.models';

@Injectable({ providedIn: 'root' })
export class NasaService {
  private readonly baseUrl = 'https://api.nasa.gov';
  
  // Pon tu API Key gratuita aquí
  private readonly apiKey = 'ORomGFfcSZCeegeTgYGLkGePW8LWcA0u49R6UaO5'; 

  constructor(private http: HttpClient) {}

  // 1. APOD
  

  // 2. INSIGHT MARS WEATHER (Reemplaza Tech)
  

  // 3. NEOWS (Asteroides)
  

  // 4. EONET (Eventos Naturales)
  

  // 5. SEARCH (Buscador)
  search(query: string): Observable<NasaSearchResponse> {
    const params = new HttpParams().set('q', query).set('media_type', 'image');
    return this.http.get<NasaSearchResponse>(`https://images-api.nasa.gov/search`, { params });
  }

  // 6. DONKI (Solar)
  getSolarFlares(): Observable<DonkiResponse[]> {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const params = new HttpParams().set('api_key', this.apiKey).set('startDate', date.toISOString().split('T')[0]);
    return this.http.get<DonkiResponse[]>(`${this.baseUrl}/DONKI/FLR`, { params });
  }
}