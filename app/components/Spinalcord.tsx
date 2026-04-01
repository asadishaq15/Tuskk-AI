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
const SCROLL_ROTATION_TURNS = 2;

const HOVER_POP_DISTANCE = 2.2;
const POP_SPRING_STIFFNESS = 0.18;
const POP_SPRING_DAMPING = 0.72;

const VIDEO_FILES = ["vid1.mp4", "vid2.mp4", "vid3.mp4"];

function createRoundedRectTexture(w: number, h: number, r: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
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
  liveTexture: THREE.VideoTexture | THREE.CanvasTexture;
}

function loadVideoAsset(
  renderer: THREE.WebGLRenderer,
  filename: string
): Promise<VideoAsset> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = `/assets/${filename}`;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.addEventListener(
      "canplaythrough",
      async () => {
        const liveTexture = new THREE.VideoTexture(video);
        liveTexture.minFilter = THREE.LinearFilter;
        liveTexture.magFilter = THREE.LinearFilter;
        liveTexture.format = THREE.RGBAFormat;
        liveTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const posterTexture = await captureFirstFrame(video);
        resolve({ video, posterTexture, liveTexture });
      },
      { once: true }
    );
    video.addEventListener(
      "error",
      () => reject(new Error(`Failed to load: ${filename}`)),
      { once: true }
    );
    video.load();
  });
}

function createPlaceholderVideoAsset(): VideoAsset {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, "#120a22");
  g.addColorStop(1, "#061018");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(196,181,253,0.12)";
  ctx.font = "600 42px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Add /public/assets/*.mp4", canvas.width / 2, canvas.height / 2);

  const posterTexture = new THREE.CanvasTexture(canvas);
  posterTexture.minFilter = THREE.LinearFilter;
  posterTexture.magFilter = THREE.LinearFilter;
  posterTexture.needsUpdate = true;

  const liveTexture = posterTexture.clone();
  liveTexture.needsUpdate = true;

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;

  return { video, posterTexture, liveTexture };
}

async function loadVideoAssetWithFallback(renderer: THREE.WebGLRenderer): Promise<VideoAsset> {
  const order = [...VIDEO_FILES].sort(() => Math.random() - 0.5);
  for (const filename of order) {
    try {
      return await loadVideoAsset(renderer, filename);
    } catch {
      console.warn(`[Spinalcord] Video unavailable: /assets/${filename}`);
    }
  }
  console.warn("[Spinalcord] No videos loaded — using placeholder textures.");
  return createPlaceholderVideoAsset();
}

interface BlockData {
  group: THREE.Group;
  mesh: THREE.Mesh;
  material: THREE.MeshPhongMaterial;
  video: HTMLVideoElement;
  posterTexture: THREE.CanvasTexture;
  liveTexture: THREE.VideoTexture | THREE.CanvasTexture;
  isPlaying: boolean;
  popCurrent: number;
  popVelocity: number;
  popTarget: number;
  scaleCurrent: number;
  scaleVelocity: number;
  scaleTarget: number;
}

function activateBlock(b: BlockData) {
  if (!b.isPlaying && b.video.src) {
    b.material.map = b.liveTexture;
    b.material.needsUpdate = true;
    b.video.currentTime = 0;
    b.video.play().catch(() => {});
    b.isPlaying = true;
  }
  b.popTarget = HOVER_POP_DISTANCE;
  b.scaleTarget = 1.08;
}

function deactivateBlock(b: BlockData) {
  if (b.isPlaying) {
    b.video.pause();
    b.video.currentTime = 0;
    b.material.map = b.posterTexture;
    b.material.needsUpdate = true;
    b.isPlaying = false;
  }
  b.popTarget = 0;
  b.scaleTarget = 1.0;
}

function updateBlockSpring(b: BlockData) {
  const popForce = (b.popTarget - b.popCurrent) * POP_SPRING_STIFFNESS;
  b.popVelocity = b.popVelocity * POP_SPRING_DAMPING + popForce;
  b.popCurrent += b.popVelocity;

  const scaleForce = (b.scaleTarget - b.scaleCurrent) * POP_SPRING_STIFFNESS;
  b.scaleVelocity = b.scaleVelocity * POP_SPRING_DAMPING + scaleForce;
  b.scaleCurrent += b.scaleVelocity;

  b.mesh.position.z = RADIUS + b.popCurrent;
  b.mesh.scale.setScalar(b.scaleCurrent);
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
  const geo = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, 1, 1);
  const allBlocks: BlockData[] = [];

  for (let i = 0; i < TOTAL_PLANES; i++) {
    const t = i / TOTAL_PLANES;
    const angle = t * HELIX_TURNS * Math.PI * 2;
    const y = HELIX_Y_START + t * HELIX_HEIGHT;

    const asset = await loadVideoAssetWithFallback(renderer);
    videoElements.push(asset.video);

    const material = new THREE.MeshPhongMaterial({
      map: asset.posterTexture,
      alphaMap,
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
      depthWrite: false,
      depthTest: true,
    });

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.z = RADIUS;
    mesh.renderOrder = 1;

    const group = new THREE.Group();
    group.rotation.y = angle;
    group.position.y = y;
    galleryGroup.add(group);
    group.add(mesh);

    allBlocks.push({
      group,
      mesh,
      material,
      video: asset.video,
      posterTexture: asset.posterTexture,
      liveTexture: asset.liveTexture,
      isPlaying: false,
      popCurrent: 0,
      popVelocity: 0,
      popTarget: 0,
      scaleCurrent: 1.0,
      scaleVelocity: 0,
      scaleTarget: 1.0,
    });
  }

  return allBlocks;
}

