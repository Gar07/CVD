export const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    
    uniform vec2 u_scale; // Variabel baru untuk rasio aspek layar
    
    varying vec2 v_texCoord;
    
    void main() {
        // Kalikan posisi titik dengan skala agar video tidak peyang (Object-Fit Cover)
        gl_Position = vec4(a_position * u_scale, 0.0, 1.0);
        
        // Flip Y untuk WebGL
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y); 
    }
`;

export const fragmentShaderSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_image;
    
    uniform int u_mode;
    uniform float u_intensity;
    uniform float u_splitPosition; // Variabel baru untuk Split Screen

    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 rgb = color.rgb;

        // SPLIT SCREEN LOGIC: Jika piksel di kanan garis split, tampilkan warna asli
        if (v_texCoord.x > u_splitPosition || u_mode == 0) {
            gl_FragColor = color;
            return;
        }

        // --- ALGORITMA DALTONIZATION ---
        mat3 rgb2lms = mat3(17.8824, 3.4557, 0.02996, 43.5161, 27.1554, 0.18431, 4.1193, 3.8671, 1.4670);
        mat3 lms2rgb = mat3(0.0809, -0.0102, -0.0004, -0.1305, 0.0540, -0.0041, 0.1167, -0.1136, 0.6935);

        mat3 simCVD;
        if (u_mode == 1) { // Protan
            simCVD = mat3(0.0, 0.0, 0.0, 2.02344, 1.0, 0.0, -2.52581, 0.0, 1.0);
        } else if (u_mode == 2) { // Deutan
            simCVD = mat3(1.0, 0.494207, 0.0, 0.0, 0.0, 0.0, 0.0, 1.24827, 1.0);
        } else { // Tritan
            simCVD = mat3(1.0, 0.0, -0.395913, 0.0, 1.0, 0.801109, 0.0, 0.0, 0.0);
        }

        mat3 err2mod = mat3(0.0, 0.0, 0.0, 0.7, 1.0, 0.0, 0.7, 0.0, 1.0);

        vec3 lms = rgb2lms * rgb;
        vec3 lms_cvd = simCVD * lms;
        vec3 rgb_cvd = lms2rgb * lms_cvd;
        vec3 error = rgb - rgb_cvd;
        vec3 error_mod = err2mod * error;
        vec3 corrected_rgb = rgb + error_mod;
        
        vec3 final_rgb = mix(rgb, corrected_rgb, u_intensity);
        gl_FragColor = vec4(final_rgb, color.a);
    }
`;