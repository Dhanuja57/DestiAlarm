DestiAlarm — Smart Travel Alert System
Overview

DestiAlarm is a React-based web application designed to assist travelers by providing real-time tracking and voice-based alerts when approaching their destination. It continuously monitors the user’s live GPS location, calculates the distance to the destination, and triggers both voice and sound alarms when the user reaches a predefined proximity.

Motivation and Challenges

During development, one of the main challenges was integrating a live map with accurate location tracking and dynamic route visualization without relying on paid or restricted APIs.
Initially, Google Maps API was considered, but it was avoided due to:

Limited free quota and billing requirements.

API key management complexity.

The need for a completely open-source and dependency-free solution.

Instead, open-source alternatives such as OpenStreetMap, Leaflet, and OSRM (Open Source Routing Machine) were used to achieve similar functionality with full customization and no usage restrictions.

Key Features

Real-time GPS tracking using the Geolocation API.

Dynamic route generation and visualization with OSRM Routing API.

Interactive map rendering using Leaflet and OpenStreetMap.

Adjustable alarm radius to set distance-based alerts.

Integrated voice and sound notifications through the Web Speech and Audio APIs.

Options to mute, replay, and reset alarms for flexible control.

Clean and responsive user interface developed using React.

Technology Stack

Category	Technology
Frontend	React (Vite)
Mapping	Leaflet + OpenStreetMap
Routing	OSRM Routing API
Voice & Sound	Web Speech API, HTML Audio API
Location	Browser Geolocation API
Working Principle

The user enters a destination and selects an alert distance (in meters).

The system continuously tracks the live GPS coordinates.

The OSRM API generates a driving route and updates dynamically based on movement.

When the user approaches the defined proximity, a voice alert and sound alarm are triggered automatically.

Once the user reaches the final point, the system stops the alarm and confirms arrival.

Advantages and Uniqueness

Fully open-source and free — no paid API dependencies.

Real-time voice feedback for a hands-free experience.

Lightweight and responsive, suitable for both mobile and desktop use.

Supports offline-friendly behavior once the map tiles are loaded.

Can be extended to applications like public transport alerts, delivery tracking, or travel assistance.

Future Enhancements

Integration with background service workers for alerts even when minimized.

Support for offline map caching.

Advanced route optimization with real-time traffic APIs.

Multi-language voice alerts.
