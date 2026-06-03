import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { KeyboardControls, useGLTF, useAnimations, Sky, Html } from '@react-three/drei'
import { Physics, RigidBody, CylinderCollider, CuboidCollider } from '@react-three/rapier'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import Ecctrl, { useGame } from 'ecctrl'
import { useExplore } from './useExplore'
import { Kiosks, ProximityDetector } from './Kiosks'

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

/* ------------------------------------------------------------------
 * Archipelago (Phase 3 gray-box), data-driven. Islands are grassy discs
 * with rocky cone undersides; bridges are flat stone walkways linking the
 * hub to each section island along an axis. The Software Dev island stays
 * at the origin (its kiosks live in world space). Adding or moving a
 * section is just editing ISLANDS / BRIDGE_LINKS below.
 * ------------------------------------------------------------------ */
const ISLAND_TOP_Y = 0 // walking surface height
const ISLAND_THICKNESS = 1.5
const BRIDGE_HALF_WIDTH = 3
const BRIDGE_OVERLAP = 3 // how far each bridge end sinks into its island

// Radii scale with how much each island holds: Dev (5 kiosks) is biggest;
// About (one merged stop) is small. Dev stays at the origin; Video and About
// are pulled in close to the hub so their bridges stay short (~half the
// length they'd have at the islands' full reach).
const ISLANDS = [
  { id: 'hub', position: [0, 0, 75], radius: 16, color: '#b3d99b', label: 'Hub' },
  { id: 'dev', position: [0, 0, 0], radius: 33, color: '#a7d8a0', label: 'Software Dev' },
  { id: 'video', position: [54, 0, 75], radius: 26, color: '#9ec9e8', label: 'Videography' },
  { id: 'about', position: [-40, 0, 75], radius: 14, color: '#e6c98a', label: 'About' },
]
const BRIDGE_LINKS = [
  ['hub', 'dev'],
  ['hub', 'video'],
  ['hub', 'about'],
]
const SPAWN = [0, 2.5, 75] // on the hub

const islandById = (id) => ISLANDS.find((i) => i.id === id)

// Build an axis-aligned bridge between two islands that share one axis.
// Returns deck params + the walkable rect zone, overlapping both islands.
function makeBridge(aId, bId) {
  const a = islandById(aId)
  const b = islandById(bId)
  const dx = b.position[0] - a.position[0]
  const dz = b.position[2] - a.position[2]
  const hw = BRIDGE_HALF_WIDTH
  if (Math.abs(dx) >= Math.abs(dz)) {
    const s = Math.sign(dx)
    const start = a.position[0] + s * (a.radius - BRIDGE_OVERLAP)
    const end = b.position[0] - s * (b.radius - BRIDGE_OVERLAP)
    const minX = Math.min(start, end)
    const maxX = Math.max(start, end)
    const cz = a.position[2]
    return {
      axis: 'x', cx: (minX + maxX) / 2, cz, length: maxX - minX,
      from: aId, to: bId, hubEnd: [start, 0, cz], // `start` is the a-side (hub) end
      zone: { type: 'rect', minX, maxX, minZ: cz - hw + 0.4, maxZ: cz + hw - 0.4 },
    }
  }
  const s = Math.sign(dz)
  const start = a.position[2] + s * (a.radius - BRIDGE_OVERLAP)
  const end = b.position[2] - s * (b.radius - BRIDGE_OVERLAP)
  const minZ = Math.min(start, end)
  const maxZ = Math.max(start, end)
  const cx = a.position[0]
  return {
    axis: 'z', cx, cz: (minZ + maxZ) / 2, length: maxZ - minZ,
    from: aId, to: bId, hubEnd: [cx, 0, start], // `start` is the a-side (hub) end
    zone: { type: 'rect', minX: cx - hw + 0.4, maxX: cx + hw - 0.4, minZ, maxZ },
  }
}

const BRIDGES = BRIDGE_LINKS.map(([a, b]) => makeBridge(a, b))

