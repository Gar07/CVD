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
    
    uniform int u_mode;           // 0 hingga 7 (Sesuai dengan HTML Select)
    uniform float u_intensity;    // 0.0 hingga 1.0
    uniform float u_splitPosition;// Untuk garis split
    uniform int u_appMode;        // 0: Corrector, 1: Simulator

    void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        vec3 rgb = color.rgb;

        // Split Screen Logic: Jika di kanan garis, tampilkan asli
        if (v_texCoord.x > u_splitPosition || u_mode == 0) {
            gl_FragColor = color;
            return;
        }

        // 1. Matriks Transformasi Ruang LMS
        mat3 rgb2lms = mat3(17.8824, 3.4557, 0.02996, 43.5161, 27.1554, 0.18431, 4.1193, 3.8671, 1.4670);
        mat3 lms2rgb = mat3(0.0809, -0.0102, -0.0004, -0.1305, 0.0540, -0.0041, 0.1167, -0.1136, 0.6935);

        // 2. Kalkulasi Dasar Buta Warna Total (Dichromacy) & Monokrom
        vec3 baseCVD = rgb; // Default
        
        if (u_mode == 1 || u_mode == 2) { // Protan (Total / Lemah)
            mat3 simProtan = mat3(0.0, 0.0, 0.0, 2.02344, 1.0, 0.0, -2.52581, 0.0, 1.0);
            baseCVD = lms2rgb * (simProtan * (rgb2lms * rgb));
        } 
        else if (u_mode == 3 || u_mode == 4) { // Deutan (Total / Lemah)
            mat3 simDeutan = mat3(1.0, 0.494207, 0.0, 0.0, 0.0, 0.0, 0.0, 1.24827, 1.0);
            baseCVD = lms2rgb * (simDeutan * (rgb2lms * rgb));
        } 
        else if (u_mode == 5 || u_mode == 6) { // Tritan (Total / Lemah)
            mat3 simTritan = mat3(1.0, 0.0, -0.395913, 0.0, 1.0, 0.801109, 0.0, 0.0, 0.0);
            baseCVD = lms2rgb * (simTritan * (rgb2lms * rgb));
        }
        else if (u_mode == 7) { // Achromatopsia (Monokrom)
            // Menggunakan persepsi Luminance standar NTSC
            float gray = dot(rgb, vec3(0.299, 0.587, 0.114));
            baseCVD = vec3(gray, gray, gray);
        }

        // 3. Kalkulasi Anomali (Kelemahan warna, bukan buta total)
        vec3 simCVD = baseCVD;
        // Jika mode genap (2=Protanomali, 4=Deuteranomali, 6=Tritanomali), campur 60% efek buta warna
        if (u_mode == 2 || u_mode == 4 || u_mode == 6) {
            simCVD = mix(rgb, baseCVD, 0.6);
        }

        vec3 final_rgb;

        // 4. CABANG LOGIKA: SIMULATOR vs KOREKTOR
        if (u_appMode == 1) {
            // [MODE SIMULATOR] Langsung keluarkan hasil buta warnanya
            final_rgb = mix(rgb, simCVD, u_intensity);
        } else {
            // [MODE KOREKTOR] Lakukan Daltonization
            // Matriks pergeseran warna untuk membantu membedakan kontras
            mat3 err2mod = mat3(0.0, 0.0, 0.0, 0.7, 1.0, 0.0, 0.7, 0.0, 1.0);
            
            vec3 error = rgb - simCVD;          // Cari warna yang tak terlihat
            vec3 error_mod = err2mod * error;   // Geser warna tersebut
            vec3 corrected_rgb = clamp(rgb + error_mod, 0.0, 1.0); // Tambahkan ke asli
            
            final_rgb = mix(rgb, corrected_rgb, u_intensity);
        }

        gl_FragColor = vec4(final_rgb, color.a);
    }
`;