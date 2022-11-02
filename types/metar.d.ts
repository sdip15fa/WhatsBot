declare module "metar" {
  export default function parseMETAR(metar: string): {
    station: string;
    /** timestamp */
    time: string;
    auto: boolean;
    wind: {
      speed: number;
      gust?: number;
      direction: number;
      variation: {
        min: number;
        max: number;
      };
      unit: string;
    };
    cavok: boolean;
    visibility: number;
    weather?: {
      abbreviation: string;
      meaning: string;
    }[];
    clouds: {
      abbreviation: string;
      meaning: string;
      altitude: number;
      cumulonimbus: boolean;
    }[];
    temperature: number,
    dewpoint: number,
    altimeterInHpa: number
  };
}
