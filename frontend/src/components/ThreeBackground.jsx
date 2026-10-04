import { useEffect, useRef } from "react";
import * as THREE from "three";

// soft 3D "pill galaxy" — low-poly capsules and spheres drifting in
// colored fog. Pure three.js on a transparent canvas; pauses when the
// tab is hidden and renders a static frame under prefers-reduced-motion.
export default function ThreeBackground({ density = 26, className = "" }) {
    const hostRef = useRef(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0f766e, 0.055);

        const camera = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 100);
        camera.position.set(0, 0, 16);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(host.clientWidth, host.clientHeight);
        host.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(6, 8, 10);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x8b5cf6, 0.9);
        rim.position.set(-8, -4, 6);
        scene.add(rim);

        // medicine-adjacent palette: teal, violet, amber, rose, sky
        const palette = [0x14b8a6, 0x2dd4bf, 0x8b5cf6, 0xf59e0b, 0xf43f5e, 0x38bdf8];

        const geometry = new THREE.CapsuleGeometry(0.55, 1.1, 6, 14);
        const ballGeometry = new THREE.IcosahedronGeometry(0.5, 2);
        const items = [];

        for (let i = 0; i < density; i++) {
            const color = palette[i % palette.length];
            const material = new THREE.MeshStandardMaterial({
                color,
                roughness: 0.28,
                metalness: 0.12,
                transparent: true,
                opacity: 0.85,
            });
            const mesh = new THREE.Mesh(i % 3 === 0 ? ballGeometry : geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 26,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 12 - 2
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            mesh.scale.setScalar(0.55 + Math.random() * 1.1);
            // per-item drift parameters
            mesh.userData = {
                speed: 0.25 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.004,
                baseY: mesh.position.y,
            };
            scene.add(mesh);
            items.push(mesh);
        }

        let raf = 0;
        let running = true;
        const clock = new THREE.Clock();

        const render = () => {
            const t = clock.getElapsedTime();
            for (const mesh of items) {
                const { speed, phase, spin, baseY } = mesh.userData;
                mesh.position.y = baseY + Math.sin(t * speed + phase) * 1.1;
                mesh.rotation.x += spin;
                mesh.rotation.z += spin * 0.7;
            }
            renderer.render(scene, camera);
        };

        const loop = () => {
            if (!running) return;
            render();
            raf = requestAnimationFrame(loop);
        };

        const onResize = () => {
            if (!host.clientWidth) return;
            camera.aspect = host.clientWidth / host.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(host.clientWidth, host.clientHeight);
        };
        window.addEventListener("resize", onResize);

        const onVisibility = () => {
            if (document.hidden) {
                running = false;
                cancelAnimationFrame(raf);
            } else if (!reduced) {
                running = true;
                loop();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        if (reduced) {
            render(); // single static frame
        } else {
            loop();
        }

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVisibility);
            renderer.dispose();
            geometry.dispose();
            ballGeometry.dispose();
            for (const mesh of items) mesh.material.dispose();
            if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
        };
    }, [density]);

    return (
        <div
            ref={hostRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        />
    );
}
