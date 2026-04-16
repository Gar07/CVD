import { vertexShaderSource, fragmentShaderSource } from './shaders.js';

export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true });
        
        this.mode = 0; 
        this.intensity = 1.0;
        this.splitPosition = 1.0; // 1.0 = full layar koreksi
        this.sourceElement = null; // Bisa berupa <video> atau <img>
        this.appMode = 0; // 0 untuk Corrector, 1 untuk Simulator
        // Untuk menghitung FPS
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fpsElement = document.getElementById('fps-counter');
        if (this.gl) this.initWebGL();
    }

    setSource(element) {
        this.sourceElement = element;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initWebGL() {
        // Compile Shaders
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Buat Program Shader
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        this.gl.useProgram(this.program);

        // Siapkan posisi segi empat (Rectangle) untuk layar Canvas
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,  1.0, -1.0,  -1.0,  1.0,
            -1.0,  1.0,  1.0, -1.0,   1.0,  1.0
        ]), this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Siapkan koordinat Texture (Video)
        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,  1.0, 0.0,  0.0, 1.0,
            0.0, 1.0,  1.0, 0.0,  1.0, 1.0
        ]), this.gl.STATIC_DRAW);

        const texCoordLocation = this.gl.getAttribLocation(this.program, "a_texCoord");
        this.gl.enableVertexAttribArray(texCoordLocation);
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        // Buat Texture untuk menampung Frame Video
        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        // Dapatkan lokasi Uniform Variables
        this.modeLocation = this.gl.getUniformLocation(this.program, "u_mode");
        this.intensityLocation = this.gl.getUniformLocation(this.program, "u_intensity");
        this.splitLocation = this.gl.getUniformLocation(this.program, "u_splitPosition");
        this.scaleLocation = this.gl.getUniformLocation(this.program, "u_scale");
        this.appModeLocation = this.gl.getUniformLocation(this.program, "u_appMode");
    }

    setSplit(position) { this.splitPosition = position; }
    setAppMode(mode) { this.appMode = mode; }
    setMode(mode) { this.mode = mode; }
    setIntensity(intensity) { this.intensity = intensity; }

    resizeCanvas() {
        // Sesuaikan ukuran canvas dengan jendela peramban
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }

    render() {
        // --- LOGIKA FPS COUNTER ---
        const now = performance.now();
        this.frameCount++;
        if (now - this.lastTime >= 1000) { // Update setiap 1 detik
            if (this.fpsElement) {
                this.fpsElement.innerText = `FPS: ${this.frameCount}`;
                // Ubah warna jika FPS drop di bawah 30
                this.fpsElement.style.color = this.frameCount >= 30 ? '#00FF00' : '#FF0000';
            }
            this.frameCount = 0;
            this.lastTime = now;
        }
        // --------------------------
        
        if (this.sourceElement && (this.sourceElement.readyState >= 2 || this.sourceElement.complete)) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.sourceElement);

            // --- BARU: MATEMATIKA OBJECT-FIT COVER ---
            // Dapatkan resolusi sumber (bisa dari <video> atau <img>)
            const srcWidth = this.sourceElement.videoWidth || this.sourceElement.width;
            const srcHeight = this.sourceElement.videoHeight || this.sourceElement.height;
            
            let scaleX = 1.0;
            let scaleY = 1.0;

            if (srcWidth && srcHeight) {
                const canvasRatio = this.canvas.width / this.canvas.height;
                const srcRatio = srcWidth / srcHeight;

                // Logika pemotongan agar pas layar penuh tanpa mengubah rasio asli
                if (canvasRatio > srcRatio) {
                    scaleY = canvasRatio / srcRatio;
                } else {
                    scaleX = srcRatio / canvasRatio;
                }
            }
            // Kirim skala X dan Y ke Vertex Shader GPU
            this.gl.uniform2f(this.scaleLocation, scaleX, scaleY);
            // ------------------------------------------

            this.gl.uniform1i(this.modeLocation, this.mode);
            this.gl.uniform1f(this.intensityLocation, this.intensity);
            this.gl.uniform1f(this.splitLocation, this.splitPosition);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
            this.gl.uniform1i(this.appModeLocation, this.appMode);
        }
        requestAnimationFrame(() => this.render());
    }

    // Tambahkan method ini di bawah method render()
    getPixelColor(x, y) {
        // Menggunakan drawingBuffer untuk akurasi resolusi tinggi
        const glY = this.gl.drawingBufferHeight - Math.floor(y) - 1; 
        const pixels = new Uint8Array(4);
        
        // Membaca 1x1 piksel pada koordinat X, glY
        this.gl.readPixels(Math.floor(x), glY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        
        return {
            r: pixels[0],
            g: pixels[1],
            b: pixels[2]
        };
    }
}