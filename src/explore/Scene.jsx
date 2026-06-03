import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { KeyboardControls, useGLTF, useAnimations, Sky, Text, Clouds, Cloud } from '@react-three/drei'
import { Physics, RigidBody, CylinderCollider, CuboidCollider } from '@react-three/rapier'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import Ecctrl, { useGame } from 'ecctrl'
import { useExplore } from './useExplore'
import { Kiosks, ProximityDetector } from './Kiosks'
import { WorldDecor } from './Decor'
import { Museums } from './Architecture'
import {
  ISLAND_TOP_Y,
  ISLAND_THICKNESS,
  BRIDGE_HALF_WIDTH,
  ISLANDS,
  SPAWN,
  islandById,
  BRIDGES,
  ZONES,
  BUILDING_THEME,
} from './worldLayout'

/* ------------------------------------------------------------------
 * STEP 1 SPIKE SCENE
 * A flat platform + the real Quaternius character with walk/run/idle/
 * jump driven by ecctrl. This is intentionally a gray-box: no biomes
 * or islands yet — the only goal is to prove movement feels good on
 * desktop AND mobile before we invest in art.
 * ------------------------------------------------------------------ */

const characterURL = '/models/character.glb'

// Maps ecctrl's required animation slots → the actual clip names inside
// the Quaternius Adventurer GLB (verified by inspecting the file).
// All slots MUST map to an EXISTING clip or ecctrl throws "cannot read
// properties of undefined". The Adventurer has no jump clips, so the
// jump/fall slots reuse the neutral idle pose (jumping still works
// physically — there's just no dedicated jump animation).
const animationSet = {
  idle: 'CharacterArmature|Idle',
  walk: 'CharacterArmature|Run', // always-run: walk state reuses the Run clip
  run: 'CharacterArmature|Run',
  jump: 'CharacterArmature|Idle_Neutral',
  jumpIdle: 'CharacterArmature|Idle_Neutral',
  jumpLand: 'CharacterArmature|Idle',
  fall: 'CharacterArmature|Idle_Neutral',
  action1: 'CharacterArmature|Wave',
  action2: 'CharacterArmature|Interact',
  action3: 'CharacterArmature|Roll',
  action4: 'CharacterArmature|Sword_Slash',
}

// drei KeyboardControls preset — these named actions are what ecctrl reads.
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
]

function CharacterModel(props) {
  const { scene } = useGLTF(characterURL)

  // Clone the skeleton so this instance owns its own rig. Rendering the
  // shared cached scene directly leaves the animation mixer bound to a
  // detached object under React StrictMode → no animation plays. A clone
  // fixes that (standard pattern for animated R3F characters).
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])

  // Skinned meshes need castShadow set per-mesh, and frustumCulled off so
  // the character doesn't pop out of view when the bounding box is stale.
  useEffect(() => {
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.frustumCulled = false
      }
    })
  }, [model])

  return (
    <group {...props}>
      <primitive object={model} />
    </group>
  )
}

useGLTF.preload(characterURL)

/* ------------------------------------------------------------------
 * CharacterAnimation — a drop-in replacement for ecctrl's
 * EcctrlAnimation that additionally scales walk/run playback to the
 * character's real ground speed, so the legs keep pace with the body
 * (no foot-sliding). It reads ecctrl's shared animation state from
 * useGame, just like the stock component does.
 *
 * RUN_STRIDE_K: higher = faster legs. The character always runs, so this
 * is the single locomotion cadence knob.
 * ------------------------------------------------------------------ */
const RUN_STRIDE_K = 0.15

