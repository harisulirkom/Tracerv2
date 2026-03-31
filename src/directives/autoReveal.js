const INIT_CLASS = 'scroll-reveal-init'
const IN_CLASS = 'scroll-reveal-in'
const DEFAULT_SELECTORS = 'section, article, [data-scroll-reveal]'
const REVEAL_PRESETS = {
  normal: {
    threshold: 0.1,
    rootMargin: '0px 0px -6% 0px',
    delayStep: 48,
    delayMax: 288,
  },
  snappy: {
    threshold: 0.08,
    rootMargin: '0px 0px -3% 0px',
    delayStep: 34,
    delayMax: 204,
  },
}

const hasCustomAnimation = (el) => {
  if (!(el instanceof HTMLElement)) return false
  return Array.from(el.classList).some((className) => className.startsWith('animate-'))
}

const shouldSkip = (el) => {
  if (!(el instanceof HTMLElement)) return true
  if (el.dataset.scrollRevealIgnore !== undefined) return true
  if (el.closest('[data-scroll-reveal-ignore]')) return true
  if (hasCustomAnimation(el)) return true
  if (el.classList.contains(INIT_CLASS) || el.classList.contains(IN_CLASS)) return true
  return false
}

const collectTargets = (host, selectors) => {
  if (!(host instanceof HTMLElement)) return []
  const targetSet = new Set()
  const routeRoots = Array.from(host.children).filter((node) => node instanceof HTMLElement)

  routeRoots.forEach((root) => {
    Array.from(root.children).forEach((child) => {
      if (child instanceof HTMLElement) targetSet.add(child)
    })
    root.querySelectorAll(selectors).forEach((node) => {
      if (node instanceof HTMLElement) targetSet.add(node)
    })
  })

  return Array.from(targetSet).filter((target) => !shouldSkip(target))
}

const getRevealPreset = () => {
  if (typeof document === 'undefined') return REVEAL_PRESETS.normal
  const preset = document.documentElement?.dataset?.motionPreset
  return REVEAL_PRESETS[preset] || REVEAL_PRESETS.normal
}

const autoRevealDirective = {
  mounted(el, binding) {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const options = binding?.value || {}
    const selectors = options.selectors || DEFAULT_SELECTORS
    const revealPreset = getRevealPreset()
    const observed = new WeakSet()
    let rafId = null

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const target = entry.target
          target.classList.add(IN_CLASS)
          observer.unobserve(target)
        })
      },
      {
        threshold: revealPreset.threshold,
        rootMargin: revealPreset.rootMargin,
      },
    )

    const applyTargets = () => {
      const targets = collectTargets(el, selectors)
      targets.forEach((target, index) => {
        if (observed.has(target)) return
        observed.add(target)
        target.classList.add(INIT_CLASS)
        target.style.setProperty(
          '--reveal-delay',
          `${Math.min((index % 8) * revealPreset.delayStep, revealPreset.delayMax)}ms`,
        )
        observer.observe(target)
      })
    }

    const scheduleApply = () => {
      if (rafId != null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = null
        applyTargets()
      })
    }

    const mutationObserver = new MutationObserver(() => {
      scheduleApply()
    })

    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
    })

    scheduleApply()

    el.__autoRevealCleanup = () => {
      if (rafId != null) cancelAnimationFrame(rafId)
      mutationObserver.disconnect()
      observer.disconnect()
    }
  },
  unmounted(el) {
    if (typeof el.__autoRevealCleanup === 'function') {
      el.__autoRevealCleanup()
      delete el.__autoRevealCleanup
    }
  },
}

export default autoRevealDirective
