// ----------------------------------
// MAPBOX
// ----------------------------------
mapboxgl.accessToken = "pk.eyJ1IjoibWFyLS10aW4iLCJhIjoiY21ndTI0ejRvMDhvOTJpb3N4bTVqaTJqZSJ9.ZPHLVLUNCh2X94XMeMQoYQ";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [-66.1653, -17.3895],
    zoom: 13
});

let deviceMarker = null;
let geofenceLayers = {};
let autoFollow = true;


// ------------------------------
// Botón Mi ubicación
// ------------------------------
document.getElementById("btnMiUbicacion").addEventListener("click", () => {
    autoFollow = true;

    if (deviceMarker) {
        const pos = deviceMarker.getLngLat();
        map.flyTo({
            center: [pos.lng, pos.lat],
            zoom: 16,
            speed: 0.7
        });
    }
});

// Si el usuario mueve el mapa manualmente, deja de seguir
map.on("dragstart", () => {
    autoFollow = false;
});


// ----------------------------------
// FIREBASE CONFIG
// ----------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyAvvQwqlASXuvM1-LaT08Bgu-W5I4F9Qh4",
    authDomain: "geolocalizacion-b78ab.firebaseapp.com",
    databaseURL: "https://geolocalizacion-b78ab-default-rtdb.firebaseio.com",
    projectId: "geolocalizacion-b78ab",
    storageBucket: "geolocalizacion-b78ab.firebasestorage.app",
    messagingSenderId: "975579589875",
    appId: "1:975579589875:web:75083e3f52df0cfb4f9b86",
    measurementId: "G-3VKVN13T3J"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();


// ==========================================================
// ===============   UBICACIÓN EN TIEMPO REAL   ==============
// ==========================================================
function listenForDeviceLocation() {
    const ref = db.ref("ultimaUbicacion/Martin");

    ref.on("value", (snap) => {
        const d = snap.val();
        if (!d) return;

        updateDeviceMarker(d.lat, d.lon);
        checkGeofenceExit(d.lat, d.lon);
    });
}

function updateDeviceMarker(lat, lon) {
    if (!deviceMarker) {
        deviceMarker = new mapboxgl.Marker({ color: "blue" })
            .setLngLat([lon, lat])
            .addTo(map);
    } else {
        deviceMarker.setLngLat([lon, lat]);
    }

    if (autoFollow) {
        map.flyTo({
            center: [lon, lat],
            zoom: 16,
            speed: 0.5
        });
    }
}


// ==========================================================
// ==================   GEOFERCAS EN VIVO   ==================
// ==========================================================
function listenForGeofences() {
    const ref = db.ref("geocercas");


    ref.on("child_added", (snap) => {
        drawGeofence(snap.key, snap.val());
    });

    ref.on("child_changed", (snap) => {
        drawGeofence(snap.key, snap.val());
    });

    ref.on("child_removed", (snap) => {
        removeGeofence(snap.key);
    });
}


// ==========================================================
// ===============  DIBUJAR / BORRAR GEOFERCA  ===============
// ==========================================================
function drawGeofence(id, geofence) {
    const center = [geofence.lon, geofence.lat];
    const radius = geofence.radius;

    const points = 64;
    const coords = [];

    for (let i = 0; i < points; i++) {
        const ang = (i / points) * (2 * Math.PI);
        coords.push([
            center[0] + (radius / 111320) * Math.cos(ang),
            center[1] + (radius / 110540) * Math.sin(ang)
        ]);
    }
    coords.push(coords[0]); // cerrar polígono

    const geojson = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [coords]
        }
    };

    const layerId = "geofence-" + id;

    if (map.getSource(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }

    map.addSource(layerId, { type: "geojson", data: geojson });
    map.addLayer({
        id: layerId,
        type: "fill",
        source: layerId,
        paint: {
            "fill-color": "#ff0000",
            "fill-opacity": 0.3
        }
    });

    geofenceLayers[id] = geojson;
}

function removeGeofence(id) {
    const layerId = "geofence-" + id;

    if (map.getSource(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }

    delete geofenceLayers[id];
}


// ==========================================================
// ===============   DETECTAR SALIDA GEOFENCA   ==============
// ==========================================================
function checkGeofenceExit(lat, lon) {
    const point = turf.point([lon, lat]);

    let inside = false;

    for (let id in geofenceLayers) {
        const poly = geofenceLayers[id];
        if (turf.booleanPointInPolygon(point, poly)) {
            inside = true;
            break;
        }
    }

    if (!inside) showExitAlert();
}

function showExitAlert() {
    const alerta = document.getElementById("alertaGeocerca");

    alerta.style.display = "block";
    setTimeout(() => {
        alerta.style.display = "none";
    }, 5000);
}


// ==========================================================
// ================     INICIAR LISTENERS     ================
// ==========================================================
listenForDeviceLocation();
listenForGeofences();
