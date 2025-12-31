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
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
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

    // Camera - use orthographic camera to fill viewport exactly
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      -aspect, aspect, 1, -1, 0.1, 1000
    );
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting - add directional light to show depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(2, 2, 2);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-2, -1, 1);
    scene.add(directionalLight2);

    // Create plane geometry with more subdivisions for smooth displacement
    // Use aspect ratio to ensure it fills the viewport
    const planeWidth = aspect * 2;
    const planeHeight = 2;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 128, 128); // High subdivision for displacement
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      displacementScale: 0.1, // Depth of displacement
      displacementBias: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !meshRef.current || !rendererRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      const newAspect = newWidth / newHeight;

      // Update orthographic camera
      const camera = cameraRef.current as THREE.OrthographicCamera;
      camera.left = -newAspect;
      camera.right = newAspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();

      // Update plane geometry to match new aspect ratio
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      geometry.dispose();
      const newGeometry = new THREE.PlaneGeometry(newAspect * 2, 2, 128, 128); // High subdivision for displacement
      meshRef.current.geometry = newGeometry;

      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update texture when config changes
  useEffect(() => {
    if (!meshRef.current || !config.pattern) {
      return;
    }

    // Dispose of old textures to prevent memory leaks
    const currentMaterial = meshRef.current.material as THREE.MeshStandardMaterial;
    if (currentMaterial.map) currentMaterial.map.dispose();
    if (currentMaterial.displacementMap) currentMaterial.displacementMap.dispose();
    if (currentMaterial.normalMap) currentMaterial.normalMap.dispose();
    if (currentMaterial.roughnessMap) currentMaterial.roughnessMap.dispose();

    let cancelled = false;

    createTextureFromConfig(config, 2048, 2048)
      .then((textures) => {
        if (cancelled || !meshRef.current) {
          textures.map.dispose();
          textures.displacementMap.dispose();
          textures.normalMap.dispose();
          textures.roughnessMap.dispose();
          return;
        }
        
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.map = textures.map;
        material.displacementMap = textures.displacementMap;
        material.normalMap = textures.normalMap;
        material.roughnessMap = textures.roughnessMap;
        material.displacementScale = 0.1; // Adjust depth
        material.needsUpdate = true;
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
    config.adjustments.invert,
  ]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full ${className}`}
      style={{ minHeight: 0 }}
    >
      {(!config.pattern || !config.material) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-10 bg-gray-50">
          <p>Select a pattern and material to preview</p>
        </div>
      )}
    </div>
  );
}

