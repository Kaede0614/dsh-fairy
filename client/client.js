// dsh-fairy / client half — Fairy's H.D.D. skin, ZZZ cut.
//
// The skin reproduces the two visual systems that surround Fairy in the game:
//
//   1. the H.D.D. panel — a deep-navy screen with a huge blue eye in it, a name
//      chip in the corner and a cold glow all around (see 素材/Fairy视频素材/clips:
//      the contract scene and every later H.D.D. cut);
//   2. New Eridu's street graphics — hard black plates, a condensed bold
//      letter-spaced face, halftone dots, scanlines and one warning yellow used
//      as a tape, not as a theme colour. (0.10.1 dropped the film-strip bands:
//      they ate the window's top and bottom edges and the user vetoed them.)
//
// What that means in the shell:
//   - palette: near-black navy + H.D.D. blue + cyan, plus 警告黄 #FFD52E only for
//     framing marks, the nameplate tick and the tape; stacked as an override
//     layer so the user's light/dark preference does not un-skin the app;
//   - stage: halftone, a blue bloom where the H.D.D. screen light would fall,
//     scanlines, vignette, registration marks;
//   - the eye (大眼珠子) is Fairy-DSH's own mascot (0.16.0;
//     `client/fairy-mascot.port.js`, spliced in below), two seats —
//       sidebar brand mark (26 px) · the big 232 px eye pinned in the conversation
//       column's bottom-left corner. 0.17.0 gave the blank session no seat of its
//       own: it borrows that corner eye, doubled and pinned to the middle of the
//       screen, and quiets the shell's centered hero chrome so the blank page
//       keeps the conversation frame instead of a hero layout (see HeroQuiet).
//       0.18.0 removed the third seat, the 20 px eye that lived in the rail;
//     each seat owns one instance of the ported runtime: the rotating lashes,
//     the four staggered iris layers on one 1440 ms clock, the random horizontal
//     tear, the flicker, and the thinking / comforting lids. The two upstream
//     effects this skin deliberately drops are the expanding lash-pulse ring
//     (涟漪) and the state-change fault burst (which used to blank the eye white);
//   - furniture: FAIRY nameplate with a yellow tick, and the skewed H.D.D. tape at
//     the sidebar foot. The dialogue-bar rail that used to sit above the composer
//     is gone (0.18.0, user: 「删除会话中，输入框上面这个东西」): its ONLY survivor is
//     the VOICE switch, now a corner fixture in the page's bottom-right.
//
// History that still matters: 0.8.x drew the eye (rejected four times), 0.9.0
// inlined the footage (rejected on placement), 0.9.1 deleted the eye and kept the
// nameplate fix (`priority: -1` on a single slot) and the token override layer.
// 0.10.0 brought the footage back with the panel context this time — an eye inside
// an H.D.D. frame, not a mascot floating over a corner. 0.10.1 removed the two
// film-strip bands the same user vetoed a day later. 0.13.0–0.15.0 cycled through
// a vector rethink and a Fairy-DSH-styled CSS imitation; 0.16.0 replaced all of it
// with the upstream mascot itself.
window.__ModuleLoader__.load({
  id: 'dsh-fairy',
  factory(require) {
    const React = require('react')
    // 0.18.0: the voice switch leaves the composer's flow. A portal onto <body>
    // is what lets it be a fixture of the window's bottom-right corner instead of
    // a child of the composer card (see VoiceCorner). `react-dom` is part of the
    // browser module table; the guarded require keeps the chip alive in hosts
    // (and the sample scripts) that do not expose it.
    const ReactDOM = (() => {
      try {
        return require('react-dom')
      } catch (error) {
        return null
      }
    })()
    const h = React.createElement

    const THEME_ID = 'zzz-hdd'
    const PIN_KEY = 'dsh-fairy.themePinned.v2'

    // >>> fairy-mascot-port
    // Generated from client/fairy-mascot.port.js by scripts/mascot_port_splice.mjs.
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
    // <<< fairy-mascot-port

    // --- palette: H.D.D. navy + New Eridu yellow ---------------------------
    // Applied by the layout ThemePresenter as inline CSS variables on <body>.
    const WARN = '#FFD52E'
    const TOKENS = {
      '--dsw-alias-bg-base': '#05070F',
      '--dsw-alias-bg-layer-1': '#080D1C',
      '--dsw-alias-bg-layer-2': '#0B1430',
      '--dsw-alias-bg-layer-3': '#101B3C',
      '--dsw-alias-bg-layer-4': '#142147',
      '--dsw-alias-bg-overlay': '#090F22',
      '--dsw-alias-bg-module-platform': '#060A15',
      '--dsw-alias-bg-multi-select': '#132045',
      '--dsw-alias-bg-skeleton': 'rgba(120,160,255,0.08)',
      '--dsw-alias-bg-document-preview': '#080D1C',
      '--dsw-alias-bg-mask-1': 'rgba(2,4,10,0.58)',
      '--dsw-alias-bg-mask-2': 'rgba(2,4,10,0.34)',
      '--dsw-alias-bg-mask-3': 'rgba(2,4,10,0.80)',
      '--dsw-alias-bg-mask-drop': 'rgba(5,7,15,0.80)',
      '--dsw-alias-bg-mask-photo': 'rgba(2,4,10,0.92)',
      '--dsw-specific-sidebar-fill': '#04060C',
      '--dsw-specific-menu': '#090F22',
      '--dsw-specific-selector': '#0B1430',
      '--dsw-specific-input-major': '#080E1F',
      '--dsw-specific-login-input': '#080E1F',
      '--dsw-specific-tip': '#090F22',
      '--dsw-specific-bubble': '#0A1226',
      '--dsw-specific-bubble-highlight': 'rgba(47,107,255,0.18)',
      '--dsw-specific-sidebar-nav-item-hover': 'rgba(127,212,255,0.07)',
      '--dsw-specific-sidebar-nav-item-active': 'rgba(47,107,255,0.20)',
      '--dsw-specific-sidebar-nav-item-active-accent': '#FFD52E',

      '--dsw-alias-border-l1': '#131C36',
      '--dsw-alias-border-l2': '#1B2748',
      '--dsw-alias-border-l2-darkmode-thin': '#131C36',
      '--dsw-alias-border-l3': '#26355C',
      '--dsw-alias-border-l4': '#33457A',
      '--dsw-alias-border-inverted': 'rgba(0,0,0,0.58)',
      '--dsw-alias-border-inverted2': 'rgba(0,0,0,0.36)',

      '--dsw-alias-label-primary': '#F2F3F5',
      '--dsw-alias-label-primary-bluish': '#F7FAFF',
      '--dsw-alias-label-primary-dimmed': '#B9C6DE',
      '--dsw-alias-label-primary-foreground': '#04060B',
      '--dsw-alias-label-primary-inverted': '#04060B',
      '--dsw-alias-label-secondary': '#AEBBD4',
      '--dsw-alias-label-tertiary': '#7E8FB0',
      '--dsw-alias-label-dimmed': '#5B6A8C',
      '--dsw-alias-label-caption': '#8FA1C8',
      '--dsw-alias-label-error': '#FF5C7A',
      '--dsw-alias-menu-icon': '#AEBBD4',
      '--dsw-alias-link': '#8FD0FF',

      '--dsw-alias-brand-primary': '#2F6BFF',
      '--dsw-alias-brand-primary-invert': '#04060B',
      '--dsw-alias-brand-text': '#8FD0FF',
      '--dsw-alias-state-business-primary': '#2F6BFF',
      '--dsw-focus-ring-color': WARN,

      '--dsw-alias-interactive-bg-hover': 'rgba(47,107,255,0.14)',
      '--dsw-alias-interactive-bg-active': 'rgba(47,107,255,0.22)',
      '--dsw-alias-interactive-bg-hover-accent': 'rgba(127,212,255,0.18)',
      '--dsw-alias-interactive-bg-hover-danger': 'rgba(255,92,122,0.14)',
      '--dsw-alias-interactive-bg-hover-solid': '#16234A',
      // New Eridu's one loud accent: the primary action is warning yellow with
      // ink on top, the way the game paints its commit buttons.
      '--dsw-alias-button-primary-fill': WARN,
      '--dsw-alias-button-primary-hover': '#FFE05C',
      '--dsw-alias-button-primary-dimmed': 'rgba(255,213,46,0.42)',
      '--dsw-alias-button-contrast-fill': '#1E2C54',
      '--dsw-alias-button-elevated-fill': '#0B1430',
      '--dsw-alias-button-floating-fill': '#0B1430',
      '--dsw-alias-button-floating-hover': '#142147',
      '--dsw-alias-button-info-fill': '#0D213E',
      '--dsw-alias-button-info-hover': '#123253',
      '--dsw-alias-button-ghost-active-fill': 'rgba(127,212,255,0.14)',
      '--dsw-alias-button-ghost-active-border': 'rgba(127,212,255,0.5)',
      '--dsw-alias-button-ghost-active-hover': 'rgba(127,212,255,0.22)',
      '--dsw-alias-button-tool-bar-fill': '#0B1430',
      '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
      '--dsw-alias-button-tool-bar-hover': 'rgba(47,107,255,0.16)',

      '--dsw-alias-state-success-primary': '#4FE3A1',
      '--dsw-alias-state-success-secondary': '#35B882',
      '--dsw-alias-state-success-tertiary': 'rgba(79,227,161,0.18)',
      '--dsw-alias-state-warn-primary': WARN,
      '--dsw-alias-state-warn-secondary': '#C9A61B',
      '--dsw-alias-state-warn-tertiary': 'rgba(255,213,46,0.16)',
      '--dsw-alias-state-warn-label': '#FFE58A',
      '--dsw-alias-state-error-primary': '#FF5C7A',
      '--dsw-alias-state-error-secondary': '#C93A58',
      '--dsw-alias-state-idle-primary': '#6A7CA6',

      '--dsw-alias-markdown-code-block': '#04060B',
      '--dsw-alias-markdown-code-block-banner': '#080E1F',
      '--dsw-alias-markdown-inline-code': '#131C36',
      '--dsw-alias-markdown-tag': 'rgba(127,212,255,0.16)',
      '--dsw-alias-markdown-citation': '#8FA1C8',
      '--dsw-alias-markdown-placeholder': '#5B6A8C',
      '--dsw-alias-markdown-code-segment-selected': 'rgba(47,107,255,0.18)',
      '--dsw-alias-markdown-code-segment-unselected': 'transparent',
      '--dsw-alias-code-diff-added': 'rgba(79,227,161,0.16)',
      '--dsw-alias-code-diff-deleted': 'rgba(255,92,122,0.16)',
      '--dsw-alias-settings-card-fill': '#090F22',
      '--dsw-alias-settings-card-stroke': '#1B2748',
      '--dsw-alias-toast-bg': '#0B1430',
      '--dsw-alias-toast-label': '#F2F3F5',
      '--dsw-alias-tooltip-bg': '#101C3A',
      '--dsw-alias-tooltip-key-bg': '#1B2748',
      '--dsw-alias-scrollbar-bg-l1': '#182344',
      '--dsw-alias-scrollbar-bg-l2': '#22305A',
      '--dsw-alias-scrollbar-hover-l1': '#33457A',
      '--dsw-alias-scrollbar-hover-l2': '#3E5292',

      // ZZZ sets its UI in a condensed industrial sans and keeps corners tight;
      // the shipped 20 px panel radius is what made the old skin read as "chat app".
      // 0.24.7: the Chinese fallback is HarmonyOS Sans SC, not Microsoft YaHei (user:
      // 「用鸿蒙黑体」). YaHei's wide, flat-contrast glyphs are what made the Chinese
      // read as "default Windows" against Bahnschrift; the 华为 face is the same kind
      // of geometric gothic and its six installed weights (Thin…Black) cover the
      // 700/800 labels YaHei only fakes. Latin still starts at Bahnschrift; PingFang
      // SC / YaHei stay behind it, so a machine without 鸿蒙 falls back cleanly.
      '--dsw-font-family':
        '"Bahnschrift SemiCondensed", "Bahnschrift", "DIN Condensed", "Segoe UI", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      '--dsw-radius-xs': '2px',
      '--dsw-radius-sm': '4px',
      '--dsw-radius-md': '8px',
      '--dsw-radius-lg': '12px',
      '--dsw-radius-xl': '16px',
      '--dsw-radius-panel': '18px',
    }


    // --- H.D.D. furniture ---------------------------------------------------
    // Every piece below is a real slot; the shell keeps owning layout. The eye is
    // the Fairy-DSH mascot itself (the fairy-mascot-port block above): one SVG,
    // one runtime, two seats (0.18.0 removed the 20 px eye that lived in the rail).
    // `size` is the seat's BOX; the drawn disc is 136/160 of it, which is exactly
    // upstream's proportion.
    const EYE_SIZE = { brand: 26, corner: 232 }

    // --- what Fairy is doing ------------------------------------------------
    // One activity value, derived exactly as Fairy-DSH derives it
    // (fairy-visual/src/client/utils.js + comfort-detector.js):
    //   comforting > thinking (the session is running) > normal.
    // The cue lists, the backward walk over the latest decisive user message and
    // the suppression rules are upstream's; the text never leaves the page.
    const COMFORT_CUES = [
      /求安慰|安慰我|哄哄我|温柔一点|对我温柔|许愿精灵/, /难受|难过|伤心|委屈|孤独|寂寞|害怕|恐慌|焦虑|崩溃|绝望|失望|痛苦|心累|好累|疲惫|精疲力竭|压力好大|撑不住|受不了了|想哭|哭了|睡不着|不想活|想关闭自己|想把自己关机|想消失|被否定|否定我|被拒绝|被抛下/, /我不好|我很糟|我好糟|我被.*伤害|没人理解我|没有人理解我/, /\b(?:sad|upset|lonely|scared|afraid|anxious|panic(?:ked)?|depressed|overwhelmed|stressed|hurt|crying|cry|comfort me|be gentle)\b/i,
    ]
    /* An explicit request not to comfort is stronger than a quoted distress word
     * (for example: “不要安慰我，直接给方案”). */
    const COMFORT_SUPPRESS_CUES = [
      /(?:不用|不要|别|无需|不必).{0,8}(?:安慰|哄|温柔对待)/,
      /(?:只要|请).{0,8}(?:分析|方案|结论|下一步).{0,8}(?:不用|不要|别).{0,8}(?:安慰|哄)/,
      /\b(?:don't|do not|no need to)\s+(?:comfort|coddle|reassure)\b/i,
    ]
    const COMFORT_EXIT_CUES = [
      /我好多了|好多了|没事了|没关系了|已经好了|不用安慰了|不需要安慰了|可以了|结束这个话题|换个话题|说点别的|回到正题|继续工作|切换会话|切换页面|打开新会话|新建会话/,
      /\b(?:i(?:'m| am) better|feel better|all good|no worries|never mind|change the subject|let's move on|back to work)\b/i,
      /帮我(?:写|改|查|解释|翻译|总结|实现)|我们聊聊代码|开始工作|下一个问题|换个问题|打开设置|怎么实现/,
      /\b(?:help me write|debug|explain|translate|summarize|next question|change topics?|let's work on|how do I implement)\b/i,
    ]

    function classifyComfortMessage(text) {
      const normalized = String(text || '').replace(/\s+/g, ' ').trim()
      if (!normalized) return 'hold'
      const hasCue = (cues) => cues.some((cue) => cue.test(normalized))
      if (hasCue(COMFORT_SUPPRESS_CUES)) return 'exit'
      if (hasCue(COMFORT_CUES)) return 'trigger'
      if (hasCue(COMFORT_EXIT_CUES)) return 'exit'
      return 'hold'
    }

    function valueText(value) {
      if (typeof value === 'string') return value
      if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join(' ')
      if (!value || typeof value !== 'object') return ''
      return [value.text, value.content, value.value, value.message].map(valueText).filter(Boolean).join(' ')
    }

    function nodeText(node) {
      const blocks = Array.isArray(node?.data?.blocks) ? node.data.blocks : []
      return blocks.map(valueText).concat(
        valueText(node?.data?.text),
        valueText(node?.data?.content),
        valueText(node?.data?.message),
        valueText(node?.data?.input),
      ).join(' ')
    }

    function isUserNode(node) {
      return node?.kind === 'user' || node?.data?.role === 'user'
    }

    /* Walk backward to the latest decisive user cue. Neutral continuation does
     * not clear an earlier comfort request, while an explicit recovery/topic-exit
     * cue does. Ambiguous closers such as “先这样” deliberately keep the state. */
    function deriveSessionComfort(snapshot) {
      const order = Array.from(snapshot?.chat?.order || [])
      const nodes = snapshot?.chat?.nodes
      for (let index = order.length - 1; index >= 0; index -= 1) {
        const node = nodes?.get?.(order[index]) || nodes?.[order[index]]
        if (!isUserNode(node)) continue
        const result = classifyComfortMessage(nodeText(node))
        if (result === 'trigger') return true
        if (result === 'exit') return false
      }
      return false
    }

    function deriveSessionActivity(snapshot) {
      if (deriveSessionComfort(snapshot)) return 'comforting'
      return snapshot?.running === true ? 'thinking' : 'normal'
    }

    /* The selected session's read-only snapshot drives the eye. `sessions` is a
     * documented client service (every conversation surface in the shell reads
     * it); a missing row or a stale snapshot fails closed to `normal`, so the eye
     * never invents an expression. */
    let activityStore = null

    function createActivityStore(sessions) {
      const store = {
        activity: 'normal',
        lifecycle: 'idle',
        sessionId: undefined,
        subs: new Set(),
        session: null,
        sessionOff: null,
        listOff: null,
        subscribe(fn) {
          this.subs.add(fn)
          return () => this.subs.delete(fn)
        },
        emit() {
          this.subs.forEach((fn) => fn(this.activity))
        },
        update() {
          const snapshot = this.session && typeof this.session.getSnapshot === 'function' ? this.session.getSnapshot() : null
          const activity = deriveSessionActivity(snapshot)
          const lifecycle = snapshot ? (snapshot.running ? 'running' : snapshot.blank ? 'idle' : 'completed') : 'idle'
          if (this.activity === activity && this.lifecycle === lifecycle) return
          this.activity = activity
          this.lifecycle = lifecycle
          this.emit()
        },
        bind() {
          let id = null
          try {
            id = sessions.list.getSnapshot().current
          } catch (error) {
            id = null
          }
          let next = null
          try {
            next = id == null ? null : (sessions.binding(id) || {}).session || null
          } catch (error) {
            next = null
          }
          this.sessionId = id
          if (next === this.session) return this.update()
          if (this.sessionOff) this.sessionOff()
          this.session = next
          this.sessionOff = next && typeof next.subscribe === 'function' ? next.subscribe(() => this.update()) : null
          this.update()
        },
        dispose() {
          if (this.sessionOff) this.sessionOff()
          if (this.listOff) this.listOff()
          this.sessionOff = null
          this.listOff = null
          this.session = null
          this.subs.clear()
        },
      }
      if (sessions && sessions.list && typeof sessions.list.subscribe === 'function') {
        store.listOff = sessions.list.subscribe(() => store.bind())
      }
      store.bind()
      return store
    }

    /* The eye's state: the session's own activity, and — while Fairy is speaking
     * (the voice player's state machine) — the thinking lid, so a read-out is
     * never a dead eye. */
    function useFairyActivity() {
      const [voice, setVoice] = React.useState(audio.state)
      React.useEffect(() => {
        const update = (next) => setVoice(next)
        audio.subs.add(update)
        return () => audio.subs.delete(update)
      }, [])
      const [activity, setActivity] = React.useState(activityStore ? activityStore.activity : 'normal')
      React.useEffect(() => {
        if (!activityStore) return undefined
        const update = (next) => setActivity(next)
        setActivity(activityStore.activity)
        return activityStore.subscribe(update)
      }, [])
      if (activity !== 'normal') return activity
      return voice === 'playing' || voice === 'loading' ? 'thinking' : 'normal'
    }

    // --- the eye ------------------------------------------------------------
    // The Fairy-DSH mascot (client/fairy-mascot.port.js), mounted per seat. The
    // port owns the SVG, the stylesheet and the animation machine; this component
    // only hands it a box and a state.
    function FairyEye(props) {
      const { size, state, className, seat, active } = props
      const host = React.useRef(null)
      const instance = React.useRef(null)
      React.useEffect(() => {
        const node = host.current
        if (!node) return undefined
        const mounted = FairyMascotPort.createInstance(node, { state, active: active !== false })
        instance.current = mounted
        return () => {
          instance.current = null
          mounted.dispose()
        }
      }, [])
      React.useEffect(() => {
        if (instance.current) instance.current.setState(state)
      }, [state])
      React.useEffect(() => {
        if (instance.current) instance.current.setVisualActive(active !== false)
      }, [active])
      return h('span', {
        ref: host,
        className: 'dshf-fairy-eye' + (className ? ' ' + className : ''),
        'data-fairy-mascot': seat || 'eye',
        'data-fairy-eye': state,
        style: { width: size, height: size },
      })
    }

    // 0.24.0: the sidebar's mark is now nothing (user: 「最左上角的图标改为空白对话
    // 页面中的文字部分（去除倒影）」). The seat still has to be REGISTERED — the slot is
    // single, and dropping the row would hand the corner back to the shipped whale mark
    // — so it stays claimed and renders an empty node. The plate CSS above is untouched,
    // which is what makes putting the 26 px eye back a one-line change.
    function SidebarEye() {
      return null
    }

    // 0.17.0: the blank session renders as a conversation with nothing in it.
    // The shell's blank layout is a centered hero (headline with a brand mark,
    // composer right under it, both vertically centered). The user asked for the
    // conversation frame instead, the one difference being the big eye in the
    // middle of the screen. This seat is the slot the host renders *inside* that
    // headline, ahead of the title, so it renders nothing and hides the hero
    // chrome it sits in; the composer stack then falls to the bottom of the page
    // (the `[data-content-phase="hero"]` rules in the stylesheet).
    //
    // The node to hide is found by structure, not by a class name: walk up until
    // an ancestor has a sibling that owns the composer (the input itself). That
    // ancestor is the hero root, and hiding it takes the title and the preview
    // badge with it while leaving the workspace/preset row and the composer alone.
    // If the structure does not match — a host rebuild that moved the mark out of
    // the hero — nothing is hidden and the page stays as the shell drew it, rather
    // than blanking something unrelated.
    function HeroQuiet() {
      const anchor = React.useRef(null)
      React.useEffect(() => {
        const node = anchor.current
        if (!node) return undefined
        const INPUT = '[contenteditable], textarea'
        const holdsComposer = (element) =>
          element.matches(INPUT) || element.querySelector(INPUT) !== null
        let heroRoot = node
        let stack = null
        while (heroRoot.parentElement && heroRoot.parentElement !== document.body) {
          const parent = heroRoot.parentElement
          if (Array.from(parent.children).some((sibling) => sibling !== heroRoot && holdsComposer(sibling))) {
            stack = parent
            break
          }
          heroRoot = parent
        }
        if (!stack || heroRoot === node) return undefined
        const style = heroRoot.getAttribute('style')
        heroRoot.style.display = 'none'
        return () => {
          if (!heroRoot.isConnected) return
          if (style === null) heroRoot.removeAttribute('style')
          else heroRoot.setAttribute('style', style)
        }
      }, [])
      return h('span', { ref: anchor, className: 'dshf-hero-quiet', 'aria-hidden': true })
    }

    // 0.19.0: the big eye is the movable one (user: 「将fairy做成可拖动的，默认位置在
    // 左下角」). The conversation seat keeps its measured default — the conversation
    // column's bottom-left, above the composer — and a drag adds an offset on top of
    // it. Storing the OFFSET rather than an absolute position is what keeps the eye
    // following the sidebar when it collapses: the seat is re-measured, the offset is
    // not. A double-click drops the offset and the eye snaps back home.
    const EYE_OFFSET_KEY = 'dsh-fairy.eyeOffset'
    const EYE_PLATE_SIZE = 240
    const EYE_PLATE_EDGE = 8

    function readEyeOffset() {
      try {
        const raw = window.localStorage.getItem(EYE_OFFSET_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
          return { x: parsed.x, y: parsed.y }
        }
      } catch (error) {
        // storage unavailable or an unreadable value: the default seat is the answer
      }
      return { x: 0, y: 0 }
    }

    function saveEyeOffset(offset) {
      try {
        if (offset) window.localStorage.setItem(EYE_OFFSET_KEY, JSON.stringify(offset))
        else window.localStorage.removeItem(EYE_OFFSET_KEY)
      } catch (error) {
        // storage unavailable: the offset lasts for this page only
      }
    }

    /* The plate is 240 px square and owns its own edges, so the offset is clamped
     * against the seat it was measured at: the eye cannot be dragged off the page,
     * and a shrinking window pulls it back in instead of hiding it. */
    function clampEyeOffset(offset, box) {
      if (!box) return offset
      const width = window.innerWidth || EYE_PLATE_SIZE + EYE_PLATE_EDGE * 2
      const height = window.innerHeight || EYE_PLATE_SIZE + EYE_PLATE_EDGE * 2
      const minX = EYE_PLATE_EDGE - box.left
      const maxX = width - EYE_PLATE_SIZE - EYE_PLATE_EDGE - box.left
      const minY = box.bottom - height + EYE_PLATE_SIZE + EYE_PLATE_EDGE
      const maxY = box.bottom - EYE_PLATE_EDGE
      return {
        x: Math.min(Math.max(offset.x, minX), Math.max(minX, maxX)),
        y: Math.min(Math.max(offset.y, minY), Math.max(minY, maxY)),
      }
    }

    // 0.22.0: the H.D.D. title band under the blank page's eye (user: 「复现项目中
    // 空白会话页面中『空洞深潜系统』的这个效果……加到空白会话页面的 fairy 下方，
    // 做个最小版本」). The reference is 素材/hdd/title-card/render.py's title card,
    // reduced to its lower band: the HOLLOW DEEP DIVE SYSTEM wordmark, the hairlines
    // with the six-character Chinese subtitle in the gap, and — as on the in-game
    // card — three mirrored copies of the wordmark stacked under it, each one lower,
    // fainter, blurrier and shifted right, like the logo sitting on brushed glass.
    // The card's background (gradient, grid, scanlines, glow) is NOT reproduced: the
    // blank session already paints that, and the eye's own halo sits behind this text.
    // The band is a descendant of the same anchor as the plate, so the stylesheet can
    // place it from the measured eye centre with no second measurement.
    const HDD_TITLE_EN = 'HOLLOW DEEP DIVE SYSTEM'
    const HDD_TITLE_CN = '空洞深潜系统'
    const HDD_ECHOES = [0, 1, 2, 3, 4, 5]
    // 0.22.0: the wordmark's own face. ZZZ's display face is not on this machine and
    // Segoe UI Black — the closest system font — has rounder bowls and wider spacing
    // than the card. This is Archivo Black (SIL OFL 1.1), subsetted to the 20 glyphs
    // the wordmark uses and inlined, so the band needs no network and no extra
    // request. See the stylesheet comment for the tracking fit.
    const HDD_FACE_CJK = 'data:font/woff2;base64,d09GMgABAAAAAAlgABIAAAAADuQAAAkCAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGYFeGx4cQAZgP1NUQVQqAGQRCAqQGI0rCxIAATYCJAMWBCAFhF4HIAwHFyQYEhsnDBHVrB8i00hZOH+/n6fT/s+gujNBla2xLJlUnAlZaAFmhazylO72aa105Unm6YMMBKBXTTZ7gHMA/UQFs3yXMCqerKktoKuwQEbXKoIrIsdXeaARq2Vu7+bkhPQzRkxDvJoHXaTYdg/rAKv5h4CGCpL3gIRgaVMHA2WW5QtGIMuxwDYMWQOmsUEoGzaNmaBsxLRoDLIgWBdNlOZAGqyCpD007pCAmFaIwTIgiCc68pTyus1k20zIqvfAFgdREKAeAAtsA4Lo0ftgYAoAyEGL3TxosS8atNrGF4yPjmlEESRAAoRB7aFAOjEEAizRGVcN1KTEPQ+bhc8SVHpsj5PEj/BbEASA78CVZWX7nAPTQwEmC+IUDgNZCmIb835QJW4qJNu31EsbuiEFUtb8gJgIbFMN5DYsxRiMhWTQkYx/73IIvi0QmiBETesSAF/qGFiErQHfSwEmxm/JIhBLoKUitPUkiOIQg/jY+ZTRpNE/jWtXrFj1nzU/SL3f3iOBH+3/6f6IvVObnRup9Tnk3kEhBlggAKISNlSQF1S9Ft8HE/HRZUBWIeg8MgiEEAJhQJMEQRBkcGgkiRAiQ0kBTSOEUKhYjMgBCv35NBlKknRYKI0ihRKBhEKITBLRoTESagYVxoaEBw85hDZbyDKR3R7sGBYArRYBHYwMFI4wCkMOilx3LsPDoWNut+Syk3IewewUjoYUk76XmcypV35GMenzZTKnXvmVZ3m+kD3HcXMdIhAaRIAwGhBLkUhz3udrPTj1RdQrv79AznIc13HsQdZznlezX3Bc2eHPPpM85xWK6z5fLvOZ3z+mmHz5MpM59eoVo5j0Ma10fAZHBI2jlRSso2DubOIxy/Zn2PO+Vs+9mFd+uVUAtF4AdIoAaIsAaIVCa5UryOjPBEtsrjTEdw0fun77ejRz+MydOxIHhaOhcECYEBArAiETDuJhxWWfz5cZ7Yf8cvYWx7XIeV6jOOmLZY75FWymyDduEE0/LKdg3bmiSxw65o+bfOikjhzBVrIcx3HMsQtxPM/ziw673ZLTfOVpnuf7We6HDKz3eDwgV4y71sVe5Jj2KE6fuZl95O7r9/nsG06hpqjtFteHUf5LJsVtX6gzgaWKL32JIOM3i0Boo/B1hyin00k5j/Ppk08zOe4W2rFjxw6048YFTE2l4D985oxEuDy5vNty9CN/iWmPRnGUAMqgqKuPer3eeGqK47ic9Z5L16aMydjzj3iLDTigpwzdlojve+KRH3afkRz5PP/IRZ5PllVddfa0wvVhzDR3yaO8yvPtZv+vW5b+MuWXexKqXat096tdBblezapql+5+QbUL/KtKzaXHwpNGvoyf/03Bz5ifWbbs3pJ0ZeH/Z0XfOdsVUiH+/Nu14XUCajnVdVq7R+v+sF55qyH1JzVSY9Kjhsz2/1epv5Wl1Kd21Vlm/1WWQT7ZVG6tXODS9pgLhortH0LdiGPYAam2J2Pm3Y7Bv2xZnrz86Ob9nUZ9b9yzgNedZrD2LLujytMkJDUp1406fsz55twYYuVDMduG01bImLZW9Y4f/O6pwWS8SzCls1paa1tmaWoFVW3NnQNTVZpjPzyXWG1L3PSThkCJ6lZD+s9qyy3JTxpy6MfWUnvZIldnb/+8kcLBvTDeTn2wpCFTNkGknx45my8y5RhblBs/vJ1YWdWc2BHakVrx2cj5fJE2Sy3rN+09MzOsvD6+ObQl2ciwvZb42Q+8LLNhRlPdxCH20LA7WZ/8x3n6eZ1aqV4KvyvRl7xdvku3K3pjZr3ym4YUb7LMDKfqM3qxOtXXDYnnU6QWsaculfzBktLByiU7dM1swVjh8N6usUN5E3H2ru5dXDR+E87GrYtZN/97Yz9evXjl9iXrt4wPj6/wmkfN/oKOvlomW5HbnXOn17C3LVc+m81/Yu5rvTgiXVBlbxzpi3V3q+PWpv0xvde5JXckmYU/8cvzHrZ1dje23tCv+uXuMf0JZKoZZOu7GpxDTepWKSPzeVb8L98kpJmgsvK4xkd76/JD720OjbbksuauiCvx0xEPKR0uSdikIe5SVyM+jmkzx135Sj9dF/uLzy3Fqzs36i7IOzc6Uj/cVUGA4+V4CN4nzdRkZ5TBdvREuJNShdl/nvw+7tITHVY4fuXtnmsnTWXf7h6VZeFQfmZuCNa5e1gstSQvDz6E+oLl90NUs3vb+mq7anXlqTV9bSx8k66Z9XFpz5yu19aiM/k9xYzj9ZzhOfFoSdwMDSKEQiJsEVknEj2xE10zlA+ygyOiI4Jn/Suu4FbsErwrfHP+SB8rTdJvfuDp2vyYKOsctaZsD7Fg9Zik0OTVprpau1x16PaWj91m18xjBgati4zjTt/0uP6gVJzQXDP97/qNJekBKSEZgXFFLIiMmZO3y+zuh3G/yNHzDwJyg6urm6L8KheeSUgUaX3eq6xcq6/ibxxhU6zXafbtt9bHsPtakz8vKI1ctEm2zrs2HNgU0RffEioSts1PWSyUdmkkNsv6E5V3DViX7W+3G3W9ZVCfZ3MwLskcAARAJigaHt30plIr7JeyKL4FeHjYbhfAk1Wn7vxR+/1erUNJEwFFZAAIIF/w7ymonf6j9ve0WgcCfAcFDGsdLxAQ32Lyb5GIwAFdnYyyLIk89B3YVZn4OuvkKnXXeiFuzRQwFtyYMpQFO6ZICO+Zcmy4wlSghQqmIpZEMTTxQ10nCDUVAG3euULqaaaRJvrGuX10EYJn7VgvtfTQTBd9ZblHl4e3tuFBJz004kkmCaSRQSd9+Eou1XTQSy6xuBNDJ23UUUA9PVYf76QDCR888MILP9xJwodQmmyh9px8oI71zvXAG2+CUNhONa3Ua5Q2UM8Q9Qy5PzoD8CcAL3xT0Eh1kOpEaUDY7UQTRwyZhOZAMh+Kn3CiFueEHF54swVLuU89JhFNXRlqEp7nJC4MDj0eVJ8HDxHOt+OJM25IDNJ8SwolcqinV8jYAPXU1SBBLnRfIoNq2unHHMmlk356qIXcsawUHzPd/9nSoMHvPy38n3tYvhRBG+HnP3VQO/1f/jdCreM+pQji23vELtxwwgoDzDAA'
    const HDD_FACE = 'data:font/woff2;base64,d09GMgABAAAAAAQ0AA4AAAAACAQAAAPiAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGiIbIBwqBmAAbBEICoVwhD0BNgIkAzwLIAAEIAWDagcgGzwGIB6FTdl6OCcnV/XyUU8juVpqIvjaT/fd/RRZZeJEXMGRSoWpJ0WgbFCXVDWg0NXt+PPB96qXNoNLhl8rsrMgD6ZRhSvSwO2uz/T3UxelD3BROtQGjAodSFQCTXBAf5YUEecpvtFwtpMWbeGHfF2nzfM9BZgAkIgLEHJ6guHIejDGnCXSTEzNhRIFCgAoREfOhOY0e1Vd2sGYCNc/pzFkAmSQboVCwGrYOlrwjXAgjTNRcN6cAsJRN1cL0hHNWlFu93+hGifBgADSjLAB0CCCBEJcICKAKtzpHB2RwFoCSZpMuQoUFYCGeMlSZciRr6j4Bzz0ZI9ddtpum60RgyGQAlriDa9vNwNeIVYAUAEgIQ9cwJDjDCtVKio3Vmk0zFWp1LHvaZBKJVOX8tGEDGSsQgsVtQ2kmRaZwGQcPDjlMk4rOC3MSwZev77MClkxm3r1KozV1EW8RE2/f2PAFTbqGgOKX/mC46t89HUC6K+xouEq408l48sLK/D9UfsYe/29iSVuo3ZgwMk8Ih8SN7HzAWd58tPqOpX/c63laA2UyRjRQt3iRbyEl2qLWSFLRdBN1Eys53m8gNfeWV9Y2OS6wTWVSaOnhk8dLUHq5yztVhE9L7qp79JimNY+1+4O7v7+/DtwIHegu5b6d1E1iMTMH57ySkWMkva7uLb/BapURisqPX+c3hDcMIbWj/HYgKz7g1vXrVOaTZsObFm/PmxT4hIpT4qWxJmUZIhhBkjwfk1oUH20OjqoYbxL9NJ7dweDlniX2NlZKa1t7Urw7n5lM2lUna8st3u4v5w3+5moztY122fkIOloSddRCze1jLzonx3iWmVucqI5maNv65hVlNZxXfMwXC3uejRYsAGy//6bkafpqNOP/tYjY2cR3VCfF6x/ln5B04beyg7aSUPvLFiPr3e5bsm/wU+o3MFH1RIAAkSMXPD46O/udPhXpUJ8Abw8b+wDfLcT/P6v/Ff5CnEvYJgACPgT9EN3BJx6AxA+z3R6B7EO5DEY0iWGHANDDEVump06NiAcknuURGWF2+uXjDKDPr8gywwKBEyrouBLbC+GnMOKk4SqDeAJMDJhah9ZoHGDLIr0jEy5hj1ZxjTS55dzjkbEaa+Dnjpp0qBRF9Z8efMRJIpcEF53vBid1GjUpJv2rMVqVaVGC2uZOmmvWZ0aXeigqy749jrprHJu3KuLDjoL5cVLgybSv+iqmqca7bXlJUNb7TSp1lVnHnL11EEdrwukr3pdruabrU6DrtC368SHJ2/eAoXJk6JAurDWVTwa5P0BspHp89XppDNor53s6OIcZxI5s3L5AgA='

    function HDDBand() {
      return h(
        'div',
        { className: 'dshf-hdd-band', 'aria-hidden': true },
        h(
          'div',
          { className: 'dshf-hdd-wordwrap' },
          h('b', { className: 'dshf-hdd-word' }, HDD_TITLE_EN),
          // the echoes are the same string flipped by CSS: three text nodes in the
          // DOM, no canvas, no second font load, and the nth-child rules below give
          // each one its own drop, drift, blur and opacity
          h(
            'span',
            { className: 'dshf-hdd-refl' },
            HDD_ECHOES.map((echo) => h('b', { key: echo, className: 'dshf-hdd-echo' }, HDD_TITLE_EN)),
          ),
        ),
        h(
          'span',
          { className: 'dshf-hdd-sub' },
          h('i', { 'aria-hidden': true }),
          h('em', null, HDD_TITLE_CN),
          h('i', { 'aria-hidden': true }),
        ),
      )
    }

    function GutterEye() {
      // 0.12.0: the big one, in the empty bottom-left corner of the conversation
      // column (user: 「把 fairy 放到红框所示的地方」，并撤掉 0.11.0 那个贴在输入
      // 卡片上的小角板). The composer card is `position: relative`, so this node can
      // read the card's box from `offsetParent` and place a fixed-size plate above
      // the card, against the column's left edge. Measured on mount, on resize and
      // whenever the card (multi-line input) changes height.
      const eye = useFairyActivity()
      const anchor = React.useRef(null)
      const boxRef = React.useRef(null)
      const offsetRef = React.useRef(null)
      const dragRef = React.useRef(null)
      const [box, setBox] = React.useState(null)
      const [offset, setOffset] = React.useState(readEyeOffset)
      const [dragging, setDragging] = React.useState(false)
      // live mirrors: a drag reads the seat and the last committed offset from refs,
      // so the pointer handlers never work from a stale render
      boxRef.current = box
      if (offsetRef.current === null) offsetRef.current = offset

      React.useEffect(() => {
        // The blank session does not use the corner coordinates: the plate is
        // centred in the conversation column, above the composer (0.17.0 stage).
        // Both numbers are measured, not guessed, and both are re-measured when the
        // column changes width — which is how the eye follows the sidebar as it
        // collapses or expands.
        const closestOf = (element, selector) =>
          element && typeof element.closest === 'function' ? element.closest(selector) : null
        const measure = () => {
          const node = anchor.current
          const card = node && node.offsetParent
          if (!card) {
            setBox(null)
            return
          }
          const cardRect = card.getBoundingClientRect()
          const column = card.parentElement && card.parentElement.getBoundingClientRect()
          const left = (column ? column.left : cardRect.left - 32) + 16
          // 0.18.0: the rail above the card is gone, so the plate is anchored to
          // the card's own top edge. The 46 px band is the height that rail used
          // to occupy (rail top 730 for a card top of 776, measured); keeping the
          // same offset holds the eye exactly where it sat before the removal.
          const seat = closestOf(node, '[data-composer-seat]')
          const anchorTop = cardRect.top - 46
          const bottom = window.innerHeight - anchorTop + 8
          // 0.17.0 stage: the middle of the area the user circled — right of the
          // sidebar, above the input box. `[data-conversation-content]` is this
          // conversation's column (it grows when the sidebar collapses), and the
          // composer seat is the top edge of the input area.
          const stage = closestOf(node, '[data-conversation-content]')
          const stageRect = (stage && stage.getBoundingClientRect()) || column || cardRect
          const seatTop = seat ? seat.getBoundingClientRect().top : anchorTop
          const stageY = Math.round((stageRect.top + seatTop) / 2)
          // 0.22.0: the title band is sized from the same measurement instead of a
          // fixed width. The hero eye is centred between the stage top and the
          // composer seat, so the room under it is half the stage (seatTop - stageY).
          // Out of that room the band needs the disc's drawn radius (68/160 of the
          // 240 px plate, times the hero scale the media query picks), a 9% gap and
          // its own height — 4.06 em from the cap top to the last mirror row, and
          // 1 em is 0.0685 W, so 0.278 W — which solves to W = (room - disc) / 0.368;
          // the 0.368 carries ~1% of clearance above the composer. Under 260 px a
          // wordmark stops reading as one, so the band stands down rather than
          // shrinking into noise.
          const heroScale = window.innerWidth <= 1180 || window.innerHeight <= 620 ? 1.2 : 1.5
          const discRadius = 102 * heroScale
          const room = seatTop - stageY
          const bandWidth = Math.round(Math.min(520, window.innerWidth - 360, (room - discRadius) / 0.376))
          setBox({
            left: Math.round(left),
            bottom: Math.round(bottom),
            stageX: Math.round(stageRect.left + stageRect.width / 2),
            // 0.23.0: the eye and the title band below it are one block, centred on
            // the stage as a whole (user: 「fairy 和下面的文字视为一个整体居中」).
            // The block is disc + 9% gap + the band's visible extent (0.278 W), so
            // its centre sits (block/2 - disc) below the eye's centre; lifting the
            // eye by exactly that puts the two halves of the block equidistant from
            // the stage's top and the composer seat. The fit above still uses the
            // stage centre, so the band keeps the size it had before the lift.
            stageY: Math.round(stageY - (2 * discRadius + 0.368 * bandWidth) / 2 + discRadius),
            // the drop is measured from the eye centre: disc edge + the same 9% gap
            hddW: bandWidth,
            hddDrop: Math.round(discRadius + bandWidth * 0.09),
            hddFit: bandWidth >= 260,
          })
        }
        measure()
        const targets = []
        const node = anchor.current
        const card = node && node.offsetParent
        if (card) targets.push(card)
        if (card && card.parentElement) targets.push(card.parentElement)
        // the column tracks the sidebar; observing it is what moves the eye
        const stage = closestOf(node, '[data-conversation-content]')
        if (stage) targets.push(stage)
        const ro = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver(measure) : null
        if (ro) targets.forEach((target) => ro.observe(target))
        window.addEventListener('resize', measure)
        // 0.17.0: the blank session places this plate from the measured stage
        // centre by CSS, and the first message flips the conversation frame back to
        // the chat layout — a move that changes no box size, so neither the
        // ResizeObserver nor `resize` would re-measure. The host's own phase
        // attribute is the cue.
        const phaseNode = node && typeof node.closest === 'function' ? node.closest('[data-content-phase]') : null
        const mo = phaseNode && typeof window.MutationObserver === 'function'
          ? new window.MutationObserver(measure)
          : null
        if (mo) mo.observe(phaseNode, { attributes: true, attributeFilter: ['data-content-phase'] })
        return () => {
          if (ro) ro.disconnect()
          if (mo) mo.disconnect()
          window.removeEventListener('resize', measure)
        }
      }, [])

      // --- drag: the pointer gesture (0.19.0) --------------------------------
      // The plate is the handle. The gesture writes `offset` in screen pixels and
      // the render adds it to the measured seat, so the eye follows the sidebar and
      // the composer while a user offset stays on top of both. The blank session
      // opts out: there the eye is the page's own composition, pinned by CSS.
      const onEyePointerDown = (event) => {
        const node = anchor.current
        if (!node || !boxRef.current) return
        const phaseNode = typeof node.closest === 'function' ? node.closest('[data-content-phase]') : null
        if (phaseNode && phaseNode.getAttribute('data-content-phase') === 'hero') return
        if (event.pointerType === 'mouse' && event.button !== 0) return
        dragRef.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          base: offsetRef.current || { x: 0, y: 0 },
          moved: false,
        }
        setDragging(true)
        // capture keeps the gesture alive over the chat, which sits under the plate
        const plate = event.currentTarget
        if (plate && typeof plate.setPointerCapture === 'function') {
          try { plate.setPointerCapture(event.pointerId) } catch (error) { /* not capturable */ }
        }
        if (typeof event.preventDefault === 'function') event.preventDefault()
      }

      const onEyePointerMove = (event) => {
        const drag = dragRef.current
        if (!drag || drag.id !== event.pointerId) return
        const next = clampEyeOffset({
          x: drag.base.x + event.clientX - drag.x,
          y: drag.base.y + event.clientY - drag.y,
        }, boxRef.current)
        if (next.x !== drag.base.x || next.y !== drag.base.y) drag.moved = true
        offsetRef.current = next
        setOffset(next)
        if (event.cancelable && typeof event.preventDefault === 'function') event.preventDefault()
      }

      const onEyePointerEnd = (event) => {
        const drag = dragRef.current
        if (!drag || drag.id !== event.pointerId) return
        dragRef.current = null
        setDragging(false)
        if (drag.moved) saveEyeOffset(offsetRef.current)
      }

      // double-click drops the offset: the eye snaps back to its bottom-left seat
      const onEyeReset = () => {
        dragRef.current = null
        const home = { x: 0, y: 0 }
        offsetRef.current = home
        setOffset(home)
        setDragging(false)
        saveEyeOffset(null)
      }

      // 0.15.0: only the eye itself. The 240x250 frame, its border/glow, the yellow
      // tick and the "Fairy" name bar are gone (user: 「删除外边框和文字啥的，只保留里面
      // 的 fairy 大眼珠子」) — the mascot draws its own halo, so it reads as a floating
      // eye on the chat background.
      // 0.16.0: the eye is Fairy-DSH's own mascot, mounted at the biggest seat.
      // 0.17.0: one seat, two placements. In a conversation it sits bottom-left; on
      // a blank session the same plate is centred in the conversation column above
      // the composer, at 1.5x (the plate is fixed and the mascot is vector, so a
      // `transform` scale is exact). The two stage coordinates travel as custom
      // properties so the stylesheet owns the phase rule and the component owns the
      // measurement. No second Fairy is mounted for the blank page.
      const live = Boolean(box)
      const shown = clampEyeOffset(offset, box)
      return h(
        'div',
        {
          ref: anchor,
          className: 'dshf-corner-anchor',
          // 0.22.0: the stage coordinates live on the anchor instead of the plate so
          // the title band, which is the plate's sibling, can read the same eye
          // centre, and the band's width/drop arrive as measured numbers. Custom
          // properties inherit, so the plate's hero rules are unchanged.
          'data-hdd-band': live && box.hddFit ? 'fit' : 'tight',
          style: live
            ? {
                '--dshf-blank-eye-x': box.stageX + 'px',
                '--dshf-blank-eye-y': box.stageY + 'px',
                '--dshf-hdd-w': box.hddW + 'px',
                '--dshf-hdd-drop': box.hddDrop + 'px',
              }
            : undefined,
        },
        h(
          'div',
          {
            className: 'dshf-corner-plate' + (dragging ? ' is-dragging' : ''),
            'data-fairy-mascot': 'corner',
            // the blank-session rules only place the plate once its centre is
            // measured; the narrow-window escape hatch keys off the same marker so
            // an unmeasured plate cannot flash at the wrong spot
            'data-blank-eye': live ? 'ready' : undefined,
            'aria-hidden': true,
            onPointerDown: onEyePointerDown,
            onPointerMove: onEyePointerMove,
            onPointerUp: onEyePointerEnd,
            onPointerCancel: onEyePointerEnd,
            onDoubleClick: onEyeReset,
            style: live
              ? {
                  left: Math.round(box.left + shown.x),
                  bottom: Math.round(box.bottom - shown.y),
                }
              : { display: 'none' },
          },
          h(FairyEye, { seat: 'corner', state: eye, size: EYE_SIZE.corner, active: live }),
        ),
        // 0.22.0: the title band. Hidden by CSS everywhere except the blank session,
        // where the hero-phase rules below place it under the eye.
        h(HDDBand),
      )
    }

    // 0.24.0: the sidebar brand is the blank session's H.D.D. band with the mirror
    // stack removed — the wordmark, the two hairlines and 「空洞深潜系统」 between them,
    // no echoes, no eye, no FAIRY plate (user: 「最左上角的图标（图1）改为空白对话页面
    // 中的文字部分（去除倒影），做个最小版本方便回滚」). Its width is the wordmark's own
    // ink, so the hairlines stretch to whatever that wordmark draws; the band on the
    // page is instead sized from the measured stage and spans it. Same two inlined
    // faces as the page band, so the mark adds no request and no asset.
    function SidebarBrand() {
      return h(
        'div',
        { className: 'dshf-brandwide', title: HDD_TITLE_EN + ' · ' + HDD_TITLE_CN },
        h('b', null, HDD_TITLE_EN),
        h(
          'span',
          null,
          h('i', { 'aria-hidden': true }),
          h('em', null, HDD_TITLE_CN),
          h('i', { 'aria-hidden': true }),
        ),
      )
    }

    function SidebarStatus() {
      return h(
        'div',
        { className: 'dshf-tape', title: 'H.D.D. 在线 · Fairy 待命中' },
        h('span', { className: 'dshf-dot' }),
        h('span', { className: 'dshf-tape-text' }, 'H.D.D.'),
      )
    }

    // --- balance strip -------------------------------------------------------
    // 0.25.0: the H.D.D. balance strip, pinned above the sidebar's 设置 row
    // (user: 「皮肤模仿【余额小鲸鱼】的功能，在【设置】上方展示余额，今日已用和峰/谷价
    // 时间」). Two halves, both read-only:
    //   - the numbers come from the skin's OWN host route (0.26.0,
    //     `/fairy-balance/summary`), which resolves DEEPSEEK_API_KEY host-side and
    //     keeps the day's balance-difference ledger — the key never reaches the
    //     browser and nothing here can spend or top up. The balance widget's
    //     route (`/dsh-whale/balance.json`) stays as a fallback for a host that
    //     has not restarted into 0.26.0 yet;
    //   - 峰/谷 is computed here, so the state word and the time line keep ticking
    //     whether or not either route answers.
    // Undo = delete this block, its CSS block and one slots.inject below.
    const BALANCE_URL = '/fairy-balance/summary'
    const BALANCE_FALLBACK_URL = '/dsh-whale/balance.json'
    const BALANCE_POLL_MS = 60000
    // 峰时口径（北京时间）：工作日 09:00–12:00、14:00–18:00；周末与法定节假日全天
    // 谷价。只列「放假」的工作日；调休上班日都落在周末，已经被周末规则覆盖。
    // 每年 11 月国务院发布次年安排后要在这里补上，否则次年多出来的假期会按峰价显示。
    const PEAK_HOURS = [[9, 12], [14, 18]]
    const VALLEY_DAYS = {
      '2026-01-01': 1, '2026-01-02': 1, '2026-01-03': 1,
      '2026-02-15': 1, '2026-02-16': 1, '2026-02-17': 1, '2026-02-18': 1,
      '2026-02-19': 1, '2026-02-20': 1, '2026-02-21': 1, '2026-02-22': 1, '2026-02-23': 1,
      '2026-04-04': 1, '2026-04-05': 1, '2026-04-06': 1,
      '2026-05-01': 1, '2026-05-02': 1, '2026-05-03': 1, '2026-05-04': 1, '2026-05-05': 1,
      '2026-06-19': 1, '2026-06-20': 1, '2026-06-21': 1,
      '2026-09-25': 1, '2026-09-26': 1, '2026-09-27': 1,
      '2026-10-01': 1, '2026-10-02': 1, '2026-10-03': 1, '2026-10-04': 1,
      '2026-10-05': 1, '2026-10-06': 1, '2026-10-07': 1,
    }
    const BEIJING_OFFSET_MS = 8 * 3600000

    /** Beijing wall clock of one instant, as a Date whose UTC fields are local. */
    function beijingDate(at) {
      return new Date(Number(at) + BEIJING_OFFSET_MS)
    }

    function beijingDay(at) {
      return beijingDate(at).toISOString().slice(0, 10)
    }

    /** Weekends and the listed statutory holidays bill at the valley price all day. */
    function isValleyDay(at) {
      const bj = beijingDate(at)
      const dow = bj.getUTCDay()
      if (dow === 0 || dow === 6) return true
      return Boolean(VALLEY_DAYS[bj.toISOString().slice(0, 10)])
    }

    function isPeakAt(at) {
      if (isValleyDay(at)) return false
      const hour = beijingDate(at).getUTCHours()
      return PEAK_HOURS.some(([start, end]) => hour >= start && hour < end)
    }

    /** The window a peak instant sits in, as `[startHour, endHour]`; null in the valley. */
    function peakWindowAt(at) {
      if (!isPeakAt(at)) return null
      const hour = beijingDate(at).getUTCHours()
      return PEAK_HOURS.find(([start, end]) => hour >= start && hour < end) || null
    }

    /**
     * The next instant the price band flips. The rule only ever changes on the hour
     * edges 00/09/12/14/18 Beijing time, so scanning 15 days of those edges is exact
     * (the longest holiday run is well shorter).
     */
    function nextBandChange(at) {
      const now = Number(at)
      const current = isPeakAt(now)
      const day0 = Math.floor((now + BEIJING_OFFSET_MS) / 86400000) * 86400000
      for (let d = 0; d <= 15; d += 1) {
        for (const edge of [0, 9, 12, 14, 18]) {
          const candidate = day0 + d * 86400000 + edge * 3600000 - BEIJING_OFFSET_MS
          if (candidate <= now + 1000) continue
          if (isPeakAt(candidate) !== current) return candidate
        }
      }
      return null
    }

    function clockText(at) {
      const bj = beijingDate(at)
      const pad = (value) => String(value).padStart(2, '0')
      return pad(bj.getUTCHours()) + ':' + pad(bj.getUTCMinutes())
    }

    function moneyText(value) {
      if (value === null || value === undefined) return '—'
      const n = Number(value)
      if (!Number.isFinite(n)) return '—'
      return n.toFixed(2)
    }

    function currencyMark(code) {
      if (code === 'CNY') return '¥'
      if (code === 'USD') return '$'
      return String(code || '') + ' '
    }

    /**
     * The strip above 设置. Purely presentational: it reads the balance route and
     * the local clock, and never writes anything back.
     */
    function BalanceCard() {
      const [reading, setReading] = React.useState({ status: 'loading' })
      const [now, setNow] = React.useState(() => Date.now())

      React.useEffect(() => {
        let alive = true
        // One read of one route: a 404/other status means "this route is not
        // mounted" (null), while a JSON body is the answer — including the
        // { ok: false, code } the host returns for NO_KEY / HTTP / FAILED.
        const readRoute = async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-store' })
            if (!res.ok) return null
            return await res.json()
          } catch (error) {
            return null
          }
        }
        const load = async () => {
          let body = await readRoute(BALANCE_URL)
          if (!body || body.ok !== true) {
            const fallback = await readRoute(BALANCE_FALLBACK_URL)
            if (fallback && fallback.ok === true) body = fallback
            else if (!body) body = fallback
          }
          if (!alive) return
          if (body && body.ok) {
            setReading({
              status: 'ready',
              // own route: balance/todayUsed · balance widget: totalBalance/todayUsage
              balance: body.balance !== undefined ? body.balance : body.totalBalance,
              today: body.todayUsed !== undefined ? body.todayUsed : body.todayUsage,
              currency: body.currency || 'CNY',
              source: body.usageLabel || (body.source === 'balance-observed' ? '已观测消费' : ''),
            })
          } else {
            setReading({ status: body && body.code === 'NO_KEY' ? 'nokey' : 'error' })
          }
        }
        void load()
        const poll = window.setInterval(load, BALANCE_POLL_MS)
        const tick = window.setInterval(() => setNow(Date.now()), 30000)
        const onVisible = () => {
          if (document.visibilityState !== 'visible') return
          setNow(Date.now())
          void load()
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
          alive = false
          window.clearInterval(poll)
          window.clearInterval(tick)
          document.removeEventListener('visibilitychange', onVisible)
        }
      }, [])

      const peak = isPeakAt(now)
      const peakSlot = peakWindowAt(now)
      const next = nextBandChange(now)
      const valleyAllDay = isValleyDay(now)
      const bjNow = beijingDate(now)
      const hour = bjNow.getUTCHours() + bjNow.getUTCMinutes() / 60
      const markPct = Math.max(0, Math.min(100, (hour / 24) * 100))
      const ready = reading.status === 'ready'
      const mark = currencyMark(reading.currency)
      const balanceText = ready ? mark + moneyText(reading.balance) : '—'
      const todayText = ready ? mark + moneyText(reading.today) : '—'
      const stateWord = peak ? '高峰' : '谷价'
      let whenText = ''
      if (peak && peakSlot) {
        const pad = (value) => String(value).padStart(2, '0')
        whenText = pad(peakSlot[0]) + ':00–' + pad(peakSlot[1]) + ':00'
      } else if (valleyAllDay) whenText = '全天'
      else if (next) whenText = clockText(next) + ' 起峰'
      const title = ready
        ? '余额 ' + balanceText + ' · 今日已用 ' + todayText + (reading.source ? '（' + reading.source + '）' : '')
          + '｜峰时 工作日 09:00–12:00、14:00–18:00；周末与法定节假日全天谷价'
        : reading.status === 'nokey'
          ? '未配置 DEEPSEEK_API_KEY，余额挂件读不到数'
          : '余额接口暂不可用'

      return h(
        'div',
        { className: 'dshf-balance' + (ready ? '' : ' is-idle'), title },
        h(
          'div',
          { className: 'dshf-balance-head' },
          h('span', { className: 'dshf-balance-key' }, '余额'),
          h('span', { className: 'dshf-balance-amount' }, balanceText),
          h(
            'span',
            { className: 'dshf-balance-bandstate' + (peak ? ' is-peak' : '') },
            h('i', { className: 'dshf-balance-lamp' }),
            stateWord,
          ),
        ),
        h(
          'div',
          { className: 'dshf-balance-foot' },
          h('span', { className: 'dshf-balance-key' }, '今日已用'),
          h('span', { className: 'dshf-balance-today' }, todayText),
          h('span', { className: 'dshf-balance-when' }, whenText),
        ),
        h(
          'div',
          { className: 'dshf-balance-meter' + (valleyAllDay ? ' is-valley-all-day' : ''), 'aria-hidden': true },
          PEAK_HOURS.map(([start, end]) =>
            h('span', {
              key: 'band-' + start,
              className: 'dshf-balance-span',
              style: { left: (start / 24) * 100 + '%', width: ((end - start) / 24) * 100 + '%' },
            }),
          ),
          h('span', {
            className: 'dshf-balance-now' + (peak ? ' is-peak' : ''),
            style: { left: markPct + '%' },
          }),
        ),
      )
    }

    // --- voice --------------------------------------------------------------
    // Fairy's replies are spoken with her own GPT-SoVITS voice. The host half owns
    // the engine *and the text*: this half either plays the live sentence stream —
    // `/live` (SSE) announces opaque speech ids and `/speech?id=` serves the wav —
    // or asks for the automatic read-out of one finalized answer. That read-out
    // is a short spoken summary (`speakMode: 'summary'` on the host), so a long
    // coding answer does not get read out code block by code block.
    const VOICE_PREFIX = '/fairy-voice'
    const VOICE_KEY = 'dsh-fairy.voiceAuto'
    const SEEN_KEY = 'dsh-fairy.voiceSeen'
    const SEEN_LIMIT = 400

    const voiceStore = {
      enabled: true,
      subs: new Set(),
      init() {
        try {
          // auto-read is on unless this browser turned it off once
          this.enabled = window.localStorage.getItem(VOICE_KEY) !== '0'
        } catch (error) {
          this.enabled = true
        }
        return this
      },
      set(next) {
        this.enabled = Boolean(next)
        try {
          window.localStorage.setItem(VOICE_KEY, this.enabled ? '1' : '0')
        } catch (error) {
          // storage unavailable: session-only preference
        }
        this.subs.forEach((fn) => fn(this.enabled))
      },
    }.init()

    const seenVoices = {
      ids: [],
      load() {
        try {
          const raw = window.localStorage.getItem(SEEN_KEY)
          const parsed = raw ? JSON.parse(raw) : []
          this.ids = Array.isArray(parsed) ? parsed : []
        } catch (error) {
          this.ids = []
        }
        return this
      },
      has(id) {
        return this.ids.includes(id)
      },
      add(id) {
        if (this.has(id)) return
        this.ids.push(id)
        if (this.ids.length > SEEN_LIMIT) this.ids = this.ids.slice(-SEEN_LIMIT)
        try {
          window.localStorage.setItem(SEEN_KEY, JSON.stringify(this.ids))
        } catch (error) {
          // ignore
        }
      },
    }.load()

    // First batch of assistant nodes after a session becomes visible is history,
    // not a fresh reply: it is recorded as seen but never spoken.
    const primed = new Map()
    const PRIME_WINDOW_MS = 3000

    // The session whose composer is on screen; the live stream filters on it.
    const activeSession = { id: null }

    // One queue serves both paths: consecutive chunks of a live reply play back
    // to back, and an explicit play replaces whatever is queued.
    const audio = {
      context: null,
      source: null,
      state: 'idle',
      subs: new Set(),
      queue: [],
      notify() {
        this.subs.forEach((fn) => fn(this.state))
      },
      unlock() {
        if (this.context) {
          if (this.context.state === 'suspended') this.context.resume().catch(() => {})
          return this.context
        }
        const Ctor = window.AudioContext || window.webkitAudioContext
        if (!Ctor) return null
        try {
          this.context = new Ctor()
        } catch (error) {
          return null
        }
        return this.context
      },
      stop() {
        this.queue.length = 0
        if (this.source) {
          try {
            this.source.stop()
          } catch (error) {
            // already stopped
          }
          this.source = null
        }
        this.state = 'idle'
        this.notify()
      },
      /** Replace the queue with one url (manual replay or finalized fallback). */
      play(url) {
        this.stop()
        this.queue.push(url)
        return this.drain()
      },
      /** Append one live sentence chunk; playback starts as soon as it can. */
      enqueue(url) {
        this.queue.push(url)
        return this.drain()
      },
      async drain() {
        if (this.state === 'loading' || this.state === 'playing') return this.state
        const url = this.queue.shift()
        if (!url) {
          this.state = 'idle'
          this.notify()
          return false
        }
        this.state = 'loading'
        this.notify()
        let response
        try {
          response = await fetch(url, { cache: 'no-store' })
        } catch (error) {
          this.state = 'offline'
          this.notify()
          return false
        }
        if (!response.ok) {
          // 204 means the host already read this reply live; anything else is a
          // missing engine, and the next reply gets another chance.
          this.state = response.status === 204 ? 'idle' : 'offline'
          this.notify()
          return this.drain()
        }
        const buffer = await response.arrayBuffer()
        const context = this.unlock()
        if (!context) {
          this.state = 'unsupported'
          this.notify()
          return false
        }
        let decoded
        try {
          decoded = await context.decodeAudioData(buffer)
        } catch (error) {
          this.state = 'error'
          this.notify()
          return false
        }
        const source = context.createBufferSource()
        source.buffer = decoded
        source.connect(context.destination)
        source.onended = () => {
          if (this.source !== source) return
          this.source = null
          this.state = 'idle'
          this.notify()
          this.drain()
        }
        this.source = source
        this.state = 'playing'
        this.notify()
        source.start()
        return true
      },
    }

    // Server-sent events carrying "sentence N is ready" for the open session.
    // Opening the stream also pre-warms the engine on the host.
    const live = {
      source: null,
      session: null,
      failures: 0,
      open(sessionId) {
        if (!voiceStore.enabled || !sessionId || typeof window.EventSource !== 'function') return
        if (this.source && this.session === sessionId) return
        this.close()
        const url = `${VOICE_PREFIX}/live?session=${encodeURIComponent(sessionId)}`
        const source = new window.EventSource(url)
        source.onmessage = (event) => this.receive(event)
        source.onerror = () => {
          if (source !== this.source) return
          // a host without the live route keeps 404-ing: stop reconnecting
          this.failures += 1
          if (this.failures >= 3) this.close()
        }
        this.source = source
        this.session = sessionId
        this.failures = 0
      },
      close() {
        if (this.source) {
          try {
            this.source.close()
          } catch (error) {
            // already closed
          }
        }
        this.source = null
        this.session = null
      },
      receive(event) {
        let message
        try {
          message = JSON.parse(event.data)
        } catch (error) {
          return
        }
        if (!message || typeof message !== 'object') return
        this.failures = 0
        if (message.session && activeSession.id && message.session !== activeSession.id) return
        if (message.type === 'speech' && typeof message.id === 'string') {
          audio.unlock()
          audio.enqueue(`${VOICE_PREFIX}/speech?id=${encodeURIComponent(message.id)}`)
          return
        }
        if (message.type === 'done' && typeof message.message === 'string') {
          seenVoices.add(message.message)
        }
      },
    }

    function voiceUrl(sessionId, messageId, mode) {
      const query = new URLSearchParams()
      if (sessionId) query.set('session', sessionId)
      if (messageId) query.set('message', messageId)
      if (mode) query.set('mode', mode)
      return `${VOICE_PREFIX}/tts?${query.toString()}`
    }

    function autoUrl(sessionId, messageId) {
      const query = new URLSearchParams()
      if (sessionId) query.set('session', sessionId)
      if (messageId) query.set('message', messageId)
      return `${VOICE_PREFIX}/auto?${query.toString()}`
    }

    function speakMessage(sessionId, messageId, mode) {
      if (!messageId) return Promise.resolve(false)
      return audio.play(voiceUrl(sessionId, messageId, mode)).then((played) => {
        if (played) seenVoices.add(messageId)
        return played
      })
    }

    function stopVoice() {
      audio.stop()
      const sessionId = activeSession.id
      if (!sessionId) return
      // Tell the host to stop synthesizing the rest of this reply, not just to
      // stop playing it — CPU synthesis is the expensive half.
      fetch(`${VOICE_PREFIX}/quiet?session=${encodeURIComponent(sessionId)}`, { method: 'POST' }).catch(() => {})
    }

    function autoSpeak(sessionId, messageId) {
      if (!voiceStore.enabled || !messageId || seenVoices.has(messageId)) return
      const now = Date.now()
      const first = primed.get(sessionId)
      if (first === undefined) {
        primed.set(sessionId, now)
        seenVoices.add(messageId)
        return
      }
      if (now - first < PRIME_WINDOW_MS) {
        seenVoices.add(messageId)
        return
      }
      // The host answers 204 when this reply was already read (or is history/a
      // progress step), and 200 with the short summary wav when it should speak.
      // There is no whole-reply fallback here on purpose: an old host or a broken
      // summary must stay silent rather than read the entire answer aloud again.
      audio.play(autoUrl(sessionId, messageId)).then((played) => {
        if (played) seenVoices.add(messageId)
      })
    }

    const VOICE_GLYPH = {
      idle: '▶',
      loading: '…',
      playing: '■',
      offline: '✕',
      error: '✕',
      unsupported: '✕',
    }

    function VoiceAction(props) {
      const { messageId, sessionId } = props
      const [state, setState] = React.useState(audio.state)
      React.useEffect(() => {
        const update = (next) => setState(next)
        audio.subs.add(update)
        return () => audio.subs.delete(update)
      }, [])
      React.useEffect(() => {
        autoSpeak(sessionId, messageId)
      }, [sessionId, messageId])
      const playing = state === 'loading' || state === 'playing'
      const glyph = playing ? VOICE_GLYPH[state] : VOICE_GLYPH.idle
      const onClick = (mode) => () => {
        audio.unlock()
        if (audio.state === 'playing' || audio.queue.length > 0) {
          stopVoice()
          return
        }
        speakMessage(sessionId, messageId, mode)
      }
      const label = (mode, text) =>
        h(
          'button',
          {
            type: 'button',
            className: playing ? 'dshf-btn dshf-btn-on' : 'dshf-btn',
            title:
              state === 'offline'
                ? 'Fairy 语音引擎未就绪'
                : mode === 'summary'
                  ? '让 Fairy 朗读这条回复的摘要'
                  : '朗读这条回复全文',
            onClick: onClick(mode),
            style: state === 'offline' ? { opacity: 0.55 } : undefined,
          },
          h('span', { 'aria-hidden': true }, glyph),
          h('span', null, text),
        )
      return h(
        'span',
        { className: 'dshf-voice-row' },
        label('summary', '摘要'),
        label(undefined, '全文'),
      )
    }

    function warmEngine() {
      fetch(`${VOICE_PREFIX}/status?warm=1`, { cache: 'no-store' }).catch(() => {})
    }

    function VoiceToggle() {
      const [enabled, setEnabled] = React.useState(voiceStore.enabled)
      React.useEffect(() => {
        const update = (next) => {
          setEnabled(next)
          if (next) {
            audio.unlock()
            live.open(activeSession.id)
          } else {
            live.close()
            stopVoice()
          }
        }
        voiceStore.subs.add(update)
        return () => voiceStore.subs.delete(update)
      }, [])
      React.useEffect(() => {
        if (voiceStore.enabled) {
          warmEngine()
          live.open(activeSession.id)
        }
      }, [])
      const onClick = () => {
        const next = !enabled
        if (next) {
          audio.unlock()
          warmEngine()
        }
        voiceStore.set(next)
      }
      return h(
        'button',
        {
          type: 'button',
          title: enabled ? 'Fairy 语音摘要已开启：新回复自动朗读摘要（点击关闭）' : '开启：新回复自动朗读摘要',
          onClick,
          className: enabled ? 'dshf-btn dshf-btn-on' : 'dshf-btn',
        },
        h('span', { className: enabled ? 'dshf-dot is-on' : 'dshf-dot', 'aria-hidden': true }),
        h('span', null, 'VOICE'),
      )
    }

    // --- VOICE, pinned to the page's bottom-right corner (0.18.0) ------------
    // The H.D.D. rail that used to sit above the composer is gone (user:
    // 「删除会话中，输入框上面这个东西」). Its name chip, place line, wave meter and
    // the REF tape cost the input column a 34 px row for no information; only the
    // voice switch was worth keeping, and it moved to the corner (user:
    // 「把【voice】调整到右下角」).
    //
    // The dock slot is still the seat that carries the live session id — that is
    // what the live speaker needs — but the chip leaves the composer's flow: it
    // is portalled onto <body> so it can be a real corner fixture at the window's
    // stacking level. A fixed child of the composer stack would paint inside the
    // card's own stacking context, which is where the floating mascot widget that
    // owns the corner would cover it; the portal is what keeps this switch
    // clickable, and the composer loses nothing to a wrapper element.
    function VoiceCorner(props) {
      const sessionId = (props && props.sessionId) || null
      React.useEffect(() => {
        activeSession.id = sessionId
        if (voiceStore.enabled) live.open(sessionId)
        else live.close()
      }, [sessionId])
      const chip = h(
        'div',
        { className: 'dshf-voice-corner', 'data-fairy-voice': 'corner' },
        h(VoiceToggle),
      )
      return ReactDOM && typeof ReactDOM.createPortal === 'function'
        ? ReactDOM.createPortal(chip, document.body)
        : chip
    }

    // --- stage: halftone + scanlines + H.D.D. bloom --------------------------
    // 0.10.1: the two film-strip bands are gone (user: 「最上下方的类似胶片的横条去掉」).
    // They were the loudest of the decorative layers and they cost 30 px of the
    // window's own top/bottom edges for no information — everything else stays.
    // 0.24.1: the top-left registration mark is gone too (user: 「最左上角的这个黄色去掉」).
    // It is the one corner the brand row grew into when 0.24.0 replaced the FAIRY
    // plate with the wordmark band — the mark's 15 px arm ended 3 px from the H, so
    // the two read as one broken glyph.
    // 0.24.6: the remaining three go as well (user: 「现在把右上，左下，右下的都去掉」),
    // so the stage is decoration only — no mark sits in any corner. All four
    // `.dshf-mark.is-*` rules stay in the stylesheet: re-seating one is one line.
    const STAGE_LAYERS = [
      { className: 'dshf-dots' },
      { className: 'dshf-bloom' },
      { className: 'dshf-scan' },
      { className: 'dshf-vig' },
    ]

    function FairyStage() {
      return h(
        React.Fragment,
        null,
        ...STAGE_LAYERS.map((layer) =>
          h('div', { key: layer.className, 'aria-hidden': true, className: 'dshf-fx ' + layer.className }),
        ),
      )
    }

    // --- stylesheet ---------------------------------------------------------
    // Replaces the three-keyframe tag of 0.9.x: the ZZZ cut needs masks, blend
    // modes and one hover state, none of which belong in an inline style object.
    const CSS = `
      ::selection{background:#2F6BFF;color:#F2F6FF}
      ::-moz-selection{background:#2F6BFF;color:#F2F6FF}

      @keyframes dshf-pulse{0%,100%{opacity:.35}50%{opacity:1}}

      /* the eye: Fairy-DSH's own mascot stylesheet ---------------------------- */
      /* client/fairy-mascot.port.js is the source; it is spliced above and its
         CSS is concatenated here so the bundle still ships one style tag. */
      ${FairyMascotPort.CSS}

      /* 0.21.0: in a conversation the glow reaches HALF as far; the blank session
         keeps the full halo (user: 「空白会话的fairy不变，非空白会话的fairy光晕范围
         缩小50%」). Both placements are the same seat and the same plate, so the
         difference has to be staged by the host's own phase attribute — the same
         cue the blank-session rules below use.
         Scaling the halo layer is not an option: the lines are 0.62 viewBox units
         thin, so at 50% they fall below a pixel and the field simply disappears.
         The layer therefore keeps its own size and is masked instead — fully
         visible to the disc's edge, then fading to nothing at 1.4R. The shipped
         tail fades at ~1.8R, so the glow past the disc goes 0.8R -> 0.4R (half).
         Geometry: the layer box is 754 x 464 px around a 232 px eye, the eye sits
         at 50% / 46.875% of it, and the fade ends 142 px out (18.8% of the box's
         width, 30.6% of its height: the box is not square, so the gradient has to
         be an ellipse to stay a circle around the eye).
         The rim ring is scaled by 0.934 about its own centre, which halves the part
         of it that reaches past the disc (10 viewBox units -> 5). */
      [data-content-phase]:not([data-content-phase="hero"]) .dsh-fairy-halo-layer{
        -webkit-mask-image:radial-gradient(ellipse 18.8% 30.6% at 50% 46.875%,#000 0 72%,transparent 100%);
        mask-image:radial-gradient(ellipse 18.8% 30.6% at 50% 46.875%,#000 0 72%,transparent 100%)}
      [data-content-phase]:not([data-content-phase="hero"]) .dsh-fairy-outer-halo{
        transform-box:fill-box;transform-origin:center;transform:scale(.934)}

      .dshf-fairy-eye{display:block;position:relative;flex:none;line-height:0;overflow:visible}

      /* stage ---------------------------------------------------------------- */
      .dshf-fx{position:fixed;pointer-events:none;z-index:0}
      .dshf-dots{
        inset:0;opacity:.10;
        background-image:radial-gradient(rgba(127,212,255,.34) 1px,transparent 1.3px);
        background-size:7px 7px;
        -webkit-mask-image:radial-gradient(135% 95% at 50% 118%,#000 0%,transparent 62%);
        mask-image:radial-gradient(135% 95% at 50% 118%,#000 0%,transparent 62%);
      }
      .dshf-bloom{
        inset:0;
        background:
          radial-gradient(58% 42% at 65% 14%,rgba(47,107,255,.20),transparent 70%),
          radial-gradient(46% 38% at 24% 104%,rgba(127,212,255,.10),transparent 72%);
      }
      .dshf-scan{
        inset:0;opacity:.42;mix-blend-mode:multiply;
        background:repeating-linear-gradient(180deg,rgba(0,0,0,.20) 0 1px,transparent 1px 3px);
      }
      .dshf-vig{
        inset:0;
        background:radial-gradient(120% 100% at 50% 50%,transparent 56%,rgba(2,4,10,.58) 100%);
      }
      .dshf-mark{width:15px;height:15px;opacity:.55;border:0 solid ${WARN}}
      /* 0.24.6: no layer asks for any of the four any more (see STAGE_LAYERS); the
         rules stay so re-seating a corner mark is a one-line change. */
      .dshf-mark.is-tl{top:12px;left:12px;border-top-width:1.5px;border-left-width:1.5px}
      .dshf-mark.is-tr{top:12px;right:12px;border-top-width:1.5px;border-right-width:1.5px}
      .dshf-mark.is-bl{bottom:12px;left:12px;border-bottom-width:1.5px;border-left-width:1.5px}
      .dshf-mark.is-br{bottom:12px;right:12px;border-bottom-width:1.5px;border-right-width:1.5px}

      /* the H.D.D. plate the eye sits in ------------------------------------- */
      /* 0.16.0: overflow stays visible — the mascot's halo, pulse ring and glitch
         slices paint outside its box, which is what makes it read as an eye and
         not a button. The plate itself is still clipped by its own radius. */
      .dshf-tile{position:relative;display:grid;place-items:center;overflow:visible;
        background:radial-gradient(circle at 50% 38%,#123174 0%,#08122A 58%,#04060B 100%);
        border:1px solid rgba(127,212,255,.30);
        box-shadow:0 0 18px rgba(47,107,255,.38),inset 0 0 14px rgba(47,107,255,.26)}

      /* 0.12.0: the big H.D.D. panel in the conversation column's bottom-left --
         a zero-size absolute anchor (its offsetParent is the composer card, which
         is what the component measures) plus a fixed-size plate the component pins
         above the card, against the column's left edge. pointer-events:none keeps
         the whole chat clickable underneath. */
      .dshf-corner-anchor{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none}
      /* 0.15.0: no frame, no name — the plate is just the fixed-size box the mascot
         sits in. Whatever halo you see is the SVG's own outer-halo gradient.
         0.19.0: the eye is draggable, so the plate has to take the pointer — but only
         inside the drawn disc: border-radius:50% makes the square's corners
         click-through, which is what keeps the chat text around it selectable, and
         every child stays pointer-events:none so the SVG never becomes the target. */
      .dshf-corner-plate{position:fixed;width:240px;height:240px;
        display:grid;place-items:center;z-index:1;
        background:none;border:0;box-shadow:none;
        pointer-events:auto;cursor:grab;border-radius:50%;touch-action:none;
        user-select:none;-webkit-user-select:none}
      .dshf-corner-plate>*{pointer-events:none}
      .dshf-corner-plate.is-dragging{cursor:grabbing}
      .dshf-corner-plate.is-dragging .dshf-fairy-eye{filter:brightness(1.12)}
      .dshf-tile::after{content:'';position:absolute;inset:0;pointer-events:none;
        background:linear-gradient(180deg,rgba(242,243,245,.18),transparent 42%);
        mix-blend-mode:screen}
      .dshf-tile-sm{width:30px;height:30px;border-radius:8px}

      /* the eye's seats ------------------------------------------------------ */
      /* 0.16.0: the Fairy-DSH mascot replaces both the 1:1 footage (three small
         seats) and the 0.14.0 CSS approximation (the corner). The port's own
         stylesheet is above; these rules only place the box. */
      .dshf-corner-plate .dshf-fairy-eye{pointer-events:none}

      /* 0.17.0: the blank session is the conversation frame, with one difference —
         the big eye in the middle of the conversation column. The shell vertically
         centers its hero chrome (justify-content:center on the scroll body); the
         hero seat is now silent (HeroQuiet), so pushing the composer stack to the
         bottom leaves a blank session reading like a conversation that has no
         messages yet. The eye itself is the corner plate, placed at the measured
         centre of "right of the sidebar, above the input box" (the component sets
         --dshf-blank-eye-x/y from the column and the composer seat) and scaled 1.5x
         — same seat, same instance, no second Fairy. Both rules key off the host's
         own data attributes (data-content-phase, data-conversation-scroll), never a
         hashed CSS-module class name. */
      [data-content-phase="hero"] [data-conversation-scroll]{justify-content:flex-end!important}
      [data-content-phase="hero"] .dshf-corner-plate{
        left:var(--dshf-blank-eye-x,50vw)!important;right:auto!important;
        top:var(--dshf-blank-eye-y,50vh)!important;bottom:auto!important;
        transform:translate(-50%,-50%) scale(var(--dshf-blank-eye-scale,1.5));
        transform-origin:center;
        /* 0.19.0: the blank page's eye is the page, not a handle — no grab cursor and
           no hit area, so the hero composition stays untouched */
        cursor:default;pointer-events:none}

      /* the H.D.D. title band (0.22.0) --------------------------------------- */
      /* Every number below is measured off the card itself (819 x 236 crop of the
         H.D.D. title screen: cap height 37 px, wordmark ink 727 px wide) and then
         expressed as a fraction of the band's own width, so one --dshf-hdd-w
         resizes the whole thing:
           wordmark        cap height 0.0476 W (font 0.0685 W of Archivo Black,
                           cap 0.70 em), tracking -0.097 em, ink 0.936 W
           subtitle        glyphs 0.35 caps, pitch 0.0721 W (2.7 em of the subtitle's
                           own size); its row sits 0.164 em (of its own size) below
                           the wordmark's box and the stack below it starts 0.37 em
                           lower than the card's tightest value, because on this
                           page that row read cramped between the two English lines
           rules           1.5 px on the reference, 0.53 em past the wordmark on
                           each side, ~0.35 of white
           mirror stack    first copy's ink starts 1.54 caps from the cap top,
                           each copy is the SAME size as the wordmark (1:1, no
                           stretch), pitch 0.467 em = 2/3 of a row, so consecutive
                           rows overlap by 1/3; six copies, no horizontal drift
         The face is inlined and subsetted rather than borrowed from the system:
         measured against the card, Segoe UI Black — the closest installed font —
         needs -4.5% tracking and still reads rounder, while Archivo Black lands
         within 1% on ink width, cap height and ink/cap ratio (19.6 vs 19.65).
         The band hangs off the measured eye centre — the disc's drawn radius plus
         a 9% gap, both written by the component from the stage it measured — and
         is the same fixed-position trick the plate uses. "display:none" elsewhere:
         a conversation gets the eye only. */
      .dshf-hdd-band{display:none}
      /* the wordmark face: 20 glyphs, 1.1 KB, inlined (see HDD_FACE above) */
      @font-face{font-family:"dshf-hdd-wordmark";font-style:normal;font-weight:900;
        src:url(${HDD_FACE}) format("woff2")}
      /* the subtitle face: Noto Sans SC 700, the six characters only (2.4 KB,
         see HDD_FACE_CJK). YaHei Light is far too thin under a Black wordmark;
         this is the same kind of geometric gothic as the Latin face. */
      @font-face{font-family:"dshf-hdd-cjk";font-style:normal;font-weight:700;
        src:url(${HDD_FACE_CJK}) format("woff2")}
      /* The component writes both numbers inline from the measured stage; these are
         the fallbacks for the first paint, before it has measured anything. */
      .dshf-corner-anchor{--dshf-hdd-w:min(520px,calc(100vw - 360px));--dshf-hdd-drop:203px}
      [data-content-phase="hero"] .dshf-hdd-band{
        display:block;position:fixed;z-index:1;pointer-events:none;
        left:var(--dshf-blank-eye-x,50vw);
        top:calc(var(--dshf-blank-eye-y,50vh) + var(--dshf-hdd-drop,203px));
        transform:translateX(-50%);
        width:var(--dshf-hdd-w,min(520px,calc(100vw - 360px)));
        font-size:calc(var(--dshf-hdd-w,520px) * .0685);
        line-height:1;font-weight:900;color:#DBDFE2;letter-spacing:-.097em;
        font-family:"dshf-hdd-wordmark","Segoe UI","Segoe UI Variable Display",system-ui,
          -apple-system,"Helvetica Neue",Arial,sans-serif;
        -webkit-font-smoothing:antialiased}
      /* a stage too short to hold the wordmark under the eye keeps the band off
         rather than letting it run into the composer (the component measures this) */
      .dshf-corner-anchor[data-hdd-band="tight"] .dshf-hdd-band{display:none}
      .dshf-hdd-wordwrap{position:relative}
      .dshf-hdd-word{display:block;text-align:center;white-space:nowrap;font:inherit}
      /* The mirror stack: six 1:1 copies of the wordmark — same face, same size, no
         stretch and no horizontal drift — each flipped about its own top
         (scaleY(-1), origin top) and pushed down by --dshf-echo-t, so a copy lands
         at [t - 1 em, t] and its ink at [t - 0.91 em, t - 0.175 em]. The stack
         starts 0.37 em below the wordmark's box, leaving the subtitle row air on
         both sides; then the pitch is 0.467 em, i.e. 2/3 of one mirrored row, so each row
         tucks 1/3 under the next. The last row's ink ends 4.41 em under the cap top,
         which is what the 3.42 em container holds. Opacity steps down six times
         (0.20 → 0.06) and the blur ramps from 0 to 0.093 em — sharp at the top,
         soft at the bottom — so the trail reads as one falloff, not six lines.
         The blur is in em, not px: it has to scale with the band, or a small
         window turns the whole trail into grey mush. */
      .dshf-hdd-refl{
        position:absolute;left:0;top:calc(100% + .11em);width:100%;height:3.84em;overflow:hidden}
      .dshf-hdd-echo{
        position:absolute;left:0;top:0;width:100%;display:block;
        font:inherit;text-align:center;white-space:nowrap;
        transform:translateY(var(--dshf-echo-t,1.245em)) scaleY(-1);
        transform-origin:top left}
      .dshf-hdd-echo:nth-child(1){--dshf-echo-t:1.245em;opacity:.2;filter:blur(0)}
      .dshf-hdd-echo:nth-child(2){--dshf-echo-t:1.712em;opacity:.17;filter:blur(.015em)}
      .dshf-hdd-echo:nth-child(3){--dshf-echo-t:2.179em;opacity:.14;filter:blur(.032em)}
      .dshf-hdd-echo:nth-child(4){--dshf-echo-t:2.646em;opacity:.11;filter:blur(.053em)}
      .dshf-hdd-echo:nth-child(5){--dshf-echo-t:3.113em;opacity:.085;filter:blur(.073em)}
      .dshf-hdd-echo:nth-child(6){--dshf-echo-t:3.58em;opacity:.06;filter:blur(.093em)}
      /* the hairlines + 空 洞 深 潜 系 统 between them. The subtitle is 0.29 of the
         wordmark's size and its letters sit 2.7 em apart — on the card the six
         characters are nearly a third of the band wide, far apart, and much lighter
         than the wordmark. The last letter-space is taken back with margin-right so
         the row stays centred. */
      .dshf-hdd-sub{
        display:flex;align-items:center;gap:.8em;margin-top:.164em;
        font-size:.292em;font-weight:700;line-height:1;color:#B8BECE;
        letter-spacing:2.7em;
        font-family:"dshf-hdd-cjk","Noto Sans SC","Microsoft YaHei",sans-serif}
      .dshf-hdd-sub i{flex:1;height:1px;
        background:linear-gradient(90deg,rgba(158,170,215,.30),rgba(158,170,215,.42))}
      .dshf-hdd-sub i:last-child{
        background:linear-gradient(90deg,rgba(158,170,215,.42),rgba(158,170,215,.30))}
      .dshf-hdd-sub em{font-style:normal;margin-right:-2.7em;white-space:nowrap}

      /* nameplate + tape ----------------------------------------------------- */
      .dshf-brand{display:flex;flex-direction:column;gap:2px;line-height:1.1;min-width:0}
      .dshf-brand b{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;
        letter-spacing:.22em;color:#F2F3F5}
      .dshf-brand b i{width:13px;height:3px;background:${WARN};transform:skewX(-18deg);
        box-shadow:0 0 9px rgba(255,213,46,.65)}
      .dshf-brand>span{font-size:9px;letter-spacing:.02em;color:#8FB0DE;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

      /* 0.24.0: the brand becomes the blank page's wordmark band, without the mirror
         stack ---------------------------------------------------------------- */
      /* Same construction as .dshf-hdd-band above — wordmark, hairlines and the six
         character subtitle between them — shrunk into the brand row and stripped of
         the echoed copies. The width is the wordmark's own ink: the column is
         max-content, so the subtitle row (the cross axis) stretches to exactly that
         and the two hairlines take what the six characters leave. Both faces are
         already declared for the page band, so the mark adds no request and no bytes.
         The plate rules above and .dshf-brand are deliberately left alone: rolling
         this back is restoring the previous SidebarBrand / SidebarEye, nothing else. */
      /* 0.24.4: the band grows until its edges sit on the new-session button's (user:
         「将左上角图标放大到与目前的『新会话』按钮对齐」). One number does it: the ink
         scales linearly with the wordmark's font size — 13 px drew 181.8 px and the
         button is 252 px wide, so 18 px draws 251.7 px — and the subtitle grows with
         it (8 -> 10 px) so the pair keeps its proportion. The max-width cap had to go
         with it: the slot is 244 px wide (24 px in from the column's edge) and the
         button 252 px, so clamping the box made the wordmark overflow its own
         hairlines instead of centring in them. The two host boxes around the band are
         hard-wired to 24 px tall and clip, hence the override below. Below ~276 px of
         sidebar the row's own overflow starts clipping the wordmark's ends; the
         default 280 px is the width this was drawn at. */
      /* 0.24.5: the band sizes itself from the sidebar instead of a fixed 18 px (user:
         「有点太大了，超过了……与最窄状态的侧边栏宽度对齐」, with the wordmark's H and M
         clipped at the narrow end). The host clamps the sidebar to 264..420 px, so an
         18 px wordmark (252 px ink) was 12 px too wide at the narrow end — 236 px is
         all that fits there. 100cqw is the name span, the band's containing block
         (228 px at a 264 px sidebar), so (100cqw + 8px) * .0715 solves
         ink = spanWidth + 8 = the new-session button's width at every width: 236 px
         at 264 (2 px inside the row's 240 px), 252 px at 280, 392 px at 420. The
         .0715 is 1/13.985, the measured ink per px of the wordmark's own face; the
         subtitle and the gap are in em so they follow the wordmark. container-type on
         the span is what makes cqw resolve — the span keeps its flex:1 width, so the
         containment does not collapse it. */
      .dshf-brandwide{display:flex;flex-direction:column;gap:.28em;width:max-content;
        line-height:1;transform:translateX(-6px);
        font-size:calc((100cqw + 8px) * .0715)}
      /* 0.24.2: the band is centred in the sidebar, not left-aligned in it (user:
         「左上角的图标居中，现在太靠左了」). Two pieces, because the host hands the
         brand row to a button whose spans are both content-sized:
           1. the has() selector reaches the two host spans the band sits in. Both are
              content-sized, so justify-content:center alone would have nothing
              to centre in; flex:1 1 auto makes them take the row's width first.
              The selector is our own class, never a hashed CSS-module name — the
              same rule the rest of this stylesheet follows.
           2. the -6 px covers the row's asymmetry: the name span starts 24 px in
              (12 px sidebar padding + 4 px row padding + the 8 px slot gap) and ends
              12 px short of the column (the sidebar padding), so a centred box still
              sits sidebarWidth/2 + 6 px from the left. Before 0.24.3 the toggle ate
              28 px + 8 px of the row's right side and this offset was +12 px.
              The offset is a constant, not a snapshot of one width, which matters
              because the sidebar is resizable (the host ships a drag handle): at
              360 px the same two rules still put the centre on 180.
         Measured at 1440x900, 280 px column: band 14.2..265.9, centre 139.9 against
         a column centre of 140 (0.24.4 grew the band to the new-session button's
         width, so it is the same centre with a wider box). */
      span:has(.dshf-brandwide){flex:1 1 auto;justify-content:center;min-width:0;
        container-type:inline-size}
      /* 0.24.4: the host sizes the brand row's two boxes to 24 px and clips them; the
         band is 33 px now, so both are opened up. The button also has to stop clipping
         sideways: its box starts 2 px right of the band's left edge. */
      [data-slot="sidebar"] [data-window-drag] > button:first-child{
        overflow:visible!important;height:auto!important}
      span:has(.dshf-brandwide){height:auto}
      .dshf-brandwide b{display:block;text-align:center;white-space:nowrap;
        font:900 1em/1 "dshf-hdd-wordmark","Segoe UI","Segoe UI Variable Display",
          system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;
        letter-spacing:-.09em;color:#DBDFE2;-webkit-font-smoothing:antialiased;
        transform:translateZ(0)}
      .dshf-brandwide span{display:flex;align-items:center;gap:6px;
        font-family:"dshf-hdd-cjk","Noto Sans SC","Microsoft YaHei",sans-serif;
        font-size:.556em;font-weight:700;line-height:1;color:#B8BECE;letter-spacing:.38em;
        transform:translateZ(0)}
      .dshf-brandwide span i{flex:1;height:1px;
        background:linear-gradient(90deg,rgba(158,170,215,.30),rgba(158,170,215,.42))}
      .dshf-brandwide span i:last-child{
        background:linear-gradient(90deg,rgba(158,170,215,.42),rgba(158,170,215,.30))}
      /* the tracking's trailing space is left in on purpose: pulling it back with a
         negative margin would tighten the right hairline's gap and break the pair */
      .dshf-brandwide span em{font-style:normal;white-space:nowrap}
      /* 0.24.9: the whole sidebar reads in HarmonyOS for BOTH scripts (user:
         「侧边栏的中英文也要相应改动 … 指的是工作区下面的文字」, then 「新会话 / 插件 /
         设置 也要改」). Its Latin still came from Bahnschrift, so after 0.24.7 moved
         the Chinese the sidebar kept the old look — and the project rows are mostly
         English names, which is exactly where it showed. Declaring it on the slot
         covers nav, list, footer and our own tape in one rule; the .dshf-brandwide
         wordmark names its own faces, so the top-left icon is untouched. Chinese in
         the nav was already resolving to HarmonyOS through the global fallback, so
         what actually changes here is the Latin (H.D.D. chip, sidebar captions).
         Undo = delete this one rule. */
      [data-slot="sidebar"]{
        font-family:"HarmonyOS Sans SC","PingFang SC","Microsoft YaHei",sans-serif}
      /* 0.24.10: the H.D.D. status chip leaves the sidebar footer and joins the VOICE
         plate's corner as its upper twin (user: 「把左边的HDD放到右侧voice上面，且外框
         形状改成与voice相同」). Same plate recipe as .dshf-voice-corner — 7 px radius,
         1 px inset border, dark gradient, same shadow — so the two read as one cluster;
         the parallelogram skew is gone with it. 45 px = 14 px inset + the 25 px VOICE
         plate + a 6 px gap, the same gap the sidebar toggle uses 84 px out. Undo =
         restore this rule and the one below it.
         0.24.18: the whole stack steps up one row (76 -> 107) because the mode chip
         now sits directly under VOICE (see the mode-chip rule further down). Undo =
         put 107 back to 76 and the VOICE row back to 45.
         0.24.20: one row again (107 -> 138) for the merged view chip. */
      .dshf-tape{position:fixed;right:14px;bottom:169px;z-index:10050;
        width:64.4px;height:25px;box-sizing:border-box;justify-content:center;
        display:inline-flex;align-items:center;gap:6px;padding:0;
        border-radius:7px;border:1px solid rgba(127,212,255,.22);
        background:linear-gradient(180deg,rgba(9,16,34,.90),rgba(5,8,18,.90));
        box-shadow:0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)}
      /* 0.24.11: the VOICE plate is two layers — the plate, then the button's own
         filled box inside it (rgba(127,212,255,.16), 3 px radius, inset 2 px). The
         chip was a single layer, which is what still read as "not the same" (user:
         「voice内部有填充。HDD也改成一样」). Same numbers, drawn by a pseudo-element
         so the markup stays one div: inset 2 px lands its box 3 px in from the plate
         edge (1 px border + 2 px), exactly where the VOICE button's box starts. The
         padding goes 10 -> 11 px so the dot and label land on the same 12 px the
         VOICE button's do; the 7 px vertical keeps the pair at a matching 25 px. */
      .dshf-tape::before{content:'';position:absolute;inset:2px;border-radius:3px;
        background:rgba(127,212,255,.16);pointer-events:none}
      .dshf-tape>*{position:relative;z-index:1;transform:none}
      .dshf-tape-text{font-size:9px;letter-spacing:.22em;color:#CFE4FF;line-height:1}
      /* 0.24.16: the dot must not shrink. Both chips are pinned boxes now, and a flex
         item defaults to flex-shrink:1 — so on a machine whose VOICE label rounds a
         few px wider (a fallback face, a different zoom), the fixed 58.4 px button
         squeezed the 6 px dot down to nothing instead of letting the label overflow
         into its 9 px padding. That is what made the breathing light "disappear"
         (user: 「voice前面的呼吸灯怎么没了」); flex:none keeps it exactly 6 px. */
      .dshf-dot{width:6px;height:6px;border-radius:999px;background:#7FD4FF;flex:none;
        box-shadow:0 0 8px #7FD4FF;animation:dshf-pulse 2.4s ease-in-out infinite}
      .dshf-dot.is-on{background:${WARN};box-shadow:0 0 8px rgba(255,213,46,.9)}

      /* the balance strip above the sidebar's 设置 row ----------------------- */
      /* 0.25.0 (user: 「在【设置】上方展示余额，今日已用和峰/谷价时间。注意要美观，
         符合fairy的风格。做最小版本方便回滚」).
         Placement: the host's sidebar foot is one flex column —
         regionArea (flex:1) then footArea [ footerActions, settingsArea ] — and the
         footer's action row ships height:0, because the only thing in it (the skin's
         H.D.D. chip) is position:fixed. The strip is NOT fixed: it is laid out in
         that action row and the two rows around it are switched to height:auto, so
         the footer grows by the strip's own height and regionArea gives that space
         up. No session row can therefore scroll under the strip (measured with the
         20-session list expanded: the list scroller's clientHeight drops by exactly
         the strip's outer height, and the last row ends above it).
         Both selectors are structural — a div that holds the footer slot as its
         child or grandchild — never one of the host's hashed CSS-module names.
         Recipe is the corner chips' plate (7 px radius, 1 px .22 border, navy
         gradient, same shadow) so the skin keeps one plate language; only the inner
         box differs — a flat .05 wash instead of the chips' .16 fill, because this
         one carries two rows of text rather than a label.
         Per the skin's rules: values are #EAF4FF / #CFE4FF on the dark plate, the
         peak lamp is the H.D.D. cyan and the peak state switches to the warning
         amber #FFD52E — both are the palette's own semantic colours, hardcoded
         here exactly like .dshf-dot.is-on above. Undo = delete this whole block
         and the slots.inject for fairy-balance. */
      div:has(> div > [data-slot="sidebar.footer.action"]){height:auto!important}
      div:has(> [data-slot="sidebar.footer.action"]){height:auto!important;
        flex-direction:column;align-items:stretch}
      .dshf-balance{box-sizing:border-box;width:calc(100% + 4px);
        margin:6px -2px 4px;display:flex;flex-direction:column;gap:5px;
        position:relative;
        padding:8px 10px 9px;border-radius:7px;
        border:1px solid rgba(127,212,255,.22);
        background:linear-gradient(180deg,rgba(9,16,34,.92),rgba(5,8,18,.92));
        box-shadow:0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05);
        font-family:"HarmonyOS Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
        color:#CFE4FF;line-height:1}
      .dshf-balance::before{content:'';position:absolute;inset:2px;border-radius:3px;
        background:rgba(127,212,255,.05);pointer-events:none}
      .dshf-balance>*{position:relative;z-index:1}
      .dshf-balance-head,.dshf-balance-foot{display:flex;align-items:baseline;
        gap:8px;min-width:0}
      /* 0.26.1 readable labels (user: 「左下方余额条的文字太小太细，看不清。可以稍微
         加大加粗一些的。做个最小版本看看效果」). Only the four small text runs move —
         the plate, the rows, the meter and every selector stay exactly as they were:
           key      9 px / 400 / .18em #8FA3C4  ->  10 px / 600 / .14em #A9BCD9
           amount  15 px / 600                 ->  16 px / 700
           bands   9 px / 400 / .16em          ->  10 px / 600 / .12em
           today  11 px / 400                  ->  12 px / 600
           when    9 px / 400 / .1em  #8FA3C4  ->  10 px / 500 / .08em #A9BCD9
         The tracking is pulled back by about the same ratio the size grows, so the two
         rows keep their measured width and nothing needs re-laying-out. The two greys
         step one shade brighter (#A9BCD9 is the same hue as #8FA3C4, +14 % luminance)
         because "太细看不清" was a contrast complaint as much as a size one. Undo =
         restore the five declarations from client.js.bak-20261030-035939-balancelg. */
      .dshf-balance-key{font-size:10px;font-weight:600;letter-spacing:.14em;
        color:#A9BCD9;flex:none}
      .dshf-balance-amount{font-size:16px;font-weight:700;color:#EAF4FF;
        font-variant-numeric:tabular-nums;letter-spacing:.02em;flex:none;
        text-shadow:0 0 12px rgba(127,212,255,.28)}
      .dshf-balance-bandstate{margin-left:auto;display:inline-flex;align-items:center;
        gap:5px;flex:none;font-size:10px;font-weight:600;letter-spacing:.12em;color:#9FD9F7;
        padding:2px 6px;border-radius:3px;background:rgba(127,212,255,.12)}
      .dshf-balance-bandstate.is-peak{color:${WARN};
        background:rgba(255,213,46,.12)}
      .dshf-balance-lamp{width:5px;height:5px;border-radius:999px;flex:none;
        background:#7FD4FF;box-shadow:0 0 7px #7FD4FF;
        animation:dshf-pulse 2.4s ease-in-out infinite}
      .dshf-balance-bandstate.is-peak .dshf-balance-lamp{background:${WARN};
        box-shadow:0 0 7px rgba(255,213,46,.9)}
      .dshf-balance-today{font-size:12px;font-weight:600;color:#DCE8FA;
        font-variant-numeric:tabular-nums;flex:none}
      .dshf-balance-when{margin-left:auto;font-size:10px;font-weight:500;
        letter-spacing:.08em;color:#A9BCD9;flex:none;font-variant-numeric:tabular-nums;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      /* one 24 h rule: the two peak windows sit where they do on the clock, the
         marker is now. Under a valley-all-day calendar the bands stay drawn but
         hollow — the day is cheap regardless of the hour. */
      /* 0.26.2 the chart stops borrowing the warning colour (user: 「这个黄色看起来太
         突兀了，你想想如何改配色比较符合当前皮肤的整体配色。做个最小版本方便回滚」).
         Why the amber read as an intrusion rather than as data: this skin spends
         cyan for structure (H.D.D. #7FD4FF everywhere) and reserves amber #FFD52E /
         rose #FF5C7A for "something is wrong" — the 高峰 chip's lamp, the VOICE
         off-lamp. 70 px of amber under two rows of white-on-navy text was an alert
         colour used as furniture, and it was the only warm hue on the plate.
         So the meter keeps ONE hue and encodes the price by how much of it there is
         — valley = dim cyan rail, peak = the same cyan, lit:
           valley rail  rgba(127,212,255,.12) -> .10
           peak span    rgba(255,213,46,.55)  -> rgba(127,212,255,.80)   (lit cyan)
           hollow span  amber .16 / .28       -> cyan .14 / .26, valley-all-day only
           now marker   cyan / amber by state -> ice white #EAF4FF in BOTH states,
                        because a cyan tick disappears on a lit cyan band. #EAF4FF is
                        the amount's own white, so nothing new enters the palette.
         .58 was tried first and read as grey — over the navy plate 58 % of a cyan
         only reaches a slate mid-tone; 80 % is where it reads as "lit" without
         going to a solid bar. The 高峰 chip keeps its amber on purpose: it is 5 px
         of lamp + two glyphs, and it is the one place where "expensive" *is* a
         warning. Undo = restore the five declarations from
         client.js.bak-20261030-121545-cyanramp. */
      .dshf-balance-meter{position:relative;height:3px;margin-top:1px;border-radius:999px;
        background:rgba(127,212,255,.10)}
      .dshf-balance-span{position:absolute;top:0;bottom:0;
        background:rgba(127,212,255,.80);border-radius:999px}
      .dshf-balance-meter.is-valley-all-day .dshf-balance-span{
        background:rgba(127,212,255,.14);box-shadow:inset 0 0 0 1px rgba(127,212,255,.26)}
      .dshf-balance-now{position:absolute;top:-2px;width:2px;height:7px;border-radius:1px;
        background:#EAF4FF;box-shadow:0 0 6px #7FD4FF;transform:translateX(-1px)}
      /* same white at peak, but the halo turns white: on a lit cyan band a cyan glow
         has nothing to glow against, so the tick separates by temperature instead. */
      .dshf-balance-now.is-peak{background:#EAF4FF;box-shadow:0 0 8px rgba(234,244,255,.9)}
      .dshf-balance.is-idle .dshf-balance-amount,
      .dshf-balance.is-idle .dshf-balance-today{color:#77879F}
      /* the rail is 56 px wide and its 设置 seat collapses to a 36 px square: the
         strip would land on top of it (same stand-down the open-with chip uses),
         and it is page furniture, so it also steps aside for an open dialog. */
      body:has([data-sidebar-collapsed]) .dshf-balance{display:none!important}
      body:has([role="dialog"]) .dshf-balance,
      body:has(dialog[open]) .dshf-balance{opacity:0;pointer-events:none}

      /* the 设置 row wears the same plate as the strip above it ---------------- */
      /* 0.26.0 (user: 「下面设置的这一块也模仿刚才做的余额条，做成一个风格类似的条，
         不然太突兀了。做最小版本方便回滚」). CSS only — no DOM, no JS: the row the
         host already draws (div:has(> [data-slot="settings.launcher"]), the same
         element that carries --dshf-settingsrow) gets the strip's own recipe: 7 px
         radius, navy gradient, the 1 px .22 border, the .05 inner wash and the same
         drop shadow. The border is an INSET SHADOW rather than a border so the row
         keeps its measured 42 px and nothing below it moves (the host's row is
         calc(100% + 4px) wide with -2 px margins, so the two plates end on the same
         10..270 edge).
         The host's own button inside paints --dsw-alias-interactive-bg-hover on
         hover; that is a blue .14 wash in this skin and would double up on the
         plate, so it is made transparent and the feedback moves to the row itself
         (border brightens to .42, plate lifts a step). Undo = delete this block;
         the row returns to the host's bare ghost look. */
      div:has(> [data-slot="settings.launcher"]){
        border-radius:7px;
        background:linear-gradient(180deg,rgba(9,16,34,.92),rgba(5,8,18,.92));
        box-shadow:inset 0 0 0 1px rgba(127,212,255,.22),
          0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)}
      div:has(> [data-slot="settings.launcher"])::before{
        content:'';position:absolute;inset:2px;border-radius:3px;
        background:rgba(127,212,255,.05);pointer-events:none}
      /* Expanded rail only: the host's own button keeps its 36 px square, its zero
         padding and its hover fill while the sidebar is collapsed (there the other
         rail icons are bare, so a plate around 设置 would be the odd one out). */
      body:not(:has([data-sidebar-collapsed])) div:has(> [data-slot="settings.launcher"]) > * > button{
        border-radius:7px;background:transparent!important;padding-left:10px!important}
      body:has([data-sidebar-collapsed]) div:has(> [data-slot="settings.launcher"]){
        background:none;box-shadow:none}
      body:has([data-sidebar-collapsed]) div:has(> [data-slot="settings.launcher"])::before{
        content:none}
      div:has(> [data-slot="settings.launcher"]):hover{
        background:linear-gradient(180deg,rgba(13,24,48,.94),rgba(6,10,22,.94));
        box-shadow:inset 0 0 0 1px rgba(127,212,255,.42),
          0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)}

      /* the voice switch in the page's bottom-right corner ------------------- */
      /* 0.18.0: the rail above the composer is deleted; this plate is all that
         is left of it, and it is out of the composer's flow (VoiceCorner portals
         it onto <body>), so the composer column loses the 34 px row for good.
         z-index sits above the floating mascot widget that owns the same corner
         (9999): the chip has to stay visible and clickable there. */
      /* 0.24.15: the plate is pinned to the same 64.4 x 25 box the other two chips
         use (user: 「长度明明不一致啊」). Until now it was content-sized — plate =
         2 px padding + the VOICE button, and that button's label width depends on how
         the 9 px Bahnschrift-SemiCondensed label and its 1.44 px tracking round, which
         is not the same in every browser/zoom. Pinning the box makes the three chips
         equal by construction instead of by coincidence; 64.4 - 2 borders - 4 padding
         is exactly the 58.4 px the button needs, so nothing is clipped.
         0.24.18: 45 -> 76 px, one row up, because the mode chip takes the row
         directly under this plate. Undo = put 45 back here and 107 -> 76 on the chip
         above.
         0.24.20: 76 -> 107 px, one row again for the merged view chip. */
      .dshf-voice-corner{position:fixed;right:14px;bottom:138px;z-index:10050;
        width:64.4px;height:25px;box-sizing:border-box;
        display:flex;align-items:center;padding:2px;border-radius:7px;
        border:1px solid rgba(127,212,255,.22);
        background:linear-gradient(180deg,rgba(9,16,34,.90),rgba(5,8,18,.90));
        box-shadow:0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)}
      /* the inner button is pinned too (58.4 = 64.4 - 2 borders - 4 padding), so a
         label that rounds wider in another browser/zoom centres inside the plate
         instead of pushing the plate itself wider */
      /* 0.24.17: VOICE takes the H.D.D. chip's own numbers, so the two chips differ
         by their letters alone — lamp, face, fill and frame included (user: 「把右侧
         voice的外观修改到和HDD完全一致的样子，即外观上看只有字母不同」). The plate
         was already shared (0.24.10-0.24.15); what was still the button's own, one
         line each: the
         always-on inner fill (the chip draws .16 with ::before, the button only
         carried it while the switch was ON), the chip's HarmonyOS face (the button
         inherited the skin's Bahnschrift, so the two labels were set in different
         type), its .22em tracking (1.98 px at 9 px; the button had .16em = 1.44),
         its 6 px dot gap (was 5) and its #CFE4FF label (was #AEBBD4, and #BFE6FF
         while on). Horizontal padding goes 9 -> 0 px so the label keeps the chip's
         centred position inside the 58.4 px button instead of overflowing its
         38.4 px content box. Undo = this block plus the rule right below it. */
      .dshf-voice-corner .dshf-btn{border-color:transparent;padding:4px 0;
        width:58.4px;box-sizing:border-box;justify-content:center;
        gap:6px;background:rgba(127,212,255,.16);color:#CFE4FF;
        font-family:"HarmonyOS Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
        letter-spacing:.22em}
      /* the chip is static, so VOICE gets no hover and no on-state paint: both stay
         at the resting values above, which is what makes the pair identical. Nothing
         in the plate says which way the switch is any more — the state lives on the
         button's title (and only there). */
      .dshf-voice-corner .dshf-btn:hover,
      .dshf-voice-corner .dshf-btn.dshf-btn-on,
      .dshf-voice-corner .dshf-btn.dshf-btn-on:hover{
        background:rgba(127,212,255,.16);color:#CFE4FF;border-color:transparent}
      /* ...and its lamp is the chip's lamp at every setting — the same #7FD4FF with
         the same 8 px halo, breathing on the same 2.4 s keyframes (user: 「呼吸灯的
         颜色也要一样，都是HDD的蓝色」). The yellow .dshf-dot.is-on stays declared
         for anything else that wants an on-lamp; only the VOICE corner overrides it.
         (No backticks anywhere in this stylesheet: it is one template literal.) */
      .dshf-voice-corner .dshf-dot.is-on{
        background:#7FD4FF;box-shadow:0 0 8px #7FD4FF}
      /* 0.24.22: the lamp is blue while the switch is on and red while it is off (user:
         「【voice】开启时外观保持现状，关闭时呼吸灯变为红色」). Only the OFF colour changes:
         the halo takes the same red and the 2.4 s breathing (from .dshf-dot) stays, so the
         chip still reads as a live lamp — a muted one. The red is the skin's own error
         token (#FF5C7A = --dsw-alias-label-error / the *_danger alias), not an invented
         colour. Scoped to the corner: the H.D.D. chip's dot carries no .is-on and has to
         stay blue. Undo = delete this rule and the off lamp goes back to blue. */
      .dshf-voice-corner .dshf-dot:not(.is-on){
        background:#FF5C7A;box-shadow:0 0 8px #FF5C7A}
      /* page furniture, not a modal: while a dialog is open (the settings panel is
         one) it stands down instead of floating over it. The :has() selector keys
         off the host's own ARIA role, so a hashed class rename cannot unstyle it. */
      body:has([role="dialog"]) .dshf-voice-corner,
      body:has([role="dialog"]) .dshf-tape,
      body:has(dialog[open]) .dshf-voice-corner,
      body:has(dialog[open]) .dshf-tape{opacity:0;pointer-events:none}

      /* the HOST's sidebar toggle in the page's bottom-right corner -------------- */
      /* 0.24.3: the toggle leaves the brand row and joins the corner cluster as the
         second chip, in the VOICE plate's own style (user: 「将『收起侧边栏』的按钮放到
         右下角，风格与右下角的 voice 一致」). The selector stays structural: the sidebar
         slot wrapper is one of the host's own data attributes and the toggle is the
         drag row's last button (the brand is the first). No hashed CSS-module name,
         so a host class rename cannot leave the chip in the corner.
         Both sidebar states keep it there: collapsed, this chip is the only way back
         out (the rail's top-left button was empty since 0.24.0 emptied the Fairy
         mark seat, so nothing is lost there).
         0.24.12: it drops BELOW the VOICE plate (user: 「把侧边栏按钮挪到voice下方」), so
         the corner is now one vertical stack hung off the same 14 px inset:
         toggle 14, VOICE 45, H.D.D. 76 — each slot 25 px tall + the 6 px gap the rest
         of the cluster uses. The plate recipe was already VOICE's; what was missing
         was VOICE's inner box, so the toggle gets the same ::before the H.D.D. chip
         got (2 px inset, 3 px radius, the .16 fill) with the glyph lifted above it.
         The placement needs !important to beat the host's own positioning in its
         collapsed and windows-titlebar variants. */
      /* 0.24.26: the right sidebar's toggle joins the corner stack as the row BELOW this
         one (user: 「把右上方的右侧边栏按钮挪到右下角的【左侧边栏】按钮下方，套用
         【左侧边栏】的外观」), so it wears the same plate. The two share every declaration
         — recipe, inner box, hover, glyph size, dialog stand-down — and differ only in
         their bottom, which the rule right after this one sets.
         Undo = delete this block and the three :not() overrides below, and put
         45/76/107/138/169 back to 14/45/76/107/138. */
      [data-slot="conversation.session.header.corner"] > button{
        position:fixed!important;left:auto!important;top:auto!important;
        right:14px!important;bottom:14px!important;
        width:64.4px!important;height:25px!important;padding:0!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        border:1px solid rgba(127,212,255,.22)!important;border-radius:7px!important;
        background:linear-gradient(180deg,rgba(9,16,34,.90),rgba(5,8,18,.90))!important;
        box-shadow:0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)!important;
        color:#CFE4FF!important;z-index:10050}
      [data-slot="sidebar"] [data-window-drag] > button:last-child{
        position:fixed!important;left:auto!important;top:auto!important;
        right:14px!important;bottom:14px!important;
        width:64.4px!important;height:25px!important;padding:0!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        border:1px solid rgba(127,212,255,.22)!important;border-radius:7px!important;
        background:linear-gradient(180deg,rgba(9,16,34,.90),rgba(5,8,18,.90))!important;
        box-shadow:0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)!important;
        color:#CFE4FF!important;z-index:10050}
      /* the left toggle held the bottom row until now; it steps up one slot, so the pair
         reads (top to bottom) … 创造模式 / 左侧边栏 / 右侧边栏 */
      [data-slot="sidebar"] [data-window-drag] > button:last-child{
        bottom:45px!important}
      [data-slot="sidebar"] [data-window-drag] > button:last-child::before,
      [data-slot="conversation.session.header.corner"] > button::before{
        content:'';position:absolute;inset:2px;border-radius:3px;
        background:rgba(127,212,255,.16);pointer-events:none}
      [data-slot="sidebar"] [data-window-drag] > button:last-child:hover,
      [data-slot="conversation.session.header.corner"] > button:hover{
        background:linear-gradient(180deg,rgba(18,32,58,.92),rgba(7,12,26,.92))!important;
        border-color:rgba(127,212,255,.45)!important;color:#EAF4FF!important}
      /* collapsed, the host keeps its panel glyph behind a hover (the mark that used
         to sit in front of it is the seat 0.24.0 emptied); without this the chip
         would be an empty plate in the rail */
      [data-slot="sidebar"] [data-window-drag] > button:last-child > svg,
      [data-slot="conversation.session.header.corner"] > button > svg{
        display:inline-flex!important;width:15px!important;height:15px!important;
        position:relative;z-index:1}
      /* page furniture like VOICE: it stands down while a dialog is open */
      body:has([role="dialog"]) [data-slot="sidebar"] [data-window-drag] > button:last-child,
      body:has([role="dialog"]) [data-slot="conversation.session.header.corner"] > button,
      body:has(dialog[open]) [data-slot="sidebar"] [data-window-drag] > button:last-child,
      body:has(dialog[open]) [data-slot="conversation.session.header.corner"] > button{
        opacity:0;pointer-events:none}

      /* the two sidebar toggles take VOICE's breathing lamp --------------------- */
      /* 0.24.33: both corner toggles get the same 6 px breathing lamp as VOICE
         (user: 「右下的左右侧边栏也加上呼吸灯，外观套用VOICE。默认保持蓝色，点击后变为
         红色，再点击变回蓝色」). Blue is the resting state; red is the state after the
         click, read off the host's own frame attributes instead of any script:
         - the left toggle's click collapses the rail, and the frame then carries
           data-sidebar-collapsed (measured), so the lamp is red exactly while the rail is
           collapsed;
         - the right toggle's click opens the right panel — but the host UNMOUNTS that
           button while the panel is open (measured: the corner slot's innerHTML is empty
           and a 收起右侧边栏 control appears inside the panel), so its chip cannot show
           the state it just switched on. The rule is still here, keyed on the missing
           data-rightbar-collapsed attribute, so the chip is red the moment the host keeps
           it mounted; today it stays blue and the chip simply disappears while open.
         0.24.34: the lamp is taken OUT of the flex flow and pinned, because these two
         chips carry a 15 px glyph instead of a label: centred as a pair the lamp landed at
         x 1380 while the four label chips' lamps sit at x 1369 (user: 「刚才的两个蓝色
         呼吸灯要左对齐。如图呼吸灯没有对齐」). Pinned at the same 1369 px — 6.4 px into
         the padding box, i.e. 7.4 px from the chip's border box — and vertically centred
         in the 23 px content box, so all six lamps share one column while the glyph stays
         where it was.
         Undo = delete this block; both chips lose the lamp and the 6 px gap. */
      [data-slot="sidebar"] [data-window-drag] > button:last-child,
      [data-slot="conversation.session.header.corner"] > button{
        gap:6px!important}
      [data-slot="sidebar"] [data-window-drag] > button:last-child::after,
      [data-slot="conversation.session.header.corner"] > button::after{
        position:absolute;left:6.4px;top:8.5px;
        content:'';width:6px;height:6px;border-radius:999px;
        background:#7FD4FF;box-shadow:0 0 8px #7FD4FF;
        animation:dshf-pulse 2.4s ease-in-out infinite}
      /* red: the rail is collapsed (left) / the right panel is open (right) */
      body:has([data-sidebar-collapsed]) [data-slot="sidebar"] [data-window-drag] > button:last-child::after,
      body:has([data-conversation-tabs]):not(:has([data-rightbar-collapsed]))
        [data-slot="conversation.session.header.corner"] > button::after{
        background:#FF5C7A;box-shadow:0 0 8px #FF5C7A}

      /* the 打开方式 control, now on the sidebar's 设置 row ---------------------- */
      /* 0.24.27: the header's 打开方式 split button (文件资源管理器 + the dropdown
         chevron) left the header for the corner stack. 0.24.31 it leaves the stack again
         and sits to the RIGHT of the sidebar's 设置 row (user: 「把右侧的【打开方式】按钮
         挪到左侧【设置】的右侧，并且将外观调整为与【设置】相似的风格」):
         - the row is 42 px tall at the bottom of the sidebar (measured 848..890 in a
           900 px window), and it is CONTENT-sized inside the rail, so a fixed right:
           offset would follow the window instead of the sidebar. The row itself becomes
           an anchor and the chip hangs off its right edge, centred on it;
         - 设置's own look is a bare ghost row — transparent, no border, radius 8, the
           16 px icon in the theme's text colour — so the plate, the .16 inner box and the
           blue palette are gone and the folder glyph is lifted to 16 px. The chevron
           stays: the two halves are still separate buttons.
         The corner stack closes the vacated row: everything above 打开方式 drops 31 px.
         Undo = restore this block from the backup; the stack rows move back up. */
      div:has(> [data-slot="settings.launcher"]){anchor-name:--dshf-settingsrow}
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]){
        position:fixed!important;top:auto!important;bottom:auto!important;
        position-anchor:--dshf-settingsrow;
        left:calc(anchor(--dshf-settingsrow right) - 84px);right:auto!important;
        top:auto!important;bottom:16px!important;z-index:10050;
        width:50px!important;height:30px!important;padding:0!important;box-sizing:border-box!important;
        display:flex!important;align-items:center!important;justify-content:flex-end!important;
        border:0!important;border-radius:8px!important;
        background:transparent!important;box-shadow:none!important;
        color:rgb(242,243,245)!important}
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target])::before{
        content:none!important}
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]) > div{
        width:auto!important;height:100%!important;
        border:0!important;border-radius:0!important;background:none!important;
        box-shadow:none!important;display:flex!important;
        align-items:center!important;justify-content:flex-end!important}
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]) > div::before,
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]) > div::after{
        display:none!important}
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]) > div > button{
        height:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;
        border:0!important;border-radius:8px!important;background:none!important;box-shadow:none!important;
        padding:0 6px!important;color:inherit!important;cursor:pointer}
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]) > div > button:hover{
        background:rgba(255,255,255,.07)!important}
      [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]) img{
        width:16px!important;height:16px!important}
      /* the collapsed rail is 56 px wide and its 设置 seat is a 36 px square; the two
         sidebar chips would land right on top of it (measured: 打开方式 at -4..46, ⋯ at
         16..46), so they stand down with the rail. Undo = delete this rule. */
      body:has([data-sidebar-collapsed]) [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]),
      body:has([data-sidebar-collapsed]) [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])){
        display:none!important}
      /* page furniture like the rest of the stack: away for an open dialog */
      body:has([role="dialog"]) [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]),
      body:has(dialog[open]) [data-slot="conversation.session.header.utilities"] > span:has([data-open-target]){
        opacity:0;pointer-events:none}

      /* the 更多操作 button, now on the sidebar's 设置 row ------------------------ */
      /* 0.24.28: the header's ⋯ button (下载 Session 日志 / 反馈) was the last thing left in
         the header's utility row. 0.24.32 it leaves the corner stack for the 设置 row, to
         the RIGHT of 打开方式, so 设置 / 打开方式 / ⋯ read as one row (user: 「将右侧的三点
         按钮，挪到左侧【打开】的右侧，并且将外观调整为与【设置】相似的风格，使得这三个
         按钮在同一行」):
         - it is the only utility button that does not carry data-open-target, so
           :not(:has(...)) stays the structural handle;
         - same anchor as 打开方式 (the 设置 row), 30 px wide so it ends exactly on the
           row's right edge, and 打开方式 steps left 84 px to make room;
         - 设置's ghost look: transparent, no border, radius 8, theme text colour.
         Its menu is position:absolute with top:32px INSIDE this span, so the flip to
         bottom:100% is what keeps it on screen from this seat.
         Undo = restore this block from the backup; the stack rows move back up. */
      [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])){
        position:fixed!important;top:auto!important;
        position-anchor:--dshf-settingsrow;
        left:calc(anchor(--dshf-settingsrow right) - 30px);right:auto!important;
        bottom:16px!important;z-index:10050;
        width:30px!important;height:30px!important;padding:0!important;box-sizing:border-box!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        border:0!important;border-radius:8px!important;
        background:transparent!important;box-shadow:none!important;
        color:rgb(242,243,245)!important}
      [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target]))::before{
        content:none!important}
      [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])) > button{
        width:100%!important;height:100%!important;padding:0!important;
        border:0!important;border-radius:8px!important;background:none!important;box-shadow:none!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        color:inherit!important;cursor:pointer}
      [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])) > button:hover{
        background:rgba(255,255,255,.07)!important}
      [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])) > button > svg{
        width:15px!important;height:15px!important;position:relative;z-index:1}
      [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])) > [role="menu"]{
        top:auto!important;bottom:calc(100% + 6px)!important;
        left:auto!important;right:0!important}
      body:has([role="dialog"]) [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])),
      body:has(dialog[open]) [data-slot="conversation.session.header.utilities"] > span:not(:has([data-open-target])){
        opacity:0;pointer-events:none}

      /* the mode display, moved into the corner stack ------------------------- */
      /* 0.24.18: the session header's preset label (「创造模式」/「标准模式」) leaves the
         header's action row and takes the row directly under the VOICE plate (user:
         「把最上方的模式显示挪到voice的下面，外观套用voice的」), wearing the corner's
         recipe: the same 64.4 x 25 plate, the same 2 px padding and 2 px-inset inner
         box, the same 9 px HarmonyOS #CFE4FF label, and the chip's breathing lamp in
         place of the host's 14 px preset glyph (hidden, not removed, so the icon is
         back the moment this block goes). The selector stays structural — the slot is
         the host's own data-slot attribute and the preset label is its child span, so
         no hashed CSS-module name is involved. The label is display-only (its title
         carries the preset's description), so nothing here has to stay clickable.
         Tracking is the one number that does NOT come over: .22em is the Latin chips'
         spacing (H.D.D. / VOICE), and four full-width CJK glyphs at that tracking fill
         the 58.4 px content box edge to edge — measured, the lamp then sat 4 px off
         the other three while the label hugged the right border. .03em brings the
         label to the chip's own 37 px ink, so the lamp lands on the same 7.7 px the
         H.D.D. chip's does.
         Undo = delete this block and its stand-down rule, then put 45/107 back on the
         two chips above. */
      [data-slot="conversation.session.header.actions"] > span{
        position:fixed!important;left:auto!important;top:auto!important;
        right:14px!important;bottom:76px!important;z-index:10050!important;
        width:64.4px!important;height:25px!important;padding:2px!important;margin:0!important;
        box-sizing:border-box!important;display:inline-flex!important;
        align-items:center!important;justify-content:center!important;gap:6px!important;
        border:1px solid rgba(127,212,255,.22)!important;border-radius:7px!important;
        background:linear-gradient(180deg,rgba(9,16,34,.90),rgba(5,8,18,.90))!important;
        box-shadow:0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)!important;
        color:#CFE4FF!important;font-size:9px!important;line-height:1!important;
        letter-spacing:.03em!important;white-space:nowrap!important;overflow:visible!important;
        font-family:"HarmonyOS Sans SC","PingFang SC","Microsoft YaHei",sans-serif!important}
      /* the inset box the other three chips draw. z-index -1 is safe here: the plate is
         fixed with a z-index, so it is a stacking context and the fill lands above the
         plate's own gradient but under the label (an in-flow text node cannot be lifted
         the way the chips lift their span children). */
      [data-slot="conversation.session.header.actions"] > span::before{
        content:'';position:absolute;inset:2px;border-radius:3px;z-index:-1;
        background:rgba(127,212,255,.16);pointer-events:none}
      /* the host's preset glyph gives way to the corner's lamp; order:-1 puts the lamp
         in front of the label even though ::after comes last in the box */
      [data-slot="conversation.session.header.actions"] > span > svg{display:none!important}
      [data-slot="conversation.session.header.actions"] > span::after{
        content:'';order:-1;flex:none;width:6px;height:6px;border-radius:999px;
        background:#7FD4FF;box-shadow:0 0 8px #7FD4FF;
        animation:dshf-pulse 2.4s ease-in-out infinite}
      /* page furniture like the rest of the stack: away for an open dialog */
      body:has([role="dialog"]) [data-slot="conversation.session.header.actions"] > span,
      body:has(dialog[open]) [data-slot="conversation.session.header.actions"] > span{
        opacity:0;pointer-events:none}

      /* the session view tabs, merged into one corner chip ---------------------- */
      /* 0.24.20: 「对话」/「轨迹」 leave the header's tab row and become ONE chip directly
         under the VOICE plate (user: 「将左上的【对话】和【轨迹】合并为一个按钮，放到
         【voice】下面，外观参考【voice】」). CSS cannot weld two buttons into one, so the
         two tabs are stacked on the same plate and hit-tested through each other: the
         SELECTED one is the one painted (z-index 2, pointer-events:none so it never
         swallows the click) and the unselected one sits underneath with transparent
         text, where the click actually lands and switches the view. The chip therefore
         shows the view you are in and still toggles when clicked — which is what the two
         tabs did together, in one box.
         The plate, the inner box, the lamp, the face and the label's left edge are the
         corner's numbers (lamp at 7.7 px, label ink starting at 20 px, like the four
         chips above). Undo = delete this block and put 107/138 back to 76/107. */
      [data-conversation-tabs]{
        position:fixed!important;right:14px!important;bottom:107px!important;z-index:10050!important;
        width:64.4px!important;height:25px!important;padding:2px!important;margin:0!important;
        box-sizing:border-box!important;display:block!important;overflow:visible!important;
        border:1px solid rgba(127,212,255,.22)!important;border-radius:7px!important;
        background:linear-gradient(180deg,rgba(9,16,34,.90),rgba(5,8,18,.90))!important;
        box-shadow:0 8px 20px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,243,245,.05)!important}
      [data-conversation-tabs]::before{
        content:'';position:absolute;inset:2px;border-radius:3px;
        background:rgba(127,212,255,.16);pointer-events:none}
      /* the chip's lamp. 6.7 px inside the padding box = the 7.7 px the four chips above
         put their dot on */
      [data-conversation-tabs]::after{
        content:'';position:absolute;left:6.7px;top:50%;translate:0 -50%;
        width:6px;height:6px;border-radius:999px;background:#7FD4FF;
        box-shadow:0 0 8px #7FD4FF;animation:dshf-pulse 2.4s ease-in-out infinite}
      /* both tabs fill the plate; only the selected one shows its label (the unselected
         one is transparent but still the hit target), and the active tab's blue
         underline is dropped with the border */
      [data-conversation-tabs] > button{
        position:absolute!important;left:0!important;top:0!important;right:0!important;bottom:0!important;
        display:flex!important;align-items:center!important;padding:0 0 0 17.4px!important;margin:0!important;
        border:0!important;border-radius:3px!important;background:none!important;
        font-family:"HarmonyOS Sans SC","PingFang SC","Microsoft YaHei",sans-serif!important;
        font-size:9px!important;line-height:1!important;letter-spacing:.03em!important;
        white-space:nowrap!important}
      [data-conversation-tabs] > button::before,
      [data-conversation-tabs] > button::after{display:none!important}
      [data-conversation-tabs] > button[aria-selected="true"]{
        z-index:2;color:#CFE4FF!important;pointer-events:none!important}
      [data-conversation-tabs] > button[aria-selected="false"]{
        z-index:1;color:transparent!important}
      /* 0.24.21: the chip prints ONE fixed label, 对话/轨迹, instead of the view you are
         in (user: 「把该按钮文本的【对话】改为【对话/轨迹】」). Neither tab's own text is
         painted any more: the selected one hides its text with font-size:0 and prints
         the pair through ::before (which the rule above switched off together with the
         tab underline, hence the explicit display), and the unselected one stays
         transparent because it is still the click target.
         Five glyphs + the lamp do not fit at the chips' 6 px gap: 7.7 + 6 + 6 leaves
         19.7 px for the label and the string is 41.9 px wide, which would hang over the
         inner box's edge. The gap goes 6 -> 4 px (label starts at 17.4) so the string
         ends 4 px short of the border, like the four chips above. Undo = delete this
         rule set; the chip goes back to naming the view it is in. */
      [data-conversation-tabs] > button[aria-selected="true"]::before{
        display:inline-block!important;content:'对话/轨迹';
        font-size:9px!important;letter-spacing:.03em!important;color:#CFE4FF!important}
      [data-conversation-tabs] > button[aria-selected="true"]{font-size:0!important}
      /* 0.24.23: the chip's lamp is blue on 对话 and red on 轨迹 (user: 「在【对话】时外观
         保持现状，在【轨迹】时呼吸灯变为红色」). CSS cannot read the label text, so this
         keys off the host's own state instead: 轨迹 is the tablist's second button and
         aria-selected is what the host flips. Same red as the VOICE off-lamp (#FF5C7A,
         the skin's error token), same 8 px halo, same 2.4 s breathing — only the colour
         changes. Since 0.24.21 made the label fixed, this lamp is now the chip's only
         state read-out. Undo = delete this rule and both views keep the blue lamp. */
      [data-conversation-tabs]:has(> button:nth-of-type(2)[aria-selected="true"])::after{
        background:#FF5C7A;box-shadow:0 0 8px #FF5C7A}
      /* 0.24.24: the session title leaves the header (user: 「左上角显示标题的部分删除，没有
         意义」). It is the breadcrumb nav only — the header's utility buttons on the right
         (更多打开方式 / 更多操作) stay where the host puts them. Structural on purpose: the
         slot is the host's own data attribute and the crumbs are the only nav in it, so no
         hashed class and no Chinese aria-label is involved (that label is localised).
         Undo = delete this rule and the title comes back. */
      [data-slot="conversation.session.header"] nav{display:none!important}
      /* ...and with the title gone the header would keep a 76 px strip with an empty left
         half (the host pins height 76, min-height 76 and a 65 px tab row), so it is
         collapsed to the one row that is still used: 41 px = 10 px padding + the
         utilities' 30 px row + the 1 px rule. All three host values have to move, hence
         the three declarations. Scoped with :has so the blank page's own header is
         untouched. Undo = delete this rule; the header goes back to the 76 px strip. */
      header:has([data-conversation-tabs]){height:auto!important;min-height:0!important;
        grid-template-rows:auto!important}
      /* 0.24.30: the strip itself goes, so the conversation starts at the very top of the
         window (user: 「最上方的阻碍还在，也可以去掉…内容可以顶着网页的最顶端」). The
         40 px left over was 10 px padding + the 30 px title row, and every in-flow child
         of that row is either hidden (the crumbs) or position:fixed (all the chips), so
         zeroing both leaves nothing behind. The header element itself has to keep
         rendering — the corner stack, the view chip and the task trigger are its
         descendants — hence 0 px rather than display:none. Scoped with :has so the blank
         page's header, which still carries a real title row, is untouched.
         Undo = delete this rule; the strip comes back (40 px). */
      header:has([data-conversation-tabs]){padding:0!important;grid-template-rows:0!important}
      /* 0.24.29: the hairline under the header goes too (user: 「可以把最上方那根横线去掉
         了，上方的按钮都被我挪走了」). It is the header's own 1 px bottom border
         (rgb(38,53,92)); nothing else draws a line there (measured: no other 1 px strip
         within 3 px of the header's bottom edge). Scoped with :has so the blank page's
         header keeps its divider. Undo = delete this rule, the line comes back. */
      header:has([data-conversation-tabs]){border-bottom:0!important}
      /* page furniture like the rest of the stack: away for an open dialog */
      body:has([role="dialog"]) [data-conversation-tabs],
      body:has(dialog[open]) [data-conversation-tabs]{
        opacity:0;pointer-events:none}

      /* the background-task display, moved into the composer's bottom bar ------- */
      /* 0.24.19: the header's background-task trigger («1 个后台任务运行中», 148 px of
         spinner + sentence + caret) leaves the header row and joins the statistics line
         under the composer (user: 「将后台任务显示放到最下面如图所示的栏里」), keeping
         the host's own look — that line's items are 12 px, rgb(126,143,176), no plate.
         Two things move it without touching the host's markup:
         (1) the line is a CENTRED, content-sized flex row, so it slides 112 px left
             when the sidebar collapses — a fixed right: offset would drift off it. So
             the row itself becomes a CSS anchor (anchor-name on the row that owns the
             conversation.composer.dock slot) and the chip hangs off its right edge with
             the row's own 12 px gap. Chrome 125+ only; the whole block is behind
             @supports, so a browser without anchor positioning keeps the chip in the
             header exactly as the host drew it.
         (2) the host's panel is position:absolute with top:33px INSIDE this wrapper, so
             it opens downward — off the bottom of the window from this row (measured:
             panel lands at y 914 in a 900 px window, i.e. invisible). Flipping it to
             bottom:100% inside the same wrapper is the whole fix (user: 「点击时内容
             向下显示改为向上显示」), and right-aligning it keeps it on screen.
         No backticks in this stylesheet: it is one template literal.
         Undo = delete this block. */
      @supports ((anchor-name: --dshf-dockrow) and (position-anchor: --dshf-dockrow)){
        div:has(> [data-slot="conversation.composer.dock"]){anchor-name:--dshf-dockrow}
        [data-slot="conversation.session.header.actions"] > div{
          position:fixed!important;right:auto!important;bottom:auto!important;
          position-anchor:--dshf-dockrow;
          /* bottom-aligned, not centre-aligned: the line's own items sit on its bottom
             edge (measured 874..896 inside a 870..896 row), so this lands the chip on
             their band instead of 2 px above it */
          left:anchor(--dshf-dockrow right);top:anchor(--dshf-dockrow bottom);
          translate:0 -100%;margin:0 0 0 12px;z-index:10050;
          height:22px!important;align-items:center!important;display:inline-flex!important}
        [data-slot="conversation.session.header.actions"] > div > button{
          height:22px!important;min-height:0!important;padding:0!important;margin:0!important;
          display:inline-flex!important;align-items:center!important}
        /* the panel opens UP, and hangs off the chip's right edge so its 500 px stay
           inside the window */
        [data-slot="conversation.session.header.actions"] > div > ul{
          top:auto!important;bottom:calc(100% + 6px)!important;
          left:auto!important;right:0!important}
      }

      /* buttons -------------------------------------------------------------- */
      .dshf-btn{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:3px;
        border:1px solid rgba(127,212,255,.24);background:transparent;color:#AEBBD4;
        font-size:9px;letter-spacing:.16em;line-height:1;cursor:pointer;
        font-family:inherit;transition:background .14s ease,color .14s ease,border-color .14s ease}
      .dshf-btn:hover{background:rgba(127,212,255,.12);color:#EAF4FF;
        border-color:rgba(127,212,255,.45)}
      .dshf-btn:focus-visible{outline:1.5px solid ${WARN};outline-offset:2px}
      .dshf-btn-on{border-color:rgba(127,212,255,.60);background:rgba(127,212,255,.16);color:#BFE6FF}
      .dshf-voice-row{display:inline-flex;align-items:center;gap:4px}

      /* a 240 px panel in the column's left gutter needs the room; on a narrow or
         very short window it would sit on the message text, so it stands down --- */
      @media (max-width:1180px), (max-height:620px){
        .dshf-corner-plate{display:none !important}
      }
      /* ...but on a blank session that plate *is* the page, so there it stays —
         the stage centre is measured, so it does not compete with messages. A short
         window has less stage: one size down rather than spilling onto the composer */
      @media (max-width:1180px), (max-height:620px){
        [data-content-phase="hero"] .dshf-corner-plate[data-blank-eye="ready"]{
          display:grid!important;--dshf-blank-eye-scale:1.2}
      }

      /* the pack's stills take over when the OS asks for less motion ---------- */
      @media (prefers-reduced-motion: reduce){
        .dshf-dot,.dshf-fairy-eye *{animation:none !important}
      }
    `

    // --- plugin ------------------------------------------------------------
    // `sidebar.brand.name` reports -1 as its priority. The shell registers its own
    // occupant of that single slot at priority 0, and a single slot throws on a
    // same-priority second registration — the throw lands inside `slots.inject`,
    // is contained, and the shipped brand simply keeps rendering. That is what
    // silently ate the FAIRY nameplate; -1 is the documented way to shadow it
    // ("lowest renders"). Both single-slot seats below need it.
    const SHADOW = -1

    return {
      inject: ['theme', 'slots', 'sessions'],
      apply(ctx) {
        ctx.effect(
          () => ctx.theme.register({ id: THEME_ID, colorScheme: 'dark', tokens: { ...TOKENS } }),
          'dsh-fairy: register H.D.D. theme',
        )

        // 0.16.0: the eye's expression follows the selected session (Fairy-DSH's
        // own projection). `sessions` is a shell client service; when the row is
        // missing or the snapshot is stale the store stays `normal`.
        ctx.effect(() => {
          activityStore = createActivityStore(ctx.sessions)
          return () => {
            activityStore?.dispose()
            activityStore = null
          }
        }, 'dsh-fairy: session activity projection')

        ctx.effect(() => {
          try {
            if (!window.localStorage.getItem(PIN_KEY)) {
              window.localStorage.setItem(PIN_KEY, '1')
              ctx.theme.setTheme(THEME_ID)
            }
          } catch (error) {
            // storage unavailable: keep the user's preference
          }
        }, 'dsh-fairy: pin H.D.D. theme once')

        // A registered theme id is never persisted (only light/dark/system are),
        // so the host settings sync re-adopts `preference: dark` on every boot and
        // the one-time pin above loses: the skin painted the shipped palette with
        // nothing but its grid on top. A token override layer is the path a skin
        // is supposed to take — it stacks the H.D.D. values over whichever theme
        // is active instead of fighting the user's appearance choice.
        ctx.effect(() => {
          const service = ctx.theme
          if (typeof service.overrideTokens !== 'function') return undefined
          const pairs = {}
          for (const [name, value] of Object.entries(TOKENS)) pairs[name] = { light: value, dark: value }
          return service.overrideTokens('dsh-fairy', pairs)
        }, 'dsh-fairy: stack the H.D.D. palette over the active theme')

        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-fairy'
          tag.textContent = CSS
          document.head.appendChild(tag)
          return () => tag.remove()
        }, 'dsh-fairy: stylesheet')

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            { name: 'shell.overlay', id: 'fairy-stage', order: 100 },
            FairyStage,
          ),
        )

        // Fairy's plate replaces the shipped whale mark in the brand row
        ctx.slots.inject('sidebar.brand.mark', () =>
          ctx.slots.register(
            { name: 'sidebar.brand.mark', id: 'fairy-brand-eye', priority: SHADOW },
            SidebarEye,
          ),
        )

        // the sidebar brand name becomes Fairy's nameplate
        ctx.slots.inject('sidebar.brand.name', () =>
          ctx.slots.register(
            { name: 'sidebar.brand.name', id: 'fairy-brand-name', priority: SHADOW },
            SidebarBrand,
          ),
        )

        // H.D.D. tape beside the settings entry at the sidebar foot
        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            { name: 'sidebar.footer.action', id: 'fairy-status', order: 10 },
            SidebarStatus,
          ),
        )

        // 0.25.0: the read-only balance strip above the 设置 row. A list slot keeps
        // the H.D.D. chip and this strip independent; the strip positions itself
        // against the row (CSS anchor), so the zero-height footer row is untouched.
        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            { name: 'sidebar.footer.action', id: 'fairy-balance', order: 20 },
            BalanceCard,
          ),
        )

        // 0.17.0: no mark in the hero headline any more — this seat only quiets the
        // shell's centered hero chrome so the blank session keeps the conversation
        // frame (see HeroQuiet). Still `priority: -1`: it has to out-rank the
        // shipped whale mark to be the node the quieting is measured from.
        ctx.slots.inject('conversation.hero.brand.mark', () =>
          ctx.slots.register(
            { name: 'conversation.hero.brand.mark', id: 'fairy-hero-quiet', priority: SHADOW },
            HeroQuiet,
          ),
        )

        // 0.18.0: the H.D.D. rail above the composer is deleted. This dock row is
        // still claimed — the slot is the only seat that hands the component the
        // live session id, which is what the voice stream needs — but the
        // component renders nothing into the row: it portals the corner VOICE
        // switch onto <body> instead (see VoiceCorner).
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'fairy-voice-corner', order: 10 },
            VoiceCorner,
          ),
        )

        // 0.11.0: the big eye on the composer's bottom-left corner. `input.left` is
        // a real list slot inside the card's tool row; the plate itself is
        // absolutely positioned (the card is its containing block) and carries
        // pointer-events:none, so the "+" row and the input stay untouched.
        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            { name: 'conversation.input.left', id: 'fairy-corner-eye', order: 5 },
            GutterEye,
          ),
        )

        // "speak this reply" inside the assistant action strip; the slot passes
        // the finalized message id and the session gives us the lookup key.
        ctx.slots.inject('conversation.chat.assistant-actions', () =>
          ctx.slots.register(
            {
              name: 'conversation.chat.assistant-actions',
              id: 'fairy-voice-action',
              order: 20,
              inject: (sessionId) => ({ sessionId }),
            },
            VoiceAction,
          ),
        )

        // A live reply can start before the first click inside the composer, and
        // browsers keep an AudioContext suspended until a user gesture.
        ctx.effect(() => {
          const unlock = () => {
            audio.unlock()
          }
          document.addEventListener('pointerdown', unlock)
          document.addEventListener('keydown', unlock)
          return () => {
            document.removeEventListener('pointerdown', unlock)
            document.removeEventListener('keydown', unlock)
            live.close()
            audio.stop()
          }
        }, 'dsh-fairy: voice stream lifecycle')
      },
      // exposed for the sample scripts — inert at runtime
      preview: {
        TOKENS,
        EYE_SIZE,
        STAGE_LAYERS,
        CSS,
        MASCOT: FairyMascotPort,
        // 0.25.0: the pure half of the balance strip, so scripts/test_client.mjs can
        // pin the peak calendar and the money format without a browser.
        balance: {
          url: BALANCE_URL,
          fallbackUrl: BALANCE_FALLBACK_URL,
          peakHours: PEAK_HOURS,
          valleyDays: VALLEY_DAYS,
          isPeakAt,
          peakWindowAt,
          nextBandChange,
          moneyText,
          beijingDay,
        },
        activity: {
          createStore: createActivityStore,
          deriveActivity: deriveSessionActivity,
          deriveComfort: deriveSessionComfort,
          classifyComfortMessage,
        },
        components: {
          FairyEye,
          SidebarEye,
          HeroQuiet,
          GutterEye,
          HDDBand,
          SidebarBrand,
          SidebarStatus,
          BalanceCard,
          VoiceCorner,
          VoiceToggle,
          VoiceAction,
          FairyStage,
        },
      },
    }
  },
})
