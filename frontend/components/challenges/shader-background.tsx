"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface ShaderBackgroundProps {
  leftColor?: string;
  rightColor?: string;
  intensity?: number;
  voteRatio?: number; // 0-1, where 0 = left winning, 1 = right winning
  className?: string;
}

// Vertex shader
const vertexShader = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment shader - creates dynamic battle gradient with energy waves
const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uVoteRatio;
  uniform vec3 uLeftColor;
  uniform vec3 uRightColor;
  uniform vec2 uResolution;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // Calculate battle line position based on vote ratio
    float battleLine = 0.5 + (uVoteRatio - 0.5) * 0.3;

    // Create flowing energy waves
    float noise1 = snoise(vec2(uv.x * 3.0 + uTime * 0.3, uv.y * 2.0)) * 0.15;
    float noise2 = snoise(vec2(uv.x * 5.0 - uTime * 0.2, uv.y * 3.0 + uTime * 0.1)) * 0.1;

    // Dynamic battle boundary with energy distortion
    float distortedX = uv.x + noise1 + noise2;

    // Create gradient with battle energy at the clash point
    float gradient = smoothstep(battleLine - 0.2, battleLine + 0.2, distortedX);

    // Energy concentration at battle line
    float battleEnergy = 1.0 - abs(distortedX - battleLine) * 4.0;
    battleEnergy = max(0.0, battleEnergy);
    battleEnergy = pow(battleEnergy, 2.0);

    // Pulsing energy at clash point
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
    battleEnergy *= 0.5 + pulse * 0.5;

    // Mix colors
    vec3 leftGlow = uLeftColor * 1.2;
    vec3 rightGlow = uRightColor * 1.2;
    vec3 baseColor = mix(uLeftColor, uRightColor, gradient);

    // Add energy glow at battle line
    vec3 energyColor = mix(leftGlow, rightGlow, 0.5);
    baseColor += energyColor * battleEnergy * 0.4;

    // Subtle vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.2);
    vignette = smoothstep(0.0, 1.0, vignette);

    // Add subtle scanlines for tech feel
    float scanline = sin(uv.y * uResolution.y * 0.5) * 0.02 + 1.0;

    // Final color with atmosphere
    vec3 finalColor = baseColor * vignette * scanline;

    // Add subtle white glow at energy points
    finalColor += vec3(1.0) * battleEnergy * 0.15;

    gl_FragColor = vec4(finalColor, 0.85);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0.3, 0.8, 0.94]; // Default cyan
}

export function ShaderBackground({
  leftColor = "#4CC9F0",
  rightColor = "#F97316",
  intensity = 1,
  voteRatio = 0.5,
  className,
}: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return false;

    glRef.current = gl;

    // Create shaders
    const vShader = gl.createShader(gl.VERTEX_SHADER);
    const fShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vShader || !fShader) return false;

    gl.shaderSource(vShader, vertexShader);
    gl.shaderSource(fShader, fragmentShader);
    gl.compileShader(vShader);
    gl.compileShader(fShader);

    // Check for compilation errors
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
      return false;
    }
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
      return false;
    }

    // Create program
    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return false;
    }

    programRef.current = program;

    // Create fullscreen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }, []);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas) return;

    // Resize canvas
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(program);

    // Set uniforms
    const time = (Date.now() - startTimeRef.current) / 1000;
    gl.uniform1f(gl.getUniformLocation(program, "uTime"), time);
    gl.uniform1f(gl.getUniformLocation(program, "uVoteRatio"), voteRatio);
    gl.uniform2f(
      gl.getUniformLocation(program, "uResolution"),
      canvas.width,
      canvas.height
    );

    const leftRgb = hexToRgb(leftColor);
    const rightRgb = hexToRgb(rightColor);
    gl.uniform3f(
      gl.getUniformLocation(program, "uLeftColor"),
      leftRgb[0] * intensity,
      leftRgb[1] * intensity,
      leftRgb[2] * intensity
    );
    gl.uniform3f(
      gl.getUniformLocation(program, "uRightColor"),
      rightRgb[0] * intensity,
      rightRgb[1] * intensity,
      rightRgb[2] * intensity
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationRef.current = requestAnimationFrame(render);
  }, [leftColor, rightColor, intensity, voteRatio]);

  useEffect(() => {
    const success = initWebGL();
    if (success) {
      render();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initWebGL, render]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// Fallback for browsers without WebGL
export function GradientFallback({
  leftColor = "#4CC9F0",
  rightColor = "#F97316",
  voteRatio = 0.5,
  className,
}: ShaderBackgroundProps) {
  const battleLine = 50 + (voteRatio - 0.5) * 30;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(90deg, ${leftColor}40 0%, ${leftColor}20 ${battleLine - 10}%, ${rightColor}20 ${battleLine + 10}%, ${rightColor}40 100%)`,
        pointerEvents: "none",
      }}
    />
  );
}
