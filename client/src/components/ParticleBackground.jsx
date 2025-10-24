import { useEffect, useRef } from "react";
import { createParticleSystem } from "../utils/particleSystem";
import "./ParticleBackground.css";

/**
 * Detects if the device is mobile
 */
function isMobile() {
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || window.innerWidth < 768
    );
}

function ParticleBackground() {
    const canvasRef = useRef(null);
    const particleSystemRef = useRef(null);

    useEffect(() => {
        // Don't render particles on mobile devices
        if (isMobile()) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (particleSystemRef.current) {
                particleSystemRef.current.resize(
                    window.innerWidth,
                    window.innerHeight
                );
            }
        };

        resizeCanvas();

        // Create particle system
        particleSystemRef.current = createParticleSystem(canvas, {
            particleCount: 450,
        });

        // Mouse move handler
        const handleMouseMove = (e) => {
            if (particleSystemRef.current) {
                particleSystemRef.current.updateMousePosition(
                    e.clientX,
                    e.clientY
                );
            }
        };

        // Mouse leave handler
        const handleMouseLeave = () => {
            if (particleSystemRef.current) {
                particleSystemRef.current.clearMousePosition();
            }
        };

        // Window resize handler
        const handleResize = () => {
            resizeCanvas();
        };

        // Visibility change handler (pause when tab not visible)
        const handleVisibilityChange = () => {
            if (particleSystemRef.current) {
                if (document.hidden) {
                    particleSystemRef.current.stop();
                } else {
                    particleSystemRef.current.start();
                }
            }
        };

        // Add event listeners
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("resize", handleResize);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Start animation
        particleSystemRef.current.start();

        // Cleanup
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("resize", handleResize);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            if (particleSystemRef.current) {
                particleSystemRef.current.destroy();
                particleSystemRef.current = null;
            }
        };
    }, []);

    // Don't render canvas on mobile
    if (isMobile()) {
        return null;
    }

    return <canvas ref={canvasRef} className="particle-background" />;
}

export default ParticleBackground;
