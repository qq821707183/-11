import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, HandGesture, HandInfo, PhotoData } from './types';
import { Scene } from './components/Scene';
import CameraFeed from './components/CameraFeed';
import { UIOverlay } from './components/UIOverlay';
import { CONFIG } from './constants';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.TREE_FORM);
  const [currentGesture, setCurrentGesture] = useState<HandGesture>(HandGesture.NONE);
  const [rotationOffset, setRotationOffset] = useState<number>(0);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  const lastHandUpdateRef = useRef<number>(0);

  // Calculate position for photo on tree surface
  const createPhotoData = (url: string): PhotoData => {
    // Determine random height on tree
    const y = (Math.random() - 0.5) * CONFIG.TREE_HEIGHT * 0.8;
    // Calculate radius at this height for the tree cone
    // Normalized height from bottom (0 to 1)
    // Actually our tree math: y goes from -H/2 to H/2. 
    // Top is H/2, Bottom is -H/2. Radius is 0 at Top, Max at Bottom.
    const normalizedH = (CONFIG.TREE_HEIGHT / 2 - y) / CONFIG.TREE_HEIGHT;
    const radius = normalizedH * CONFIG.TREE_RADIUS_BASE + 0.5; // +0.5 to sit slightly outside
    
    const angle = Math.random() * Math.PI * 2;
    
    return {
      id: uuidv4(),
      url,
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
      scatterPosition: [
        (Math.random() - 0.5) * CONFIG.SCATTER_RADIUS,
        (Math.random() - 0.5) * CONFIG.SCATTER_RADIUS,
        (Math.random() - 0.5) * CONFIG.SCATTER_RADIUS
      ],
      rotation: [0, angle, 0],
    };
  };

  const handlePhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setPhotos(prev => [...prev, createPhotoData(url)]);
  };

  const updateState = (gesture: HandGesture, xPos: number) => {
    setCurrentGesture(gesture);

    if (gesture === HandGesture.FIST) {
      setAppState(AppState.TREE_FORM);
      setActivePhotoId(null);
    } 
    else if (gesture === HandGesture.OPEN_PALM) {
       if (appState === AppState.TREE_FORM || appState === AppState.PHOTO_VIEW) {
         setAppState(AppState.SCATTERED);
         setActivePhotoId(null);
       }
    } 
    else if (gesture === HandGesture.GRAB) {
       // Hand grab logic usually requires spatial selection, 
       // handled simpler here by just entering view mode if needed
       if (appState === AppState.SCATTERED && photos.length > 0 && !activePhotoId) {
         setAppState(AppState.PHOTO_VIEW);
         setActivePhotoId(photos[0].id);
       }
    }

    if (appState === AppState.SCATTERED) {
      const rotationSpeed = (xPos - 0.5) * 2;
      setRotationOffset(prev => prev + rotationSpeed * 0.05);
    }
  };

  const onHandUpdate = useCallback((info: HandInfo) => {
    lastHandUpdateRef.current = Date.now();
    updateState(info.gesture, info.x);
  }, [appState, photos, activePhotoId]);

  // Mouse Interaction Handlers
  const handleMouseDown = () => {
    // Mouse Down = Fist (Gather)
    if (Date.now() - lastHandUpdateRef.current > 1000) {
      updateState(HandGesture.FIST, 0.5);
    }
  };

  const handleMouseUp = () => {
    // Mouse Up = Open (Scatter)
    if (Date.now() - lastHandUpdateRef.current > 1000) {
      updateState(HandGesture.OPEN_PALM, 0.5);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Mouse Move = Rotation if in scatter
    if (Date.now() - lastHandUpdateRef.current > 1000 && appState === AppState.SCATTERED) {
      const normalizedX = e.clientX / window.innerWidth;
      // We don't change state, just rotation
      const rotationSpeed = (normalizedX - 0.5) * 2;
      setRotationOffset(prev => prev + rotationSpeed * 0.02);
    }
  };

  const handlePhotoClick = (id: string) => {
    setActivePhotoId(id);
    setAppState(AppState.PHOTO_VIEW);
  };

  return (
    <div 
      className="w-full h-screen relative bg-black select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
          appState={appState} 
          photos={photos} 
          rotationOffset={rotationOffset} 
          onPhotoClick={handlePhotoClick}
        />
      </div>

      {/* UI Overlay */}
      <UIOverlay 
        started={started}
        onStart={() => setStarted(true)}
        appState={appState} 
        currentGesture={currentGesture} 
        onPhotoUpload={handlePhotoUpload} 
        photoCount={photos.length}
      />

      {/* Vision Logic (Hidden) */}
      <CameraFeed onHandUpdate={onHandUpdate} isActive={started} />
    </div>
  );
};

export default App;