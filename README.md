# Satellite_Detection_App

# Space Detection and Satellite Tracker

A web-based 3D visualization platform designed to track satellites and monitor space objects in Earth's orbit. This application utilizes Three.js to render a 3D environment and processes real-world orbital data to display satellite positions.

---

## Features

* **3D Globe Rendering:** Interactive Earth visualization with high-quality textures.
* **Satellite Tracking:** Displays satellite positions using TLE (Two-Line Element) and CSV data.
* **User Accounts:** Functional login and signup pages for user management.
* **Responsive Design:** Modular CSS and JavaScript structure for a seamless browser experience.

---

## File Structure

* **data/**: Contains essential assets and datasets.
    * `all_satellite_orbits.csv`: Comprehensive orbital data.
    * `earth.jpg`: Texture map for the 3D Earth model.
    * `tle.txt`: Real-time Two-Line Element sets for satellite tracking.
* **earth3d.js**: The core logic for initializing the 3D scene, camera, and Earth model.
* **script.js**: Handles general application logic and UI interactions.
* **style.css**: Defines the visual layout and styling for all pages.
* **index.html**: The primary application dashboard.
* **login.html / signup.html**: Authentication interface for users.

---

## Technical Stack

* **Language**: JavaScript (ES6+), HTML5, CSS3
* **Graphics Library**: Three.js (WebGL)
* **Data Formats**: CSV, TLE (Two-Line Element)

---

## Getting Started

### Prerequisites

To view this project locally, a local web server is required to properly load the external data files (CSV and TXT) due to browser security policies.

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/sanyam07bohra/space_detection.git](https://github.com/sanyam07bohra/space_detection.git)
