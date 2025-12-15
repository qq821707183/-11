export enum AppState {
  TREE_FORM = 'TREE_FORM',
  SCATTERED = 'SCATTERED',
  PHOTO_VIEW = 'PHOTO_VIEW',
}

export enum HandGesture {
  NONE = 'NONE',
  FIST = 'FIST',      // Close tree
  OPEN_PALM = 'OPEN', // Scatter
  GRAB = 'GRAB',      // Select photo
}

export interface ParticleData {
  id: number;
  type: 'sphere' | 'box' | 'candy';
  color: string;
  position: [number, number, number];
  scatterPosition: [number, number, number];
  scale: number;
  speed: number;
}

export interface PhotoData {
  id: string;
  url: string;
  position: [number, number, number];
  scatterPosition: [number, number, number];
  rotation: [number, number, number];
}

export interface HandInfo {
  gesture: HandGesture;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  pinchDistance: number;
  rotation: number;
}