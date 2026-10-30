// dsh-fairy / Fairy-DSH mascot port — the single source of truth for Fairy's eye.
//
// Port of github.com/Chengzhibense/Fairy-DSH (Apache-2.0),
// fairy-visual/dsh-fairy-visual/src/client/:
//   mascot-geometry.js · mascot-eye-svg.js · mascot-effects-svg.js · mascot-style.js
//   mascot-motion-clock.js · mascot-event-scheduler.js · mascot-runtime.js
//
// The artwork (geometry, gradients, clip paths, halo lines), the CSS (selectors,
// keyframes, glitch variables, low-power rules) and the motion model (one 1440 ms
// master clock, cubic-bezier(0.72,0,0.28,1) eye layers, the random glitch
// scheduler, the flicker) are the upstream ones. These changes were made, because
// this skin mounts Fairy in up to four seats instead of one full-screen stage and
// because two upstream effects were removed on request (0.16.1):
//
//   1. every SVG id is namespaced per instance (`fairy-m<N>-*`), so four eyes
//      can share a document without stealing each other's defs, <use> clones or
//      mutable slice rectangles. The two places where upstream CSS names an id
//      directly (`filter: url(#…)` for the thread tear, `clip-path: url(#…)` for
//      the thinking / comforting lids) are committed by the instance that owns
//      them as inline declarations instead;
//   2. the singleton runtime became `createInstance(root, options)` plus one
//      shared requestAnimationFrame ticker for every live instance;
//   3. stage/HDD ownership, settings transport and style injection are gone —
//      the skin owns the stylesheet and the seats — and the root is sized by its
//      wrapper instead of `min(76%, 36vh, 450px)`;
//   4. `prefers-reduced-motion` also stops the JavaScript motion loop, not just
//      the CSS timelines. Upstream only stops the CSS, which leaves the
//      JS-committed eye transforms breathing; a frozen eye is the intent of both;
//   5. the expanding lash-pulse ring (upstream PULSE_SVG + its three keyframes)
//      is not ported at all — the user asked for the ripple to be removed
//      ("泛出涟漪");
//   6. the two-burst fault that upstream plays on every expression change is not
//      ported either — that burst is the "Fairy turns pure white" flash the user
//      asked to remove ("fairy 变纯白"). The steady random tear stays;
//   7. the flicker circle carries `opacity="0"` as a presentation attribute, not
//      only as a CSS rule: the five <use> block clones copy that element, and a
//      CSS-only opacity never reached the clone shadow trees, so every clone
//      painted a full white disc. That was the actual white-out source.
//
// Everything else below the header is upstream code in upstream order. Do not
// "fix" the numbers: they are the measured Fairy-DSH values, and
// scripts/mascot_compare.mjs renders this file next to the upstream modules and
// pixel-diffs the two (minus the two removed effects, which the harness drops
// from the upstream page as well).
const FairyMascotPort = (() => {
  'use strict'

  const ROOT_ATTR = 'data-dsh-fairy-mascot-root'
  const MOTION_CYCLE_MS = 1440

  // --- mascot-geometry.js -----------------------------------------------------
  const MASCOT_GEOMETRY = Object.freeze({
    outerDiscRadius: 68,
    outerStrokeWidth: 1.2,
    outerHaloRadius: 79,
    scleraRadius: 48,
    scleraContactStrokeWidth: 0.8,
    scleraHaloRadius: 56,
    pupilRadius: 16,
    highlightCenter: Object.freeze({ x: 98, y: 100.5 }),
    highlightRadius: 11,
    highlightHaloRadius: 18,
  })

  const formatRatio = (value) => value.toFixed(3).replace(/^0/, '')

  const outerVisibleEdge = MASCOT_GEOMETRY.outerDiscRadius + MASCOT_GEOMETRY.outerStrokeWidth / 2
  const outerHaloPeak = outerVisibleEdge / MASCOT_GEOMETRY.outerHaloRadius
  const scleraHaloPeak = (MASCOT_GEOMETRY.scleraRadius + MASCOT_GEOMETRY.scleraContactStrokeWidth / 2) / MASCOT_GEOMETRY.scleraHaloRadius
  const highlightHaloPeak = MASCOT_GEOMETRY.highlightRadius / MASCOT_GEOMETRY.highlightHaloRadius

  // --- mascot-effects-svg.js --------------------------------------------------
  /* Build the halo as a few deterministic static paths instead of hundreds of SVG nodes. */
  function buildHaloLines() {
    const paths = new Map()
    for (let y = -34; y <= 194; y += 1) {
      const t = y + 34
      /* Independent slow waves keep left/right endpoints asymmetric but static. */
      const leftWave = (Math.sin(t * 0.082 - 1.1) + 0.55 * Math.sin(t * 0.151 + 2.4) + 1.55) / 3.1
      const rightWave = (Math.sin(t * 0.097 + 2.2) + 0.5 * Math.sin(t * 0.137 - 1.7) + 1.5) / 3
      const leftLength = 158 + leftWave * 56
      const rightLength = 158 + rightWave * 56
      const length = leftLength + rightLength
      const brightness = 0.50 + ((leftWave + rightWave) * .5) * 0.50
      const x = 80 - leftLength
      /* Four luminance buckets preserve the existing light falloff while allowing
       * the browser to rasterize the complete halo in only a handful of paths. */
      const bucket = Math.max(.5, Math.min(1, Math.round(brightness * 8) / 8))
      const key = bucket.toFixed(3)
      if (!paths.has(key)) paths.set(key, [])
      paths.get(key).push('M' + x.toFixed(2) + ' ' + (y + .25).toFixed(2) + 'h' + length.toFixed(2))
    }
    return Array.from(paths.entries()).map(function (entry) {
      return '<path d="' + entry[1].join('') + '" fill="none" stroke="currentColor" stroke-width=".62" stroke-linecap="butt" opacity="' + entry[0] + '"/>'
    }).join('')
  }
  const HALO_LINES = buildHaloLines()

  /* The expanding lash-pulse ring is intentionally NOT ported: the user asked for
   * it to be removed ("泛出涟漪"). Upstream ships it as PULSE_SVG plus the
   * dsh-fairy-lash-pulse keyframes; both are gone from this file. */

  /* Keep negative-x halo lines out of the body's 0..160 SVG viewport. Safari
   * clips overflow from that viewport even when CSS overflow is visible; this
   * independent user-space viewport preserves the original line coordinates. */
  function buildHaloSvg(id) {
    return `
<svg class="dsh-fairy-halo dsh-fairy-halo-layer" viewBox="-180 -70 520 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
	<defs>
		<radialGradient id="${id('halo-layer-fade')}" gradientUnits="userSpaceOnUse" color-interpolation="linearRGB" cx="80" cy="80" r="124">
			<stop offset="0" stop-color="black"/>
			<stop offset=".44" stop-color="black"/>
			<stop offset=".45" stop-color="white" stop-opacity=".08"/>
			<stop offset=".46" stop-color="white" stop-opacity=".30"/>
			<stop offset=".47" stop-color="white" stop-opacity=".65"/>
			<stop offset=".48" stop-color="white"/>
			<stop offset=".52" stop-color="white" stop-opacity=".72"/>
			<stop offset=".56" stop-color="white" stop-opacity=".56"/>
			<stop offset=".60" stop-color="white" stop-opacity=".44"/>
			<stop offset=".65" stop-color="white" stop-opacity=".30"/>
			<stop offset=".71" stop-color="white" stop-opacity=".19"/>
			<stop offset=".77" stop-color="white" stop-opacity=".135"/>
			<stop offset=".83" stop-color="white" stop-opacity=".09"/>
			<stop offset=".89" stop-color="white" stop-opacity=".058"/>
			<stop offset=".90" stop-color="white" stop-opacity=".052"/>
			<stop offset=".91" stop-color="white" stop-opacity=".046"/>
			<stop offset=".92" stop-color="white" stop-opacity=".039"/>
			<stop offset=".93" stop-color="white" stop-opacity=".032"/>
			<stop offset=".94" stop-color="white" stop-opacity=".025"/>
			<stop offset=".95" stop-color="white" stop-opacity=".019"/>
			<stop offset=".96" stop-color="white" stop-opacity=".013"/>
			<stop offset=".97" stop-color="white" stop-opacity=".0075"/>
			<stop offset=".98" stop-color="white" stop-opacity=".0035"/>
			<stop offset=".99" stop-color="white" stop-opacity=".001"/>
			<stop offset="1" stop-color="white" stop-opacity="0"/>
		</radialGradient>
		<mask id="${id('halo-layer-mask')}" mask-type="luminance" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-260" y="-120" width="680" height="440">
			<rect x="-260" y="-120" width="680" height="440" fill="url(#${id('halo-layer-fade')})"/>
		</mask>
	</defs>
	<g mask="url(#${id('halo-layer-mask')})" opacity=".99">${HALO_LINES}</g>
</svg>`
  }

  // --- mascot-eye-svg.js -----------------------------------------------------
  function buildEyeSvg(id) {
    return `
<svg class="dsh-fairy-main" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="presentation">
	<defs>
		<!-- Color, glow, scanline, and horizontal-only displacement resources. -->
		<linearGradient id="${id('outer-gradient')}" x1=".2" y1="0" x2=".8" y2="1">
			<stop stop-color="#4053f0"/>
			<stop offset=".54" stop-color="#3045dc"/>
			<stop offset="1" stop-color="#3d50c8"/>
		</linearGradient>
		<!-- One static radial field replaces separate halo strokes, avoiding alpha seams. -->
		<radialGradient id="${id('sclera-halo-gradient')}" gradientUnits="userSpaceOnUse" cx="80" cy="80" r="${MASCOT_GEOMETRY.scleraHaloRadius}" color-interpolation="linearRGB">
			<stop offset=".82" stop-color="#ffffff" stop-opacity="0"/>
			<stop offset="${formatRatio(scleraHaloPeak)}" stop-color="#ffffff" stop-opacity=".22"/>
			<stop offset=".875" stop-color="#ffffff" stop-opacity=".28"/>
			<stop offset=".89" stop-color="#ffffff" stop-opacity=".19"/>
			<stop offset=".91" stop-color="#ffffff" stop-opacity=".11"/>
			<stop offset=".94" stop-color="#ffffff" stop-opacity=".07"/>
			<stop offset=".96" stop-color="#ffffff" stop-opacity=".035"/>
			<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
		</radialGradient>
		<radialGradient id="${id('outer-halo-gradient')}" gradientUnits="userSpaceOnUse" cx="80" cy="80" r="${MASCOT_GEOMETRY.outerHaloRadius}" color-interpolation="linearRGB">
			<stop offset=".80" stop-color="var(--dsh-fairy-outer-halo-color)" stop-opacity="0"/>
			<stop offset=".84" stop-color="var(--dsh-fairy-outer-halo-color)" stop-opacity=".10"/>
			<stop offset="${formatRatio(outerHaloPeak)}" stop-color="var(--dsh-fairy-outer-halo-color)" stop-opacity=".28"/>
			<stop offset=".90" stop-color="var(--dsh-fairy-outer-halo-color)" stop-opacity=".18"/>
			<stop offset=".95" stop-color="var(--dsh-fairy-outer-halo-color)" stop-opacity=".06"/>
			<stop offset=".99" stop-color="var(--dsh-fairy-outer-halo-color)" stop-opacity=".02"/>
			<stop offset="1" stop-color="var(--dsh-fairy-outer-halo-color)" stop-opacity="0"/>
		</radialGradient>
		<radialGradient id="${id('highlight-halo-gradient')}" gradientUnits="userSpaceOnUse" cx="${MASCOT_GEOMETRY.highlightCenter.x}" cy="${MASCOT_GEOMETRY.highlightCenter.y}" r="${MASCOT_GEOMETRY.highlightHaloRadius}" color-interpolation="linearRGB">
			<stop offset=".53" stop-color="#f5f8fd" stop-opacity="0"/>
			<stop offset=".56" stop-color="#f5f8fd" stop-opacity=".16"/>
			<stop offset="${formatRatio(highlightHaloPeak)}" stop-color="#f5f8fd" stop-opacity=".43"/>
			<stop offset=".72" stop-color="#f5f8fd" stop-opacity=".19"/>
			<stop offset=".77" stop-color="#f5f8fd" stop-opacity=".12"/>
			<stop offset=".83" stop-color="#f5f8fd" stop-opacity=".055"/>
			<stop offset=".89" stop-color="#f5f8fd" stop-opacity=".02"/>
			<stop offset=".96" stop-color="#f5f8fd" stop-opacity=".004"/>
			<stop offset="1" stop-color="#f5f8fd" stop-opacity="0"/>
		</radialGradient>
		<pattern id="${id('lines')}" width="4" height="4" patternUnits="userSpaceOnUse">
			<!-- Keep the internal scanline texture present but quieter against the eye. -->
			<rect width="4" height="1" fill="#c9f8ff" opacity=".055"/>
		</pattern>
		<!-- Blue is forced to 0.5 so the displacement map moves pixels horizontally only. -->
		<filter id="${id('interference')}" x="-30%" y="0%" width="160%" height="100%" filterRes="96 72" color-interpolation-filters="sRGB">
			<feTurbulence id="${id('noise')}" type="fractalNoise" baseFrequency=".012 .72" numOctaves="1" seed="1" result="noise"/>
			<feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 0 0 .5  0 0 0 1 0" result="horizontal-noise"/>
			<feDisplacementMap id="${id('displace')}" in="SourceGraphic" in2="horizontal-noise" scale="5" xChannelSelector="R" yChannelSelector="B"/>
		</filter>
		<clipPath id="${id('disc-clip')}"><circle cx="80" cy="80" r="${MASCOT_GEOMETRY.outerDiscRadius - 1}"/></clipPath>
		<clipPath id="${id('thinking-eye-clip')}">
			<path class="dsh-fairy-thinking-clip-shape" d="M20 60 Q80 90 140 60 V160 H20 Z"/>
			<!-- This fixed lower region prevents curve scaling from clipping the lower eye. -->
			<rect x="0" y="108" width="160" height="52"/>
		</clipPath>
		<!-- A shallow reversed arc gives Fairy the gentle, slightly drooped brow. -->
		<clipPath id="${id('comforting-eye-clip')}">
			<path class="dsh-fairy-comforting-clip-shape" d="M20 60 Q80 30 140 60 V160 H20 Z"/>
			<rect x="0" y="108" width="160" height="52"/>
		</clipPath>
		<!-- These five rectangles are resized slightly for every block-glitch event. -->
		<clipPath id="${id('slice-1')}"><rect x="4" y="12" width="152" height="25"/></clipPath>
		<clipPath id="${id('slice-2')}"><rect x="4" y="37" width="152" height="28"/></clipPath>
		<clipPath id="${id('slice-3')}"><rect x="4" y="65" width="152" height="26"/></clipPath>
		<clipPath id="${id('slice-4')}"><rect x="4" y="91" width="152" height="30"/></clipPath>
		<clipPath id="${id('slice-5')}"><rect x="4" y="121" width="152" height="27"/></clipPath>
		</defs>

		<g class="dsh-fairy-body">
	<!-- Stable outer radial halo stays outside the fault signal so it is not
	     filtered or duplicated by the block-glitch clones. -->
		<circle class="dsh-fairy-outer-halo" cx="80" cy="80" r="${MASCOT_GEOMETRY.outerHaloRadius}" fill="url(#${id('outer-halo-gradient')})"/>
	<g class="dsh-fairy-signal" data-fault-source="true">
	<!-- The complete normal visual. Glitch modes filter or slice this entire group. -->
	<g id="${id('image')}" class="dsh-fairy-image">
		<circle class="dsh-fairy-outer-disc" cx="80" cy="80" r="${MASCOT_GEOMETRY.outerDiscRadius}" fill="url(#${id('outer-gradient')})" stroke="#f2fbff" stroke-width="${MASCOT_GEOMETRY.outerStrokeWidth}"/>
	<!-- Dark circle + square form the four rotating lashes / eyelids. -->
	<g class="dsh-fairy-corners" clip-path="url(#${id('disc-clip')})" fill="#2b3388">
		<!-- Slightly open the eye: reduce the lid ring without changing its silhouette. -->
		<circle cx="80" cy="80" r="51.75"/>
		<rect x="37" y="37" width="86" height="86" rx="2" transform="rotate(3 80 80)"/>
	</g>

	<!-- Eye anatomy: sclera, layered eyeball, pupil, then highlight. -->
	<g class="dsh-fairy-eye">
			<!-- One animated group keeps the vector rim pixel-locked to the sclera. -->
			<g class="dsh-fairy-sclera">
				<circle cx="80" cy="80" r="${MASCOT_GEOMETRY.scleraRadius}" fill="#eef0f5"/>
				<circle class="dsh-fairy-sclera-halo" cx="80" cy="80" r="${MASCOT_GEOMETRY.scleraHaloRadius}" fill="url(#${id('sclera-halo-gradient')})"/>
				<!-- A thin contact rim closes subpixel seams at the sclera/halo boundary. -->
				<circle class="dsh-fairy-sclera-contact" cx="80" cy="80" r="${MASCOT_GEOMETRY.scleraRadius}" fill="none" stroke="#ffffff" stroke-width="${MASCOT_GEOMETRY.scleraContactStrokeWidth}" stroke-opacity=".16"/>
			</g>
		<g class="dsh-fairy-eyeball">
			<circle class="dsh-fairy-layer-three" cx="80" cy="80" r="33" fill="#9daee0"/>
			<circle class="dsh-fairy-layer-two" cx="80" cy="80" r="24.15" fill="#eef0f5"/>
			<circle class="dsh-fairy-layer-two" cx="80" cy="80" r="23.5" fill="#317bcf"/>
			<circle class="dsh-fairy-layer-one" cx="80" cy="80" r="16.6" fill="none" stroke="#f5f8fd" stroke-width=".1"/>
			<circle class="dsh-fairy-layer-one" cx="80" cy="80" r="${MASCOT_GEOMETRY.pupilRadius}" fill="#3b3d8a"/>
				<g class="dsh-fairy-highlight dsh-fairy-layer-two">
					<circle class="dsh-fairy-highlight-halo" cx="${MASCOT_GEOMETRY.highlightCenter.x}" cy="${MASCOT_GEOMETRY.highlightCenter.y}" r="${MASCOT_GEOMETRY.highlightHaloRadius}" fill="url(#${id('highlight-halo-gradient')})"/>
					<circle class="dsh-fairy-highlight-glow" cx="${MASCOT_GEOMETRY.highlightCenter.x}" cy="${MASCOT_GEOMETRY.highlightCenter.y}" r="${MASCOT_GEOMETRY.highlightRadius}" fill="#f5f8fd"/>
			</g>
		</g>
	</g>
	<!-- Full-eye flicker layer stays outside the scaled eye group and is not part
	     of the fault clone source; it covers the disc and brows only.
	     opacity="0" is a presentation attribute, not just the CSS rule: the five
	     <use> block clones copy this element, and a CSS-only opacity did not reach
	     the clone shadow trees — every clone then painted a full white disc, which
	     is the "fairy turns pure white" flash this skin has to avoid. -->
	<circle class="dsh-fairy-eye-flicker" cx="80" cy="80" r="${outerVisibleEdge}" fill="#ffffff" opacity="0" pointer-events="none"/>

	<g clip-path="url(#${id('disc-clip')})" opacity=".42">
		<rect class="dsh-fairy-scanlines" x="12" y="10" width="136" height="146" fill="url(#${id('lines')})"/>
	</g>
	</g>
	<!-- Five complete-image clones clipped into horizontal blocks for left/right displacement. -->
	<g class="dsh-fairy-glitch-blocks">
		<use href="#${id('image')}" class="dsh-fairy-glitch-1" clip-path="url(#${id('slice-1')})"/>
		<use href="#${id('image')}" class="dsh-fairy-glitch-2" clip-path="url(#${id('slice-2')})"/>
		<use href="#${id('image')}" class="dsh-fairy-glitch-3" clip-path="url(#${id('slice-3')})"/>
		<use href="#${id('image')}" class="dsh-fairy-glitch-4" clip-path="url(#${id('slice-4')})"/>
		<use href="#${id('image')}" class="dsh-fairy-glitch-5" clip-path="url(#${id('slice-5')})"/>
	</g>
	</g>
	</g>
		</svg>`
  }

  function buildFloatMarkup(root, id) {
    root.setAttribute('aria-hidden', 'true')
    root.innerHTML = '<div class="dsh-fairy-float">' + buildHaloSvg(id) + buildEyeSvg(id) + '</div>'
  }

  // --- mascot-event-scheduler.js ---------------------------------------------
  /* Bounded one-shot scheduler: one live callback per logical animation task. */
  function createEventScheduler() {
    const tasks = new Map()
    const schedule = (name, callback, delay) => {
      const previous = tasks.get(name)
      if (previous) clearTimeout(previous.timer)
      const token = (previous?.token || 0) + 1
      const entry = { token, timer: null }
      entry.timer = setTimeout(() => {
        if (tasks.get(name) !== entry) return
        tasks.delete(name)
        callback()
      }, Math.max(0, Number(delay) || 0))
      tasks.set(name, entry)
      return entry.timer
    }
    const cancel = (name) => {
      const entry = tasks.get(name)
      if (!entry) return
      clearTimeout(entry.timer)
      tasks.delete(name)
    }
    return Object.freeze({
      schedule,
      cancel,
      cancelAll: () => [...tasks.keys()].forEach(cancel),
      has: (name) => tasks.has(name),
      activeCount: () => tasks.size,
    })
  }

  // --- mascot-motion-clock.js -------------------------------------------------
  /* One monotonic, normalized phase for every Fairy eye motion consumer. */
  function createMotionClock({ now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()), cycleMs = MOTION_CYCLE_MS, rate = 1 } = {}) {
    if (!Number.isFinite(cycleMs) || cycleMs <= 0) throw new Error('Invalid Fairy motion clock cycle')
    let epoch = now()
    let phase = 0
    let currentRate = Number.isFinite(rate) && rate > 0 ? rate : 1
    let paused = false
    let pausedAt = epoch
    const read = () => {
      if (paused) return phase
      const elapsed = Math.max(0, now() - epoch) * currentRate
      return ((phase + elapsed / cycleMs) % 1 + 1) % 1
    }
    return Object.freeze({
      phase: read,
      timeline: (nextCycleMs = cycleMs) => read() * nextCycleMs,
      rate: () => currentRate,
      setRate: (nextRate) => {
        const timestamp = now()
        phase = read()
        currentRate = Number.isFinite(nextRate) && nextRate > 0 ? nextRate : 1
        epoch = timestamp
        pausedAt = timestamp
      },
      pause: () => {
        if (paused) return
        pausedAt = now()
        phase = read()
        paused = true
      },
      resume: () => {
        if (!paused) return
        epoch = now()
        paused = false
      },
      reset: () => {
        epoch = now()
        phase = 0
        pausedAt = epoch
        paused = false
      },
      isPaused: () => paused,
      pausedAt: () => pausedAt,
    })
  }

  // --- mascot-style.js --------------------------------------------------------
  /* Upstream stylesheet. Changed for this skin: the root is sized by its wrapper
   * (`width/height: 100%` instead of `min(76%, 36vh, 450px)` and no 520 px media
   * query), the two light-theme colour overrides are dropped because this skin
   * has no light variant, and the two rules that name a per-instance clip path /
   * filter by id are written by the runtime as inline declarations instead. */
  const CSS = `
/* The host owns fixed positioning; this child fills the centered stage without intercepting input. */
[data-dsh-fairy-mascot-root="true"] {
	position: relative;
	width: 100%;
	height: 100%;
	aspect-ratio: 1;
	z-index: 99999;
	pointer-events: none;
	user-select: none;
	/* Keep the root as a non-composited overflow host. Safari clips transformed
	 * descendants to an ancestor's layout box when that ancestor owns opacity,
	 * isolation, or containment. Opacity is applied per visual SVG below. */
	overflow: visible;
}
[data-dsh-fairy-mascot-root="true"], [data-dsh-fairy-mascot-root="true"] * { box-sizing: border-box; }
[data-dsh-fairy-mascot-root="true"] { --dsh-fairy-outer-halo-color: #c9f8ff; }
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-halo { color: #c9efff; }
/* Low-power mode removes only the expensive decorative raster work. */
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-outer-disc,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-sclera,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-highlight-glow {
	filter: none;
}
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-outer-halo,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-sclera-halo,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-sclera-contact,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-highlight-halo {
	display: none;
}
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-halo {
	display: none;
}
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-corners,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-sclera,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-layer-three,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-layer-two,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-layer-one,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-thinking-clip-shape,
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-comforting-clip-shape {
	will-change: auto;
}
/* The source image remains legible while a regular glitch is active. */
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch] .dsh-fairy-outer-disc,
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch] .dsh-fairy-sclera,
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch] .dsh-fairy-highlight-glow {
	filter: none;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-float {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: visible;
}
[data-dsh-fairy-mascot-root="true"] svg {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-halo-layer {
	position: absolute;
	left: -112.5%;
	top: -43.75%;
	width: 325%;
	height: 200%;
	z-index: 0;
	pointer-events: none;
	opacity: .92;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-main {
	position: relative;
	z-index: 1;
	/* The main eye is the opaque boundary; the halo layer stays behind it. */
	opacity: 1;
}
/* The two glitch modes are mutually exclusive and selected by data-glitch. */
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal {
	transform-origin: 80px 80px;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch] {
	/* Two full-surface chromatic drop shadows were the most expensive transient
	 * part of a fault. The retained level shift plus displacement preserves the
	 * glitch expression without rasterizing the eye two additional times. */
	will-change: transform, filter;
	filter:
		brightness(var(--dsh-g-bright, 1.12))
		contrast(var(--dsh-g-contrast, 1.18));
	transform: translateX(var(--dsh-g-x, 0)) skewX(var(--dsh-g-skew, 0deg));
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-image {
	opacity: 1;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-glitch-blocks {
	opacity: 0;
	display: none;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch="blocks"] .dsh-fairy-glitch-blocks {
	opacity: 1;
	display: block;
}
/* Block clones contain their own lash animation; freeze all copies on one frame. */
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch="blocks"] .dsh-fairy-corners {
	animation: none !important;
	transform: rotate(var(--dsh-lash-angle, 0deg));
}
/* The five <use> slices inherit the eye's continuous animations. Pausing their
 * copies at the current frame keeps the same fractured image while avoiding five
 * extra pulse timelines and compositor layers for each short block fault. */
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch="blocks"] .dsh-fairy-glitch-blocks .dsh-fairy-sclera,
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch="blocks"] .dsh-fairy-glitch-blocks .dsh-fairy-layer-three,
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch="blocks"] .dsh-fairy-glitch-blocks .dsh-fairy-layer-two,
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal[data-glitch="blocks"] .dsh-fairy-glitch-blocks .dsh-fairy-layer-one {
	animation-play-state: paused !important;
	will-change: auto;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-glitch-1 { transform: translateX(var(--dsh-g-s1-x, 0)); }
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-glitch-2 { transform: translateX(var(--dsh-g-s2-x, 0)); }
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-glitch-3 { transform: translateX(var(--dsh-g-s3-x, 0)); }
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-glitch-4 { transform: translateX(var(--dsh-g-s4-x, 0)); }
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-glitch-5 { transform: translateX(var(--dsh-g-s5-x, 0)); }
/* Constant lash rotation plus staggered, continuous inside-to-outside eye breathing. */
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-corners {
	animation: dsh-fairy-lashes calc(15s / var(--dsh-fairy-steady-rate, 1)) linear infinite;
	animation-delay: var(--dsh-lash-delay, 0s);
	transform-origin: 80px 80px;
	will-change: transform;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-eye {
	transform: scale(.90);
	transform-origin: 80px 80px;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-eye-flicker {
	opacity: 0;
	animation: none;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-image[data-flicker="true"] ~ .dsh-fairy-eye-flicker,
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-image[data-flicker="true"] .dsh-fairy-eye-flicker {
	animation: dsh-fairy-eye-flicker-overlay var(--dsh-fairy-flicker-duration, 210ms) cubic-bezier(.32, 0, .68, 1) both;
	will-change: opacity;
}
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-eye {
	animation: none !important;
	filter: none !important;
}
[data-dsh-fairy-mascot-root="true"][data-low-power] .dsh-fairy-eye-flicker {
	display: none !important;
}
/* The thinking / comforting lids and the thread-tear filter name their clip path
 * and filter by id. Upstream CSS can spell those ids out because one stage owns
 * one SVG; here the runtime writes the same two declarations inline for the one
 * instance that owns them (see syncLid() / syncFaultFilter()). */
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-thinking-clip-shape {
	animation: dsh-fairy-thinking-clip calc(.72s / var(--dsh-fairy-steady-rate, 1)) cubic-bezier(.72, 0, .28, 1) 0s infinite alternate;
	animation-play-state: paused;
	transform-box: view-box;
	transform-origin: 80px 60px;
	will-change: auto;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-comforting-clip-shape {
	animation: dsh-fairy-comforting-clip calc(.72s / var(--dsh-fairy-steady-rate, 1)) cubic-bezier(.72, 0, .28, 1) 0s infinite alternate;
	animation-play-state: paused;
	transform-box: view-box;
	transform-origin: 80px 60px;
	will-change: auto;
}
/* The runtime disables these fallback timelines and evaluates the active eyelid
 * path from the mascot motion clock, keeping thinking/comfort on the same phase. */
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-sclera {
	animation: dsh-fairy-pulse-outer calc(.72s / var(--dsh-fairy-steady-rate, 1)) cubic-bezier(.72, 0, .28, 1) 0s infinite alternate;
	transform-box: view-box;
	transform-origin: 80px 80px;
	will-change: transform;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-layer-three {
	animation: dsh-fairy-pulse-three calc(.72s / var(--dsh-fairy-steady-rate, 1)) cubic-bezier(.72, 0, .28, 1) calc(-.045s / var(--dsh-fairy-steady-rate, 1)) infinite alternate;
	transform-origin: 80px 80px;
	will-change: transform;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-layer-two {
	animation: dsh-fairy-pulse-two calc(.72s / var(--dsh-fairy-steady-rate, 1)) cubic-bezier(.72, 0, .28, 1) calc(-.09s / var(--dsh-fairy-steady-rate, 1)) infinite alternate;
	transform-origin: 80px 80px;
	will-change: transform;
}
[data-dsh-fairy-mascot-root="true"] .dsh-fairy-layer-one {
	animation: dsh-fairy-pulse-inner calc(.72s / var(--dsh-fairy-steady-rate, 1)) cubic-bezier(.72, 0, .28, 1) calc(-.18s / var(--dsh-fairy-steady-rate, 1)) infinite alternate;
	transform-origin: 80px 80px;
	will-change: transform;
}
/* Visual lifecycle is owned by the host contract. Pausing the whole SVG freezes
 * every eye layer on its exact frame; resume realigns the active eyelid clip to
 * the retained sclera phase before scheduling faults again. */
[data-dsh-fairy-mascot-root="true"][data-visual-suspended],
[data-dsh-fairy-mascot-root="true"][data-visual-suspended] * {
	animation-play-state: paused !important;
	will-change: auto !important;
}
/* Scanline texture stays static; moving this full-size rect continuously causes
 * a needless SVG repaint without changing the state expression. */
/* Correct Fairy arc: the center of the upper lid pushes downward, not upward. */
@keyframes dsh-fairy-thinking-clip {
	from { transform: translateY(14.5px) scaleY(.55); }
	to { transform: translateY(15.5px); }
}
@keyframes dsh-fairy-comforting-clip {
	from { transform: translateY(-4px); }
	to { transform: translateY(4px); }
}
@keyframes dsh-fairy-lashes { to { transform: rotate(360deg); } }
@keyframes dsh-fairy-pulse-outer {
	/* Keep the fully expanded sclera just inside the lid edge so the ring
	 * never becomes visibly thinner than the calibrated resting thickness. */
	from { transform: scale(.985); }
	to { transform: scale(.91); }
}
@keyframes dsh-fairy-pulse-three {
	from { transform: scale(1); }
	to { transform: scale(.90); }
}
@keyframes dsh-fairy-pulse-two {
	from { transform: scale(1); }
	to { transform: scale(.87); }
}
@keyframes dsh-fairy-pulse-inner {
	from { transform: scale(1); }
	to { transform: scale(.85); }
}
@keyframes dsh-fairy-eye-flicker-overlay {
	0%, 100% { opacity: 0; }
	22% { opacity: var(--dsh-fairy-flicker-opacity-1, .04); }
	48% { opacity: var(--dsh-fairy-flicker-opacity-mid, .012); }
	72% { opacity: var(--dsh-fairy-flicker-opacity-2, .03); }
}
@media (prefers-reduced-motion: reduce) {
	[data-dsh-fairy-mascot-root="true"] *, [data-dsh-fairy-mascot-root="true"] *::before, [data-dsh-fairy-mascot-root="true"] *::after {
		animation: none !important;
	}
	[data-dsh-fairy-mascot-root="true"] .dsh-fairy-signal {
		opacity: 1 !important;
		filter: none !important;
		transform: none !important;
	}
	[data-dsh-fairy-mascot-root="true"] .dsh-fairy-image { opacity: 1 !important; }
	[data-dsh-fairy-mascot-root="true"] .dsh-fairy-glitch-blocks { opacity: 0 !important; }
}
`

  // --- shared drivers ---------------------------------------------------------
  /* Every live instance shares one RAF ticker, one reduced-motion query and one
   * set of document lifecycle listeners. Upstream runs a single stage, so this
   * is the only structural divergence: the per-frame work is byte-for-byte the
   * same renderMotionFrame() upstream commits. */
  let instanceSeq = 0
  const live = new Set()
  let ticker = 0
  let motionQuery = null
  let listenersBound = false

  const motionReduced = () => Boolean(motionQuery && motionQuery.matches)

  function renderAll() {
    ticker = 0
    let wanted = false
    live.forEach((instance) => {
      if (!instance.wantsMotion()) return
      instance.renderFrame()
      wanted = true
    })
    if (wanted) ticker = requestAnimationFrame(renderAll)
  }

  function kickTicker() {
    if (!live.size) return
    if (ticker) return
    let wanted = false
    live.forEach((instance) => { if (instance.wantsMotion()) wanted = true })
    if (wanted) ticker = requestAnimationFrame(renderAll)
  }

  function bindSharedListeners() {
    if (listenersBound) return
    listenersBound = true
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const onChange = () => {
        live.forEach((instance) => instance.onMotionPreferenceChange())
        kickTicker()
      }
      if (typeof motionQuery.addEventListener === 'function') motionQuery.addEventListener('change', onChange)
      else if (typeof motionQuery.addListener === 'function') motionQuery.addListener(onChange)
    }
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        live.forEach((instance) => instance.setDocumentVisible(document.visibilityState !== 'hidden'))
      })
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pagehide', () => live.forEach((instance) => instance.setDocumentVisible(false)))
      window.addEventListener('pageshow', () => live.forEach((instance) => instance.setDocumentVisible(document.visibilityState !== 'hidden')))
      /* Upstream's steady-animation cadence control. This skin has no slider yet,
       * but an external control can still drive every eye. */
      window.addEventListener('dsh-fairy-mascot-animation-speed', (event) => {
        live.forEach((instance) => instance.setRate(event?.detail?.rate))
      })
    }
  }

  // --- mascot-runtime.js ------------------------------------------------------
  const FAULT_TIMING = Object.freeze({
    threads: Object.freeze({ pulses: 4, gapMin: 30, gapMax: 42, fadeMin: 34, fadeMax: 76 }),
    blocks: Object.freeze({ gapMin: 56, gapMax: 104, fadeMin: 48, fadeMax: 96 }),
  })

  function randomBetween(min, max) {
    return min + Math.random() * (max - min)
  }

  class MascotInstance {
    constructor(root, options = {}) {
      if (!root || typeof root.innerHTML !== 'string') throw new Error('FairyMascot: an element root is required')
      this.root = root
      this.closed = false
      this.animationRate = 1
      this.appliedState = null
      this.visualActive = options.active !== false
      this.documentVisible = true
      this.scheduler = createEventScheduler()
      this.clock = createMotionClock()
      this.glitchToken = 0
      this.flickerToken = 0
      this.lastGlitchMode = Math.random() < .5 ? 'threads' : 'blocks'
      this.prefix = 'fairy-m' + (++instanceSeq)
      this.id = (name) => this.prefix + '-' + name
      this.nodes = {}

      bindSharedListeners()
      buildFloatMarkup(root, this.id)
      root.setAttribute(ROOT_ATTR, 'true')
      this.cacheVisualNodes()
      this.setRate(options.rate)
      this.setState(options.state || 'normal')
      if (options.lowPower === true) this.setLowPower(true)
      live.add(this)
      this.syncSuspension()
      kickTicker()
    }

    /* Cache the small, fixed SVG surface once per mount. Fault pulses can then
     * update attributes directly without repeating selector walks. */
    cacheVisualNodes() {
      const root = this.root
      const pick = (selector) => root.querySelector(selector)
      this.nodes = {
        signal: pick('.dsh-fairy-signal'),
        sclera: pick('.dsh-fairy-sclera'),
        eye: pick('.dsh-fairy-eye'),
        image: pick('.dsh-fairy-image'),
        thinkingClipShape: pick('.dsh-fairy-thinking-clip-shape'),
        comfortingClipShape: pick('.dsh-fairy-comforting-clip-shape'),
        noise: pick('#' + this.id('noise')),
        displacement: pick('#' + this.id('displace')),
        blockSliceRects: Array.from(root.querySelectorAll('[id^="' + this.prefix + '-slice-"] rect')),
        layerThree: Array.from(root.querySelectorAll('.dsh-fairy-layer-three')),
        layerTwo: Array.from(root.querySelectorAll('.dsh-fairy-layer-two')),
        layerOne: Array.from(root.querySelectorAll('.dsh-fairy-layer-one')),
      }
      /* The browser must not create a second playback clock for any continuously
       * breathing layer. Their transforms are committed by renderFrame(). */
      const breathing = [this.nodes.sclera, ...this.nodes.layerThree, ...this.nodes.layerTwo, ...this.nodes.layerOne]
      breathing.forEach((element) => { if (element) element.style.animation = 'none' })
      ;[this.nodes.thinkingClipShape, this.nodes.comfortingClipShape].forEach((element) => {
        if (element) element.style.animation = 'none'
      })
    }

    wantsMotion() {
      return !this.closed && this.visualActive && this.documentVisible && !motionReduced()
    }

    idle() {
      return this.closed || !this.visualActive || !this.documentVisible
    }

    /* One normalized phase is the only animation state owned by JavaScript. */
    currentEyeMotionPhase() { return this.clock.phase() }

    /* The concentric eye layers must never own separate browser timelines. The
     * renderer evaluates the original cubic-bezier keyframes from one normalized
     * phase and commits every transform in the same animation frame. */
    easeEyePhase(value) {
      const x = Math.max(0, Math.min(1, value))
      let low = 0
      let high = 1
      for (let i = 0; i < 12; i += 1) {
        const t = (low + high) / 2
        const xValue = 3 * (1 - t) * (1 - t) * t * .72 + 3 * (1 - t) * t * t * .28 + t * t * t
        if (xValue < x) low = t
        else high = t
      }
      const t = (low + high) / 2
      return 3 * (1 - t) * t * t + t * t * t
    }

    readEyeProgress(phase) {
      const cyclePhase = ((phase % 1) + 1) % 1
      return this.easeEyePhase(cyclePhase <= .5 ? cyclePhase * 2 : 2 - cyclePhase * 2)
    }

    renderFrame() {
      const root = this.root
      if (!root || this.closed) return
      const nodes = this.nodes
      const phase = this.currentEyeMotionPhase()
      const targets = (value) => (Array.isArray(value) ? value : value ? [value] : [])
      const layers = [
        [nodes.sclera, .985, .91, 0],
        [nodes.layerThree, 1, .90, 45],
        [nodes.layerTwo, 1, .87, 90],
        [nodes.layerOne, 1, .85, 180],
      ]
      layers.forEach(([elements, from, to, leadMs]) => {
        const list = targets(elements)
        if (!list.length) return
        const progress = this.readEyeProgress(phase + leadMs / MOTION_CYCLE_MS)
        const transform = 'scale(' + (from + (to - from) * progress).toFixed(6) + ')'
        list.forEach((element) => { element.style.transform = transform })
      })
      const state = this.appliedState
      const clip = state === 'thinking' ? nodes.thinkingClipShape : state === 'comforting' ? nodes.comfortingClipShape : null
      ;[nodes.thinkingClipShape, nodes.comfortingClipShape].forEach((element) => {
        if (element && element !== clip) element.style.transform = ''
      })
      if (clip) {
        const clipProgress = this.readEyeProgress(phase)
        clip.style.willChange = 'transform'
        clip.style.transform = state === 'thinking'
          ? 'translateY(' + (14.5 + clipProgress).toFixed(6) + 'px) scaleY(' + (.55 + .45 * clipProgress).toFixed(6) + ')'
          : 'translateY(' + (-4 + 8 * clipProgress).toFixed(6) + 'px)'
      }
    }

    /* Build five mildly uneven blocks. Weights are constrained to avoid extreme sizes. */
    setBlockLayout() {
      const weights = []
      let weightTotal = 0
      for (let i = 0; i < 5; i += 1) {
        const weight = randomBetween(.9, 1.1)
        weights.push(weight)
        weightTotal += weight
      }
      let y = 12
      for (let i = 0; i < 5; i += 1) {
        const rect = this.nodes.blockSliceRects[i] || this.root.querySelector('#' + this.id('slice-' + (i + 1)) + ' rect')
        if (!rect) continue
        const height = i === 4 ? 148 - y : 136 * weights[i] / weightTotal
        rect.setAttribute('y', y.toFixed(1))
        rect.setAttribute('height', height.toFixed(1))
        y += height
      }
    }

    /* Removing the attribute restores the untouched normal visual immediately. */
    clearGlitchVisual() {
      const signal = this.nodes.signal || this.root.querySelector('.dsh-fairy-signal')
      if (!signal) return
      signal.removeAttribute('data-glitch')
      ;['--dsh-g-x', '--dsh-g-skew', '--dsh-g-bright', '--dsh-g-contrast', '--dsh-g-s1-x', '--dsh-g-s2-x', '--dsh-g-s3-x', '--dsh-g-s4-x', '--dsh-g-s5-x'].forEach((name) => {
        signal.style.removeProperty(name)
      })
      this.syncFaultFilter()
    }

    /* Upstream gates the thread tear on `.dsh-fairy-signal[data-glitch="threads"]`
     * (and, for its removed transition burst, on `data-transition-glitch`), naming
     * one document-wide filter id in CSS. Here each eye owns its own filter, so the
     * same condition commits the same declaration inline. */
    syncFaultFilter() {
      const image = this.nodes.image || (this.root && this.root.querySelector('.dsh-fairy-image'))
      const signal = this.nodes.signal || (this.root && this.root.querySelector('.dsh-fairy-signal'))
      if (!image || !this.root) return
      const torn = Boolean(signal && signal.getAttribute('data-glitch') === 'threads')
      if (torn) image.style.filter = 'url(#' + this.id('interference') + ')'
      else image.style.removeProperty('filter')
    }

    /* Upstream clips the eye through `[data-state="thinking"|"comforting"]` rules
     * that spell the clip-path id out in CSS; per-instance ids need the same
     * declaration written by the instance that owns the path. */
    syncLid(state) {
      const eye = this.nodes.eye || (this.root && this.root.querySelector('.dsh-fairy-eye'))
      if (!eye) return
      if (state === 'thinking') eye.style.clipPath = 'url(#' + this.id('thinking-eye-clip') + ')'
      else if (state === 'comforting') eye.style.clipPath = 'url(#' + this.id('comforting-eye-clip') + ')'
      else eye.style.removeProperty('clip-path')
    }

    stopEyeFlicker() {
      this.flickerToken += 1
      this.scheduler.cancel('flicker')
      const image = this.nodes.image
      if (image) {
        image.removeAttribute('data-flicker')
        ;['--dsh-fairy-flicker-duration', '--dsh-fairy-flicker-opacity-1', '--dsh-fairy-flicker-opacity-mid', '--dsh-fairy-flicker-opacity-2'].forEach((name) => image.style.removeProperty(name))
      }
    }

    scheduleEyeFlicker() {
      if (this.closed || this.scheduler.has('flicker') || !this.root || this.appliedState !== 'normal' || this.root.hasAttribute('data-low-power') || !this.wantsMotion()) return
      const token = this.flickerToken
      this.scheduler.schedule('flicker', () => {
        if (this.closed || token !== this.flickerToken || this.appliedState !== 'normal' || this.root.hasAttribute('data-low-power') || !this.wantsMotion()) return
        const image = this.nodes.image || this.root.querySelector('.dsh-fairy-image')
        if (!image) return
        const duration = randomBetween(155, 255)
        image.style.setProperty('--dsh-fairy-flicker-duration', duration.toFixed(0) + 'ms')
        image.style.setProperty('--dsh-fairy-flicker-opacity-1', randomBetween(.026, .048).toFixed(3))
        image.style.setProperty('--dsh-fairy-flicker-opacity-mid', randomBetween(.006, .016).toFixed(3))
        image.style.setProperty('--dsh-fairy-flicker-opacity-2', randomBetween(.018, .040).toFixed(3))
        image.setAttribute('data-flicker', 'true')
        this.scheduler.schedule('flicker', () => {
          if (image) image.removeAttribute('data-flicker')
          if (token === this.flickerToken) this.scheduleEyeFlicker()
        }, duration)
      }, randomBetween(1750, 3600) / this.animationRate)
    }

    /*
     * SVG <use> block clones can advance their nested CSS animations on
     * slightly different timelines. Capture one angle before exposing the
     * clones, then share its phase so every lash copy is identical.
     */
    lockLashFrame(signal) {
      const corners = signal && signal.querySelector('.dsh-fairy-image .dsh-fairy-corners')
      if (!signal || !corners) return
      const transform = window.getComputedStyle(corners).transform
      let angle = 0
      const match = transform && transform.match(/^matrix\(([^)]+)\)$/)
      if (match) {
        const values = match[1].split(',')
        const a = parseFloat(values[0])
        const b = parseFloat(values[1])
        if (Number.isFinite(a) && Number.isFinite(b)) angle = Math.atan2(b, a) * 180 / Math.PI
      }
      const normalized = (angle + 360) % 360
      signal.style.setProperty('--dsh-lash-angle', normalized.toFixed(3) + 'deg')
      signal.style.setProperty('--dsh-lash-delay', (-normalized / 360 * 15).toFixed(4) + 's')
    }

    /*
     * Generate one short randomized pulse.
     * threads: vertically varying noise displaces pixels only along the horizontal axis.
     * blocks: five adjacent clips move left/right with alternating polarity.
     * Upstream also had an `isTransition` variant with roughly twice the amplitude
     * for state changes; that burst was removed on request ("fairy 变纯白"), so
     * every fault any instance emits now uses the steady-state values only.
     */
    setGlitchPulse(signal, mode) {
      const style = signal.style
      style.setProperty('--dsh-g-x', randomBetween(-.9, .9).toFixed(2) + 'px')
      style.setProperty('--dsh-g-skew', randomBetween(-.24, .24).toFixed(2) + 'deg')
      style.setProperty('--dsh-g-bright', randomBetween(1.02, 1.14).toFixed(2))
      style.setProperty('--dsh-g-contrast', randomBetween(1.02, 1.16).toFixed(2))

      const noise = this.nodes.noise
      const displacement = this.nodes.displacement
      if (mode === 'threads') {
        /* Turbulence generation is the costliest fault primitive. A short burst
         * already jitters via the signal variables above, so generate one noise field
         * at its first frame and reuse it for the remaining pulses. */
        const beginsThreadBurst = signal.getAttribute('data-glitch') !== 'threads'
        if (beginsThreadBurst && noise) {
          noise.setAttribute('seed', String(Math.floor(randomBetween(1, 999))))
          noise.setAttribute('baseFrequency', randomBetween(.004, .011).toFixed(3) + ' ' + randomBetween(.65, 1).toFixed(2))
        }
        if (beginsThreadBurst && displacement) displacement.setAttribute('scale', randomBetween(17, 29).toFixed(1))
      } else {
        /* Lock the rotating lashes once per block event; rewriting the delay on
         * every short pulse would restart the CSS animation timeline. */
        if (!signal.hasAttribute('data-glitch')) this.lockLashFrame(signal)
        const slicePolarity = Math.random() < .5 ? -1 : 1
        const sliceStrength = randomBetween(1.4, 3)
        for (let i = 1; i <= 5; i += 1) {
          const direction = i % 2 === 0 ? slicePolarity : -slicePolarity
          const offset = direction * (sliceStrength + randomBetween(-.35, .35))
          style.setProperty('--dsh-g-s' + i + '-x', offset.toFixed(2) + 'px')
        }
      }
      signal.setAttribute('data-glitch', mode)
      this.syncFaultFilter()
    }

    /* Upstream played a two-burst fault on every expression change (a short
     * threaded tear, then a longer blocks-and-threads burst). That burst is the
     * "Fairy turns pure white" flash the user asked to delete, so a state change
     * now only commits the new lid and re-arms the steady-state schedulers. */

    /* Schedule the next event after 2.3-4.6 seconds, then emit several short pulses. */
    armGlitchTimer(callback, delay) {
      return this.scheduler.schedule('glitch', callback, delay)
    }

    scheduleGlitch() {
      if (this.closed || this.scheduler.has('glitch') || !this.root || !this.wantsMotion()) return
      const token = this.glitchToken
      this.armGlitchTimer(() => {
        if (this.closed || token !== this.glitchToken || !this.wantsMotion()) return
        const signal = this.nodes.signal || this.root.querySelector('.dsh-fairy-signal')
        if (!signal) return
        const mode = this.lastGlitchMode === 'threads' ? 'blocks' : 'threads'
        this.lastGlitchMode = mode
        if (mode === 'blocks') this.setBlockLayout()
        /* Threads remain brief. Each block event doubles its original 1-2 pulse window. */
        const pulseCount = mode === 'threads' ? FAULT_TIMING.threads.pulses : 2 * (1 + Math.floor(Math.random() * 2))
        let pulseIndex = 0

        const pulse = () => {
          if (this.closed || token !== this.glitchToken || !this.wantsMotion()) return
          this.setGlitchPulse(signal, mode)
          pulseIndex += 1
          if (pulseIndex < pulseCount) {
            const timing = FAULT_TIMING[mode]
            this.armGlitchTimer(pulse, randomBetween(timing.gapMin, timing.gapMax))
          } else {
            this.armGlitchTimer(() => {
              if (this.closed || token !== this.glitchToken) return
              this.clearGlitchVisual()
              this.scheduleGlitch()
            }, mode === 'threads' ? randomBetween(FAULT_TIMING.threads.fadeMin, FAULT_TIMING.threads.fadeMax) : randomBetween(FAULT_TIMING.blocks.fadeMin, FAULT_TIMING.blocks.fadeMax))
          }
        }

        pulse()
      }, randomBetween(2300, 4600) / this.animationRate)
    }

    /* Invalidating the token also cancels callbacks already queued by an older event. */
    stopGlitch() {
      this.glitchToken += 1
      this.scheduler.cancel('glitch')
      this.clearGlitchVisual()
      this.stopEyeFlicker()
    }

    ensureGlitchScheduler() {
      if (this.closed) return
      if (!this.wantsMotion()) {
        this.synchronizeActiveClipPhase('normal')
        return
      }
      this.scheduleGlitch()
      this.scheduleEyeFlicker()
    }

    onMotionPreferenceChange() {
      if (this.closed) return
      if (motionReduced()) {
        this.stopGlitch()
        this.synchronizeActiveClipPhase('normal')
      } else {
        this.synchronizeActiveClipPhase(this.appliedState || 'normal')
        this.ensureGlitchScheduler()
      }
    }

    setRate(nextRate) {
      const numericRate = typeof nextRate === 'string' ? Number(nextRate) : nextRate
      const rate = numericRate === .7 || numericRate === 1.5 ? numericRate : 1
      const changed = rate !== this.animationRate
      if (changed) this.clock.setRate(rate)
      this.animationRate = rate
      if (!this.root) return
      this.root.setAttribute('data-dsh-fairy-animation-rate', String(rate))
      this.root.style.setProperty('--dsh-fairy-steady-rate', String(rate))
      if (changed) {
        this.renderFrame()
        /* Thinking/comfort clips are independent CSS animations and must be
         * re-anchored at the same boundary as the eye layers. */
        this.synchronizeActiveClipPhase(this.appliedState || 'normal')
      }
      /* A rate change is a new cadence boundary. Do not leave already queued
       * glitch/flicker timers running on the old cadence. */
      if (changed && this.root && !this.idle()) {
        this.stopGlitch()
        if (this.appliedState === 'normal') {
          this.scheduleGlitch()
          this.scheduleEyeFlicker()
        }
      }
    }

    /* Commits the visual state. Repeated notifications are ignored; a real change
     * re-seats the lid and re-arms the steady schedulers — no fault burst (that
     * transition effect was removed on request). */
    setState(nextState) {
      if (this.closed || !this.root) return
      const normalized = nextState === 'comforting' ? 'comforting' : nextState === 'thinking' ? 'thinking' : 'normal'
      if (this.appliedState === normalized) {
        if (!this.idle()) this.ensureGlitchScheduler()
        return
      }
      this.root.setAttribute('data-state', normalized)
      this.appliedState = normalized
      this.syncLid(normalized)
      if (this.idle()) {
        this.renderFrame()
        return
      }
      this.synchronizeActiveClipPhase(normalized)
      this.ensureGlitchScheduler()
      kickTicker()
    }

    synchronizeActiveClipPhase(nextState) {
      if (!this.root) return
      /* All continuous layers and the active clip are rendered from the same phase. */
      this.renderFrame()
      this.pauseClipAnimation(this.nodes.thinkingClipShape)
      this.pauseClipAnimation(this.nodes.comfortingClipShape)
      if (nextState !== 'normal' && !motionReduced()) this.renderFrame()
    }

    pauseClipAnimation(shape) {
      if (!shape) return
      /* Freeze the inactive path before assigning the next master-clock frame. */
      shape.style.animationDelay = '0s'
      shape.style.animationPlayState = 'paused'
      shape.style.willChange = 'auto'
    }

    setLowPower(enabled) {
      if (!this.root) return
      if (enabled) this.root.setAttribute('data-low-power', '')
      else this.root.removeAttribute('data-low-power')
    }

    setDocumentVisible(visible) {
      const next = visible !== false
      if (this.documentVisible === next) return
      this.documentVisible = next
      this.syncSuspension()
    }

    setVisualActive(active) {
      const next = active !== false
      if (this.visualActive === next) return
      this.visualActive = next
      this.syncSuspension()
    }

    /* A suspended eye freezes every CSS animation and the JS clock on the same
     * frame; the resume path realigns the active eyelid clip before scheduling
     * faults again, exactly like upstream's stage lifecycle. */
    syncSuspension() {
      if (this.closed || !this.root) return
      if (this.idle()) {
        this.clock.pause()
        this.stopGlitch()
        this.root.setAttribute('data-visual-suspended', 'true')
        return
      }
      this.clock.resume()
      this.root.removeAttribute('data-visual-suspended')
      this.synchronizeActiveClipPhase(this.appliedState || 'normal')
      this.ensureGlitchScheduler()
      kickTicker()
    }

    dispose() {
      if (this.closed) return
      this.closed = true
      this.glitchToken += 1
      this.flickerToken += 1
      this.scheduler.cancelAll()
      this.clock.pause()
      live.delete(this)
      this.root?.removeAttribute('data-visual-suspended')
      this.root?.removeAttribute('data-state')
      this.root?.removeAttribute(ROOT_ATTR)
      this.root?.removeAttribute('data-dsh-fairy-animation-rate')
      if (this.root) this.root.innerHTML = ''
      this.nodes = {}
    }
  }

  function createInstance(root, options) {
    return new MascotInstance(root, options)
  }

  return Object.freeze({
    ROOT_ATTR,
    MOTION_CYCLE_MS,
    CSS,
    GEOMETRY: MASCOT_GEOMETRY,
    FAULT_TIMING,
    createInstance,
    createEventScheduler,
    createMotionClock,
    buildEyeSvg,
    buildHaloSvg,
    buildFloatMarkup,
    formatRatio,
    /* test seam: the number of mounted eyes */
    liveCount: () => live.size,
  })
})()
