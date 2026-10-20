// ============================================================
// Anime Gesture Attacks - Gesture Recognizer
// Advanced 3D Hand Landmark Feature Extraction & Gesture Classifier
// ============================================================

class GestureRecognizer {
    constructor() {
        this.sensitivity = 1.0;
        this.currentMode = 'all'; // 'all', 'dbz', 'naruto', 'jjk'
        
        // State tracking
        this.history = [];
        this.kameChargeTime = 0;
        this.kameCharged = false;
        this.spiritBombChargeTime = 0;
        this.auraTime = 0;
        this.lastHandPos = null;
        this.punchSpeed = 0;
        this.hollowRedBlueReady = false;
        this.lastGesture = null;
        this.gestureConfidence = {};
        
        // Cooldowns to prevent re-trigger spamming
        this.cooldowns = {
            kameBlast: 0,
            spiritBombImpact: 0,
            shadowClone: 0,
            amaterasu: 0,
            unlimitedVoid: 0,
            hollowPurple: 0,
            dismantleCleave: 0,
            blackFlash: 0
        };
    }

    setMode(mode) {
        this.currentMode = mode;
        console.log(`Active anime mode switched to: ${mode}`);
    }

    setSensitivity(val) {
        this.sensitivity = Math.max(0.5, Math.min(2.0, val));
    }

