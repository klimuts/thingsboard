import L from 'leaflet';
import LeafletMap from '../leaflet-map';
import { MapOptions } from '../map-models';
import { aspectCache } from '@app/core/utils';

const maxZoom = 4;//?

export class ImageMap extends LeafletMap {

    imageOverlay;
    aspect = 0;
    width = 0;
    height = 0;

    constructor(private $container: HTMLElement, options: MapOptions) {
        super($container, options);
        aspectCache(options.mapUrl).subscribe(aspect => {
            this.aspect = aspect;
            this.onResize();
            super.setMap(this.map);
            super.initSettings(options);
        });
    }

    updateBounds(updateImage?, lastCenterPos?) {
        const w = this.width;
        const h = this.height;
        let southWest = this.pointToLatLng(0, h);
        let northEast = this.pointToLatLng(w, 0);
        const bounds = new L.LatLngBounds(southWest, northEast);

        if (updateImage && this.imageOverlay) {
            this.imageOverlay.remove();
            this.imageOverlay = null;
        }

        if (this.imageOverlay) {
            this.imageOverlay.setBounds(bounds);
        } else {
            this.imageOverlay = L.imageOverlay(this.options.mapUrl, bounds).addTo(this.map);

        }
        const padding = 200 * maxZoom;
        southWest = this.pointToLatLng(-padding, h + padding);
        northEast = this.pointToLatLng(w + padding, -padding);
        const maxBounds = new L.LatLngBounds(southWest, northEast);
        this.map.setMaxBounds(maxBounds);
        if (lastCenterPos) {
            lastCenterPos.x *= w;
            lastCenterPos.y *= h;
            /* this.ctx.$scope.$injector.get('$mdUtil').nextTick(() => {
                 this.map.panTo(center, { animate: false });
             });*/
        }
    }

    onResize(updateImage?) {
        let width = this.$container.clientWidth;
        if (width > 0 && this.aspect) {
            let height = width / this.aspect;
            const imageMapHeight = this.$container.clientHeight;
            if (imageMapHeight > 0 && height > imageMapHeight) {
                height = imageMapHeight;
                width = height * this.aspect;
            }
            width *= maxZoom;
            const prevWidth = this.width;
            const prevHeight = this.height;
            if (this.width !== width) {
                this.width = width;
                this.height = width / this.aspect;
                if (!this.map) {
                    this.initMap(updateImage);
                } else {
                    const lastCenterPos = this.latLngToPoint(this.map.getCenter());
                    lastCenterPos.x /= prevWidth;
                    lastCenterPos.y /= prevHeight;
                    this.updateBounds(updateImage, lastCenterPos);
                    this.map.invalidateSize(true);
                    // this.updateMarkers();
                }

            }
        }
    }

    initMap(updateImage?) {
        if (!this.map && this.aspect > 0) {
            var center = this.pointToLatLng(this.width / 2, this.height / 2);
            this.map = L.map(this.$container, {
                minZoom: 1,
                maxZoom: maxZoom,
                scrollWheelZoom: !this.options.disableScrollZooming,
                center: center,
                zoom: 1,
                crs: L.CRS.Simple,
                attributionControl: false
            });
            this.updateBounds(updateImage);
            // this.updateMarkers();
        }
    }


    pointToLatLng(x, y) {
        return L.CRS.Simple.pointToLatLng({ x, y } as L.PointExpression, maxZoom - 1);
    }

    latLngToPoint(latLng) {
        return L.CRS.Simple.latLngToPoint(latLng, maxZoom - 1);
    }
}