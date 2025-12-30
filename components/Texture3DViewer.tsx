'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TextureConfig } from '@/types/texture';
import { createTextureFromConfig } from '@/utils/textureRenderer';

interface Texture3DViewerProps {
  config: TextureConfig;
  className?: string;
}

export default function Texture3DViewer({ config, className }: Texture3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create plane geometry for texture display
    const geometry = new THREE.PlaneGeometry(4, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Mouse controls for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      mesh.rotation.y += deltaX * 0.01;
      mesh.rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update texture when config changes
  useEffect(() => {
    if (!meshRef.current || !config.pattern || !config.material) {
      // Clear texture if pattern or material is missing
      const currentMaterial = meshRef.current?.material as THREE.MeshStandardMaterial;
      if (currentMaterial?.map) {
        currentMaterial.map.dispose();
        currentMaterial.map = null;
        currentMaterial.needsUpdate = true;
      }
      return;
    }

    console.log('Updating texture with pattern:', config.pattern.name, 'material:', config.material.name);

    // Dispose of old texture to prevent memory leaks
    const currentMaterial = meshRef.current.material as THREE.MeshStandardMaterial;
    if (currentMaterial.map) {
      currentMaterial.map.dispose();
      currentMaterial.map = null;
    }

    let cancelled = false;

    createTextureFromConfig(config, 2048, 2048)
      .then((texture) => {
        if (cancelled || !meshRef.current) {
          texture.dispose();
          return;
        }
        
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.map = texture;
        material.needsUpdate = true;
        console.log('Texture updated successfully');
      })
      .catch((error) => {
        console.error('Failed to create texture:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [
    config.pattern?.id,
    config.pattern?.svgUrl,
    config.material?.id,
    config.material?.imageUrl,
    config.patternSettings.rows,
    config.patternSettings.columns,
    config.patternSettings.width,
    config.patternSettings.height,
    config.materialSettings.width,
    config.materialSettings.height,
    config.materialSettings.tint,
    config.jointSettings.horizontal,
    config.jointSettings.vertical,
    config.jointSettings.tint,
    config.adjustments.brightness,
    config.adjustments.contrast,
    config.adjustments.hue,
    config.adjustments.saturation,
    config.adjustments.invert
  ]);

  return (
    <div 
      ref={containerRef} 
      className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}
    >
      {(!config.pattern || !config.material) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10">
          <p>Select a pattern and material to preview</p>
        </div>
      )}
    </div>
  );
}

