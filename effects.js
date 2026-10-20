// ============================================================
// Anime Gesture Attacks - Visual Effects (VFX) Engine
// Ultra High-Performance Canvas 2D Stylized Anime Rendering
// ============================================================

class AnimeVFXEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Active visual effects & particles
        this.particles = [];
        this.shockwaves = [];
        this.lightningBolts = [];
        this.banners = [];
        this.cutSlashes = [];
        this.smokePuffs = [];
        this.activeDomain = null; // Unlimited void state
        this.activeBlast = null;  // Kamehameha / Hollow Purple blast
        this.activeSpiritBomb = null;
        
        // Screen dynamics
        this.screenShakeTime = 0;
        this.screenShakeIntensity = 0;
        this.whiteoutAlpha = 0;
        this.negativeFlashAlpha = 0;
        
        // Internal clock for animations
        this.time = 0;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    triggerScreenShake(intensity = 15, duration = 0.4) {
        this.screenShakeIntensity = intensity;
        this.screenShakeTime = duration;
    }

    triggerWhiteout(duration = 0.5) {
        this.whiteoutAlpha = 1.0;
    }

    triggerNegativeFlash(duration = 0.25) {
        this.negativeFlashAlpha = 0.85;
    }

    // Show stylish Japanese Anime Cut-in Banner
    addBanner(kanji, english, color = '#00f0ff', duration = 2.0) {
        this.banners.push({
            kanji,
            english,
            color,
            time: 0,
            duration,
            scale: 0.5,
            alpha: 1.0
        });
    }

    // Add generic anime particle
    addParticle(x, y, vx, vy, color, size, life, shape = 'circle', fade = true) {
        this.particles.push({
            x, y, vx, vy,
            color, size,
            life, maxLife: life,
            shape, fade
        });
    }

    // Add shockwave ring
    addShockwave(x, y, maxRadius, color = '#ffffff', lineWidth = 8, duration = 0.6) {
        this.shockwaves.push({
            x, y,
            radius: 5,
            maxRadius,
            color,
            lineWidth,
            time: 0,
            duration
        });
    }

    // Helper: Generate procedural jagged lightning path
    generateLightningPath(x1, y1, x2, y2, displacement = 25, iterations = 4) {
        let points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        for (let iter = 0; iter < iterations; iter++) {
            const nextPoints = [];
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2;
                const normalX = -(p2.y - p1.y);
                const normalY = (p2.x - p1.x);
                const len = Math.sqrt(normalX * normalX + normalY * normalY) || 1;
                const offset = (Math.random() - 0.5) * displacement * Math.pow(0.65, iter);
                
                nextPoints.push(p1);
                nextPoints.push({
                    x: mx + (normalX / len) * offset,
                    y: my + (normalY / len) * offset
                });
            }
            nextPoints.push(points[points.length - 1]);
            points = nextPoints;
        }
        return points;
    }

    // ============================================================
    // ATTACK EFFECT TRIGGERS
    // ============================================================

    // 1. DBZ: Kamehameha Charge
    renderKamehamehaCharge(x, y, progress) {
        const ctx = this.ctx;
        const radius = 25 + progress * 45;
        const pulse = Math.sin(this.time * 25) * 4;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Outer glow
        const grad = ctx.createRadialGradient(x, y, 5, x, y, radius + pulse + 30);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.3, 'rgba(0, 220, 255, 0.85)');
        grad.addColorStop(0.7, 'rgba(0, 100, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 50, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius + pulse + 30, 0, Math.PI * 2);
        ctx.fill();

        // Energy sparks contracting inward
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = radius * (1.5 + Math.random() * 1.5);
            const sx = x + Math.cos(angle) * dist;
            const sy = y + Math.sin(angle) * dist;
            this.addParticle(sx, sy, (x - sx) * 6, (y - sy) * 6, '#00ffff', 3 + Math.random() * 3, 0.2);
        }

        ctx.restore();
    }

    // DBZ: Kamehameha Blast
    triggerKamehamehaBlast(origin) {
        this.triggerScreenShake(24, 1.2);
        this.addBanner('かめはめ波', 'KAMEHAMEHA', '#00f0ff', 2.2);
        this.addShockwave(origin.x * this.canvas.width, origin.y * this.canvas.height, 400, '#00f0ff', 16, 0.8);
        
        this.activeBlast = {
            type: 'kamehameha',
            origin: { x: origin.x * this.canvas.width, y: origin.y * this.canvas.height },
            time: 0,
            duration: 1.8
        };
    }

    // 2. DBZ: Spirit Bomb (Genki Dama)
    renderSpiritBombGather(center, progress) {
        const ctx = this.ctx;
        const cx = center.x * this.canvas.width;
        const cy = center.y * this.canvas.height;
        const radius = 40 + progress * 140;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Twilight screen tint
        ctx.fillStyle = `rgba(5, 10, 30, ${0.4 * progress})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Core celestial sphere
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 1.3);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#38bdf8');
        grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.5)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Inward gathering cosmic energy particles
        for (let i = 0; i < 6; i++) {
            const edge = Math.floor(Math.random() * 4);
            let px = 0, py = 0;
            if (edge === 0) { px = Math.random() * this.canvas.width; py = 0; }
            else if (edge === 1) { px = this.canvas.width; py = Math.random() * this.canvas.height; }
            else if (edge === 2) { px = Math.random() * this.canvas.width; py = this.canvas.height; }
            else { px = 0; py = Math.random() * this.canvas.height; }

            const speed = 400 + Math.random() * 300;
            const angle = Math.atan2(cy - py, cx - px);
            this.addParticle(px, py, Math.cos(angle) * speed, Math.sin(angle) * speed, '#7dd3fc', 3.5, 0.7);
        }

        ctx.restore();
    }

    triggerSpiritBombImpact(center) {
        this.triggerScreenShake(30, 2.0);
        this.triggerWhiteout(0.8);
        this.addBanner('元気玉', 'SPIRIT BOMB', '#38bdf8', 2.5);
        const cx = center.x * this.canvas.width;
        const cy = center.y * this.canvas.height;
        
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.addShockwave(cx, cy, 600 + i * 150, '#38bdf8', 18 - i * 3, 1.0);
            }, i * 120);
        }
    }

    // 3. DBZ: Super Saiyan Aura
    renderSuperSaiyanAura(hands, intensity) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        hands.forEach(h => {
            const hx = h.x * this.canvas.width;
            const hy = h.y * this.canvas.height;

            // Spawning golden flame particles
            for (let i = 0; i < 5; i++) {
                const angle = (Math.random() - 0.5) * 0.8 - Math.PI / 2;
                const speed = 120 + Math.random() * 220;
                this.addParticle(
                    hx + (Math.random() - 0.5) * 60,
                    hy + (Math.random() - 0.5) * 40,
                    Math.cos(angle) * speed * 0.3,
                    -Math.abs(Math.sin(angle) * speed),
                    Math.random() > 0.3 ? '#facc15' : '#ffffff',
                    5 + Math.random() * 8,
                    0.45,
                    'flame'
                );
            }

            // Electric blue SSJ2 sparks
            if (Math.random() < 0.35) {
                const p1 = { x: hx + (Math.random() - 0.5) * 100, y: hy + (Math.random() - 0.5) * 100 };
                const p2 = { x: hx + (Math.random() - 0.5) * 100, y: hy + (Math.random() - 0.5) * 100 };
                const points = this.generateLightningPath(p1.x, p1.y, p2.x, p2.y, 20, 3);
                
                ctx.strokeStyle = '#67e8f9';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                points.forEach((p, idx) => {
                    if (idx === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                });
                ctx.stroke();
            }
        });

        // Golden aura edge vignette
        const grad = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.3,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.75
        );
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `rgba(234, 179, 8, ${0.35 * intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.restore();
    }

    // 4. NARUTO: Rasengan
    renderRasengan(origin) {
        const ctx = this.ctx;
        const x = origin.x * this.canvas.width;
        const y = origin.y * this.canvas.height;
        const radius = 45;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Multi-layered counter-rotating spiral vortex rings
        for (let ring = 0; ring < 5; ring++) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(this.time * (ring % 2 === 0 ? 8 : -11) + ring * 1.2);
            
            ctx.strokeStyle = ring === 0 ? '#ffffff' : (ring % 2 === 0 ? '#38bdf8' : '#0284c7');
            ctx.lineWidth = 3 - ring * 0.4;
            ctx.beginPath();
            ctx.ellipse(0, 0, radius - ring * 5, (radius - ring * 5) * 0.45, ring * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Glowing core sphere
        const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.8)');
        grad.addColorStop(0.8, 'rgba(14, 165, 233, 0.4)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Swirling wind needles
        for (let i = 0; i < 3; i++) {
            const ang = this.time * 12 + (i * Math.PI * 2) / 3;
            const r = radius * (1.1 + Math.sin(this.time * 20 + i) * 0.2);
            const wx = x + Math.cos(ang) * r;
            const wy = y + Math.sin(ang) * r;
            this.addParticle(wx, wy, -Math.sin(ang) * 90, Math.cos(ang) * 90, '#bae6fd', 3, 0.15);
        }

        ctx.restore();
    }

    // 5. NARUTO: Chidori
    renderChidori(origin) {
        const ctx = this.ctx;
        const x = origin.x * this.canvas.width;
        const y = origin.y * this.canvas.height;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Blinding palm flash
        const grad = ctx.createRadialGradient(x, y, 5, x, y, 70);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, 'rgba(125, 211, 252, 0.7)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 70, 0, Math.PI * 2);
        ctx.fill();

        // Radiating violent electric arcs
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 70 + Math.random() * 110;
            const targetX = x + Math.cos(angle) * length;
            const targetY = y + Math.sin(angle) * length;
            const points = this.generateLightningPath(x, y, targetX, targetY, 22, 4);

            ctx.strokeStyle = Math.random() > 0.4 ? '#ffffff' : '#38bdf8';
            ctx.lineWidth = 2 + Math.random() * 2;
            ctx.beginPath();
            points.forEach((p, idx) => {
                if (idx === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        }

        ctx.restore();
    }

    // 6. NARUTO: Shadow Clone (Kage Bunshin) Poof
    triggerShadowClonePoof(origin) {
        this.addBanner('影分身の術', 'KAGE BUNSHIN NO JUTSU', '#f59e0b', 2.0);
        this.triggerScreenShake(12, 0.4);

        const cx = origin.x * this.canvas.width;
        const cy = origin.y * this.canvas.height;

        // Big anime cartoon smoke puff explosion
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 320;
            this.smokePuffs.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                radius: 25 + Math.random() * 40,
                alpha: 1.0,
                life: 0.9 + Math.random() * 0.4
            });
        }
    }

    // 7. NARUTO: Amaterasu
    triggerAmaterasu(target) {
        this.addBanner('天照', 'AMATERASU', '#ef4444', 2.2);
        this.triggerScreenShake(16, 0.5);

        const tx = target.x * this.canvas.width;
        const ty = target.y * this.canvas.height;

        // Black flame eruption
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 140;
            this.addParticle(
                tx + (Math.random() - 0.5) * 30,
                ty + (Math.random() - 0.5) * 30,
                Math.cos(angle) * speed * 0.5,
                -Math.abs(Math.sin(angle) * speed),
                Math.random() > 0.35 ? '#000000' : '#dc2626',
                8 + Math.random() * 14,
                1.2 + Math.random() * 0.6,
                'flame'
            );
        }
    }

    // 8. JJK: Domain Expansion: Unlimited Void (Gojo Satoru)
    triggerUnlimitedVoid(origin) {
        this.triggerScreenShake(20, 1.2);
        this.triggerWhiteout(0.6);
        this.addBanner('領域展開: 無量空処', 'DOMAIN EXPANSION: UNLIMITED VOID', '#a855f7', 3.5);

        this.activeDomain = {
            type: 'unlimited_void',
            time: 0,
            duration: 5.0
        };
    }

    // 9. JJK: Hollow Purple (Kyoshiki: Murasaki)
    renderHollowPurplePrep(redPos, bluePos) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Red Reversal orb
        const rx = redPos.x * this.canvas.width;
        const ry = redPos.y * this.canvas.height;
        const rGrad = ctx.createRadialGradient(rx, ry, 5, rx, ry, 50);
        rGrad.addColorStop(0, '#ffffff');
        rGrad.addColorStop(0.4, '#ef4444');
        rGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(rx, ry, 50, 0, Math.PI * 2);
        ctx.fill();

        // Blue Convergence orb
        const bx = bluePos.x * this.canvas.width;
        const by = bluePos.y * this.canvas.height;
        const bGrad = ctx.createRadialGradient(bx, by, 5, bx, by, 50);
        bGrad.addColorStop(0, '#ffffff');
        bGrad.addColorStop(0.4, '#3b82f6');
        bGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    triggerHollowPurpleBlast(origin) {
        this.triggerScreenShake(35, 1.8);
        this.triggerWhiteout(0.7);
        this.addBanner('虚式「紫」', 'HOLLOW PURPLE', '#c084fc', 2.8);

        this.activeBlast = {
            type: 'hollow_purple',
            origin: { x: origin.x * this.canvas.width, y: origin.y * this.canvas.height },
            time: 0,
            duration: 2.2
        };
    }

    // 10. JJK: Malevolent Shrine (Sukuna Dismantle / Cleave)
    triggerMalevolentShrine(origin) {
        this.triggerScreenShake(22, 1.0);
        this.addBanner('伏魔御厨子: 解・捌', 'MALEVOLENT SHRINE: DISMANTLE', '#e11d48', 2.5);

        // Multiple clean cutting lines across the screen
        for (let i = 0; i < 7; i++) {
            const isHorizontal = Math.random() > 0.5;
            const x1 = isHorizontal ? 0 : Math.random() * this.canvas.width;
            const y1 = isHorizontal ? Math.random() * this.canvas.height : 0;
            const x2 = isHorizontal ? this.canvas.width : Math.random() * this.canvas.width;
            const y2 = isHorizontal ? Math.random() * this.canvas.height : this.canvas.height;

            this.cutSlashes.push({
                x1, y1, x2, y2,
                time: 0,
                duration: 0.8 + Math.random() * 0.4,
                delay: i * 0.08
            });
        }
    }

    // 11. JJK: Black Flash (Kokusen)
    triggerBlackFlash(origin) {
        this.triggerScreenShake(26, 0.7);
        this.triggerNegativeFlash(0.3);
        this.addBanner('黒閃', 'BLACK FLASH', '#e11d48', 2.0);

        const ox = origin.x * this.canvas.width;
        const oy = origin.y * this.canvas.height;
        this.addShockwave(ox, oy, 350, '#e11d48', 14, 0.6);

        // Black lightning bolts with red edges radiating outward
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + (Math.random() - 0.5) * 0.4;
            const length = 120 + Math.random() * 180;
            const tx = ox + Math.cos(angle) * length;
            const ty = oy + Math.sin(angle) * length;
            const points = this.generateLightningPath(ox, oy, tx, ty, 30, 4);

            this.lightningBolts.push({
                points,
                color: '#000000',
                edgeColor: '#ff003c',
                time: 0,
                duration: 0.5
            });
        }
    }

    // ============================================================
    // MAIN RENDER LOOP UPDATE
    // ============================================================
    updateAndRender(dt) {
        this.time += dt;
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Apply screen shake
        ctx.save();
        if (this.screenShakeTime > 0) {
            this.screenShakeTime -= dt;
            const offsetX = (Math.random() - 0.5) * this.screenShakeIntensity;
            const offsetY = (Math.random() - 0.5) * this.screenShakeIntensity;
            ctx.translate(offsetX, offsetY);
        }

        // 1. Render Unlimited Void Domain if active
        if (this.activeDomain && this.activeDomain.type === 'unlimited_void') {
            this.activeDomain.time += dt;
            const p = this.activeDomain.time / this.activeDomain.duration;
            const alpha = p < 0.2 ? p / 0.2 : (p > 0.8 ? (1 - p) / 0.2 : 1.0);

            // Deep cosmic void backdrop
            ctx.fillStyle = `rgba(5, 4, 15, ${0.85 * alpha})`;
            ctx.fillRect(0, 0, width, height);

            // Black hole singularity center
            const cx = width / 2;
            const cy = height / 2;
            
            // Accretion disk
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.time * 0.4);
            const holeGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 240);
            holeGrad.addColorStop(0, '#000000');
            holeGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.8)');
            holeGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.3)');
            holeGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = holeGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 240, 0, Math.PI * 2);
            ctx.fill();

            // Event horizon pure black sphere
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, 0, 75, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (this.activeDomain.time >= this.activeDomain.duration) {
                this.activeDomain = null;
            }
        }

        // 2. Render Active Blasts (Kamehameha / Hollow Purple)
        if (this.activeBlast) {
            this.activeBlast.time += dt;
            const b = this.activeBlast;
            const p = b.time / b.duration;
            const blastAlpha = p < 0.1 ? p / 0.1 : (p > 0.75 ? (1 - p) / 0.25 : 1.0);

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            const originX = b.origin.x;
            const originY = b.origin.y;
            const targetX = width;
            const targetY = originY;

            const beamThickness = b.type === 'kamehameha' ? 120 + Math.sin(this.time * 30) * 15 : 160 + Math.sin(this.time * 25) * 20;
            const coreColor = '#ffffff';
            const outerColor = b.type === 'kamehameha' ? '#00e5ff' : '#a855f7';

            // Main Beam gradient
            const beamGrad = ctx.createLinearGradient(0, originY - beamThickness, 0, originY + beamThickness);
            beamGrad.addColorStop(0, 'transparent');
            beamGrad.addColorStop(0.2, outerColor);
            beamGrad.addColorStop(0.5, coreColor);
            beamGrad.addColorStop(0.8, outerColor);
            beamGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = beamGrad;
            ctx.globalAlpha = blastAlpha;
            ctx.fillRect(0, originY - beamThickness, width, beamThickness * 2);

            // Expanding rings around beam
            for (let r = 0; r < 6; r++) {
                const ringX = ((this.time * 1200 + r * 220) % width);
                ctx.strokeStyle = coreColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(ringX, originY, 40, beamThickness * 0.9, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();

            if (b.time >= b.duration) {
                this.activeBlast = null;
            }
        }

        // 3. Render Sukuna Slashes (Malevolent Shrine)
        for (let i = this.cutSlashes.length - 1; i >= 0; i--) {
            const slash = this.cutSlashes[i];
            slash.time += dt;
            if (slash.time < slash.delay) continue;

            const localTime = slash.time - slash.delay;
            const p = localTime / (slash.duration - slash.delay);
            if (p >= 1.0) {
                this.cutSlashes.splice(i, 1);
                continue;
            }

            const alpha = 1.0 - p;
            ctx.save();
            ctx.strokeStyle = `rgba(225, 29, 72, ${alpha})`;
            ctx.lineWidth = 5 * (1 - p * 0.5);
            ctx.shadowColor = '#ff003c';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(slash.x1, slash.y1);
            ctx.lineTo(slash.x2, slash.y2);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Render Black Flash Lightning
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            const bolt = this.lightningBolts[i];
            bolt.time += dt;
            const p = bolt.time / bolt.duration;
            if (p >= 1.0) {
                this.lightningBolts.splice(i, 1);
                continue;
            }

            const alpha = 1.0 - p;
            ctx.save();
            // Outer red glow
            ctx.strokeStyle = bolt.edgeColor;
            ctx.lineWidth = 7 * (1 - p);
            ctx.beginPath();
            bolt.points.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();

            // Inner jet-black lightning core
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3.5 * (1 - p);
            ctx.stroke();
            ctx.restore();
        }

        // 5. Render Smoke Puffs (Shadow Clone)
        for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
            const puff = this.smokePuffs[i];
            puff.x += puff.vx * dt;
            puff.y += puff.vy * dt;
            puff.vx *= 0.94;
            puff.vy *= 0.94;
            puff.life -= dt;

            if (puff.life <= 0) {
                this.smokePuffs.splice(i, 1);
                continue;
            }

            const alpha = puff.life / 1.2;
            ctx.save();
            ctx.fillStyle = `rgba(240, 244, 248, ${alpha * 0.85})`;
            ctx.beginPath();
            ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 6. Render Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.time += dt;
            const p = sw.time / sw.duration;
            if (p >= 1.0) {
                this.shockwaves.splice(i, 1);
                continue;
            }

            const currentR = sw.radius + (sw.maxRadius - sw.radius) * p;
            const alpha = 1.0 - p;

            ctx.save();
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.lineWidth * (1.0 - p * 0.5);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, currentR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 7. Render Active Particles
        ctx.save();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            const alpha = p.fade ? (p.life / p.maxLife) : 1.0;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;

            if (p.shape === 'flame') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // 8. Render Fullscreen Flash / Whiteout / Negative
        if (this.whiteoutAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteoutAlpha})`;
            ctx.fillRect(0, 0, width, height);
            this.whiteoutAlpha = Math.max(0, this.whiteoutAlpha - dt * 2.0);
        }

        if (this.negativeFlashAlpha > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = `rgba(255, 255, 255, ${this.negativeFlashAlpha})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            this.negativeFlashAlpha = Math.max(0, this.negativeFlashAlpha - dt * 3.5);
        }

        // 9. Render Anime Calligraphy Cut-in Banners
        for (let i = this.banners.length - 1; i >= 0; i--) {
            const banner = this.banners[i];
            banner.time += dt;
            const p = banner.time / banner.duration;
            if (p >= 1.0) {
                this.banners.splice(i, 1);
                continue;
            }

            // Punchy scale pop-in then slow fade
            const scale = p < 0.15 ? 0.6 + (p / 0.15) * 0.45 : (p > 0.75 ? 1.05 - (p - 0.75) * 0.2 : 1.05);
            const alpha = p < 0.15 ? p / 0.15 : (p > 0.75 ? (1.0 - p) / 0.25 : 1.0);

            ctx.save();
            ctx.translate(width / 2, height * 0.24);
            ctx.scale(scale, scale);
            ctx.globalAlpha = alpha;

            // Stylish dark backdrop ribbon
            ctx.fillStyle = 'rgba(7, 10, 19, 0.88)';
            ctx.strokeStyle = banner.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(-300, -55, 600, 110, 16);
            ctx.fill();
            ctx.stroke();

            // Japanese Kanji Calligraphy
            ctx.font = '900 48px "Noto Sans JP", "Hiragino Kaku Gothic Pro", "Yu Gothic", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = banner.color;
            ctx.shadowBlur = 24;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(banner.kanji, 0, -12);

            // English Romaji subtitle
            ctx.font = '800 16px "Montserrat", sans-serif';
            ctx.fillStyle = banner.color;
            ctx.shadowBlur = 10;
            ctx.fillText(banner.english.toUpperCase(), 0, 30);

            ctx.restore();
        }

        ctx.restore(); // Restore screen shake
    }
}

// Global VFX engine singleton (initialized when canvas is attached)
window.AnimeVFXEngine = AnimeVFXEngine;
