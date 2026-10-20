// ============================================================
// Anime Gesture Attacks - Audio Synthesizer (Web Audio API)
// Authentic anime sound effects generated entirely with procedural audio!
// No external audio files needed - zero missing assets or latency.
// ============================================================

class AnimeAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.voiceEnabled = true;
        this.activeAuraNode = null;
        this.activeRasenganNode = null;
        this.activeChidoriNode = null;
        this.activeKameChargeNode = null;
        this.activeVoidNode = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized && this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
        console.log("Anime Audio Engine initialized successfully.");
    }

    resume() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx ? this.ctx.currentTime : 0);
        }
    }

    setVolume(val) {
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
        }
    }

    // Helper: Create filtered white noise buffer
    createNoiseBuffer(duration = 1.0) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // Voice announcement using Web Speech API
    speak(phrase, pitch = 1.0, rate = 1.0) {
        if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(phrase);
            utterance.pitch = pitch;
            utterance.rate = rate;
            utterance.volume = this.isMuted ? 0 : 0.85;
            
            // Try to find a cool voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang.includes('ja') || v.name.includes('David') || v.name.includes('Google') || v.lang.includes('en'));
            if (preferred) utterance.voice = preferred;
            
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("Speech synthesis error:", e);
        }
    }

    // ----------------------------------------------------------------
    // DRAGON BALL Z SFX
    // ----------------------------------------------------------------

    // Kamehameha Charge: High frequency rising spiral whine & deep sub energy build
    startKamehamehaCharge() {
        if (this.isMuted || !this.initialized) return;
        this.stopKamehamehaCharge();

        const now = this.ctx.currentTime;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.exponentialRampToValueAtTime(0.5, now + 2.0);

        // Sub bass oscillator
        const oscSub = this.ctx.createOscillator();
        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(55, now);
        oscSub.frequency.linearRampToValueAtTime(110, now + 3.0);

        // High pitch energy whine
        const oscHigh = this.ctx.createOscillator();
        oscHigh.type = 'triangle';
        oscHigh.frequency.setValueAtTime(220, now);
        oscHigh.frequency.exponentialRampToValueAtTime(880, now + 3.0);

        // Fast pulsing tremolo LFO
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sawtooth';
        lfo.frequency.setValueAtTime(8, now);
        lfo.frequency.linearRampToValueAtTime(28, now + 3.0);
        
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(0.4, now);
        lfo.connect(lfoGain.gain);

        oscSub.connect(gainNode);
        oscHigh.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscSub.start(now);
        oscHigh.start(now);
        lfo.start(now);

        this.activeKameChargeNode = { oscSub, oscHigh, lfo, gainNode };
        this.speak("Ka... me... ha... me...", 0.9, 0.85);
    }

    stopKamehamehaCharge() {
        if (this.activeKameChargeNode) {
            try {
                const now = this.ctx.currentTime;
                this.activeKameChargeNode.gainNode.gain.cancelScheduledValues(now);
                this.activeKameChargeNode.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                setTimeout(() => {
                    if (this.activeKameChargeNode) {
                        this.activeKameChargeNode.oscSub.stop();
                        this.activeKameChargeNode.oscHigh.stop();
                        this.activeKameChargeNode.lfo.stop();
                        this.activeKameChargeNode = null;
                    }
                }, 160);
            } catch (e) {}
        }
    }

    // Kamehameha Fire: Massive explosive beam roar + sustained laser sizzle
    playKamehamehaBlast() {
        this.stopKamehamehaCharge();
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;

        this.speak("HA--!!", 1.2, 1.4);

        // 1. Initial Shockwave thump
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(220, now);
        kickOsc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
        kickGain.gain.setValueAtTime(0.9, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.5);

        // 2. Continuous roaring beam noise (filtered white noise)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(2.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
        filter.Q.setValueAtTime(2.5, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 2.2);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 2.2);

        // 3. Laser harmonic sizzle
        const laserOsc = this.ctx.createOscillator();
        laserOsc.type = 'sawtooth';
        laserOsc.frequency.setValueAtTime(440, now);
        laserOsc.frequency.linearRampToValueAtTime(80, now + 1.8);
        const laserGain = this.ctx.createGain();
        laserGain.gain.setValueAtTime(0.4, now);
        laserGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        laserOsc.connect(laserGain);
        laserGain.connect(this.masterGain);
        laserOsc.start(now);
        laserOsc.stop(now + 1.8);
    }

    // Spirit Bomb (Genki Dama) Charge: Deep cosmic gathering chord
    playSpiritBombCharge() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("Give me your energy!", 1.0, 1.0);

        [110, 164.81, 220, 329.63, 440].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * 0.7, now);
            osc.frequency.exponentialRampToValueAtTime(freq, now + 2.5);

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 1.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.1);
            osc.stop(now + 3.2);
        });
    }

    // Spirit Bomb Impact: Cataclysmic sub-bass detonation
    playSpiritBombImpact() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("GENKI DAMA!", 1.1, 1.2);

        // Super deep sub bass
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(120, now);
        sub.frequency.exponentialRampToValueAtTime(18, now + 2.5);
        subGain.gain.setValueAtTime(1.0, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(now);
        sub.stop(now + 2.6);

        // Explosion crunch
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(2.0);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 2.0);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 2.1);
    }

    // Super Saiyan Aura / Power Up: Continuous roaring fire & electric crackles
    startSuperSaiyanAura() {
        if (this.isMuted || !this.initialized || this.activeAuraNode) return;
        const now = this.ctx.currentTime;

        this.speak("HAAAAA!!", 1.2, 1.1);

        // Flame roar (filtered noise modulated with low sine)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(5.0);
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, now);
        filter.Q.setValueAtTime(1.5, now);

        const auraGain = this.ctx.createGain();
        auraGain.gain.setValueAtTime(0.05, now);
        auraGain.gain.linearRampToValueAtTime(0.6, now + 0.8);

        noise.connect(filter);
        filter.connect(auraGain);
        auraGain.connect(this.masterGain);
        noise.start(now);

        // Electric spark pulses
        const zapOsc = this.ctx.createOscillator();
        zapOsc.type = 'sawtooth';
        zapOsc.frequency.setValueAtTime(60, now);
        const zapGain = this.ctx.createGain();
        zapGain.gain.setValueAtTime(0.25, now);
        zapOsc.connect(zapGain);
        zapGain.connect(this.masterGain);
        zapOsc.start(now);

        this.activeAuraNode = { noise, auraGain, zapOsc, zapGain };
    }

    stopSuperSaiyanAura() {
        if (this.activeAuraNode) {
            try {
                const now = this.ctx.currentTime;
                this.activeAuraNode.auraGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                this.activeAuraNode.zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                setTimeout(() => {
                    if (this.activeAuraNode) {
                        this.activeAuraNode.noise.stop();
                        this.activeAuraNode.zapOsc.stop();
                        this.activeAuraNode = null;
                    }
                }, 320);
            } catch (e) {}
        }
    }

    // ----------------------------------------------------------------
    // NARUTO SFX
    // ----------------------------------------------------------------

    // Rasengan: High-speed spinning vortex chakra sphere
    startRasengan() {
        if (this.isMuted || !this.initialized || this.activeRasenganNode) return;
        const now = this.ctx.currentTime;
        this.speak("Rasengan!", 1.1, 1.2);

        // Dual swirling rotating oscillators creating beating interference
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(480, now);
        osc2.frequency.setValueAtTime(486, now); // 6 Hz beating

        // Whirlwind noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(4.0);
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(4.0, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.4);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        noise.start(now);

        this.activeRasenganNode = { osc1, osc2, noise, gainNode };
    }

    stopRasengan() {
        if (this.activeRasenganNode) {
            try {
                const now = this.ctx.currentTime;
                this.activeRasenganNode.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                setTimeout(() => {
                    if (this.activeRasenganNode) {
                        this.activeRasenganNode.osc1.stop();
                        this.activeRasenganNode.osc2.stop();
                        this.activeRasenganNode.noise.stop();
                        this.activeRasenganNode = null;
                    }
                }, 220);
            } catch (e) {}
        }
    }

    // Chidori: 1,000 birds high-pitched electrical chirping and sparks
    startChidori() {
        if (this.isMuted || !this.initialized || this.activeChidoriNode) return;
        const now = this.ctx.currentTime;
        this.speak("Chidori!", 1.0, 1.2);

        // Chirping FM synthesis
        const carrier = this.ctx.createOscillator();
        carrier.type = 'sawtooth';
        carrier.frequency.setValueAtTime(1400, now);

        const mod = this.ctx.createOscillator();
        mod.type = 'square';
        mod.frequency.setValueAtTime(32, now); // Rapid chirps

        const modGain = this.ctx.createGain();
        modGain.gain.setValueAtTime(800, now);
        mod.connect(carrier.frequency);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0.45, now + 0.3);

        carrier.connect(gainNode);
        gainNode.connect(this.masterGain);

        carrier.start(now);
        mod.start(now);

        this.activeChidoriNode = { carrier, mod, gainNode };
    }

    stopChidori() {
        if (this.activeChidoriNode) {
            try {
                const now = this.ctx.currentTime;
                this.activeChidoriNode.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                setTimeout(() => {
                    if (this.activeChidoriNode) {
                        this.activeChidoriNode.carrier.stop();
                        this.activeChidoriNode.mod.stop();
                        this.activeChidoriNode = null;
                    }
                }, 220);
            } catch (e) {}
        }
    }

    // Shadow Clone Jutsu (Kage Bunshin no Jutsu): Classic ninja "POOF!"
    playShadowClonePoof() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("Kage Bunshin no Jutsu!", 1.1, 1.3);

        // Sharp pop transient
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(350, now);
        popOsc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        popGain.gain.setValueAtTime(0.8, now);
        popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        popOsc.connect(popGain);
        popGain.connect(this.masterGain);
        popOsc.start(now);
        popOsc.stop(now + 0.15);

        // White noise puff
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.7, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.45);
    }

    // Amaterasu: Dark ominous chord + sudden burning inferno
    playAmaterasu() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("Amaterasu...", 0.85, 0.9);

        // Dark ominous eye activation chord
        [130.81, 155.56, 196.00].forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 1.2);
        });

        // Roaring black flame eruption
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(1.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.linearRampToValueAtTime(800, now + 0.6);
        const flameGain = this.ctx.createGain();
        flameGain.gain.setValueAtTime(0.75, now + 0.1);
        flameGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        noise.connect(filter);
        filter.connect(flameGain);
        flameGain.connect(this.masterGain);
        noise.start(now + 0.1);
        noise.stop(now + 1.6);
    }

    // ----------------------------------------------------------------
    // JUJUTSU KAISEN (JJK) SFX
    // ----------------------------------------------------------------

    // Domain Expansion: Unlimited Void (Gojo Satoru): Glass shatter + cosmic void drone
    playUnlimitedVoid() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("Ryoiki Tenkai: Muryokusho", 0.95, 0.95);

        // Glass shatter sound
        for (let i = 0; i < 4; i++) {
            const shatter = this.ctx.createOscillator();
            const shatterGain = this.ctx.createGain();
            shatter.type = 'triangle';
            shatter.frequency.setValueAtTime(1800 + i * 900, now + i * 0.03);
            shatter.frequency.exponentialRampToValueAtTime(300, now + i * 0.03 + 0.25);
            shatterGain.gain.setValueAtTime(0.3, now + i * 0.03);
            shatterGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.3);
            shatter.connect(shatterGain);
            shatterGain.connect(this.masterGain);
            shatter.start(now + i * 0.03);
            shatter.stop(now + i * 0.03 + 0.3);
        }

        // Deep cosmic chord (Infinite information overload)
        const freqs = [55, 110, 164.81, 246.94, 370, 554.37];
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + 0.2);
            gain.gain.setValueAtTime(0.01, now + 0.2);
            gain.gain.linearRampToValueAtTime(0.12, now + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + 0.2);
            osc.stop(now + 4.0);
        });
    }

    // Hollow Purple (Kyoshiki: Murasaki): Red & Blue clash -> Catastrophic Purple blast
    playHollowPurple() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("Kyoshiki: Murasaki!", 1.05, 1.15);

        // Phase 1: Convergence clash (High + Low frequency collide)
        const redTone = this.ctx.createOscillator();
        const blueTone = this.ctx.createOscillator();
        const clashGain = this.ctx.createGain();

        redTone.type = 'sawtooth';
        redTone.frequency.setValueAtTime(800, now);
        redTone.frequency.exponentialRampToValueAtTime(300, now + 0.6);

        blueTone.type = 'sine';
        blueTone.frequency.setValueAtTime(120, now);
        blueTone.frequency.exponentialRampToValueAtTime(300, now + 0.6);

        clashGain.gain.setValueAtTime(0.4, now);
        clashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        redTone.connect(clashGain);
        blueTone.connect(clashGain);
        clashGain.connect(this.masterGain);
        redTone.start(now);
        blueTone.start(now);
        redTone.stop(now + 0.7);
        blueTone.stop(now + 0.7);

        // Phase 2: Instant vacuum silence -> Mass Disintegration Beam blast
        setTimeout(() => {
            if (this.isMuted || !this.ctx) return;
            const blastNow = this.ctx.currentTime;

            // Tremendous sub explosion
            const sub = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            sub.type = 'sine';
            sub.frequency.setValueAtTime(150, blastNow);
            sub.frequency.exponentialRampToValueAtTime(20, blastNow + 2.0);
            subGain.gain.setValueAtTime(1.0, blastNow);
            subGain.gain.exponentialRampToValueAtTime(0.001, blastNow + 2.2);
            sub.connect(subGain);
            subGain.connect(this.masterGain);
            sub.start(blastNow);
            sub.stop(blastNow + 2.2);

            // Reality tearing static
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(2.2);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(300, blastNow);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.8, blastNow);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, blastNow + 2.0);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noise.start(blastNow);
            noise.stop(blastNow + 2.2);
        }, 500);
    }

    // Malevolent Shrine / Cleave & Dismantle (Sukuna): Razor sharp sword slashes
    playDismantleCleave() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("Kai!", 1.2, 1.4);

        // Multiple rapid razor-sharp slashes
        for (let i = 0; i < 5; i++) {
            const slashTime = now + i * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(2400 - i * 200, slashTime);
            osc.frequency.exponentialRampToValueAtTime(180, slashTime + 0.15);
            gain.gain.setValueAtTime(0.5, slashTime);
            gain.gain.exponentialRampToValueAtTime(0.001, slashTime + 0.16);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(slashTime);
            osc.stop(slashTime + 0.18);
        }
    }

    // Black Flash (Kokusen): Space distortion + devastating physical strike
    playBlackFlash() {
        if (this.isMuted || !this.initialized) return;
        const now = this.ctx.currentTime;
        this.speak("Kokusen!", 1.15, 1.3);

        // 1. Visceral heavy impact thud (0.000001 sec spatial snap)
        const punchOsc = this.ctx.createOscillator();
        const punchGain = this.ctx.createGain();
        punchOsc.type = 'triangle';
        punchOsc.frequency.setValueAtTime(320, now);
        punchOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        punchGain.gain.setValueAtTime(1.0, now);
        punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        punchOsc.connect(punchGain);
        punchGain.connect(this.masterGain);
        punchOsc.start(now);
        punchOsc.stop(now + 0.45);

        // 2. Black lightning crackle burst
        for (let i = 0; i < 6; i++) {
            const sparkOsc = this.ctx.createOscillator();
            const sparkGain = this.ctx.createGain();
            sparkOsc.type = 'sawtooth';
            sparkOsc.frequency.setValueAtTime(1200 + Math.random() * 800, now + 0.05 + i * 0.04);
            sparkGain.gain.setValueAtTime(0.35, now + 0.05 + i * 0.04);
            sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + i * 0.04 + 0.08);
            sparkOsc.connect(sparkGain);
            sparkGain.connect(this.masterGain);
            sparkOsc.start(now + 0.05 + i * 0.04);
            sparkOsc.stop(now + 0.05 + i * 0.04 + 0.09);
        }
    }
}

// Global audio singleton
window.animeAudio = new AnimeAudioEngine();
