import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const MapUpdater = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position[0] !== 0 && position[1] !== 0) map.setView(position, 14);
  }, [position, map]);
  return null;
};

const LiveMap = () => {
  const [position, setPosition] = useState([13.0843, 80.2705]);
  const [speed, setSpeed] = useState("N/A");
  const [destination, setDestination] = useState("");
  const [destCoords, setDestCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [lastUpdatePos, setLastUpdatePos] = useState(null);
  const [alarmRadius, setAlarmRadius] = useState(500);
  const [alarmPlayed, setAlarmPlayed] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);
  const [stage, setStage] = useState(""); // NEW: tracks voice stage

  const audioRef = useRef(null);

  // ✅ Load alarm sound
  useEffect(() => {
    audioRef.current = new Audio(
      "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
    );
    audioRef.current.loop = true;
  }, []);

  // 🎙️ Voice speaker
  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // prevent overlapping
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-IN";
      utter.pitch = 1;
      utter.rate = 1;
      utter.volume = 1;
      window.speechSynthesis.speak(utter);
    } else {
      console.warn("Speech Synthesis not supported");
    }
  };

  // 🛰️ Watch GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("❌ Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        setPosition([latitude, longitude]);
        setSpeed(speed ? (speed * 3.6).toFixed(1) + " km/h" : "N/A");
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 🧭 Destination search
  const handleSearch = async () => {
    if (!destination.trim()) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${destination}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      setDestCoords([lat, lon]);
      getRoute(position, [lat, lon]);
      setAlarmPlayed(false);
      setAlarmActive(false);
      setStage(""); // reset stages
    } else {
      alert("Destination not found!");
    }
  };

  // 🛣️ Get route
  const getRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);
      setRouteCoords(coords);
      setDistance(data.routes[0].distance / 1000);
    }
  };

  // 📏 Distance calculator
  const calcDistance = (p1, p2) => {
    const R = 6371e3;
    const φ1 = (p1[0] * Math.PI) / 180;
    const φ2 = (p2[0] * Math.PI) / 180;
    const Δφ = ((p2[0] - p1[0]) * Math.PI) / 180;
    const Δλ = ((p2[1] - p1[1]) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🚗 Movement tracking + one-time speech
  useEffect(() => {
    if (!destCoords) return;
    if (!lastUpdatePos) {
      setLastUpdatePos(position);
      return;
    }

    const moved = calcDistance(lastUpdatePos, position);
    if (moved > 500) {
      getRoute(position, destCoords);
      setLastUpdatePos(position);
    }

    const d = calcDistance(position, destCoords);

    if (d > 2000 && stage !== "far") {
      speak("Still a long way to go, Dshine. Stay relaxed.");
      setStage("far");
    } else if (d <= 2000 && d > 1000 && stage !== "mid") {
      speak("You're getting closer, Dshine. About one kilometer away!");
      setStage("mid");
    } else if (d <= alarmRadius && !alarmPlayed) {
      setAlarmPlayed(true);
      setAlarmActive(true);
      audioRef.current.play();
      const msg = `Hey Dshine, you're within ${Math.round(
        alarmRadius
      )} meters of your destination!`;
      speak(msg);
      alert("🔔 " + msg);
      setStage("near");
    } else if (d <= 150 && stage !== "arrived") {
      speak("Welcome to your destination, Dshine!");
      stopAlarm();
      setStage("arrived");
    }
  }, [position, destCoords, alarmRadius]);

  // 🎚️ Controls
  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAlarmActive(false);
      window.speechSynthesis.cancel();
    }
  };

  const replayAlarm = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      const message = `Hey Dshine, you're within ${Math.round(
        alarmRadius
      )} meters of your destination!`;
      speak(message);
      setAlarmActive(true);
    }
  };

  const resetAlarm = () => {
    stopAlarm();
    setAlarmPlayed(false);
    setStage("");
    speak("Alarm reset for your next trip, Dshine!");
    alert("🔁 Alarm reset for next destination.");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2 style={{ color: "#2b6777" }}>DestiAlarm 🌍 — Smart Voice Navigator</h2>

      {/* Inputs */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Enter destination..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{
            padding: "8px",
            width: "50%",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="number"
          placeholder="Alarm (m)"
          value={alarmRadius}
          onChange={(e) => setAlarmRadius(Number(e.target.value))}
          style={{
            padding: "8px",
            width: "20%",
            marginLeft: "8px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "8px 15px",
            marginLeft: "8px",
            borderRadius: "8px",
            background: "#2b6777",
            color: "#fff",
            border: "none",
          }}
        >
          Go
        </button>
      </div>

      {/* Map */}
      <MapContainer
        center={position}
        zoom={13}
        style={{
          height: "70vh",
          width: "90%",
          margin: "auto",
          borderRadius: "12px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={position}>
          <Popup>Your live location</Popup>
        </Marker>
        {destCoords && (
          <Marker position={destCoords}>
            <Popup>Destination: {destination}</Popup>
          </Marker>
        )}
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="blue" />
        )}
        <MapUpdater position={position} />
      </MapContainer>

      {/* Info + Controls */}
      <div
        style={{
          background: "#fff",
          padding: "10px",
          width: "320px",
          margin: "15px auto",
          borderRadius: "10px",
          boxShadow: "0 0 6px rgba(0,0,0,0.1)",
          textAlign: "left",
        }}
      >
        <p><b>Latitude:</b> {position[0].toFixed(5)}</p>
        <p><b>Longitude:</b> {position[1].toFixed(5)}</p>
        <p><b>Speed:</b> {speed}</p>
        {distance && <p><b>Route Distance:</b> {distance.toFixed(2)} km</p>}
        <p><b>Alarm Radius:</b> {alarmRadius} m</p>

        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button
            onClick={stopAlarm}
            style={{
              background: "#ff5555",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              marginRight: "8px",
            }}
          >
            🔇 Stop
          </button>
          <button
            onClick={replayAlarm}
            style={{
              background: "#2b6777",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              marginRight: "8px",
            }}
          >
            🔔 Replay
          </button>
          <button
            onClick={resetAlarm}
            style={{
              background: "#ffa500",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
          >
            🔁 Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
