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
    const IS_NARROW = () =>
        typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 640px)').matches;

    let coreLoadPromise = null;
    let map = null;
    let LatLngBoundsCtor = null;
    let AdvancedMarkerElementCtor = null;
    let hotelMarker = null;
    let hotelPosition = null;
    let selectedId = null;
    let markOnMapMode = false;
    let statusOverride = '';
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

    function isMobilePins() {
        return IS_NARROW();
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
        const mobile = isMobilePins();
        const pad = mobile ? '8px 12px' : '6px 10px';
        const font = mobile ? '13px' : '12px';
        pill.style.cssText = selected
            ? `border:2px solid ${PRIMARY};background:#FFF7ED;padding:${pad};border-radius:8px;font-size:${font};font-weight:700;color:#1E293B;box-shadow:0 4px 12px rgba(0,0,0,.15);white-space:nowrap;transform:scale(1.08);`
            : `border:1px solid #E2E8F0;background:#fff;padding:${pad};border-radius:8px;font-size:${font};font-weight:700;color:#1E293B;box-shadow:0 2px 8px rgba(0,0,0,.12);white-space:nowrap;`;
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
        pill.textContent = 'Meu Local';
        const mobile = isMobilePins();
        const pad = mobile ? '8px 14px' : '6px 12px';
        const font = mobile ? '13px' : '12px';
        pill.style.cssText = `border:2px solid ${ACCENT};background:${ACCENT};color:#fff;padding:${pad};border-radius:999px;font-size:${font};font-weight:700;box-shadow:0 4px 14px rgba(196,92,62,.35);white-space:nowrap;`;
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

    function setStatus(text) {
        const hint = document.getElementById('guia-hotel-status');
        if (hint) hint.textContent = text || '';
    }

    function applyHotelDistances() {
        const clearBtn = document.getElementById('guia-clear-hotel');

        if (!hotelPosition) {
            if (clearBtn) clearBtn.classList.add('hidden');
            if (!markOnMapMode) setStatus(statusOverride || '');
            updateNearestPanel([]);
            updateDistanceBadges(new Map());
            return;
        }

        if (clearBtn) clearBtn.classList.remove('hidden');
        if (!markOnMapMode) {
            setStatus(statusOverride || 'Posição marcada — ordenando por proximidade.');
        }

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

    function scrollToNearestFeedback() {
        requestAnimationFrame(() => {
            const panel = document.getElementById('guia-nearest-panel');
            const mapWrap = document.getElementById('guia-map')?.parentElement;
            const target = panel && !panel.classList.contains('hidden') ? panel : mapWrap;
            target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    function setMarkOnMapMode(enabled) {
        markOnMapMode = !!enabled;
        const btn = document.getElementById('guia-mark-on-map');
        const mapEl = document.getElementById('guia-map');
        if (btn) {
            btn.classList.toggle('is-active', markOnMapMode);
            btn.setAttribute('aria-pressed', markOnMapMode ? 'true' : 'false');
        }
        if (mapEl) mapEl.classList.toggle('guia-map-mark-mode', markOnMapMode);
        if (markOnMapMode) {
            setStatus('Toque no mapa para marcar seu hotel / posição.');
        } else if (hotelPosition) {
            setStatus(statusOverride || 'Posição marcada — ordenando por proximidade.');
        } else {
            setStatus(statusOverride || '');
        }
    }

    function setHotel(lat, lng, label, options = {}) {
        const { statusMessage, scrollFeedback = true } = options;
        hotelPosition = { lat, lng };
        statusOverride = statusMessage || '';

        if (!map || !AdvancedMarkerElementCtor) {
            applyHotelDistances();
            if (scrollFeedback) scrollToNearestFeedback();
            return;
        }

        if (hotelMarker) {
            hotelMarker.position = { lat, lng };
            hotelMarker.title = label || 'Meu Local';
        } else {
            hotelMarker = new AdvancedMarkerElementCtor({
                map,
                position: { lat, lng },
                content: createHotelMarkerContent(),
                title: label || 'Meu Local',
                zIndex: 1000,
            });
        }

        map.panTo({ lat, lng });
        const currentZoom = map.getZoom?.() ?? 13;
        if (typeof currentZoom === 'number' && currentZoom < 14) {
            map.setZoom(14);
        }

        setMarkOnMapMode(false);
        applyHotelDistances();
        if (scrollFeedback) scrollToNearestFeedback();
    }

    function clearHotel() {
        hotelPosition = null;
        statusOverride = '';
        if (hotelMarker) {
            hotelMarker.map = null;
            hotelMarker = null;
        }
        setMarkOnMapMode(false);
        applyHotelDistances();

        const input = document.getElementById('guia-hotel-input');
        if (input) input.value = '';
        if (typeof window.__guiaClearSuggestions === 'function') {
            window.__guiaClearSuggestions();
        }
    }

    function useCurrentLocation() {
        const btn = document.getElementById('guia-use-location');
        if (!navigator.geolocation) {
            setStatus('Geolocalização não disponível neste aparelho.');
            return;
        }

        if (btn) btn.disabled = true;
        setStatus('Obtendo sua localização…');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (btn) btn.disabled = false;
                setHotel(pos.coords.latitude, pos.coords.longitude, 'Minha localização', {
                    statusMessage: 'Usando sua localização atual.',
                });
            },
            (err) => {
                if (btn) btn.disabled = false;
                const denied = err && err.code === 1;
                setStatus(
                    denied
                        ? 'Permissão de localização negada. Digite o hotel ou marque no mapa.'
                        : 'Não foi possível obter a localização. Digite o hotel ou marque no mapa.'
                );
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
    }

    function setupCardClicks() {
        document.querySelectorAll('[data-restaurant-id]').forEach((el) => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                selectRestaurant(el.dataset.restaurantId, { scroll: false, pan: true });
            });
        });
    }

    function formatPredictionText(part) {
        if (!part) return '';
        if (typeof part === 'string') return part;
        if (typeof part.text === 'string' && part.text) return part.text;
        if (typeof part.toString === 'function') {
            const s = part.toString();
            if (typeof s === 'string' && s && s !== '[object Object]') return s;
        }
        return '';
    }

    function predictionLabel(prediction) {
        const main =
            formatPredictionText(prediction.mainText) ||
            formatPredictionText(prediction.text) ||
            'Lugar';
        const secondary = formatPredictionText(prediction.secondaryText);
        return { main, secondary };
    }

    async function setupPlacesAutocomplete(container) {
        const input = document.getElementById('guia-hotel-input');
        const listEl = document.getElementById('guia-place-suggestions');
        if (!container || !input || !listEl) return;

        const AutocompleteSuggestion = google.maps.places?.AutocompleteSuggestion;
        const AutocompleteSessionToken = google.maps.places?.AutocompleteSessionToken;

        if (!AutocompleteSuggestion?.fetchAutocompleteSuggestions || !AutocompleteSessionToken) {
            container.innerHTML =
                '<p class="text-sm text-slate-500 px-3 py-2">Busca de hotel indisponível. Use sua localização ou marque no mapa.</p>';
            return;
        }

        const BH_BOUNDS = {
            west: -44.2,
            south: -20.1,
            east: -43.7,
            north: -19.7,
        };

        let sessionToken = new AutocompleteSessionToken();
        let debounceTimer = null;
        let blurTimer = null;
        let activeIndex = -1;
        let currentPredictions = [];
        let requestId = 0;

        function renewSessionToken() {
            sessionToken = new AutocompleteSessionToken();
        }

        function setExpanded(open) {
            input.setAttribute('aria-expanded', open ? 'true' : 'false');
            listEl.classList.toggle('is-open', open);
            if (open) listEl.removeAttribute('hidden');
            else listEl.setAttribute('hidden', '');
        }

        function clearSuggestions() {
            currentPredictions = [];
            activeIndex = -1;
            listEl.innerHTML = '';
            setExpanded(false);
            input.removeAttribute('aria-activedescendant');
        }

        window.__guiaClearSuggestions = clearSuggestions;

        function renderSuggestions(predictions) {
            currentPredictions = predictions;
            activeIndex = -1;
            listEl.innerHTML = '';

            if (!predictions.length) {
                setExpanded(false);
                return;
            }

            predictions.forEach((prediction, i) => {
                const { main, secondary } = predictionLabel(prediction);
                const li = document.createElement('li');
                li.id = `guia-suggest-${i}`;
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', 'false');
                li.dataset.index = String(i);

                const mainSpan = document.createElement('span');
                mainSpan.className = 'guia-suggest-main';
                mainSpan.textContent = main;
                li.appendChild(mainSpan);

                if (secondary) {
                    const secSpan = document.createElement('span');
                    secSpan.className = 'guia-suggest-secondary';
                    secSpan.textContent = secondary;
                    li.appendChild(secSpan);
                }

                li.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });
                li.addEventListener('click', () => {
                    void selectPrediction(i);
                });

                listEl.appendChild(li);
            });

            const footer = document.createElement('div');
            footer.className = 'guia-suggest-footer';
            footer.textContent = 'Powered by Google';
            listEl.appendChild(footer);

            setExpanded(true);
        }

        function highlightActive(index) {
            const options = listEl.querySelectorAll('[role="option"]');
            options.forEach((el, i) => {
                const on = i === index;
                el.classList.toggle('is-active', on);
                el.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            activeIndex = index;
            if (index >= 0 && options[index]) {
                input.setAttribute('aria-activedescendant', options[index].id);
                options[index].scrollIntoView({ block: 'nearest' });
            } else {
                input.removeAttribute('aria-activedescendant');
            }
        }

        async function selectPrediction(index) {
            const prediction = currentPredictions[index];
            if (!prediction) return;

            clearSuggestions();
            const { main } = predictionLabel(prediction);
            input.value = main;

            try {
                const place = prediction.toPlace();
                await place.fetchFields({
                    fields: ['location', 'displayName', 'formattedAddress'],
                });
                renewSessionToken();

                const loc = place.location;
                if (!loc) {
                    setStatus('Não foi possível localizar este lugar. Tente outro.');
                    return;
                }
                const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
                const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
                const rawLabel = place.displayName || place.formattedAddress || main || 'Hotel';
                const label = formatPredictionText(rawLabel) || String(rawLabel);
                input.value = label;
                setHotel(lat, lng, label, {
                    statusMessage: `Hotel: ${label}`,
                });
            } catch (err) {
                console.error('[guiabh-map] place select', err);
                setStatus('Não foi possível obter detalhes do lugar. Tente novamente.');
                renewSessionToken();
            }
        }

        async function fetchSuggestions(query) {
            const id = ++requestId;
            const request = {
                input: query,
                sessionToken,
                locationRestriction: BH_BOUNDS,
                language: 'pt-BR',
                region: 'br',
                includedRegionCodes: ['br'],
            };

            try {
                const { suggestions } =
                    await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
                if (id !== requestId) return;

                const predictions = (suggestions || [])
                    .map((s) => s.placePrediction)
                    .filter(Boolean)
                    .slice(0, 5);

                renderSuggestions(predictions);
            } catch (err) {
                // locationRestriction pode falhar em algumas builds — tenta com bias
                try {
                    const { suggestions } =
                        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                            input: query,
                            sessionToken,
                            locationBias: BH_BOUNDS,
                            language: 'pt-BR',
                            region: 'br',
                        });
                    if (id !== requestId) return;
                    const predictions = (suggestions || [])
                        .map((s) => s.placePrediction)
                        .filter(Boolean)
                        .slice(0, 5);
                    renderSuggestions(predictions);
                } catch (err2) {
                    if (id !== requestId) return;
                    console.error('[guiabh-map] autocomplete', err2);
                    clearSuggestions();
                }
            }
        }

        input.addEventListener('input', () => {
            const q = input.value.trim();
            clearTimeout(debounceTimer);
            if (q.length < 2) {
                clearSuggestions();
                return;
            }
            debounceTimer = setTimeout(() => {
                void fetchSuggestions(q);
            }, 300);
        });

        input.addEventListener('keydown', (e) => {
            const open = listEl.classList.contains('is-open');
            if (e.key === 'Escape') {
                clearSuggestions();
                return;
            }
            if (!open || !currentPredictions.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = activeIndex < currentPredictions.length - 1 ? activeIndex + 1 : 0;
                highlightActive(next);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = activeIndex > 0 ? activeIndex - 1 : currentPredictions.length - 1;
                highlightActive(prev);
            } else if (e.key === 'Enter') {
                if (activeIndex >= 0) {
                    e.preventDefault();
                    void selectPrediction(activeIndex);
                }
            }
        });

        input.addEventListener('focus', () => {
            clearTimeout(blurTimer);
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (currentPredictions.length) setExpanded(true);
        });

        input.addEventListener('blur', () => {
            blurTimer = setTimeout(() => {
                setExpanded(false);
                activeIndex = -1;
                input.removeAttribute('aria-activedescendant');
                listEl.querySelectorAll('[role="option"]').forEach((el) => {
                    el.classList.remove('is-active');
                    el.setAttribute('aria-selected', 'false');
                });
            }, 180);
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
                gestureHandling: IS_NARROW() ? 'cooperative' : 'greedy',
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
                map.fitBounds(bounds, IS_NARROW() ? 40 : 56);
            }

            map.addListener('click', (e) => {
                if (!markOnMapMode || !e.latLng) return;
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setHotel(lat, lng, 'Posição no mapa', {
                    statusMessage: 'Posição marcada no mapa — ordenando por proximidade.',
                });
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
        document.getElementById('guia-use-location')?.addEventListener('click', useCurrentLocation);
        document.getElementById('guia-mark-on-map')?.addEventListener('click', () => {
            setMarkOnMapMode(!markOnMapMode);
        });
        void initMap();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
