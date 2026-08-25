/**
 * Guia BH — mapa de restaurantes + “meu hotel”
 * Bootstrap Google Maps + Advanced Markers + Places Autocomplete + Haversine
 */
(function () {
    'use strict';

    const BOOTSTRAP_ATTR = 'data-google-maps-bootstrap';
    const PRIMARY = '#FF6B00';
    const ACCENT = '#C45C3E';
    const BH_CENTER = { lat: -19.934, lng: -43.94 };

    let coreLoadPromise = null;
    let map = null;
    let LatLngBoundsCtor = null;
    let AdvancedMarkerElementCtor = null;
    let hotelMarker = null;
    let hotelPosition = null;
    let selectedId = null;
    const pinContents = new Map();
    const markersById = new Map();

    function distanceKm(a, b) {
        const R = 6371;
        const dLat = ((b.lat - a.lat) * Math.PI) / 180;
        const dLng = ((b.lng - a.lng) * Math.PI) / 180;
        const x =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((a.lat * Math.PI) / 180) *
                Math.cos((b.lat * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    function formatKm(km) {
        if (km < 1) return `${Math.round(km * 1000)} m`;
        return `${km.toFixed(1).replace('.', ',')} km`;
    }

    function activeRestaurants() {
        const list = window.GUIABH_RESTAURANTS || [];
        return list.filter((r) => r.partnershipActive);
    }

    function injectBootstrapLoader(key) {
        if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') {
            return;
        }
        if (document.querySelector(`script[${BOOTSTRAP_ATTR}]`)) {
            return;
        }
        const script = document.createElement('script');
        script.setAttribute(BOOTSTRAP_ATTR, 'true');
        script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:${JSON.stringify(key)},v:"weekly"});`;
        document.head.appendChild(script);
    }

    async function waitForImportLibrary() {
        for (let i = 0; i < 100; i++) {
            if (typeof google?.maps?.importLibrary === 'function') return;
            await new Promise((r) => setTimeout(r, 50));
        }
        throw new Error('Google Maps importLibrary não disponível após carregar o bootstrap');
    }

    async function loadGoogleMapsCore(apiKey) {
        if (coreLoadPromise) return coreLoadPromise;
        coreLoadPromise = (async () => {
            injectBootstrapLoader(apiKey);
            await waitForImportLibrary();
            const mapsLib = await google.maps.importLibrary('maps');
            const markerLib = await google.maps.importLibrary('marker');
            await google.maps.importLibrary('places');
            return {
                Map: mapsLib.Map,
                LatLngBounds: google.maps.LatLngBounds,
                AdvancedMarkerElement: markerLib.AdvancedMarkerElement,
            };
        })();
        return coreLoadPromise;
    }

    function setOverlay(state, message) {
        const loading = document.getElementById('guia-map-loading');
        const error = document.getElementById('guia-map-error');
        const errorText = document.getElementById('guia-map-error-text');
        if (loading) loading.classList.toggle('hidden', state !== 'loading');
        if (error) error.classList.toggle('hidden', state !== 'error');
        if (errorText && message) errorText.textContent = message;
    }

    function createRestaurantMarkerContent(restaurant, selected) {
        const wrapper = document.createElement('div');
        wrapper.style.cursor = 'pointer';
        wrapper.style.userSelect = 'none';
        wrapper.title = restaurant.name;
        wrapper.setAttribute('aria-selected', selected ? 'true' : 'false');

        const pill = document.createElement('div');
        pill.dataset.restaurantPin = 'true';
        pill.textContent = restaurant.brand;
        applyPinStyle(pill, selected);
        wrapper.appendChild(pill);
        return wrapper;
    }

    function applyPinStyle(pill, selected) {
        pill.style.cssText = selected
            ? `border:2px solid ${PRIMARY};background:#FFF7ED;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:700;color:#1E293B;box-shadow:0 4px 12px rgba(0,0,0,.15);white-space:nowrap;transform:scale(1.08);`
            : `border:1px solid #E2E8F0;background:#fff;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:700;color:#1E293B;box-shadow:0 2px 8px rgba(0,0,0,.12);white-space:nowrap;`;
    }

    function setMarkerSelected(id, selected) {
        const content = pinContents.get(id);
        if (!content) return;
        const pill = content.querySelector("[data-restaurant-pin='true']");
        if (pill) applyPinStyle(pill, selected);
        content.setAttribute('aria-selected', selected ? 'true' : 'false');
    }

    function createHotelMarkerContent() {
        const wrapper = document.createElement('div');
        wrapper.style.cursor = 'default';
        wrapper.style.userSelect = 'none';
        wrapper.title = 'Seu hotel / posição';
        const pill = document.createElement('div');
        pill.textContent = 'Meu hotel';
        pill.style.cssText = `border:2px solid ${ACCENT};background:${ACCENT};color:#fff;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;box-shadow:0 4px 14px rgba(196,92,62,.35);white-space:nowrap;`;
        wrapper.appendChild(pill);
        return wrapper;
    }

    function selectRestaurant(id, { scroll = true, pan = true } = {}) {
        if (selectedId) setMarkerSelected(selectedId, false);
        selectedId = id || null;
        if (selectedId) setMarkerSelected(selectedId, true);

        document.querySelectorAll('[data-restaurant-id]').forEach((el) => {
            el.classList.toggle('guia-location-selected', el.dataset.restaurantId === selectedId);
        });
        document.querySelectorAll('[data-brand-card]').forEach((el) => {
            const brand = el.dataset.brandCard;
            const r = activeRestaurants().find((x) => x.id === selectedId);
            el.classList.toggle('guia-card-selected', !!(r && r.brand === brand));
        });

        if (scroll && selectedId) {
            const r = activeRestaurants().find((x) => x.id === selectedId);
            const brandCard = r
                ? document.querySelector(`[data-brand-card="${CSS.escape(r.brand)}"]`)
                : null;
            const locEl = document.querySelector(`[data-restaurant-id="${CSS.escape(selectedId)}"]`);
            (brandCard || locEl)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (pan && selectedId && map && markersById.has(selectedId)) {
            const r = activeRestaurants().find((x) => x.id === selectedId);
            if (r) map.panTo({ lat: r.lat, lng: r.lng });
        }
    }

    function updateNearestPanel(sorted) {
        const panel = document.getElementById('guia-nearest-panel');
        const list = document.getElementById('guia-nearest-list');
        if (!panel || !list) return;

        if (!hotelPosition || !sorted.length) {
            panel.classList.add('hidden');
            list.innerHTML = '';
            return;
        }

        panel.classList.remove('hidden');
        list.innerHTML = sorted
            .map(
                (item, i) => `
            <button type="button" data-nearest-id="${item.id}"
                class="w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-orange-100/80 bg-white hover:border-primary/40 transition-colors ${
                    item.id === selectedId ? 'ring-2 ring-primary/40' : ''
                }">
                <span class="flex items-center gap-3 min-w-0">
                    <span class="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">${i + 1}</span>
                    <span class="min-w-0">
                        <span class="block font-semibold text-secondary text-sm truncate">${item.name}</span>
                        <span class="block text-xs text-slate-500 truncate">${item.address} — ${item.neighborhood}</span>
                    </span>
                </span>
                <span class="shrink-0 text-sm font-bold text-primary">${formatKm(item.km)}</span>
            </button>`
            )
            .join('');

        list.querySelectorAll('[data-nearest-id]').forEach((btn) => {
            btn.addEventListener('click', () => selectRestaurant(btn.dataset.nearestId));
        });
    }

    function updateDistanceBadges(sortedMap) {
        document.querySelectorAll('[data-distance-for]').forEach((el) => {
            const id = el.dataset.distanceFor;
            const km = sortedMap.get(id);
            if (km == null) {
                el.classList.add('hidden');
                el.textContent = '';
            } else {
                el.classList.remove('hidden');
                el.textContent = formatKm(km);
            }
        });

        document.querySelectorAll('[data-brand-distance]').forEach((el) => {
            const brand = el.dataset.brandDistance;
            const brandItems = [...sortedMap.entries()]
                .map(([id, km]) => {
                    const r = activeRestaurants().find((x) => x.id === id);
                    return r && r.brand === brand ? km : null;
                })
                .filter((km) => km != null);
            if (!brandItems.length || !hotelPosition) {
                el.classList.add('hidden');
                el.textContent = '';
            } else {
                const nearest = Math.min(...brandItems);
                el.classList.remove('hidden');
                el.textContent = `A partir de ${formatKm(nearest)}`;
            }
        });
    }

    function reorderBrandCards(sorted) {
        const container = document.getElementById('guia-restaurant-list');
        if (!container || !hotelPosition) return;

        const brandOrder = [];
        const seen = new Set();
        for (const item of sorted) {
            if (!seen.has(item.brand)) {
                seen.add(item.brand);
                brandOrder.push(item.brand);
            }
        }

        brandOrder.forEach((brand) => {
            const card = container.querySelector(`[data-brand-card="${CSS.escape(brand)}"]`);
            if (card) container.appendChild(card);
        });
    }

    function applyHotelDistances() {
        const clearBtn = document.getElementById('guia-clear-hotel');
        const hint = document.getElementById('guia-hotel-status');

        if (!hotelPosition) {
            if (clearBtn) clearBtn.classList.add('hidden');
            if (hint) hint.textContent = '';
            updateNearestPanel([]);
            updateDistanceBadges(new Map());
            return;
        }

        if (clearBtn) clearBtn.classList.remove('hidden');
        if (hint) hint.textContent = 'Posição marcada — ordenando por proximidade.';

        const sorted = activeRestaurants()
            .map((r) => ({
                ...r,
                km: distanceKm(hotelPosition, { lat: r.lat, lng: r.lng }),
            }))
            .sort((a, b) => a.km - b.km);

        const sortedMap = new Map(sorted.map((r) => [r.id, r.km]));
        updateNearestPanel(sorted);
        updateDistanceBadges(sortedMap);
        reorderBrandCards(sorted);
    }

    function setHotel(lat, lng, label) {
        hotelPosition = { lat, lng };
        if (!map || !AdvancedMarkerElementCtor) {
            applyHotelDistances();
            return;
        }

        if (hotelMarker) {
            hotelMarker.position = { lat, lng };
        } else {
            hotelMarker = new AdvancedMarkerElementCtor({
                map,
                position: { lat, lng },
                content: createHotelMarkerContent(),
                title: label || 'Meu hotel',
                zIndex: 1000,
            });
        }

        map.panTo({ lat, lng });
        applyHotelDistances();
    }

    function clearHotel() {
        hotelPosition = null;
        if (hotelMarker) {
            hotelMarker.map = null;
            hotelMarker = null;
        }
        applyHotelDistances();

        const placeRoot = document.getElementById('guia-place-autocomplete');
        if (placeRoot) {
            const input = placeRoot.querySelector('input');
            if (input) input.value = '';
        }
    }

    function setupCardClicks() {
        document.querySelectorAll('[data-restaurant-id]').forEach((el) => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                selectRestaurant(el.dataset.restaurantId, { scroll: false, pan: true });
            });
        });
    }

    async function setupPlacesAutocomplete(container) {
        if (!container || !google.maps.places?.PlaceAutocompleteElement) {
            container.innerHTML =
                '<p class="text-sm text-slate-500">Busca de hotel indisponível. Clique no mapa para marcar sua posição.</p>';
            return;
        }

        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
            includedRegionCodes: ['br'],
            locationBias: {
                west: -44.2,
                south: -20.1,
                east: -43.7,
                north: -19.7,
            },
        });
        placeAutocomplete.id = 'guia-hotel-autocomplete';
        placeAutocomplete.style.width = '100%';
        container.innerHTML = '';
        container.appendChild(placeAutocomplete);

        placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] });
            const loc = place.location;
            if (!loc) return;
            const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
            const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
            setHotel(lat, lng, place.displayName || place.formattedAddress || 'Hotel');
        });

        // Fallback para builds mais antigos do Places Autocomplete Element
        placeAutocomplete.addEventListener('gmp-placeselect', async ({ place }) => {
            await place.fetchFields?.({ fields: ['location', 'displayName', 'formattedAddress'] });
            const loc = place.location;
            if (!loc) return;
            const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
            const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
            setHotel(lat, lng, place.displayName || place.formattedAddress || 'Hotel');
        });
    }

    async function initMap() {
        const mapEl = document.getElementById('guia-map');
        if (!mapEl) return;

        const restaurants = activeRestaurants();
        if (!restaurants.length) {
            setOverlay('error', 'Nenhum restaurante ativo para exibir no mapa.');
            return;
        }

        setOverlay('loading');

        try {
            const res = await fetch('/api/maps-config');
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || 'Não foi possível carregar a configuração do mapa.');
            }
            const { apiKey, mapId } = await res.json();

            const libs = await loadGoogleMapsCore(apiKey);
            LatLngBoundsCtor = libs.LatLngBounds;
            AdvancedMarkerElementCtor = libs.AdvancedMarkerElement;

            map = new libs.Map(mapEl, {
                mapId: mapId || 'DEMO_MAP_ID',
                center: BH_CENTER,
                zoom: 13,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
            });

            const bounds = new LatLngBoundsCtor();
            pinContents.clear();
            markersById.clear();

            for (const r of restaurants) {
                bounds.extend({ lat: r.lat, lng: r.lng });
                const content = createRestaurantMarkerContent(r, false);
                pinContents.set(r.id, content);
                content.addEventListener('click', (event) => {
                    event.stopPropagation();
                    selectRestaurant(r.id);
                });
                const marker = new AdvancedMarkerElementCtor({
                    map,
                    position: { lat: r.lat, lng: r.lng },
                    content,
                    title: r.name,
                });
                markersById.set(r.id, marker);
            }

            if (restaurants.length > 1) {
                map.fitBounds(bounds, 56);
            }

            map.addListener('click', (e) => {
                if (!e.latLng) return;
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setHotel(lat, lng, 'Posição no mapa');
            });

            await setupPlacesAutocomplete(document.getElementById('guia-place-autocomplete'));
            setOverlay('ready');
        } catch (err) {
            console.error('[guiabh-map]', err);
            setOverlay(
                'error',
                err instanceof Error
                    ? err.message
                    : 'Não foi possível carregar o mapa. Use a lista abaixo.'
            );
        }
    }

    function init() {
        setupCardClicks();
        document.getElementById('guia-clear-hotel')?.addEventListener('click', clearHotel);
        void initMap();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
