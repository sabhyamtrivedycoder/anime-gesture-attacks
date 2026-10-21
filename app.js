// ============================================================
// Anime Gesture Attacks - Main Application Coordinator
// Integrates MediaPipe Hands, VFX Engine, Audio Engine, & UI HUD
// ============================================================

class AnimeGestureApp {
    constructor() {
        this.video = document.getElementById('webcamVideo');
        this.vfxCanvas = document.getElementById('vfxCanvas');
        this.skeletonCanvas = document.getElementById('skeletonCanvas');
        this.skeletonCtx = this.skeletonCanvas.getContext('2d');
        
        this.vfx = new AnimeVFXEngine(this.vfxCanvas);
        this.audio = window.animeAudio;
        this.recognizer = window.gestureRecognizer;

        this.handsDetector = null;
        this.isCameraRunning = false;
        this.isMirrored = true;
        this.showSkeleton = true;
        
        // Frame timing
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        this.fpsTimer = performance.now();

        // DOM elements
        this.hudHandsCount = document.getElementById('hudHandsCount');
        this.hudActiveState = document.getElementById('hudActiveState');
        this.hudFps = document.getElementById('hudFps');
        this.chargeBar = document.getElementById('chargeBar');
        this.trackingIndicator = document.getElementById('trackingIndicator');
        this.cameraErrorBanner = document.getElementById('cameraErrorBanner');

        this.initUI();
    }

    async init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Initialize Audio on first interaction
        const startAudio = () => {
            this.audio.resume();
            window.removeEventListener('click', startAudio);
            window.removeEventListener('keydown', startAudio);
        };
        window.addEventListener('click', startAudio);
        window.addEventListener('keydown', startAudio);

        // Setup MediaPipe Hands
        await this.initMediaPipe();

        // Start Webcam
        await this.startWebcam();

