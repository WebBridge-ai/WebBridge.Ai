// ===================================
// WebBridge.AI - Hero video
// ===================================
// The intro builds the bridge once and hands over to a seamless loop. Whenever
// video is off or fails (no JS, reduced motion, data saver, iOS low power mode),
// the page stays on the static poster from the stylesheet.
const root = document.documentElement;

if (root.classList.contains('motion')) {
    const media = document.getElementById('heroMedia');
    const size = matchMedia('(max-aspect-ratio: 1/1)').matches ? 'tall' : 'wide';

    function createVideo(part) {
        const video = document.createElement('video');
        video.src = `assets/hero/${root.lang}/${size}-${part}.mp4`;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('aria-hidden', 'true');
        video.addEventListener('error', showPoster);
        media.appendChild(video);
        return video;
    }

    const loop = createVideo('loop');
    loop.loop = true;
    const intro = createVideo('intro');

    function showPoster() {
        root.classList.remove('motion');
        loop.remove();
        intro.remove();
    }

    intro.addEventListener('ended', function() {
        loop.play().then(() => intro.remove()).catch(showPoster);
    });

    intro.play().catch(showPoster);
}

// ===================================
// Scroll animations
// ===================================
// The class is set here, not in the markup, so the page stays fully visible
// if this script doesn't run or the visitor prefers less motion.
if (root.classList.contains('motion') && 'IntersectionObserver' in window) {
    root.classList.add('reveal');

    const revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.eyebrow, .service, .faq-item, .section > h2, .faq-head h2, .how-intro, .layer, .how-note, .how-close').forEach(el => {
        revealObserver.observe(el);
    });

    // The rail fills up to a line across the screen, and each layer lights up as it's reached.
    const pipeline = document.querySelector('.pipeline');
    const layers = document.querySelectorAll('.layer');
    const solution = document.querySelector('.pipeline-solution');
    let ticking = false;

    function updateRail() {
        ticking = false;
        const line = window.innerHeight * 0.7;
        const rect = pipeline.getBoundingClientRect();
        const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
        const progress = atEnd ? 1 : Math.min(Math.max((line - rect.top) / rect.height, 0), 1);

        pipeline.style.setProperty('--progress', progress);
        layers.forEach(layer => {
            const icon = layer.querySelector('.layer-icon').getBoundingClientRect();
            layer.classList.toggle('is-reached', atEnd || icon.top + icon.height / 2 < line);
        });
        solution.classList.toggle('is-reached', progress === 1);
    }

    function requestUpdate() {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateRail);
        }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    updateRail();
}
