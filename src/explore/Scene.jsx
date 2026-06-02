import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { KeyboardControls, useGLTF, useAnimations, Sky } from '@react-three/drei'
import { Physics, RigidBody, CylinderCollider } from '@react-three/rapier'
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
 * Floating island (Phase 2 gray-box): a grassy top disc the player walks
 * on, a rocky cone underside for the "floating rock" look, and a ring of
 * invisible wall colliders around the rim so you can't fall off.
 * ------------------------------------------------------------------ */
const ISLAND_RADIUS = 33
const ISLAND_TOP_Y = 0 // walking surface height
const ISLAND_THICKNESS = 1.5

function FloatingIsland() {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* Grassy top */}
      <mesh receiveShadow position={[0, ISLAND_TOP_Y - ISLAND_THICKNESS / 2, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS, ISLAND_THICKNESS, 48]} />
        <meshStandardMaterial color="#a7d8a0" />
      </mesh>
      <CylinderCollider
        args={[ISLAND_THICKNESS / 2, ISLAND_RADIUS]}
        position={[0, ISLAND_TOP_Y - ISLAND_THICKNESS / 2, 0]}
      />
      {/* Rocky underside (visual only), apex pointing down */}
      <mesh position={[0, ISLAND_TOP_Y - 11.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[ISLAND_RADIUS - 1, 20, 48]} />
        <meshStandardMaterial color="#8a6b4f" />
      </mesh>
    </RigidBody>
  )
}

/* Keep the character on the island via a code-enforced circular boundary
 * (reliable for a round island — no collider tunneling at speed and no
 * gaps), plus a fall failsafe that respawns at center if anything ever
 * slips off. Reads ecctrl's physics body through its ref's `.group`. */
function BoundaryGuard({ bodyRef, radius = ISLAND_RADIUS - 1, spawn = [0, 3, 0], minY = -8 }) {
  useFrame(() => {
    const body = bodyRef.current?.group
    if (!body) return
    const pos = body.translation()

    // Fall failsafe
    if (pos.y < minY) {
      body.setTranslation({ x: spawn[0], y: spawn[1], z: spawn[2] }, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    // Circular boundary: clamp horizontal distance and remove outward
    // velocity so it reads as a wall while still allowing sliding along it.
    const r = Math.hypot(pos.x, pos.z)
    if (r > radius) {
      const ox = pos.x / r
      const oz = pos.z / r
      body.setTranslation({ x: ox * radius, y: pos.y, z: oz * radius }, true)
      const v = body.linvel()
      const outward = v.x * ox + v.z * oz
      if (outward > 0) {
        body.setLinvel({ x: v.x - outward * ox, y: v.y, z: v.z - outward * oz }, true)
      }
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
            position={[0, 2, 0]}
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

          {/* Floating island + code-enforced circular boundary (with fall
              failsafe) so you can't leave the island. */}
          <FloatingIsland />
          <BoundaryGuard bodyRef={characterRef} />

          {/* Interactive kiosks + proximity detection */}
          <Kiosks />
          <ProximityDetector bodyRef={characterRef} />
        </KeyboardControls>
      </Physics>
    </>
  )
}
