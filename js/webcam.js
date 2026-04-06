export class CameraManager {
    constructor(videoElement) {
        this.video = videoElement;
        this.stream = null;
        this.track = null; // Tambahkan variabel untuk menyimpan track kamera
        this.isTorchOn = false;
    }

    async initCamera() {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Simpan track video pertama untuk fitur senter
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

    // METHOD BARU: Logika Toggle Senter
    async toggleTorch() {
        if (!this.track) return false;
        
        // Cek apakah kamera HP mendukung senter
        const capabilities = this.track.getCapabilities();
        if (!capabilities.torch) {
            alert("Perangkat ini tidak mendukung API Senter (Torch).");
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