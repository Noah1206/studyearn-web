// Kakao Maps TypeScript declarations
declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    getCenter(): LatLng;
    setLevel(level: number): void;
    getLevel(): number;
    panTo(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void;
    getBounds(): LatLngBounds;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
    getMap(): Map | null;
    setPosition(latlng: LatLng): void;
    getPosition(): LatLng;
    setZIndex(zIndex: number): void;
    getZIndex(): number;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  interface CustomOverlayOptions {
    map?: Map;
    position: LatLng;
    content: HTMLElement | string;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }

  namespace event {
    function addListener(
      target: Map | CustomOverlay,
      type: string,
      handler: (...args: unknown[]) => void
    ): void;
    function removeListener(
      target: Map | CustomOverlay,
      type: string,
      handler: (...args: unknown[]) => void
    ): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao: {
    maps: typeof kakao.maps & {
      load: (callback: () => void) => void;
      Map: typeof kakao.maps.Map;
      LatLng: typeof kakao.maps.LatLng;
      LatLngBounds: typeof kakao.maps.LatLngBounds;
      CustomOverlay: typeof kakao.maps.CustomOverlay;
      event: typeof kakao.maps.event;
    };
  };
}