function CharacterAnimation({ characterURL, animationSet, children }) {
  const group = useRef(null)
  const { animations } = useGLTF(characterURL)
  const { actions } = useAnimations(animations, group)

  const curAnimation = useGame((s) => s.curAnimation)
  const resetAnimation = useGame((s) => s.reset)
  const initializeAnimationSet = useGame((s) => s.initializeAnimationSet)

  useEffect(() => {
    initializeAnimationSet(animationSet)
  }, [])

  // Play the current clip (mirrors EcctrlAnimation: one-shot clips clamp
  // and reset to idle when finished; locomotion clips loop).
  useEffect(() => {
    const key = curAnimation ?? animationSet.jumpIdle
    const action = key ? actions[key] : null
    if (!action) return

    const oneShot = [
      animationSet.jump,
      animationSet.jumpLand,
      animationSet.action1,
      animationSet.action2,
      animationSet.action3,
      animationSet.action4,
    ].includes(curAnimation)

    if (oneShot) {
      action.reset().fadeIn(0.2).setLoop(THREE.LoopOnce, 0).play()
      action.clampWhenFinished = true
    } else {
      action.reset().fadeIn(0.2).play()
    }

    // resetAnimation is a stable zustand action, so add/remove pair up.
    action._mixer.addEventListener('finished', resetAnimation)
    return () => {
      action.fadeOut(0.2)
      action._mixer.removeEventListener('finished', resetAnimation)
    }
  }, [curAnimation])

  // Measure world-space horizontal speed each frame and retime the legs.
  const prevPos = useRef(new THREE.Vector3())
  const worldPos = useRef(new THREE.Vector3())
  const started = useRef(false)
  useFrame((_, delta) => {
    if (!group.current || delta <= 0) return
    group.current.getWorldPosition(worldPos.current)
    if (!started.current) {
      prevPos.current.copy(worldPos.current)
      started.current = true
      return
    }
    const dx = worldPos.current.x - prevPos.current.x
    const dz = worldPos.current.z - prevPos.current.z
    const speed = Math.hypot(dx, dz) / delta
    prevPos.current.copy(worldPos.current)

    // Always-run: the walk and run states both resolve to the Run clip.
    const run = actions[animationSet.run]
    if (run && (curAnimation === animationSet.run || curAnimation === animationSet.walk)) {
      run.timeScale = THREE.MathUtils.clamp(speed * RUN_STRIDE_K, 0.8, 3.6)
    }
  })

  return (
    <group ref={group} dispose={null} userData={{ camExcludeCollision: true }}>
      {children}
    </group>
  )
}

/* Islands, bridges, walkable zones, and museum/door geometry all come from the
 * shared worldLayout module (imported above), so Scene, Architecture, and
 * interactables agree on a single layout. */

function Island({ position, radius, color }) {
  const coneHeight = radius * 0.6
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        {/* Grassy top */}
        <mesh receiveShadow position={[0, ISLAND_TOP_Y - ISLAND_THICKNESS / 2, 0]}>
          <cylinderGeometry args={[radius, radius, ISLAND_THICKNESS, 48]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <CylinderCollider
          args={[ISLAND_THICKNESS / 2, radius]}
          position={[0, ISLAND_TOP_Y - ISLAND_THICKNESS / 2, 0]}
        />
        {/* Rocky underside (visual only), apex pointing down */}
        <mesh
          position={[0, ISLAND_TOP_Y - ISLAND_THICKNESS - coneHeight / 2, 0]}
          rotation={[Math.PI, 0, 0]}
        >
          <coneGeometry args={[radius - 1, coneHeight, 48]} />
          <meshStandardMaterial color="#8a6b4f" />
        </mesh>
      </RigidBody>
    </group>
  )
}

function Bridge({ axis, cx, cz, length }) {
  // Just the walkable deck now — the side walls + ceiling are the covered
  // tunnel (Architecture's BridgeTunnel). Lift slightly above the island
  // surface so the overlapping ends don't z-fight with the coplanar tops.
  const lift = 0.08
  const deckY = ISLAND_TOP_Y + lift - 0.2
  const width = BRIDGE_HALF_WIDTH * 2
  const deckArgs = axis === 'x' ? [length, 0.4, width] : [width, 0.4, length]
  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh receiveShadow position={[cx, deckY, cz]}>
        <boxGeometry args={deckArgs} />
        <meshStandardMaterial color="#9a9690" />
      </mesh>
      <CuboidCollider args={[deckArgs[0] / 2, 0.2, deckArgs[2] / 2]} position={[cx, deckY, cz]} />
    </RigidBody>
  )
}

