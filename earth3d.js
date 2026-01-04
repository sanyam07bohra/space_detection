import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer = null;
let animationId = null;

export function startEarth3D(container, satellitesData) {
    if (!satellitesData || satellitesData.length === 0) return;

    // Cleanup
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    }

    container.innerHTML = "";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / 600, 0.1, 1000);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, 600);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const R_EARTH = 2;
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(R_EARTH, 64, 64),
        new THREE.MeshStandardMaterial({ map: new THREE.TextureLoader().load("data/earth.jpg") })
    );
    scene.add(earth);

    // Objects to track multiple satellites
    const satGroups = [];

    satellitesData.forEach((data, satIdx) => {
        const group = new THREE.Group();
        
        // 1. Generate Orbit Points
        const points = [];
        for (let i = 0; i < data.lats.length; i++) {
            const lat = THREE.MathUtils.degToRad(data.lats[i]);
            const lon = THREE.MathUtils.degToRad(data.lons[i]);
            const r = R_EARTH + (data.alts[i] / 1_000_000);
            points.push(new THREE.Vector3(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(-lon)));
        }

        // 2. Orbit Line
        const orbitLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2 })
        );
        group.add(orbitLine);

        // 3. Satellite Mesh
        const satelliteMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xff3333 })
        );
        group.add(satelliteMesh);

        // 4. Footprint
        const footprint = new THREE.Mesh(
            new THREE.CircleGeometry(1, 32),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
        );
        group.add(footprint);

        scene.add(group);
        satGroups.push({ group, points, satelliteMesh, footprint, alts: data.alts });
    });

    let floatIndex = 0;
    const speedFactor = 0.05;

    function animate() {
        animationId = requestAnimationFrame(animate);
        earth.rotation.y += 0.0005;

        floatIndex = (floatIndex + speedFactor) % 120; // Based on 120 minutes of data
        const idx = Math.floor(floatIndex);

        satGroups.forEach(s => {
            const satPos = s.points[idx];
            if (!satPos) return;

            s.satelliteMesh.position.copy(satPos);

            // Footprint
            const groundPos = satPos.clone().normalize().multiplyScalar(R_EARTH + 0.01);
            s.footprint.position.copy(groundPos);
            s.footprint.lookAt(satPos);

            // Correct scaling
            const currentAlt = s.alts[idx] / 1_000_000;
            const cosTheta = R_EARTH / (R_EARTH + currentAlt);
            const theta = Math.acos(THREE.MathUtils.clamp(cosTheta, -1, 1));
            const visualRadius = R_EARTH * Math.sin(theta);
            s.footprint.scale.set(visualRadius, visualRadius, 1);
        });

        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}