// Walkable zones: each island as a circle (inset margin) + each bridge rect.
const ZONES = [
  ...ISLANDS.map((i) => ({ type: 'circle', cx: i.position[0], cz: i.position[2], r: i.radius - 1 })),
  ...BRIDGES.map((b) => b.zone),
]

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
  // Lift the deck slightly above the island surface so the overlapping
  // ends don't z-fight with the islands' coplanar tops.
  const lift = 0.08
  const deckY = ISLAND_TOP_Y + lift - 0.2
  const railY = ISLAND_TOP_Y + lift + 0.3
  const width = BRIDGE_HALF_WIDTH * 2
  const deckArgs = axis === 'x' ? [length, 0.4, width] : [width, 0.4, length]
  const railArgs = axis === 'x' ? [length, 0.6, 0.2] : [0.2, 0.6, length]
  const off = BRIDGE_HALF_WIDTH - 0.1
  const rail1 = axis === 'x' ? [cx, railY, cz + off] : [cx + off, railY, cz]
  const rail2 = axis === 'x' ? [cx, railY, cz - off] : [cx - off, railY, cz]
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Deck — top sits just above the island surface */}
      <mesh receiveShadow position={[cx, deckY, cz]}>
        <boxGeometry args={deckArgs} />
        <meshStandardMaterial color="#9a9690" />
      </mesh>
      <CuboidCollider args={[deckArgs[0] / 2, 0.2, deckArgs[2] / 2]} position={[cx, deckY, cz]} />
      {/* Low side rails (visual only) so the edges read clearly */}
      <mesh position={rail1} castShadow>
        <boxGeometry args={railArgs} />
        <meshStandardMaterial color="#7a766f" />
      </mesh>
      <mesh position={rail2} castShadow>
        <boxGeometry args={railArgs} />
        <meshStandardMaterial color="#7a766f" />
      </mesh>
    </RigidBody>
  )
}

// Placeholder gateway at a bridge's hub-side entrance: two posts straddling
// the walkway + a lintel, with a DOM label naming the destination page. The
// posts sit just outside the walkable zone (no collider needed — you walk
// through the middle). zIndexRange keeps the label below the UI overlays.
// Gray-box for now; styled archways come in the Phase 5 art pass.
function Archway({ hubEnd, axis, label, showLabel }) {
  const [x, , z] = hubEnd
  const off = BRIDGE_HALF_WIDTH + 0.3 // post offset from walkway center
  const postH = 5
  const beamY = postH + 0.2
  const thick = 0.5
  // Posts straddle the axis perpendicular to the bridge; beam spans the gap.
  const post1 = axis === 'x' ? [x, postH / 2, z + off] : [x + off, postH / 2, z]
  const post2 = axis === 'x' ? [x, postH / 2, z - off] : [x - off, postH / 2, z]
  const beamLen = off * 2 + thick
  const beamArgs = axis === 'x' ? [thick, 0.6, beamLen] : [beamLen, 0.6, thick]
  return (
    <group>
      <mesh position={post1} castShadow>
        <boxGeometry args={[thick, postH, thick]} />
        <meshStandardMaterial color="#6f6a63" />
      </mesh>
      <mesh position={post2} castShadow>
        <boxGeometry args={[thick, postH, thick]} />
        <meshStandardMaterial color="#6f6a63" />
      </mesh>
      <mesh position={[x, beamY, z]} castShadow>
        <boxGeometry args={beamArgs} />
        <meshStandardMaterial color="#5c5851" />
      </mesh>
      {showLabel && (
        <Html
          position={[x, beamY + 0.9, z]}
          center
          zIndexRange={[100, 0]}
          className="explore-island-label"
        >
          {label}
        </Html>
      )}
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

export default function Scene() {
  const characterRef = useRef(null)
  const panelOpen = useExplore((s) => s.active != null)
  const [looking, setLooking] = useState(false)
  return (
    <>
      <Sky sunPosition={[40, 25, 30]} turbidity={6} rayleigh={1.2} />
      <ambientLight intensity={0.7} />
      {/* Named "followLight" so ecctrl's followLight prop keeps shadows
          centered on the character as it moves around. */}
      <directionalLight
        name="followLight"
        position={[20, 30, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Sea of clouds far below, so the island reads as floating in the
          sky. A simple large disc for now; volumetric clouds come in the
          art pass (Phase 5). */}
      <mesh position={[0, -22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1000, 64]} />
        <meshBasicMaterial color="#eef6ff" />
      </mesh>

      <Physics timeStep="vary">
        <KeyboardControls map={keyboardMap}>
          <Ecctrl
            ref={characterRef}
            animated
            followLight
            disableControl={panelOpen}
            floatHeight={0.3}
            position={SPAWN}
            // Always run at the former sprint speed (4 × default sprint 2).
            maxVelLimit={8}
            sprintMult={1}
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
            camInitDir={{ x: 0.2, y: 0 }}
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
              showLabel={!panelOpen}
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