// Stone gateway at a bridge's hub-side entrance: two chunky posts flanking the
// tunnel mouth + a thick lintel, with the destination name engraved into the
// stone (real 3D Text on both faces, so it reads coming and going) instead of
// a floating DOM label. Posts sit just outside the walkable zone (no collider
// needed — you walk through the middle).
function Archway({ hubEnd, axis, label, color = '#332f29' }) {
  const [x, , z] = hubEnd
  const postThick = 1.2
  const postH = 5 // matches the tunnel height
  const off = BRIDGE_HALF_WIDTH + postThick / 2 // inner faces flank the tunnel mouth
  const lintelH = 2.0
  const lintelDepth = 1.5
  const lintelY = postH + lintelH / 2
  const span = off * 2 + postThick // full width across the posts

  // The tunnel runs along `axis`; posts straddle the perpendicular axis.
  const postA = axis === 'x' ? [x, postH / 2, z + off] : [x + off, postH / 2, z]
  const postB = axis === 'x' ? [x, postH / 2, z - off] : [x - off, postH / 2, z]
  const lintelArgs = axis === 'x' ? [lintelDepth, lintelH, span] : [span, lintelH, lintelDepth]

  // Title floats just proud of each lintel face: white letters with a
  // building-colored outline (`color`) for legibility + color-coding. Front
  // face toward the hub, back face toward the building, so it reads both ways.
  const faceOff = lintelDepth / 2 + 0.03
  const faces = axis === 'x'
    ? [{ pos: [x + faceOff, lintelY, z], rotY: Math.PI / 2 }, { pos: [x - faceOff, lintelY, z], rotY: -Math.PI / 2 }]
    : [{ pos: [x, lintelY, z + faceOff], rotY: 0 }, { pos: [x, lintelY, z - faceOff], rotY: Math.PI }]

  return (
    <group>
      <mesh position={postA} castShadow receiveShadow>
        <boxGeometry args={[postThick, postH, postThick]} />
        <meshStandardMaterial color="#aca596" roughness={1} />
      </mesh>
      <mesh position={postB} castShadow receiveShadow>
        <boxGeometry args={[postThick, postH, postThick]} />
        <meshStandardMaterial color="#aca596" roughness={1} />
      </mesh>
      <mesh position={[x, lintelY, z]} castShadow receiveShadow>
        <boxGeometry args={lintelArgs} />
        <meshStandardMaterial color="#b8b2a5" roughness={1} />
      </mesh>
      {faces.map((f, i) => (
        <Text
          key={i}
          position={f.pos}
          rotation={[0, f.rotY, 0]}
          font="/fonts/BebasNeue-Regular.ttf"
          fontSize={1.05}
          letterSpacing={0.04}
          maxWidth={span - 0.6}
          anchorX="center"
          anchorY="middle"
          color="#ffffff"
          outlineWidth={0.07}
          outlineColor={color}
        >
          {label}
        </Text>
      ))}
    </group>
  )
}

/* Keep the player within the walkable zones (islands + bridge). "Safe" if
 * inside any zone; otherwise clamp to the nearest zone's edge (reads as an
 * invisible wall, no collider tunneling at speed). Fall failsafe respawns
 * at the hub. Reads ecctrl's physics body through its ref's `.group`. */
function zoneContains(z, x, zz) {
  if (z.type === 'circle') return Math.hypot(x - z.cx, zz - z.cz) <= z.r
  return x >= z.minX && x <= z.maxX && zz >= z.minZ && zz <= z.maxZ
}
function zoneClamp(z, x, zz) {
  if (z.type === 'circle') {
    const dx = x - z.cx
    const dz = zz - z.cz
    const d = Math.hypot(dx, dz) || 1e-6
    return { x: z.cx + (dx / d) * z.r, z: z.cz + (dz / d) * z.r, dist: d - z.r }
  }
  const cx = Math.min(Math.max(x, z.minX), z.maxX)
  const cz = Math.min(Math.max(zz, z.minZ), z.maxZ)
  return { x: cx, z: cz, dist: Math.hypot(x - cx, zz - cz) }
}

