declare module "weather-js" {
  const weatherjs: {
    find: (
      options: { search: string; degreeType: "C" | "F" },
      callback: (err: Error | unknown, result: WeatherData[]) => void
    ) => void;
  };

  export interface WeatherData {
    location: {
      name: string;
      lat: string;
      long: string;
      timezone: string;
      alert: string;
      degreetype: string;
      imagerelativeurl: string;
    };
    current: {
      temperature: string;
      skycode: string;
      skytext: string;
      date: string;
      observationtime: string;
      observationpoint: string;
      feelslike: string;
      humidity: string;
      winddisplay: string;
      day: string;
      shortday: string;
      windspeed: string;
      imageUrl: string;
    };
    forecast: [
      {
        low: string;
        high: string;
        skycodeday: string;
        skytextday: string;
        date: string;
        day: string;
        shortday: string;
        precip: string;
      },
      {
        low: string;
        high: string;
        skycodeday: string;
        skytextday: string;
        date: string;
        day: string;
        shortday: string;
        precip: string;
      },
      {
        low: string;
        high: string;
        skycodeday: string;
        skytextday: string;
        date: string;
        day: string;
        shortday: string;
        precip: string;
      },
      {
        low: string;
        high: string;
        skycodeday: string;
        skytextday: string;
        date: string;
        day: string;
        shortday: string;
        precip: string;
      },
      {
        low: string;
        high: string;
        skycodeday: string;
        skytextday: string;
        date: string;
        day: string;
        shortday: string;
        precip: string;
      }
    ];
  }

  export default weatherjs;
}
