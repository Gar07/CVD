export class CameraManager {
    constructor(videoElement) {
        this.video = videoElement;
        this.stream = null;
        this.track = null; 
        this.isTorchOn = false;
        
        // Mode bawaan adalah kamera belakang ('environment')
        this.facingMode = 'environment'; 
    }

    async initCamera() {
        // 1. Hentikan kamera sebelumnya jika sedang aktif
        this.stopCamera();

        try {
            // 2. Minta akses kamera sesuai mode yang sedang aktif
            const constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            this.track = this.stream.getVideoTracks()[0]; 
            
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve({ width: this.video.videoWidth, height: this.video.videoHeight });
                };
            });
        } catch (error) {
            console.error("Gagal mengakses kamera:", error);
            alert("Akses kamera ditolak atau tidak ditemukan.");
            return null;
        }
    }

    // METHOD BARU: Hentikan semua aliran video sebelum berpindah
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.track = null;
            this.isTorchOn = false; // Reset status senter
        }
    }

    // METHOD BARU: Tukar antara Kamera Depan dan Belakang
    async switchCamera() {
        // Ubah variabel mode: Jika environment jadikan user, sebaliknya.
        this.facingMode = (this.facingMode === 'environment') ? 'user' : 'environment';
        
        // Inisialisasi ulang dengan mode baru
        return await this.initCamera();
    }

    async toggleTorch() {
        if (!this.track) return false;
        
        const capabilities = this.track.getCapabilities();
        if (!capabilities.torch) {
            // Beri peringatan lebih ramah karena kamera depan HP biasanya tidak punya senter
            alert("Kamera yang sedang aktif tidak mendukung API Senter (Torch). Biasanya fitur ini hanya ada di kamera belakang.");
            return false;
        }

        try {
            this.isTorchOn = !this.isTorchOn;
            await this.track.applyConstraints({
                advanced: [{ torch: this.isTorchOn }]
            });
            return this.isTorchOn;
        } catch (err) {
            console.error("Gagal menyalakan senter:", err);
            return false;
        }
    }
}