    // Helper: Distance between two 2D/3D points
    dist(p1, p2) {
        if (!p1 || !p2) return 999;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = (p1.z && p2.z) ? (p1.z - p2.z) : 0;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // Helper: Get centroid of hand
    getHandCenter(landmarks) {
        return {
            x: (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3,
            y: (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3,
            z: (landmarks[0].z + landmarks[5].z + landmarks[17].z) / 3
        };
    }

    // Check if a finger is extended relative to its knuckle (MCP) and wrist (0)
    isFingerExtended(lm, tipIdx, pipIdx, mcpIdx) {
        const dTipWrist = this.dist(lm[tipIdx], lm[0]);
        const dPipWrist = this.dist(lm[pipIdx], lm[0]);
        return dTipWrist > dPipWrist * 1.15;
    }

    // Check individual fingers
    checkFingers(lm) {
        // Thumb: compare tip to MCP
        const thumbDist = this.dist(lm[4], lm[17]);
        const thumbMcpDist = this.dist(lm[2], lm[17]);
        const thumbExtended = thumbDist > thumbMcpDist * 1.1;

        const indexExtended = this.isFingerExtended(lm, 8, 6, 5);
        const middleExtended = this.isFingerExtended(lm, 12, 10, 9);
        const ringExtended = this.isFingerExtended(lm, 16, 14, 13);
        const pinkyExtended = this.isFingerExtended(lm, 20, 18, 17);

        return {
            thumb: thumbExtended,
            index: indexExtended,
            middle: middleExtended,
            ring: ringExtended,
            pinky: pinkyExtended,
            extendedCount: (indexExtended ? 1 : 0) + (middleExtended ? 1 : 0) + (ringExtended ? 1 : 0) + (pinkyExtended ? 1 : 0)
        };
    }

    // Is hand clenched in a tight fist?
    isFist(lm, fingers) {
        const center = this.getHandCenter(lm);
        const tips = [lm[8], lm[12], lm[16], lm[20]];
        const avgTipDist = tips.reduce((sum, tip) => sum + this.dist(tip, center), 0) / 4;
        return fingers.extendedCount === 0 || avgTipDist < 0.14 * this.sensitivity;
    }

    // Is hand open palm?
    isOpenPalm(lm, fingers) {
        return fingers.extendedCount >= 3;
    }

    // Is hand clawed / pointing down (for Chidori)?
    isClaw(lm, fingers) {
        const wrist = lm[0];
        const center = this.getHandCenter(lm);
        const pointingDown = center.y > wrist.y;
        const bentFingers = fingers.extendedCount >= 1 && fingers.extendedCount <= 4;
        return pointingDown && bentFingers;
    }

    // Two-finger sword seal (Amaterasu): Index and middle extended, ring & pinky folded
    isSwordSeal(lm, fingers) {
        const tipDist = this.dist(lm[8], lm[12]);
        return fingers.index && fingers.middle && !fingers.ring && !fingers.pinky && tipDist < 0.08 * this.sensitivity;
    }

    // Gojo's Domain Expansion hand seal (crossed index over middle or index+middle vertically locked)
    isGojoSeal(lm, fingers) {
        if (!fingers.index || !fingers.middle || fingers.pinky) return false;
        const tipDist = this.dist(lm[8], lm[12]);
        const midDist = this.dist(lm[7], lm[11]);
        // Fingers crossed or touching very close vertically
        return tipDist < 0.05 * this.sensitivity && midDist < 0.05 * this.sensitivity;
    }

    // Sukuna prayer/shrine clasp (two hands pressed closely together)
    isPrayerClasp(h1, h2) {
        const centerDist = this.dist(h1.center, h2.center);
        const wristDist = this.dist(h1.landmarks[0], h2.landmarks[0]);
        const indexDist = this.dist(h1.landmarks[8], h2.landmarks[8]);
        return centerDist < 0.14 * this.sensitivity && wristDist < 0.16 * this.sensitivity && indexDist < 0.14 * this.sensitivity;
    }

    // Update cooldown timers (called each frame with delta time in seconds)
    updateCooldowns(dt) {
        for (let key in this.cooldowns) {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key] -= dt;
            }
        }
    }

    // Process raw MediaPipe hand landmarks
    // multiHandLandmarks: array of landmark arrays (each 21 points)
    // multiHandedness: array of handedness info
    processHands(multiHandLandmarks, multiHandedness, dt = 0.033) {
        this.updateCooldowns(dt);

        if (!multiHandLandmarks || multiHandLandmarks.length === 0) {
            // Reset charging states smoothly if no hands are visible
            if (this.kameChargeTime > 0) {
                this.kameChargeTime = Math.max(0, this.kameChargeTime - dt * 2);
                if (this.kameChargeTime === 0 && window.animeAudio) window.animeAudio.stopKamehamehaCharge();
            }
            if (this.auraTime > 0) {
                this.auraTime = 0;
                if (window.animeAudio) window.animeAudio.stopSuperSaiyanAura();
            }
            if (window.animeAudio) {
                window.animeAudio.stopRasengan();
                window.animeAudio.stopChidori();
            }
            return { activeAttacks: [], hands: [] };
        }

        // Structure hands data
        const hands = multiHandLandmarks.map((lm, idx) => {
            const fingers = this.checkFingers(lm);
            const center = this.getHandCenter(lm);
            const label = multiHandedness && multiHandedness[idx] ? multiHandedness[idx].label : (idx === 0 ? 'Right' : 'Left');
            return {
                landmarks: lm,
                center,
                fingers,
                isFist: this.isFist(lm, fingers),
                isOpen: this.isOpenPalm(lm, fingers),
                isClaw: this.isClaw(lm, fingers),
                isSwordSeal: this.isSwordSeal(lm, fingers),
                isGojoSeal: this.isGojoSeal(lm, fingers),
                label
            };
        });

        // Track punch velocity (Black Flash) on primary hand
        if (hands.length > 0) {
            const h = hands[0];
            if (this.lastHandPos) {
                const speed = (this.dist(h.center, this.lastHandPos) / dt);
                this.punchSpeed = this.punchSpeed * 0.6 + speed * 0.4;
            }
            this.lastHandPos = { ...h.center };
        }

        const activeAttacks = [];
        const mode = this.currentMode;

        // ============================================================
        // 1. TWO-HAND GESTURES
        // ============================================================
        if (hands.length >= 2) {
            const h1 = hands[0];
            const h2 = hands[1];
            const centerDist = this.dist(h1.center, h2.center);
            const wristDist = this.dist(h1.landmarks[0], h2.landmarks[0]);

            // --------------------------------------------------------
            // DBZ: Kamehameha (Cupped Hands -> Thrust Blast)
            // --------------------------------------------------------
            if (mode === 'all' || mode === 'dbz') {
                const areCupped = centerDist < 0.22 * this.sensitivity && !h1.isFist && !h2.isFist;
                
                if (areCupped && !this.kameCharged) {
                    this.kameChargeTime += dt;
                    if (this.kameChargeTime > 0.3 && this.kameChargeTime - dt <= 0.3) {
                        if (window.animeAudio) window.animeAudio.startKamehamehaCharge();
                    }
                    if (this.kameChargeTime >= 1.2) {
                        this.kameCharged = true;
                    }
                    activeAttacks.push({
                        type: 'kamehameha_charge',
                        origin: { x: (h1.center.x + h2.center.x) / 2, y: (h1.center.y + h2.center.y) / 2 },
                        progress: Math.min(1.0, this.kameChargeTime / 1.2)
                    });
                } else if (this.kameCharged && (centerDist > 0.20 || (h1.isOpen && h2.isOpen))) {
                    // Unleash the blast!
                    if (this.cooldowns.kameBlast <= 0) {
                        this.cooldowns.kameBlast = 2.5;
                        this.kameChargeTime = 0;
                        this.kameCharged = false;
                        if (window.animeAudio) window.animeAudio.playKamehamehaBlast();
                        activeAttacks.push({
                            type: 'kamehameha_blast',
                            origin: { x: (h1.center.x + h2.center.x) / 2, y: (h1.center.y + h2.center.y) / 2 },
                            power: 1.0
                        });
                    }
                } else if (!areCupped && this.kameChargeTime > 0 && !this.kameCharged) {
                    this.kameChargeTime = Math.max(0, this.kameChargeTime - dt * 2);
                    if (this.kameChargeTime === 0 && window.animeAudio) window.animeAudio.stopKamehamehaCharge();
                }

                // --------------------------------------------------------
                // DBZ: Spirit Bomb / Genki Dama (Both hands raised high)
                // --------------------------------------------------------
                const handsRaised = h1.landmarks[0].y < 0.32 && h2.landmarks[0].y < 0.32 && h1.isOpen && h2.isOpen;
                if (handsRaised) {
                    this.spiritBombChargeTime += dt;
                    if (this.spiritBombChargeTime > 0.4 && this.spiritBombChargeTime - dt <= 0.4) {
                        if (window.animeAudio) window.animeAudio.playSpiritBombCharge();
                    }
                    activeAttacks.push({
                        type: 'spirit_bomb_gather',
                        progress: Math.min(1.0, this.spiritBombChargeTime / 2.0),
                        center: { x: 0.5, y: 0.22 }
                    });
                } else if (this.spiritBombChargeTime >= 1.5 && h1.landmarks[0].y > 0.45 && h2.landmarks[0].y > 0.45) {
                    // Dropped hands -> Detonation!
                    if (this.cooldowns.spiritBombImpact <= 0) {
                        this.cooldowns.spiritBombImpact = 3.5;
                        this.spiritBombChargeTime = 0;
                        if (window.animeAudio) window.animeAudio.playSpiritBombImpact();
                        activeAttacks.push({
                            type: 'spirit_bomb_impact',
                            center: { x: 0.5, y: 0.5 }
                        });
                    }
                } else if (!handsRaised && this.spiritBombChargeTime > 0) {
                    this.spiritBombChargeTime = Math.max(0, this.spiritBombChargeTime - dt * 1.5);
                }

                // --------------------------------------------------------
                // DBZ: Super Saiyan Aura (Both fists clenched)
                // --------------------------------------------------------
                if (h1.isFist && h2.isFist && centerDist > 0.25) {
                    this.auraTime += dt;
                    if (this.auraTime > 0.3 && this.auraTime - dt <= 0.3) {
                        if (window.animeAudio) window.animeAudio.startSuperSaiyanAura();
                    }
                    activeAttacks.push({
                        type: 'super_saiyan_aura',
                        hands: [h1.center, h2.center],
                        intensity: Math.min(1.0, this.auraTime / 1.0)
                    });
                } else if (this.auraTime > 0) {
                    this.auraTime = 0;
                    if (window.animeAudio) window.animeAudio.stopSuperSaiyanAura();
                }
            }

            // --------------------------------------------------------
            // NARUTO: Shadow Clone Jutsu (Crossed index fingers "+")
            // --------------------------------------------------------
            if (mode === 'all' || mode === 'naruto') {
                const indexDist = this.dist(h1.landmarks[8], h2.landmarks[8]);
                const crossFingers = h1.fingers.index && h2.fingers.index && indexDist < 0.08 * this.sensitivity;
                if (crossFingers && this.cooldowns.shadowClone <= 0) {
                    this.cooldowns.shadowClone = 3.0;
                    if (window.animeAudio) window.animeAudio.playShadowClonePoof();
                    activeAttacks.push({
                        type: 'shadow_clone_poof',
                        origin: { x: (h1.landmarks[8].x + h2.landmarks[8].x) / 2, y: (h1.landmarks[8].y + h2.landmarks[8].y) / 2 }
                    });
                }
            }

            // --------------------------------------------------------
            // JJK: Hollow Purple (Red & Blue clash -> Cataclysmic beam)
            // --------------------------------------------------------
            if (mode === 'all' || mode === 'jjk') {
                const areHandsSeparated = centerDist > 0.35;
                const areHandsClasped = centerDist < 0.15 * this.sensitivity;

                if (areHandsSeparated && h1.isOpen && h2.isOpen) {
                    this.hollowRedBlueReady = true;
                    activeAttacks.push({
                        type: 'hollow_purple_prep',
                        redPos: h1.center,
                        bluePos: h2.center
                    });
                } else if (this.hollowRedBlueReady && areHandsClasped) {
                    this.hollowRedBlueReady = false;
                    if (this.cooldowns.hollowPurple <= 0) {
                        this.cooldowns.hollowPurple = 4.0;
                        if (window.animeAudio) window.animeAudio.playHollowPurple();
                        activeAttacks.push({
                            type: 'hollow_purple_blast',
                            origin: { x: (h1.center.x + h2.center.x) / 2, y: (h1.center.y + h2.center.y) / 2 }
                        });
                    }
                }

                // --------------------------------------------------------
                // JJK: Malevolent Shrine: Cleave & Dismantle (Sukuna Clasp)
                // --------------------------------------------------------
                if (this.isPrayerClasp(h1, h2) && this.cooldowns.dismantleCleave <= 0) {
                    this.cooldowns.dismantleCleave = 3.2;
                    if (window.animeAudio) window.animeAudio.playDismantleCleave();
                    activeAttacks.push({
                        type: 'malevolent_shrine',
                        origin: { x: (h1.center.x + h2.center.x) / 2, y: (h1.center.y + h2.center.y) / 2 }
                    });
                }
            }
        } else {
            // Only 1 hand visible -> Reset 2-hand charging
            if (this.auraTime > 0) {
                this.auraTime = 0;
                if (window.animeAudio) window.animeAudio.stopSuperSaiyanAura();
            }
            if (this.kameChargeTime > 0) {
                this.kameChargeTime = 0;
                if (window.animeAudio) window.animeAudio.stopKamehamehaCharge();
            }
        }

        // ============================================================
        // 2. SINGLE-HAND GESTURES (Evaluated for each visible hand)
        // ============================================================
        let hasRasengan = false;
        let hasChidori = false;

        hands.forEach((h) => {
            // --------------------------------------------------------
            // JJK: Domain Expansion: Unlimited Void (Gojo Satoru Sign)
            // --------------------------------------------------------
            if ((mode === 'all' || mode === 'jjk') && h.isGojoSeal) {
                if (this.cooldowns.unlimitedVoid <= 0) {
                    this.cooldowns.unlimitedVoid = 5.0;
                    if (window.animeAudio) window.animeAudio.playUnlimitedVoid();
                    activeAttacks.push({
                        type: 'unlimited_void',
                        origin: h.center
                    });
                }
            }

            // --------------------------------------------------------
            // NARUTO: Amaterasu (Two-Finger Sword Seal Pointing)
            // --------------------------------------------------------
            if ((mode === 'all' || mode === 'naruto') && h.isSwordSeal) {
                const targetPoint = h.landmarks[8]; // Tip of index finger
                if (this.cooldowns.amaterasu <= 0) {
                    this.cooldowns.amaterasu = 2.8;
                    if (window.animeAudio) window.animeAudio.playAmaterasu();
                    activeAttacks.push({
                        type: 'amaterasu_ignition',
                        target: targetPoint
                    });
                }
            }

            // --------------------------------------------------------
            // NARUTO: Rasengan (Open palm facing forward/up)
            // --------------------------------------------------------
            if ((mode === 'all' || mode === 'naruto') && h.isOpen && !h.isSwordSeal && !h.isGojoSeal && this.kameChargeTime <= 0) {
                hasRasengan = true;
                activeAttacks.push({
                    type: 'rasengan_sphere',
                    origin: h.center,
                    landmarks: h.landmarks
                });
            }

            // --------------------------------------------------------
            // NARUTO: Chidori (Hand held palm down / clawed)
            // --------------------------------------------------------
            if ((mode === 'all' || mode === 'naruto') && h.isClaw && !h.isFist && !h.isOpen) {
                hasChidori = true;
                activeAttacks.push({
                    type: 'chidori_sparks',
                    origin: h.center,
                    landmarks: h.landmarks
                });
            }

            // --------------------------------------------------------
            // JJK: Black Flash (Kokusen: Punch Strike Impact)
            // --------------------------------------------------------
            if ((mode === 'all' || mode === 'jjk') && h.isFist) {
                if (this.punchSpeed > 2.8 && this.cooldowns.blackFlash <= 0) {
                    this.cooldowns.blackFlash = 2.2;
                    if (window.animeAudio) window.animeAudio.playBlackFlash();
                    activeAttacks.push({
                        type: 'black_flash_impact',
                        origin: h.center
                    });
                }
            }
        });

        // Continuous audio control for Rasengan and Chidori
        if (window.animeAudio) {
            if (hasRasengan && !this.activeRasenganActive) {
                window.animeAudio.startRasengan();
                this.activeRasenganActive = true;
            } else if (!hasRasengan && this.activeRasenganActive) {
                window.animeAudio.stopRasengan();
                this.activeRasenganActive = false;
            }

            if (hasChidori && !this.activeChidoriActive) {
                window.animeAudio.startChidori();
                this.activeChidoriActive = true;
            } else if (!hasChidori && this.activeChidoriActive) {
                window.animeAudio.stopChidori();
                this.activeChidoriActive = false;
            }
        }

        return {
            activeAttacks,
            hands,
            stats: {
                handCount: hands.length,
                kameProgress: this.kameChargeTime / 1.2,
                punchSpeed: this.punchSpeed
            }
        };
    }
}

// Global gesture recognizer singleton
window.gestureRecognizer = new GestureRecognizer();
