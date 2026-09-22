const noop = () => {};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getScrollLimit = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

const getAnchorTarget = (hash) => {
	if (hash === '#') return 0;
	if (!hash || !hash.startsWith('#')) return null;

	let id;
	try {
		id = decodeURIComponent(hash.slice(1));
	} catch {
		id = hash.slice(1);
	}

	return document.getElementById(id);
};

const isFormControl = (element) =>
	element instanceof Element &&
	(element.matches('input, textarea, select, button, video, audio, [contenteditable="true"]') ||
		element.closest('button, input, textarea, select, summary, [contenteditable="true"]'));

const hasScrollableParent = (element, deltaY) => {
	let parent = element instanceof Element ? element : null;

	while (parent && parent !== document.body && parent !== document.documentElement) {
		const styles = getComputedStyle(parent);
		const canScroll = /(auto|scroll|overlay)/.test(styles.overflowY) && parent.scrollHeight > parent.clientHeight;

		if (canScroll) {
			const atTop = parent.scrollTop <= 0;
			const atBottom = parent.scrollTop + parent.clientHeight >= parent.scrollHeight - 1;

			if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
		}

		parent = parent.parentElement;
	}

	return false;
};

const updateHash = (hash) => {
	if (!hash || window.location.hash === hash) return;

	if (hash === '#') {
		window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
		return;
	}

	window.history.pushState(null, '', hash);
};

const bindAnchorLinks = (scrollToTarget) => {
	const links = [...document.querySelectorAll('a[href^="#"]')];

	const handleClick = (event) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}

		const link = event.currentTarget;
		const hash = link.getAttribute('href');
		const target = getAnchorTarget(hash);
		if (target === null) return;

		event.preventDefault();
		scrollToTarget(target);
		updateHash(hash);
	};

	links.forEach((link) => link.addEventListener('click', handleClick));

	return () => links.forEach((link) => link.removeEventListener('click', handleClick));
};

const createLenisScroll = ({ onScroll, anchorOffset }) => {
	if (typeof window.Lenis !== 'function') return null;

	let lenis;
	try {
		lenis = new window.Lenis({
			duration: 1.35,
			easing: (value) => 1 - Math.pow(2, -10 * value),
			lerp: 0.065,
			smoothWheel: true,
			wheelMultiplier: 0.98,
			touchMultiplier: 1,
			syncTouch: false,
			autoRaf: false,
		});
	} catch {
		return null;
	}

	const handleScroll = (event) => onScroll(event);
	lenis.on?.('scroll', handleScroll);

	let frameId = null;
	const frame = (time) => {
		lenis.raf(time);
		frameId = window.requestAnimationFrame(frame);
	};
	frameId = window.requestAnimationFrame(frame);

	const unbindAnchors = bindAnchorLinks((target) => {
		const destination = typeof target === 'number'
			? target
			: target.getBoundingClientRect().top + window.scrollY + anchorOffset;

		lenis.scrollTo(clamp(destination, 0, getScrollLimit()), {
			duration: 1.25,
			lock: false,
		});
	});

	onScroll();

	return () => {
		window.cancelAnimationFrame(frameId);
		unbindAnchors();
		lenis.off?.('scroll', handleScroll);
		lenis.destroy?.();
	};
};

const createFallbackScroll = ({ onScroll, anchorOffset }) => {
	let currentY = window.scrollY;
	let targetY = currentY;
	let frameId = null;
	let isAnimating = false;
	const previousScrollBehavior = document.documentElement.style.scrollBehavior;
	document.documentElement.style.scrollBehavior = 'auto';

	const stop = () => {
		frameId = null;
		isAnimating = false;
	};

	const render = () => {
		const limit = getScrollLimit();
		targetY = clamp(targetY, 0, limit);
		currentY += (targetY - currentY) * 0.08;

		if (Math.abs(targetY - currentY) < 0.5) {
			currentY = targetY;
			window.scrollTo(0, currentY);
			stop();
			return;
		}

		window.scrollTo(0, currentY);
		frameId = window.requestAnimationFrame(render);
	};

	const start = () => {
		if (frameId !== null) return;
		isAnimating = true;
		frameId = window.requestAnimationFrame(render);
	};

	const handleScroll = () => {
		if (!isAnimating) {
			currentY = window.scrollY;
			targetY = currentY;
		}
		onScroll();
	};

	const handleWheel = (event) => {
		if (event.defaultPrevented || event.ctrlKey || !event.deltaY || hasScrollableParent(event.target, event.deltaY)) return;

		const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
		const delta = clamp(event.deltaY * unit * 0.95, -200, 200);

		event.preventDefault();
		targetY = clamp(targetY + delta, 0, getScrollLimit());
		start();
	};

	const handleKeyDown = (event) => {
		if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isFormControl(event.target)) return;

		const viewportStep = window.innerHeight * 0.88;
		let destination;

		switch (event.key) {
			case 'ArrowDown':
				destination = targetY + 110;
				break;
			case 'ArrowUp':
				destination = targetY - 110;
				break;
			case 'PageDown':
				destination = targetY + viewportStep;
				break;
			case 'PageUp':
				destination = targetY - viewportStep;
				break;
			case 'Home':
				destination = 0;
				break;
			case 'End':
				destination = getScrollLimit();
				break;
			case ' ':
				destination = targetY + (event.shiftKey ? -viewportStep : viewportStep);
				break;
			default:
				return;
		}

		event.preventDefault();
		targetY = clamp(destination, 0, getScrollLimit());
		start();
	};

	const unbindAnchors = bindAnchorLinks((target) => {
		const destination = typeof target === 'number'
			? target
			: target.getBoundingClientRect().top + window.scrollY + anchorOffset;

		targetY = clamp(destination, 0, getScrollLimit());
		start();
	});

	window.addEventListener('scroll', handleScroll, { passive: true });
	window.addEventListener('wheel', handleWheel, { passive: false });
	window.addEventListener('keydown', handleKeyDown);
	onScroll();

	return () => {
		window.removeEventListener('scroll', handleScroll);
		window.removeEventListener('wheel', handleWheel);
		window.removeEventListener('keydown', handleKeyDown);
		window.cancelAnimationFrame(frameId);
		unbindAnchors();
		document.documentElement.style.scrollBehavior = previousScrollBehavior;
	};
};

export const initSmoothScroll = ({ onScroll = noop, anchorOffset = -24 } = {}) => {
  if (window.__phsDecaSmoothScroll) return noop;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;

	const previousScrollBehavior = document.documentElement.style.scrollBehavior;
	document.documentElement.style.scrollBehavior = 'auto';

  const cleanup = createLenisScroll({ onScroll, anchorOffset }) || createFallbackScroll({ onScroll, anchorOffset });

  window.__phsDecaSmoothScroll = cleanup;

  return () => {
    if (window.__phsDecaSmoothScroll !== cleanup) return;
    cleanup();
    delete window.__phsDecaSmoothScroll;
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  };
};