        // Main Loop
        requestAnimationFrame((ts) => this.renderLoop(ts));
    }

    handleResize() {
        const width = this.vfxCanvas.parentElement.clientWidth;
        const height = this.vfxCanvas.parentElement.clientHeight;
        this.vfx.resize(width, height);
        this.skeletonCanvas.width = width;
        this.skeletonCanvas.height = height;
    }

    async waitForHands(maxWaitMs = 8000) {
        const start = Date.now();
        while (typeof window.Hands === 'undefined' && (Date.now() - start < maxWaitMs)) {
            await new Promise(r => setTimeout(r, 100));
        }
        return typeof window.Hands !== 'undefined';
    }

    async initMediaPipe() {
        try {
            const hasHands = await this.waitForHands();
            if (!hasHands) {
                console.warn("MediaPipe Hands CDN load timed out; ready in interactive simulation/test mode.");
                return;
            }

            this.handsDetector = new window.Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            this.handsDetector.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.55,
                minTrackingConfidence: 0.55
            });

            this.handsDetector.onResults((results) => this.onHandResults(results));
            console.log("MediaPipe Hands loaded successfully.");
        } catch (e) {
            console.error("Error initializing MediaPipe:", e);
        }
    }

    async startWebcam() {
        try {
            if (!this.handsDetector) {
                await this.initMediaPipe();
            }

            if (typeof window.Camera !== 'undefined') {
                this.camera = new window.Camera(this.video, {
                    onFrame: async () => {
                        if (this.handsDetector && this.video.readyState >= 2) {
                            try {
                                await this.handsDetector.send({ image: this.video });
                            } catch (e) {}
                        }
                    },
                    width: 1280,
                    height: 720
                });
                await this.camera.start();
                this.isCameraRunning = true;
                this.trackingIndicator.classList.remove('inactive');
                this.cameraErrorBanner.style.display = 'none';
            } else {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    },
                    audio: false
                });

                this.video.srcObject = stream;
                await this.video.play();
                this.isCameraRunning = true;
                this.trackingIndicator.classList.remove('inactive');
                this.cameraErrorBanner.style.display = 'none';

                // Start sending frames to MediaPipe
                this.processVideoFrames();
            }
        } catch (err) {
            console.warn("Camera access failed or denied:", err);
            this.trackingIndicator.classList.add('inactive');
            this.cameraErrorBanner.style.display = 'block';
        }
    }

    async processVideoFrames() {
        if (!this.isCameraRunning) return;
        
        if (this.handsDetector && this.video.readyState >= 2) {
            try {
                await this.handsDetector.send({ image: this.video });
            } catch (e) {
                // Ignore transient frame errors
            }
        }

        // Use requestVideoFrameCallback if available, otherwise requestAnimationFrame
        if ('requestVideoFrameCallback' in this.video) {
            this.video.requestVideoFrameCallback(() => this.processVideoFrames());
        } else {
            setTimeout(() => this.processVideoFrames(), 33);
        }
    }

    onHandResults(results) {
        const now = performance.now();
        const dt = Math.min(0.1, (now - this.lastTime) / 1000);
        this.lastTime = now;

        const multiLandmarks = results.multiHandLandmarks || [];
        const multiHandedness = results.multiHandedness || [];

        // Analyze Gestures
        const analysis = this.recognizer.processHands(multiLandmarks, multiHandedness, dt);

        // Update HUD
        this.hudHandsCount.textContent = analysis.hands.length;
        if (analysis.stats.kameProgress > 0) {
            this.chargeBar.style.width = `${analysis.stats.kameProgress * 100}%`;
            this.hudActiveState.textContent = 'Charging Kamehameha...';
        } else {
            this.chargeBar.style.width = '0%';
            this.hudActiveState.textContent = analysis.activeAttacks.length > 0 
                ? analysis.activeAttacks[0].type.replace('_', ' ').toUpperCase()
                : 'IDLE / READY';
        }

        // Draw Skeleton overlay
        this.drawSkeleton(analysis.hands);

        // Helpers for horizontal camera mirroring
        const mapX = (x) => this.isMirrored ? (1 - x) : x;
        const mapPt = (pt) => pt ? { x: mapX(pt.x), y: pt.y, z: pt.z } : { x: 0.5, y: 0.5 };

        // Process Triggered Attacks
        analysis.activeAttacks.forEach(atk => {
            switch (atk.type) {
                case 'kamehameha_charge':
                    this.vfx.renderKamehamehaCharge(mapX(atk.origin.x) * this.vfxCanvas.width, atk.origin.y * this.vfxCanvas.height, atk.progress);
                    break;
                case 'kamehameha_blast':
                    this.vfx.triggerKamehamehaBlast(mapPt(atk.origin));
                    break;
                case 'spirit_bomb_gather':
                    this.vfx.renderSpiritBombGather(mapPt(atk.center), atk.progress);
                    break;
                case 'spirit_bomb_impact':
                    this.vfx.triggerSpiritBombImpact(mapPt(atk.center));
                    break;
                case 'super_saiyan_aura':
                    const mirroredHands = (atk.hands || []).map(h => ({
                        ...h,
                        center: mapPt(h.center),
                        landmarks: (h.landmarks || []).map(p => mapPt(p))
                    }));
                    this.vfx.renderSuperSaiyanAura(mirroredHands, atk.intensity);
                    break;
                case 'rasengan_sphere':
                    this.vfx.renderRasengan(mapPt(atk.origin));
                    break;
                case 'chidori_sparks':
                    this.vfx.renderChidori(mapPt(atk.origin));
                    break;
                case 'shadow_clone_poof':
                    this.vfx.triggerShadowClonePoof(mapPt(atk.origin));
                    break;
                case 'amaterasu_ignition':
                    this.vfx.triggerAmaterasu(mapPt(atk.target));
                    break;
                case 'unlimited_void':
                    this.vfx.triggerUnlimitedVoid(mapPt(atk.origin));
                    break;
                case 'hollow_purple_prep':
                    this.vfx.renderHollowPurplePrep(mapPt(atk.redPos), mapPt(atk.bluePos));
                    break;
                case 'hollow_purple_blast':
                    this.vfx.triggerHollowPurpleBlast(mapPt(atk.origin));
                    break;
                case 'malevolent_shrine':
                    this.vfx.triggerMalevolentShrine(mapPt(atk.origin));
                    break;
                case 'black_flash_impact':
                    this.vfx.triggerBlackFlash(mapPt(atk.origin));
                    break;
            }
        });
    }

    drawSkeleton(hands) {
        const ctx = this.skeletonCtx;
        ctx.clearRect(0, 0, this.skeletonCanvas.width, this.skeletonCanvas.height);
        if (!this.showSkeleton || hands.length === 0) return;

        const w = this.skeletonCanvas.width;
        const h = this.skeletonCanvas.height;
        const mapX = (x) => this.isMirrored ? (1 - x) : x;

        const connections = [
            [0,1],[1,2],[2,3],[3,4],       // Thumb
            [0,5],[5,6],[6,7],[7,8],       // Index
            [5,9],[9,10],[10,11],[11,12],  // Middle
            [9,13],[13,14],[14,15],[15,16],// Ring
            [13,17],[17,18],[18,19],[19,20],[0,17] // Pinky & Palm base
        ];

        ctx.save();
        hands.forEach(hand => {
            const lm = hand.landmarks;

            // Connections
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
            ctx.lineWidth = 2.5;
            connections.forEach(([i, j]) => {
                ctx.beginPath();
                ctx.moveTo(mapX(lm[i].x) * w, lm[i].y * h);
                ctx.lineTo(mapX(lm[j].x) * w, lm[j].y * h);
                ctx.stroke();
            });

            // Joints
            lm.forEach((pt, idx) => {
                const px = mapX(pt.x) * w;
                const py = pt.y * h;
                const isTip = [4, 8, 12, 16, 20].includes(idx);
                
                ctx.fillStyle = isTip ? '#ffd700' : '#00e5ff';
                ctx.beginPath();
                ctx.arc(px, py, isTip ? 5 : 3.5, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        ctx.restore();
    }

    renderLoop(ts) {
        // Calculate FPS
        this.frameCount++;
        if (ts - this.fpsTimer >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = ts;
            this.hudFps.textContent = `${this.fps} FPS`;
        }

        // Render VFX
        this.vfx.updateAndRender(0.016);

        requestAnimationFrame((t) => this.renderLoop(t));
    }

    // Capture combined photo of Camera + VFX
    takeSnapshot() {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = this.vfxCanvas.width;
        offCanvas.height = this.vfxCanvas.height;
        const offCtx = offCanvas.getContext('2d');

        // Draw video (handle mirror)
        offCtx.save();
        if (this.isMirrored) {
            offCtx.translate(offCanvas.width, 0);
            offCtx.scale(-1, 1);
        }
        offCtx.drawImage(this.video, 0, 0, offCanvas.width, offCanvas.height);
        offCtx.restore();

        // Draw VFX on top
        offCtx.drawImage(this.vfxCanvas, 0, 0);

        // Download image
        const link = document.createElement('a');
        link.download = `anime-attack-${Date.now()}.png`;
        link.href = offCanvas.toDataURL('image/png');
        link.click();
    }

    initUI() {
        // Mode Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                const mode = target.getAttribute('data-mode');
                this.recognizer.setMode(mode);

                // Filter attack dock cards
                document.querySelectorAll('.attack-card').forEach(card => {
                    const anime = card.getAttribute('data-anime');
                    if (mode === 'all' || mode === anime) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Audio Mute Toggle
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.addEventListener('click', () => {
            this.audio.resume();
            const isMuted = !this.audio.isMuted;
            this.audio.setMuted(isMuted);
            muteBtn.classList.toggle('active', isMuted);
            muteBtn.querySelector('span').textContent = isMuted ? 'Muted' : 'Audio ON';
        });

        // Voice SFX Toggle
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.addEventListener('click', () => {
            this.audio.resume();
            this.audio.voiceEnabled = !this.audio.voiceEnabled;
            voiceBtn.classList.toggle('active', this.audio.voiceEnabled);
            voiceBtn.querySelector('span').textContent = this.audio.voiceEnabled ? 'Voice ON' : 'Voice OFF';
        });

        // Mirror Toggle
        const mirrorBtn = document.getElementById('mirrorBtn');
        mirrorBtn.addEventListener('click', () => {
            this.isMirrored = !this.isMirrored;
            this.video.classList.toggle('unmirrored', !this.isMirrored);
            mirrorBtn.classList.toggle('active', this.isMirrored);
        });

        // Skeleton Toggle
        const skeletonBtn = document.getElementById('skeletonBtn');
        skeletonBtn.addEventListener('click', () => {
            this.showSkeleton = !this.showSkeleton;
            skeletonBtn.classList.toggle('active', this.showSkeleton);
        });

        // Snapshot Button
        document.getElementById('snapshotBtn').addEventListener('click', () => {
            this.takeSnapshot();
        });

        // Gesture Guide Modal
        const guideModal = document.getElementById('guideModal');
        document.getElementById('guideBtn').addEventListener('click', () => {
            guideModal.classList.add('open');
        });
        document.getElementById('closeGuideBtn').addEventListener('click', () => {
            guideModal.classList.remove('open');
        });
        guideModal.addEventListener('click', (e) => {
            if (e.target === guideModal) guideModal.classList.remove('open');
        });

        // Simulate Attack Button
        const simulateBtn = document.getElementById('simulateBtn');
        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => {
                this.simulateNextAttack();
            });
        }

        // Keyboard Shortcuts (1-9, 0, Space)
        window.addEventListener('keydown', (e) => {
            // Ignore if inside an input or typing
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const keyMap = {
                '1': 'kamehameha',
                '2': 'spirit_bomb',
                '3': 'super_saiyan',
                '4': 'rasengan',
                '5': 'chidori',
                '6': 'shadow_clone',
                '7': 'unlimited_void',
                '8': 'hollow_purple',
                '9': 'malevolent_shrine',
                '0': 'black_flash'
            };

            if (keyMap[e.key]) {
                this.triggerAttackByName(keyMap[e.key]);
            } else if (e.code === 'Space') {
                e.preventDefault();
                this.simulateNextAttack();
            }
        });

        // Attack Card Quick Test Buttons
        document.querySelectorAll('.attack-card').forEach(card => {
            card.addEventListener('click', () => {
                const attack = card.getAttribute('data-attack');
                this.triggerAttackByName(attack);
            });
        });
    }

    triggerAttackByName(attack, origin = { x: 0.5, y: 0.5 }) {
        this.audio.resume();
        const center = origin;

        // Update HUD
        if (this.hudActiveState) {
            this.hudActiveState.textContent = attack.replace('_', ' ').toUpperCase();
        }

        switch (attack) {
            case 'kamehameha':
                this.audio.playKamehamehaBlast();
                this.vfx.triggerKamehamehaBlast(center);
                break;
            case 'spirit_bomb':
                this.audio.playSpiritBombImpact();
                this.vfx.triggerSpiritBombImpact(center);
                break;
            case 'super_saiyan':
                this.audio.startSuperSaiyanAura();
                this.vfx.triggerScreenShake(20, 1.2);
                this.vfx.addBanner('超サイヤ人', 'SUPER SAIYAN', '#ffd700', 2.0);
                setTimeout(() => this.audio.stopSuperSaiyanAura(), 2500);
                break;
            case 'rasengan':
                this.audio.startRasengan();
                this.vfx.addBanner('螺旋丸', 'RASENGAN', '#00e5ff', 2.0);
                this.vfx.triggerScreenShake(14, 0.6);
                setTimeout(() => this.audio.stopRasengan(), 2200);
                break;
            case 'chidori':
                this.audio.startChidori();
                this.vfx.addBanner('千鳥', 'CHIDORI', '#38bdf8', 2.0);
                this.vfx.triggerScreenShake(16, 0.8);
                setTimeout(() => this.audio.stopChidori(), 2200);
                break;
            case 'shadow_clone':
                this.audio.playShadowClonePoof();
                this.vfx.triggerShadowClonePoof(center);
                break;
            case 'amaterasu':
                this.audio.playAmaterasu();
                this.vfx.triggerAmaterasu(center);
                break;
            case 'unlimited_void':
                this.audio.playUnlimitedVoid();
                this.vfx.triggerUnlimitedVoid(center);
                break;
            case 'hollow_purple':
                this.audio.playHollowPurple();
                this.vfx.triggerHollowPurpleBlast(center);
                break;
            case 'malevolent_shrine':
                this.audio.playDismantleCleave();
                this.vfx.triggerMalevolentShrine(center);
                break;
            case 'black_flash':
                this.audio.playBlackFlash();
                this.vfx.triggerBlackFlash(center);
                break;
        }
    }

    simulateNextAttack() {
        const attackList = [
            'kamehameha',
            'rasengan',
            'unlimited_void',
            'chidori',
            'hollow_purple',
            'black_flash',
            'super_saiyan',
            'malevolent_shrine',
            'shadow_clone',
            'spirit_bomb'
        ];
        if (!this.simAttackIdx) this.simAttackIdx = 0;
        const chosen = attackList[this.simAttackIdx % attackList.length];
        this.simAttackIdx++;
        
        // Random slight jitter in origin around center
        const ox = 0.45 + (Math.random() - 0.5) * 0.2;
        const oy = 0.45 + (Math.random() - 0.5) * 0.2;
        this.triggerAttackByName(chosen, { x: ox, y: oy });
    }
}

// Bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new AnimeGestureApp();
    window.app.init();
});
