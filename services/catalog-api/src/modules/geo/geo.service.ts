import { Injectable } from '@nestjs/common';

export type GeoPlaceSuggestion = {
  nameRu: string;
  nameKk?: string;
  lat: number;
  lng: number;
  displayName: string;
  slugSuggestion: string;
  timezone: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  name?: string;
  address?: Record<string, string>;
};

@Injectable()
export class GeoService {
  async searchCities(query: string, countryCode = 'kz'): Promise<GeoPlaceSuggestion[]> {
    const q = query.trim();
    if (q.length < 2) {
      return [];
    }

    const params = new URLSearchParams({
      q,
      format: 'json',
      limit: '8',
      addressdetails: '1',
      countrycodes: countryCode.toLowerCase(),
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'QalaGo/1.0 (city-admin-setup)',
        'Accept-Language': 'ru,kk,en',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as NominatimResult[];

    return data
      .filter((item) => this.isCityLike(item))
      .map((item) => this.toSuggestion(item))
      .filter((item, index, all) =>
        all.findIndex((other) => other.slugSuggestion === item.slugSuggestion) === index,
      );
  }

  private isCityLike(item: NominatimResult) {
    if (item.class !== 'place') {
      return item.type === 'administrative';
    }
    return ['city', 'town', 'municipality', 'administrative'].includes(item.type ?? '');
  }

  private toSuggestion(item: NominatimResult): GeoPlaceSuggestion {
    const address = item.address ?? {};
    const nameRu =
      address.city ??
      address.town ??
      address.municipality ??
      address.village ??
      address.state ??
      item.name ??
      item.display_name.split(',')[0]?.trim() ??
      'Город';

    const lat = Number.parseFloat(item.lat);
    const lng = Number.parseFloat(item.lon);

    return {
      nameRu,
      nameKk: address['name:kk'] ?? address.name_kk,
      lat,
      lng,
      displayName: item.display_name,
      slugSuggestion: this.slugify(nameRu),
      timezone: this.guessKazakhstanTimezone(lat, lng),
    };
  }

  private slugify(name: string) {
    const map: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
      и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
      с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
      ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', қ: 'q', ғ: 'g', ң: 'n',
      ө: 'o', ұ: 'u', һ: 'h', і: 'i',
    };

    return name
      .trim()
      .toLowerCase()
      .split('')
      .map((char) => map[char] ?? char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  private guessKazakhstanTimezone(lat: number, lng: number) {
    if (lng < 55) return 'Asia/Oral';
    if (lng < 62) return 'Asia/Aqtobe';
    if (lng < 68) return 'Asia/Qyzylorda';
    if (lat < 47) return 'Asia/Aqtau';
    return 'Asia/Almaty';
  }
}
