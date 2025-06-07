const breathCircle = document.getElementById('breathCircle');
const ctx = breathCircle.getContext('2d');
let animationFrame;
let animating = false;

// Draws the circle with a given scale (0.5 = small, 1.0 = large)
function drawCircle(scale = 1) {
    ctx.clearRect(0, 0, breathCircle.width, breathCircle.height);
    ctx.save();
    ctx.translate(breathCircle.width / 2, breathCircle.height / 2);
    ctx.beginPath();
    ctx.arc(0, 0, 100 * scale, 0, 2 * Math.PI);
    ctx.fillStyle = '#4fc3f7';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.restore();
}

// Animate inhale/exhale
function animateBreath({duration, inhale = true, onDone}) {
    animating = true;
    const start = performance.now();
    const startScale = inhale ? 0.5 : 1.0;
    const endScale = inhale ? 1.0 : 0.5;

    function animate(now) {
        if (!animating) return;
        const elapsed = now - start;
        const t = Math.min(elapsed / (duration * 1000), 1);
        const scale = startScale + (endScale - startScale) * t;
        drawCircle(scale);
        if (t < 1) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            if (onDone) onDone();
        }
    }
    animate(start);
}

function stopBreathAnimation() {
    animating = false;
    cancelAnimationFrame(animationFrame);
    drawCircle(0.5); // Reset to small
}

// Draw initial state
drawCircle(0.5);

// Expose functions globally
window.animateBreath = animateBreath;
window.stopBreathAnimation = stopBreathAnimation;