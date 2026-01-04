import { startEarth3D } from './earth3d.js';

let satellites = [];
let currentDataArray = []; // Stores data for all selected satellites

document.addEventListener("DOMContentLoaded", () => {
    function clearPlotContainer() {
        const container = document.getElementById("plotContainer");
        if (container) container.innerHTML = "";
    }

    fetch("data/tle.txt")
        .then(res => res.text())
        .then(text => {
            if (text.includes("<html")) {
                alert("TLE file not loaded");
                return;
            }
            parseTLE(text);
            populateCheckboxList();
            // Initial render with the first satellite
            updateSelection();
        });

    function parseTLE(tleText) {
        const lines = tleText.split("\n").map(l => l.trim()).filter(Boolean);
        satellites = [];
        for (let i = 0; i < lines.length - 2; i += 3) {
            satellites.push({
                name: lines[i],
                line1: lines[i + 1],
                line2: lines[i + 2],
                index: i / 3
            });
        }
    }

    // Replaces the dropdown with a scrollable list of checkboxes
    function populateCheckboxList() {
        const container = document.getElementById("satelliteSelect");
        // Ensure the container allows scrolling if there are many satellites
        container.style.overflowY = "auto";
        container.style.maxHeight = "200px";
        container.innerHTML = "";

        satellites.forEach((sat, i) => {
            const wrapper = document.createElement("div");
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.marginBottom = "5px";

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.id = `sat-${i}`;
            cb.value = i;
            cb.checked = (i === 0); // Default check the first one
            
            cb.onchange = () => updateSelection();

            const label = document.createElement("label");
            label.htmlFor = `sat-${i}`;
            label.style.marginLeft = "8px";
            label.style.cursor = "pointer";
            label.textContent = sat.name;

            wrapper.appendChild(cb);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    }

    function propagateSatellite(sat, minutes = 120) {
        const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
        const data = { name: sat.name, times: [], lats: [], lons: [], alts: [], speeds: [] };

        for (let m = 0; m <= minutes; m++) {
            const t = new Date();
            t.setMinutes(t.getMinutes() + m);
            const pv = satellite.propagate(satrec, t);
            if (!pv.position) continue;

            const gmst = satellite.gstime(t);
            const geo = satellite.eciToGeodetic(pv.position, gmst);

            data.times.push(t);
            data.lats.push(satellite.degreesLat(geo.latitude));
            data.lons.push(satellite.degreesLong(geo.longitude));
            data.alts.push(geo.height * 1000);
            data.speeds.push(
                Math.sqrt(pv.velocity.x ** 2 + pv.velocity.y ** 2 + pv.velocity.z ** 2) * 1000
            );
        }
        return data;
    }

    function updateSelection() {
        const checkboxes = document.querySelectorAll('#satelliteSelect input[type="checkbox"]:checked');
        currentDataArray = Array.from(checkboxes).map(cb => {
            const sat = satellites[cb.value];
            return propagateSatellite(sat);
        });

        const activeBtn = document.querySelector(".plot-btn.active");
        const mode = activeBtn ? activeBtn.dataset.plot : "orbit";

        renderView(mode);
    }

    function renderView(mode) {
        if (currentDataArray.length === 0) {
            clearPlotContainer();
            return;
        }

        // Use the first selected satellite for 2D plots
        const primaryData = currentDataArray[0];

        if (mode === "orbit3d") {
            switchView("3d");
            startEarth3D(document.getElementById("threeContainer"), currentDataArray);
        } else {
            switchView("plot");
            if (mode === "orbit") plotAnimatedGroundTrack(primaryData, primaryData.name);
            else if (mode === "altitude") plotAltitude(primaryData);
            else if (mode === "speed") plotSpeed(primaryData);
            else if (mode === "correlation") plotCorrelation(primaryData);
        }
        
        setupNavigation();
    }

    function plotAnimatedGroundTrack(data, name) {
        clearPlotContainer();
        Plotly.newPlot("plotContainer", [{
            type: "scattergeo",
            lat: data.lats,
            lon: data.lons,
            mode: "lines"
        }], {
            title: `Ground Track – ${name}`,
            geo: { projection: { type: "natural earth" }, showland: true }
        });
    }

    function plotAltitude(data) {
        Plotly.newPlot("plotContainer", [{ x: data.times, y: data.alts, mode: "lines" }], { title: "Altitude vs Time" });
    }

    function plotSpeed(data) {
        Plotly.newPlot("plotContainer", [{ x: data.times, y: data.speeds, mode: "lines" }], { title: "Speed vs Time" });
    }

    function plotCorrelation(data) {
        const vars = { Altitude: data.alts, Speed: data.speeds, Latitude: data.lats };
        const labels = Object.keys(vars);
        const matrix = labels.map(a => labels.map(b => pearson(vars[a], vars[b]).toFixed(2)));
        Plotly.newPlot("plotContainer", [{ z: matrix, x: labels, y: labels, type: "heatmap", colorscale: "RdBu" }], { title: "Correlation Heatmap" });
    }

    function pearson(x, y) {
        const n = x.length;
        const mx = x.reduce((a, b) => a + b) / n;
        const my = y.reduce((a, b) => a + b) / n;
        let num = 0, dx = 0, dy = 0;
        for (let i = 0; i < n; i++) {
            num += (x[i] - mx) * (y[i] - my);
            dx += (x[i] - mx) ** 2;
            dy += (y[i] - my) ** 2;
        }
        return num / Math.sqrt(dx * dy);
    }

    function switchView(mode) {
        const plotCont = document.getElementById("plotContainer");
        const threeCont = document.getElementById("threeContainer");
        if (mode === "3d") {
            plotCont.style.display = "none";
            threeCont.style.display = "block";
        } else {
            plotCont.style.display = "block";
            threeCont.style.display = "none";
        }
    }

    function setupNavigation() {
        document.querySelectorAll(".plot-btn").forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll(".plot-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                renderView(btn.dataset.plot);
            };
        });
    }
});