function loadSpinalCord(scene: THREE.Scene): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      "/spinal_cord.glb",
      (gltf) => {
        const model = gltf.scene;
        model.position.set(-0.174, -26.361, 0.589);
        model.scale.set(11, 11, 6.5);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.renderOrder = 2;

            const isSpine = mesh.name === "Male_Skeletal_Atlas_Geo_bones_back_0";
            const isCord = mesh.name === "Torus002";

            if (isSpine) {
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
            } else if (isCord) {
              mesh.material = new THREE.MeshPhysicalMaterial({
                color: 0xa8d8ff,
                roughness: 1,
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
          }
        });

        scene.add(model);
        resolve(model);
      },
      undefined,
      (err) => {
        console.error("GLB load error:", err);
        reject(err);
      }
    );
  });
}

export default function Spinalcord() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const videoElements: HTMLVideoElement[] = [];
    let allBlocks: BlockData[] = [];
    let hoveredBlock: BlockData | null = null;
    let hoverMissFrames = 0;
    const HOVER_MISS_TOLERANCE = 6;

    const getScrollFrac = (): number => {
      const wrapper = container.closest(
        "[data-gallery-scroll]"
      ) as HTMLElement | null;
      if (!wrapper) return 0;
      const val = parseFloat(wrapper.dataset.scrollFrac ?? "0");
      return isNaN(val) ? 0 : val;
    };

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

    loadSpinalCord(scene).catch(console.error);

    // Lenis is used only for its autoRaf tick — no velocity listener needed
    const lenis = new Lenis({ autoRaf: true });

    // smoothScrollFrac lerps toward rawScrollFrac each frame.
    // Because it can only move TOWARD the target (never past it),
    // there is zero overshoot and zero spring-back.
    let smoothScrollFrac = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseLeave = () => {
      mouse.set(-9999, -9999);
      if (hoveredBlock) {
        deactivateBlock(hoveredBlock);
        hoveredBlock = null;
      }
      container.style.cursor = "default";
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      const rawScrollFrac = getScrollFrac();

      // Lerp factor 0.1 → gentle ~150ms follow, impossible to overshoot
      smoothScrollFrac += (rawScrollFrac - smoothScrollFrac) * 0.1;

      // Camera pans vertically through the helix
      camera.position.y = -(smoothScrollFrac * HEIGHT - HEIGHT / 2);

      // Rotation: continuous base idle spin + scroll-driven turns.
      // Both inputs are monotonically smooth so the result never bounces.
      const baseRotation = BASE_ROTATION_SPEED * (performance.now() * 0.001);
      const scrollRotation = smoothScrollFrac * SCROLL_ROTATION_TURNS * Math.PI * 2;
      galleryGroup.rotation.y = baseRotation + scrollRotation;

      // Hover raycasting + spring pop-out
      if (allBlocks.length > 0) {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(
          allBlocks.map((b) => b.mesh),
          false
        );
        const directHit =
          hits.length > 0
            ? allBlocks.find((b) => b.mesh === hits[0].object) ?? null
            : null;

        // Keep current hover stable when pointer grazes card edges.
        // This removes the flicker/debounce feel on tilted side cards.
        let hitBlock = directHit;
        if (!hitBlock && hoveredBlock) {
          hoverMissFrames += 1;
          if (hoverMissFrames <= HOVER_MISS_TOLERANCE) {
            hitBlock = hoveredBlock;
          }
        } else {
          hoverMissFrames = 0;
        }

        if (hitBlock !== hoveredBlock) {
          if (hoveredBlock) deactivateBlock(hoveredBlock);
          if (hitBlock) activateBlock(hitBlock);
          hoveredBlock = hitBlock;
        }

        container.style.cursor = hitBlock ? "pointer" : "default";

        for (const b of allBlocks) {
          updateBlockSpring(b);
        }
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
      videoElements.forEach((v) => {
        v.pause();
        v.src = "";
        v.load();
      });
      renderer.dispose();
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen"
      style={{ background: "transparent" }}
    />
  );
}