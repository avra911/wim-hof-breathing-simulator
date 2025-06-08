const breathCircle = document.getElementById('breathCircle');
const ctx = breathCircle.getContext('2d');
let animationFrame;
let animating = false;

function drawCircle(scale = 1, timerText = '') {
    ctx.clearRect(0, 0, breathCircle.width, breathCircle.height);
    ctx.save();
    ctx.translate(breathCircle.width / 2, breathCircle.height / 2);

    // Draw left lung
    ctx.save();
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.bezierCurveTo(-90, -20, -90, 20, -30, 100);
    ctx.bezierCurveTo(-5, 90, -5, 20, -30, 0);
    ctx.closePath();
    ctx.fillStyle = '#66bb6a';
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.restore();

    // Draw right lung
    ctx.save();
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.bezierCurveTo(90, -20, 90, 20, 30, 90);
    ctx.bezierCurveTo(5, 90, 5, 20, 30, 0);
    ctx.closePath();
    ctx.fillStyle = '#66bb6a';
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.restore();

    // Draw trachea
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-4, -40 * scale);
    ctx.lineTo(4, -40 * scale);
    ctx.lineTo(4, 0);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fillStyle = '#66bb6a';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.restore();

    // Draw timer text in the center
    if (timerText) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#222';
        ctx.font = 'bold 2.5rem sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timerText, 0, 0);
    }
    ctx.restore();
}

// Animate inhale/exhale
function animateBreath({duration, inhale = true, onDone}) {
    animating = true;
    const start = performance.now();
    const startScale = inhale ? 0.30 : 1.2;
    const endScale = inhale ? 1.2 : 0.30;

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
    drawCircle(0.3); // Reset to small
}

// Draw initial state
drawCircle(0.3);

// Expose functions globally
window.animateBreath = animateBreath;
window.stopBreathAnimation = stopBreathAnimation;