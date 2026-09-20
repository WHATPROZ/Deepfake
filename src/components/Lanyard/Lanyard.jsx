/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// replace with your own imports, see the usage snippet for details
import cardGLB from './card.glb';

import * as THREE from 'three';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  selectedFileName = '',
  selectedFileType = '',
  uploadConfirmed = false,
  onSelectMedia,
  onClearUpload,
  onAnalyse
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: position, fov: fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            selectedFileName={selectedFileName}
            selectedFileType={selectedFileType}
            uploadConfirmed={uploadConfirmed}
            onSelectMedia={onSelectMedia}
            onClearUpload={onClearUpload}
            onAnalyse={onAnalyse}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  selectedFileName = '',
  selectedFileType = '',
  uploadConfirmed = false,
  onSelectMedia,
  onClearUpload,
  onAnalyse
}) {
  const band = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();
  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardImage || BLANK_PIXEL);
  // useTexture must be called unconditionally; use a blank pixel when an image
  // isn't supplied for a given face, then skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);
  // Load Deepnox logo for drawing into the card UI atlas
  const deepnoxTex = useTexture('/deepnox-logo.png');

  const cardUiMap = useMemo(() => {
    const W = 1536;
    const H = 2000;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const ellipsize = (text, limit = 28) => {
      if (!text) return '';
      return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
    };

    ctx.clearRect(0, 0, W, H);

    const panelX = W * 0.06;
    const panelY = H * 0.1;
    const panelW = W * 0.88;
    const panelH = H * 0.82;
    ctx.save();
    roundRect(panelX, panelY, panelW, panelH, 56);
    ctx.fillStyle = 'rgba(4, 10, 16, 0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.setLineDash([32, 22]);
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.86)';
    ctx.lineWidth = 10;
    const titleText = selectedFileName ? 'Uploaded!' : 'Upload Media';
    ctx.font = '900 120px Arial, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.strokeText(titleText, W / 2, H * 0.17);
    ctx.fillText(titleText, W / 2, H * 0.17);
    ctx.fillStyle = '#f4fbff';
    ctx.lineWidth = 7;
    const mediaTypeText = selectedFileName
      ? selectedFileType.startsWith('video/')
        ? 'VIDEO'
        : selectedFileType.startsWith('image/')
          ? 'PHOTO'
          : 'MEDIA'
      : 'Any media file';
    ctx.font = '800 68px Arial, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.strokeText(mediaTypeText, W / 2, H * 0.255);
    ctx.fillText(mediaTypeText, W / 2, H * 0.255);
    ctx.restore();

    const pvX = W * 0.12;
    const pvY = H * 0.34;
    const pvW = W * 0.76;
    const pvH = H * 0.28;
    ctx.save();
    roundRect(pvX, pvY, pvW, pvH, 44);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    if (frontImage && frontTex.image) {
      const img = frontTex.image;
      const scale = Math.max(pvW / img.width, pvH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = pvX + (pvW - dw) / 2;
      const dy = pvY + (pvH - dh) / 2;
      ctx.save();
      roundRect(pvX, pvY, pvW, pvH, 44);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.82)';
      ctx.lineWidth = 8;
      ctx.font = '800 66px Arial, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      if (selectedFileName) {
        ctx.strokeText('Uploaded!', W / 2, pvY + pvH * 0.44);
        ctx.fillText('Uploaded!', W / 2, pvY + pvH * 0.44);
      } else {
        ctx.strokeText('Drag and Drop', W / 2, pvY + pvH * 0.34);
        ctx.fillText('Drag and Drop', W / 2, pvY + pvH * 0.34);
        ctx.font = '800 52px Arial, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        ctx.strokeText('or', W / 2, pvY + pvH * 0.5);
        ctx.fillText('or', W / 2, pvY + pvH * 0.5);
        ctx.font = '800 58px Arial, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        ctx.strokeText('Upload The File', W / 2, pvY + pvH * 0.66);
        ctx.fillText('Upload The File', W / 2, pvY + pvH * 0.66);
      }
      ctx.fillStyle = '#edf8ff';
      ctx.lineWidth = 6;
      ctx.font = '700 46px Arial, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      if (selectedFileName) {
        ctx.strokeText(ellipsize(selectedFileName), W / 2, pvY + pvH * 0.58);
        ctx.fillText(ellipsize(selectedFileName), W / 2, pvY + pvH * 0.58);
      }
      ctx.restore();
    }

    const buttonY = H * 0.69;
    const buttonW = W * 0.48;
    const buttonH = H * 0.12;
    const uploadX = W / 2 - buttonW / 2;
    const drawButton = (x, label, accent, width = buttonW) => {
      ctx.save();
      roundRect(x, buttonY, width, buttonH, 36);
      const gradient = ctx.createLinearGradient(x, buttonY, x + width, buttonY + buttonH);
      gradient.addColorStop(0, accent);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.16)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.lineWidth = 8;
      ctx.font = '900 66px Arial, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.strokeText(label, x + width / 2, buttonY + buttonH / 2);
      ctx.fillText(label, x + width / 2, buttonY + buttonH / 2);
      ctx.restore();
    };

    const iconButtonSize = H * 0.105;
    const iconY = H * 0.715;
    const deleteX = W * 0.2;
    const analyseButtonW = W * 0.48;
    const analyseX = W * 0.41;
    const drawIconButton = (x, drawIcon, isActive = false) => {
      ctx.save();
      roundRect(x, iconY, iconButtonSize, iconButtonSize, 34);
      ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawIcon(x, iconY, iconButtonSize);
      ctx.restore();
    };
    const drawTrashIcon = (x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(x + s * 0.32, y + s * 0.38);
      ctx.lineTo(x + s * 0.68, y + s * 0.38);
      ctx.moveTo(x + s * 0.39, y + s * 0.38);
      ctx.lineTo(x + s * 0.43, y + s * 0.72);
      ctx.lineTo(x + s * 0.57, y + s * 0.72);
      ctx.lineTo(x + s * 0.61, y + s * 0.38);
      ctx.moveTo(x + s * 0.43, y + s * 0.3);
      ctx.lineTo(x + s * 0.57, y + s * 0.3);
      ctx.moveTo(x + s * 0.36, y + s * 0.34);
      ctx.lineTo(x + s * 0.64, y + s * 0.34);
      ctx.stroke();
    };
    if (selectedFileName) {
      drawIconButton(deleteX, drawTrashIcon);
      drawButton(analyseX, 'Analyse', uploadConfirmed ? 'rgba(255, 255, 255, 0.28)' : 'rgba(83, 91, 235, 0.88)', analyseButtonW);
    } else {
      drawButton(uploadX, 'Analyse', 'rgba(83, 91, 235, 0.88)');
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.generateMipmaps = false;
    composite.minFilter = THREE.LinearFilter;
    composite.magFilter = THREE.LinearFilter;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, frontTex, selectedFileName, selectedFileType, uploadConfirmed]);

  // Composite the front/back images into the card's texture atlas (front = left
  // half, back = right half). Each image is drawn aspect-preserving (no stretch).
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    const baseImg = baseMap.image;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;
    // Draw the original atlas as the backdrop (edges, bevels, etc.).
    ctx.drawImage(baseImg, 0, 0, W, H);

    // Helper to draw rounded rectangles
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Draw the custom UI into the FRONT_UV_RECT area (left half of atlas)
    const rx = FRONT_UV_RECT.x * W;
    const ry = FRONT_UV_RECT.y * H;
    const rw = FRONT_UV_RECT.w * W;
    const rh = FRONT_UV_RECT.h * H;

    // Card UI background: slightly darker translucent pane
    ctx.save();
    roundRect(rx + rw * 0.06, ry + rh * 0.04, rw * 0.88, rh * 0.92, Math.min(24, rw * 0.04));
    ctx.fillStyle = 'rgba(16,24,32,0.42)';
    ctx.fill();

    // Illuminated thin edge
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = Math.max(1, rw * 0.004);
    ctx.stroke();
    ctx.restore();

    // Top-center Deepnox logo (white)
    if (deepnoxTex && deepnoxTex.image) {
      const logoW = rw * 0.32;
      const logoH = (deepnoxTex.image.height / deepnoxTex.image.width) * logoW;
      const lx = rx + rw / 2 - logoW / 2;
      const ly = ry + rh * 0.06;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(deepnoxTex.image, lx, ly, logoW, logoH);
      ctx.restore();
    }

    // Heading text
    ctx.save();
    ctx.fillStyle = 'white';
    const fontSize = Math.max(14, Math.floor(rw * 0.045));
    ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, 'Segoe UI', Roboto`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Upload Media File', rx + rw / 2, ry + rh * 0.18);
    ctx.restore();

    // Media preview area (rounded rect) — slightly darker translucent glass
    const pvW = rw * 0.84;
    const pvH = rh * 0.46;
    const pvX = rx + rw * 0.08;
    const pvY = ry + rh * 0.26;
    ctx.save();
    roundRect(pvX, pvY, pvW, pvH, Math.min(18, pvW * 0.03));
    ctx.fillStyle = 'rgba(8,12,14,0.48)';
    ctx.fill();
    // subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = Math.max(1, rw * 0.002);
    ctx.stroke();
    ctx.restore();

    // START ANALYSING button
    const btnW = rw * 0.64;
    const btnH = Math.max(28, rh * 0.08);
    const btnX = rx + rw / 2 - btnW / 2;
    const btnY = pvY + pvH + rh * 0.06;
    ctx.save();
    roundRect(btnX, btnY, btnW, btnH, Math.min(12, btnH * 0.35));
    // button fill: faint glassy glow
    const g = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    g.addColorStop(0, 'rgba(255,255,255,0.06)');
    g.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = g;
    ctx.fill();
    // button border glow
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // button text
    ctx.fillStyle = 'white';
    ctx.font = `600 ${Math.max(12, Math.floor(btnH * 0.45))}px Inter, system-ui, -apple-system, 'Segoe UI', Roboto`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START ANALYSING', btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();

    // If a frontImage is provided, composite it into the preview area
    const drawFitted = (img) => {
      if (!img) return;
      const pick = imageFit === 'contain' ? Math.min : Math.max;
      const scale = pick(pvW / img.width, pvH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = pvX + (pvW - dw) / 2;
      const dy = pvY + (pvH - dh) / 2;
      ctx.save();
      roundRect(pvX, pvY, pvW, pvH, Math.min(18, pvW * 0.03));
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    if (frontImage && frontTex.image) drawFitted(frontTex.image);

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, frontTex, imageFit, materials.base.map, deepnoxTex]);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  // Track the last pointer position in client (window) coordinates so dragging
  // can use the full viewport, not be limited to the canvas element size.
  const pointerClient = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });

  useEffect(() => {
    const onPointerMoveWindow = e => {
      pointerClient.current.x = e.clientX;
      pointerClient.current.y = e.clientY;
    };
    window.addEventListener('pointermove', onPointerMoveWindow, { passive: true });
    const onResize = () => {
      // ensure coordinates remain valid after resize
      pointerClient.current.x = Math.min(window.innerWidth, Math.max(0, pointerClient.current.x));
      pointerClient.current.y = Math.min(window.innerHeight, Math.max(0, pointerClient.current.y));
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('pointermove', onPointerMoveWindow);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      // Use full-window client coordinates converted to NDC so dragging isn't
      // constrained to the canvas element bounds.
      const cw = window.innerWidth || 1;
      const ch = window.innerHeight || 1;
      const ndcX = (pointerClient.current.x / cw) * 2 - 1;
      const ndcY = -(pointerClient.current.y / ch) * 2 + 1;
      vec.set(ndcX, ndcY, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  // Preserve the card's top-center anchor (card-side joint at local Y=1.5)
  // when increasing visual scale. Compute group Y so:
  // groupY + SCALE * geomTopY = anchorY
  const OLD_SCALE = 2.25;
  const CARD_SCALE = OLD_SCALE * 1.25; // uniform 25% increase
  let computedGroupY = -1.2; // fallback to previous value
  if (nodes?.card?.geometry) {
    const geom = nodes.card.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    const geomTopY = geom.boundingBox.max.y;
    const anchorY = 1.5; // from useSphericalJoint(j3, card, [[0,0,0],[0,1.5,0]])
    computedGroupY = anchorY - CARD_SCALE * geomTopY;
  }

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
          <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={CARD_SCALE}
            position={[0, computedGroupY, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                // Dark glossy glass per user spec — single material-only change.
                color="#15181C"
                transparent={true}
                opacity={0.72}
                metalness={0.05}
                roughness={0.18}
                clearcoat={1}
                clearcoatRoughness={0.12}
                emissive="#000000"
                emissiveIntensity={0}
              />
            </mesh>
            {/* Deepnox logos on front and back faces — same size/position, slightly offset to avoid z-fighting. */}
            {(() => {
              // Compute card bounds to place logos in upper-center area.
              const geom = nodes.card.geometry;
              if (!geom) return null;
              if (!geom.boundingBox) geom.computeBoundingBox();
              const bb = geom.boundingBox.clone();
              const size = new THREE.Vector3();
              bb.getSize(size);
              const center = new THREE.Vector3();
              bb.getCenter(center);
              const logoW = size.x * 0.70;
              const logoH = size.y * 0.15;
              // place near upper center (a bit below the top edge)
              // nudge logos slightly upward so they sit just below the hole/hook
              const logoY = center.y + size.y * 0.28 + 0.07;
              const zOffset = size.z * 0.5 + Math.max(0.004, size.z * 0.01);
              const uiW = size.x * 0.92;
              const uiH = size.y * 0.86;
              const uiY = center.y - size.y * 0.08;
              const hitW = size.x * 0.46;
              const hitH = size.y * 0.1;
              const hitY = center.y - size.y * 0.295;
              const uploadAreaHitW = size.x * 0.68;
              const uploadAreaHitH = size.y * 0.26;
              const uploadAreaHitY = center.y - size.y * 0.09;
              const uploadHitX = 0;
              const iconHitW = size.x * 0.2;
              const iconHitH = size.y * 0.13;
              const iconHitY = center.y - size.y * 0.31;
              const deleteHitX = -size.x * 0.23;
              const analyseHitX = size.x * 0.18;
              const handleOptionPointerDown = (e, handler) => {
                e.stopPropagation();
                e.target?.releasePointerCapture?.(e.pointerId);
                handler?.();
              };
              return (
                <>
                  <mesh position={[0, uiY, zOffset + 0.002]}>
                    <planeGeometry args={[uiW, uiH]} />
                    <meshBasicMaterial map={cardUiMap} transparent={true} depthTest={false} toneMapped={false} />
                  </mesh>
                  {selectedFileName ? (
                    <>
                      <mesh
                        position={[deleteHitX, iconHitY, zOffset + 0.006]}
                        onPointerDown={e => handleOptionPointerDown(e, onClearUpload)}
                      >
                        <planeGeometry args={[iconHitW, iconHitH]} />
                        <meshBasicMaterial transparent={true} opacity={0} depthWrite={false} />
                      </mesh>
                      <mesh
                        position={[analyseHitX, hitY, zOffset + 0.006]}
                        onPointerDown={e => handleOptionPointerDown(e, onAnalyse)}
                      >
                        <planeGeometry args={[hitW, hitH]} />
                        <meshBasicMaterial transparent={true} opacity={0} depthWrite={false} />
                      </mesh>
                    </>
                  ) : (
                    <>
                      <mesh
                        position={[uploadHitX, uploadAreaHitY, zOffset + 0.006]}
                        onPointerDown={e => handleOptionPointerDown(e, onSelectMedia)}
                      >
                        <planeGeometry args={[uploadAreaHitW, uploadAreaHitH]} />
                        <meshBasicMaterial transparent={true} opacity={0} depthWrite={false} />
                      </mesh>
                      <mesh
                        position={[uploadHitX, hitY, zOffset + 0.006]}
                        onPointerDown={e => handleOptionPointerDown(e, onAnalyse)}
                      >
                        <planeGeometry args={[hitW, hitH]} />
                        <meshBasicMaterial transparent={true} opacity={0} depthWrite={false} />
                      </mesh>
                    </>
                  )}
                  <mesh position={[0, logoY, zOffset]}>
                    <planeGeometry args={[logoW, logoH]} />
                    <meshBasicMaterial map={deepnoxTex} transparent={true} depthTest={false} toneMapped={false} />
                  </mesh>
                  <mesh position={[0, logoY, -zOffset]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[logoW, logoH]} />
                    <meshBasicMaterial map={deepnoxTex} transparent={true} depthTest={false} toneMapped={false} />
                  </mesh>
                </>
              );
            })()}
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band} position={[0, 0.50, 0]}>
        <meshLineGeometry />
        <meshLineMaterial
          color="#050507"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={Boolean(lanyardImage)}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}
