import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
   The hero object — a dealt stack of messages, one of them a scam
   ───────────────────────────────────────────────────────────────────────────
   Deliberately not a dark techy hero. Warm paper lit from the upper left,
   matching the tokens the rest of the product is built from, because this has
   to read as the same object language as the verdict card further down the
   page. A neon wireframe globe would look impressive and sell the wrong thing.

   Two notes on why it is built the way it is:

   `flat` turns off ACES tone mapping. Under the default, cream paper renders
   grey and the whole scene desaturates into something that looks like a
   greyscale mock rather than the product's palette.

   The scam card is pulled forward, scaled up and tilted against the others.
   Depth is carrying the meaning here: the one being examined is the one
   nearest you.
   ═══════════════════════════════════════════════════════════════════════════ */

const PAPER = '#fdf8ec';
const PAPER_WARM = '#f6eedc';
const SCAM_PAPER = '#fdf2ef';
const DANGER = '#a4372a';
const INK = '#2e2519';

interface CardSpec {
  x: number;
  y: number;
  z: number;
  rotZ: number;
  scale: number;
  scam?: boolean;
  lines: number[];
}

/* Fanned, not piled. Each card sits a little lower, a little further back and
   a little more rotated, so the eye reads a sequence rather than a heap. */
const CARDS: CardSpec[] = [
  { x: 0.34, y: 1.42, z: -1.5, rotZ: 0.1, scale: 0.9, lines: [0.7, 0.46] },
  { x: 0.16, y: 0.74, z: -0.9, rotZ: 0.06, scale: 0.95, lines: [0.66, 0.8, 0.42] },
  { x: -0.06, y: -0.04, z: 0.4, rotZ: -0.03, scale: 1.04, scam: true, lines: [0.82, 0.6, 0.72, 0.38] },
  { x: 0.1, y: -0.86, z: -0.5, rotZ: -0.07, scale: 0.96, lines: [0.6, 0.74, 0.5] },
  { x: 0.28, y: -1.52, z: -1.1, rotZ: -0.11, scale: 0.9, lines: [0.68, 0.44] },
];

function useCardGeometry() {
  return useMemo(() => {
    const w = 2.6;
    const h = 1.28;
    const r = 0.13;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.014,
      bevelSegments: 3,
      curveSegments: 14,
    });
  }, []);
}

function Card({ spec, index }: { spec: CardSpec; index: number }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useCardGeometry();
  const scam = Boolean(spec.scam);

  // Each card drifts on its own cycle. Offsetting by index keeps the stack from
  // breathing in unison, which reads as mechanical.
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.position.z = spec.z + Math.sin(t * 0.4 + index * 1.25) * 0.07;
    group.current.position.y = spec.y + Math.sin(t * 0.28 + index * 0.8) * 0.035;
    group.current.rotation.z = spec.rotZ + Math.sin(t * 0.24 + index) * 0.011;
  });

  const lineW = 2.6 * 0.82;

  return (
    <group
      ref={group}
      position={[spec.x, spec.y, spec.z]}
      rotation={[0, 0, spec.rotZ]}
      scale={spec.scale}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={scam ? SCAM_PAPER : PAPER}
          roughness={0.62}
          metalness={0}
          emissive={scam ? DANGER : PAPER_WARM}
          emissiveIntensity={scam ? 0.03 : 0.012}
        />
      </mesh>

      {/* The letterhead rule, in the verdict's own colour on the scam card. */}
      <mesh position={[-lineW / 2 + (lineW * 0.34) / 2, 0.37, 0.085]}>
        <planeGeometry args={[lineW * 0.34, scam ? 0.045 : 0.032]} />
        <meshBasicMaterial
          color={scam ? DANGER : INK}
          transparent
          opacity={scam ? 1 : 0.42}
        />
      </mesh>

      {/* Text, abstracted to lines. Real copy at this scale would be noise. */}
      {spec.lines.map((len, i) => (
        <mesh key={i} position={[-lineW / 2 + (lineW * len) / 2, 0.14 - i * 0.2, 0.085]}>
          <planeGeometry args={[lineW * len, 0.05]} />
          <meshBasicMaterial color={INK} transparent opacity={scam ? 0.3 : 0.16} />
        </mesh>
      ))}
    </group>
  );
}

/** The whole stack tilts toward the cursor. Damped, so it trails the pointer
 *  slightly rather than snapping, which is what makes it feel like an object
 *  with weight instead of a value bound to mouse position. */
function Stack() {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    // A slow idle sway underneath the pointer response, so the object is alive
    // before anyone touches it.
    const idleY = Math.sin(t * 0.18) * 0.07;
    const idleX = Math.cos(t * 0.14) * 0.035;

    const targetY = -0.5 + pointer.x * 0.32 + idleY;
    const targetX = 0.16 - pointer.y * 0.2 + idleX;

    const k = 1 - Math.pow(0.002, delta);
    group.current.rotation.y += (targetY - group.current.rotation.y) * k;
    group.current.rotation.x += (targetX - group.current.rotation.x) * k;
  });

  return (
    // Nudged left and scaled in so the widest card clears the stage edge at
    // every viewport rather than being cropped by the canvas bounds.
    <group ref={group} rotation={[0.16, -0.5, 0]} position={[-0.35, 0, 0]} scale={0.92}>
      {CARDS.map((spec, i) => (
        <Card key={i} spec={spec} index={i} />
      ))}
    </group>
  );
}

export default function MessageStack3D() {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7.4], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Warm key from the upper left, cool fill from the lower right, so the
          paper edges read as paper rather than as flat colour. */}
      <ambientLight intensity={0.72} color="#fff3dd" />
      <directionalLight
        position={[-4.2, 5, 6]}
        intensity={1.5}
        color="#fff4e0"
      />
      <directionalLight position={[4.5, -2.4, 3]} intensity={0.42} color="#dbe6f5" />
      <Stack />
    </Canvas>
  );
}
