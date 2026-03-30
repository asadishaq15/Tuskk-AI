"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const RADIUS = 10;
const HEIGHT = 60;
const BASE_ROTATION_SPEED = 0.002;
const TOTAL_PLANES = 28;
const HELIX_TURNS = 4;
const HELIX_HEIGHT = 66;
const HELIX_Y_START = -HELIX_HEIGHT / 2;
const PLANE_WIDTH = 8.5;
const PLANE_HEIGHT = 6.0;
const CORNER_RADIUS_FRAC = 0.07;

const VIDEO_FILES = ["vid1.mp4", "vid2.mp4", "vid3.mp4"];
function getRandomVideo(): string {
  return VIDEO_FILES[Math.floor(Math.random() * VIDEO_FILES.length)];
}

function createRoundedRectTexture(w: number, h: number, r: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath(); ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function captureFirstFrame(video: HTMLVideoElement): Promise<THREE.CanvasTexture> {
  return new Promise((resolve) => {
    const draw = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      resolve(tex);
    };
    if (video.readyState >= 2 && video.videoWidth > 0) {
      video.currentTime = 0;
      video.addEventListener("seeked", draw, { once: true });
    } else {
      video.addEventListener("loadeddata", () => {
        video.currentTime = 0;
        video.addEventListener("seeked", draw, { once: true });
      }, { once: true });
    }
  });
}

interface VideoAsset {
  video: HTMLVideoElement;
  posterTexture: THREE.CanvasTexture;
  liveTexture: THREE.VideoTexture;
}

function loadVideoAsset(renderer: THREE.WebGLRenderer, filename: string): Promise<VideoAsset> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = `/assets/${filename}`;
    video.loop = true; video.muted = true;
    video.playsInline = true; video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.addEventListener("canplaythrough", async () => {
      const liveTexture = new THREE.VideoTexture(video);
      liveTexture.minFilter = THREE.LinearFilter;
      liveTexture.magFilter = THREE.LinearFilter;
      liveTexture.format = THREE.RGBAFormat;
      liveTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const posterTexture = await captureFirstFrame(video);
      resolve({ video, posterTexture, liveTexture });
    }, { once: true });
    video.addEventListener("error", () => reject(new Error(`Failed to load: ${filename}`)));
    video.load();
  });
}

interface BlockData {
  group: THREE.Group;
  mesh: THREE.Mesh;
  material: THREE.MeshPhongMaterial;
  video: HTMLVideoElement;
  posterTexture: THREE.CanvasTexture;
  liveTexture: THREE.VideoTexture;
  isPlaying: boolean;
}

function activateBlock(b: BlockData) {
  if (b.isPlaying) return;
  b.material.map = b.liveTexture;
  b.material.needsUpdate = true;
  b.video.currentTime = 0;
  b.video.play().catch(console.warn);
  b.isPlaying = true;
}

function deactivateBlock(b: BlockData) {
  if (!b.isPlaying) return;
  b.video.pause();
  b.video.currentTime = 0;
  b.material.map = b.posterTexture;
  b.material.needsUpdate = true;
  b.isPlaying = false;
}

async function initializeBlocks(
  renderer: THREE.WebGLRenderer,
  galleryGroup: THREE.Group,
  videoElements: HTMLVideoElement[]
): Promise<BlockData[]> {
  const TEX_W = 1024;
  const TEX_H = 640;
  const cornerPx = Math.round(CORNER_RADIUS_FRAC * TEX_W);
  const alphaMap = createRoundedRectTexture(TEX_W, TEX_H, cornerPx);

  // Plain flat geometry — offset goes on mesh.position, NOT baked into geo
  const geo = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 1, 1);
  const allBlocks: BlockData[] = [];

  for (let i = 0; i < TOTAL_PLANES; i++) {
    const t = i / TOTAL_PLANES;
    const angle = t * HELIX_TURNS * Math.PI * 2;
    const y = HELIX_Y_START + t * HELIX_HEIGHT;

    const asset = await loadVideoAsset(renderer, getRandomVideo());
    videoElements.push(asset.video);

    const material = new THREE.MeshPhongMaterial({
      map: asset.posterTexture,
      alphaMap,
      transparent: true,
      side: THREE.DoubleSide,   // DoubleSide so visible from all helix angles
      toneMapped: false,
      depthWrite: false,        // false so transmissive cord sees through them
      depthTest: true,
    });

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.z = RADIUS;  // offset on mesh, not geometry — correct facing
    mesh.renderOrder = 1;      // render planes before cord's transmission pass

    const group = new THREE.Group();
    group.rotation.y = angle;
    group.position.y = y;
    galleryGroup.add(group);
    group.add(mesh);

    allBlocks.push({
      group, mesh, material,
      video: asset.video,
      posterTexture: asset.posterTexture,
      liveTexture: asset.liveTexture,
      isPlaying: false,
    });
  }

  return allBlocks;
}

function loadSpinalCord(scene: THREE.Scene): void {
  const loader = new GLTFLoader();
  loader.load("/spinal_cord.glb", (gltf) => {
    const model = gltf.scene;
    model.position.set(-0.174, -26.361, 0.589);
    model.scale.set(11, 11, 4.5);
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.renderOrder = 2;  // render after planes so transmission captures them
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: 0xff9bbf,
          roughness: 0,
          metalness: 0,
          transmission: 1,
          thickness: 1.5,
          ior: 1.3,
          clearcoat: 1,
          clearcoatRoughness: 0,
          transparent: true,
          opacity: 1,
        });
      }
    });
    scene.add(model);
  }, undefined, (err) => console.error("GLB load error:", err));
}

export default function Spinalcord() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videoElements: HTMLVideoElement[] = [];
    let allBlocks: BlockData[] = [];
    let hoveredBlock: BlockData | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const galleryGroup = new THREE.Group();
    scene.add(galleryGroup);

    loadSpinalCord(scene);

    const lenis = new Lenis({ autoRaf: true });
    let rotationSpeed = 0;
    lenis.on("scroll", (e: { velocity: number }) => {
      rotationSpeed = e.velocity * 0.005;
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const handleMouseLeave = () => {
      mouse.set(-9999, -9999);
      if (hoveredBlock) { deactivateBlock(hoveredBlock); hoveredBlock = null; }
      container.style.cursor = "default";
    };
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      const rect = container.getBoundingClientRect();
      const scrollable = container.clientHeight + window.innerHeight;
      const scrolled = window.innerHeight - rect.top;
      const frac = Math.min(Math.max(scrolled / scrollable, 0), 1);

      camera.position.y = -(frac * HEIGHT - HEIGHT / 2);
      galleryGroup.rotation.y += BASE_ROTATION_SPEED + rotationSpeed;
      rotationSpeed *= 0.95;

      if (allBlocks.length > 0) {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(allBlocks.map((b) => b.mesh), false);
        const hitBlock = hits.length > 0
          ? (allBlocks.find((b) => b.mesh === hits[0].object) ?? null)
          : null;
        if (hitBlock !== hoveredBlock) {
          if (hoveredBlock) deactivateBlock(hoveredBlock);
          if (hitBlock) activateBlock(hitBlock);
          hoveredBlock = hitBlock;
        }
        container.style.cursor = hitBlock ? "pointer" : "default";
      }

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    initializeBlocks(renderer, galleryGroup, videoElements).then((blocks) => {
      allBlocks = blocks;
      animate();
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      videoElements.forEach((v) => { v.pause(); v.src = ""; v.load(); });
      renderer.dispose();
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen" style={{ background: "transparent" }} />
  );
}