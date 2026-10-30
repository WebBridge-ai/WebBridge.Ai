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
