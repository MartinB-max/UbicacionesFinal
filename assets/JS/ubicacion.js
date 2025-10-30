// ✅ Configuración de Firebase
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

// ✅ Inicializar Firebase (v8)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 🌍 Inicializar Mapbox
mapboxgl.accessToken = "pk.eyJ1IjoibWFyLS10aW4iLCJhIjoiY21ndTI0ejRvMDhvOTJpb3N4bTVqaTJqZSJ9.ZPHLVLUNCh2X94XMeMQoYQ";
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-68.1193, -16.5000], // Coordenadas iniciales (La Paz)
  zoom: 12
});

// 🧭 Referencias del DOM
const ubicacionesBody = document.getElementById("ubicacionesBody");
const markers = [];

// 🔹 Obtener nombre del usuario desde la URL (por ejemplo ?usuario=Martin)
const params = new URLSearchParams(window.location.search);
const usuario = params.get("usuario") || "Martin"; // valor por defecto

// Mostrar el nombre en los títulos
document.getElementById("nombreUsuario").textContent = usuario;
document.getElementById("nombreUsuarioTabla").textContent = usuario;

// 🔁 Escuchar datos desde Firebase del usuario correspondiente
const ref = database.ref(`ubicaciones/${usuario}`);

ref.on("value", snapshot => {
  const data = snapshot.val();
  ubicacionesBody.innerHTML = "";
  markers.forEach(m => m.remove());
  markers.length = 0;

  if (data) {
    let index = 1;

    for (const key in data) {
      const ubicacion = data[key];
      const { latitud, longitud, hora } = ubicacion;

      // 🧾 Agregar fila en la tabla
      const row = `
        <tr>
          <td>${index}</td>
          <td>${latitud}</td>
          <td>${longitud}</td>
          <td>${hora}</td>
        </tr>`;
      ubicacionesBody.innerHTML += row;

      // 📍 Agregar marcador al mapa
      const marker = new mapboxgl.Marker({ color: "blue" })
        .setLngLat([longitud, latitud])
        .setPopup(new mapboxgl.Popup().setHTML(`<b>${usuario}</b><br>${hora}`))
        .addTo(map);

      markers.push(marker);
      index++;
    }

    // 🎯 Centrar mapa en la última ubicación
    const lastKey = Object.keys(data).pop();
    const last = data[lastKey];
    map.flyTo({ center: [last.longitud, last.latitud], zoom: 14 });
  } else {
    // Si no hay datos
    ubicacionesBody.innerHTML = `<tr><td colspan="4">Sin ubicaciones registradas para ${usuario}</td></tr>`;
  }
});