function BoundaryGuard({ bodyRef, spawn = SPAWN, minY = -8 }) {
  useFrame(() => {
    const body = bodyRef.current?.group
    if (!body) return
    const pos = body.translation()

    // Fall failsafe → respawn at the hub
    if (pos.y < minY) {
      body.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    // Safe if inside any walkable zone
    for (const z of ZONES) if (zoneContains(z, pos.x, pos.z)) return

    // Otherwise clamp to the nearest zone edge and stop horizontal motion
    let best = null
    for (const z of ZONES) {
      const c = zoneClamp(z, pos.x, pos.z)
      if (!best || c.dist < best.dist) best = c
    }
    body.setTranslation({ x: best.x, y: pos.y, z: best.z }, true)
    // Remove only the OUTWARD velocity component, so you can still move
    // inward and slide along the edge instead of getting glued to it.
    const d = best.dist || 1e-6
    const ox = (pos.x - best.x) / d
    const oz = (pos.z - best.z) / d
    const v = body.linvel()
    const outward = v.x * ox + v.z * oz
    if (outward > 0) {
      body.setLinvel({ x: v.x - outward * ox, y: v.y, z: v.z - outward * oz }, true)
    }
  })
  return null
}

/* Drag-to-look layer on top of FixedCamera. Listens for pointer drags on the
 * 3D canvas (the joystick/jump/UI are separate DOM elements above it, so they
 * don't trigger look) and calls ecctrl's rotateCamera. While dragging it
 * reports `looking` so the parent can set fixedCamRotMult=0 (pausing the
 * auto-recenter); on release the camera eases back behind the character.
 * rotateCamera(xPitch, yYaw); signs match ecctrl's native drag feel. */
const LOOK_SENS = 0.005

function CameraDragControls({ characterRef, onLookingChange }) {
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const el = gl.domElement
    let activeId = null
    let lastX = 0
    let lastY = 0

    const onDown = (e) => {
      if (activeId !== null) return
      activeId = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture?.(e.pointerId)
      onLookingChange(true)
    }
    const onMove = (e) => {
      if (e.pointerId !== activeId) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      characterRef.current?.rotateCamera?.(dy * LOOK_SENS, -dx * LOOK_SENS)
    }
    const onUp = (e) => {
      if (e.pointerId !== activeId) return
      activeId = null
      el.releasePointerCapture?.(e.pointerId)
      onLookingChange(false)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [gl, characterRef, onLookingChange])

  return null
}

// Shared sun direction: the Sky's sun and the key light point the same way so
// the lighting reads coherently. Lowered/warmed from the old midday angle for
// a late-afternoon feel.
const SUN_POS = [45, 26, 22]

export default function Scene() {
  const characterRef = useRef(null)
  const panelOpen = useExplore((s) => s.active != null)
  const [looking, setLooking] = useState(false)
  return (
    <>
      {/* Soft distance haze so far islands fade into the sky. Fog is
          camera-relative, so islands you're near stay crisp while ones across
          the world dissolve toward the horizon. Color blends with the Sky. */}
      <fog attach="fog" args={['#cfe0f2', 95, 320]} />

      <Sky
        sunPosition={SUN_POS}
        turbidity={8}
        rayleigh={1.6}
        mieCoefficient={0.006}
        mieDirectionalG={0.85}
      />

      {/* Outdoor light: a hemisphere fill (cool sky above, warm ground bounce)
          plus a warm low-angle key light aligned with the Sky's sun. The key
          light is named "followLight" so ecctrl keeps its shadow centered on
          the character as it moves. */}
      <hemisphereLight args={['#bcd8f5', '#e7d2a4', 0.6]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        name="followLight"
        position={SUN_POS}
        intensity={1.4}
        color="#ffe7c2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Sea of clouds far below, so the islands read as floating. A soft disc
          is the dependable floor (recolored to melt into the fog so its edge
          never reads as a hard line); a thin layer of volumetric puffs above
          it adds real depth at the horizon. Static for now — drift is Phase 6. */}
      <mesh position={[0, -22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1000, 64]} />
        <meshBasicMaterial color="#dcebf9" />
      </mesh>
      <Clouds material={THREE.MeshBasicMaterial} limit={300} range={160}>
        <Cloud
          seed={1}
          bounds={[260, 4, 260]}
          segments={48}
          volume={50}
          opacity={0.5}
          speed={0}
          color="#f4f9ff"
          position={[0, -20, 30]}
        />
      </Clouds>

      <Physics timeStep="vary">
        <KeyboardControls map={keyboardMap}>
          <Ecctrl
            ref={characterRef}
            animated
            followLight
            disableControl={panelOpen}
            floatHeight={0.3}
            position={SPAWN}
            // Always jog at speed 8; hold Shift (the `run` action) to sprint at
            // double (8 × 2 = 16). CharacterAnimation retimes the run clip to
            // ground speed, so the legs keep pace at both speeds.
            maxVelLimit={8}
            sprintMult={2}
            // Hybrid camera: FixedCamera keeps it locked behind the character
            // (turning stays behind, movement reads "into the screen").
            // CameraDragControls lets you drag to look; while dragging we set
            // fixedCamRotMult=0 so auto-recenter doesn't fight the drag, then
            // restore it so the camera eases back behind on release.
            mode="FixedCamera"
            fixedCamRotMult={looking ? 0 : 1}
            // Follow-camera: angled down from above, moderately close.
            camInitDis={-6}
            camMaxDis={-10}
            camMinDis={-2}
            // Face south on spawn (toward the buildings) — flipped 180° from
            // the old north-facing default so you look into the world on load.
            // characterInitDir sets the character's resting facing (modelEuler);
            // camInitDir starts the camera behind it so there's no swing.
            characterInitDir={Math.PI}
            camInitDir={{ x: 0.2, y: Math.PI }}
          >
            <CharacterAnimation characterURL={characterURL} animationSet={animationSet}>
              <CharacterModel position={[0, -0.94, 0]} scale={0.95} />
            </CharacterAnimation>
          </Ecctrl>

          {/* Drag-to-look on top of the locked-behind FixedCamera. */}
          <CameraDragControls characterRef={characterRef} onLookingChange={setLooking} />

          {/* Archipelago: hub + section islands linked by bridges. The
              zone-based boundary guard keeps you on the walkable area and
              respawns you at the hub if you ever fall. */}
          {ISLANDS.map((i) => (
            <Island key={i.id} position={i.position} radius={i.radius} color={i.color} />
          ))}

          {/* Enclosed themed museums (walls + domed roofs + interior light) and
              covered bridge tunnels. */}
          <Museums islands={ISLANDS} bridges={BRIDGES} />

          {/* Distant background islets for depth. */}
          <WorldDecor />
          {BRIDGES.map((b, idx) => (
            <Bridge key={idx} {...b} />
          ))}
          {/* Labeled gateway at each bridge's hub-side entrance (named for
              the page it leads to). Replaces the old floating island labels. */}
          {BRIDGES.map((b) => (
            <Archway
              key={`arch-${b.to}`}
              hubEnd={b.hubEnd}
              axis={b.axis}
              label={islandById(b.to).label}
              color={BUILDING_THEME[b.to]?.engrave}
            />
          ))}
          <BoundaryGuard bodyRef={characterRef} />

          {/* Interactive kiosks + proximity detection */}
          <Kiosks />
          <ProximityDetector bodyRef={characterRef} />
        </KeyboardControls>
      </Physics>
    </>
  )
}
