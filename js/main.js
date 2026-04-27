import { CameraManager } from './webcam.js';
import { WebGLRenderer } from './renderer.js';

document.addEventListener('DOMContentLoaded', async () => {
    const videoElement = document.getElementById('camera-stream');
    const canvasElement = document.getElementById('gl-canvas');
    const renderer = new WebGLRenderer(canvasElement);
    const camera = new CameraManager(videoElement);
    
    // --- 1. FITUR KAMERA & RENDERER ---
    async function startCamera() {
        const size = await camera.initCamera();
        if (size) {
            renderer.setSource(videoElement);
            document.getElementById('btn-camera').style.display = 'none';
        }
    }
    await startCamera();
    renderer.resizeCanvas();
    window.addEventListener('resize', () => renderer.resizeCanvas());
    renderer.render();

    // --- 2. FITUR UI KONTROL UTAMA (DIPERBARUI) ---
    const intensitySlider = document.getElementById('intensity');
    const cvdSelect = document.getElementById('cvd-mode');
    const appModeRadios = document.getElementsByName('appMode');

    // Kontrol Intensitas
    intensitySlider.addEventListener('input', (e) => {
        renderer.setIntensity(parseFloat(e.target.value));
    });

    // Kontrol Dropdown Jenis Buta Warna
    cvdSelect.addEventListener('change', (e) => {
        renderer.setMode(parseInt(e.target.value));
    });

    // Kontrol Sakelar Koreksi vs Simulasi
    appModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                renderer.setAppMode(parseInt(e.target.value));
                
                // Ubah aksen warna UI sebagai indikator
                const uiPanel = document.getElementById('ui-panel');
                if (e.target.value === "1") {
                    // Warna Simulator (Oranye/Kuning)
                    uiPanel.style.boxShadow = "0 4px 15px rgba(255, 152, 0, 0.4)";
                } else {
                    // Warna Korektor (Default Hitam/Abu)
                    uiPanel.style.boxShadow = "0 4px 15px rgba(0,0,0,0.5)";
                }
            }
        });
    });

    // --- 3. FITUR SPLIT SCREEN (DIPERBARUI) ---
    const btnSplit = document.getElementById('btn-split');
    const splitSlider = document.getElementById('split-slider');
    const splitDivider = document.getElementById('split-divider');
    let isSplitActive = false;

    // Toggle Mode Split
    btnSplit.addEventListener('click', () => {
        isSplitActive = !isSplitActive;
        if (isSplitActive) {
            btnSplit.innerText = "🎚️ Split: ON";
            btnSplit.style.backgroundColor = "#4CAF50"; // Nyala hijau
            splitSlider.classList.add('active');
            splitDivider.classList.add('active');
            
            // Set ke tengah saat baru dinyalakan
            splitSlider.value = 0.5;
            renderer.setSplit(0.5);
            splitDivider.style.left = '50%';
        } else {
            btnSplit.innerText = "🎚️ Split: OFF";
            btnSplit.style.backgroundColor = "rgba(0, 0, 0, 0.6)"; // Mati
            splitSlider.classList.remove('active');
            splitDivider.classList.remove('active');
            
            // Kembalikan ke layar penuh (tidak ada split)
            splitSlider.value = 1.0;
            renderer.setSplit(1.0);
            splitDivider.style.left = '100%';
        }
    });

    splitSlider.addEventListener('input', (e) => {
        if (!isSplitActive) return; // Abaikan jika split mati
        const val = e.target.value;
        renderer.setSplit(parseFloat(val));
        splitDivider.style.left = (val * 100) + '%';
    });

    // --- FITUR SENTER (BARU) ---
    const btnTorch = document.getElementById('btn-torch');
    btnTorch.addEventListener('click', async () => {
        const isNowOn = await camera.toggleTorch();
        if (isNowOn) {
            btnTorch.style.backgroundColor = '#4CAF50';
        } else {
            btnTorch.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        }
    });

    // --- FITUR SIMPAN FOTO (BARU) ---
    const btnSnapshot = document.getElementById('btn-snapshot');
    btnSnapshot.addEventListener('click', () => {
        // Render ulang paksa sekali untuk memastikan buffer GPU siap digambar
        renderer.render(); 
        
        // Ambil data gambar dari elemen canvas
        const dataURL = canvasElement.toDataURL('image/png');
        
        // Buat elemen link tak terlihat untuk memicu unduhan
        const downloadLink = document.createElement('a');
        downloadLink.download = `CVD-Koreksi-${new Date().getTime()}.png`;
        downloadLink.href = dataURL;
        downloadLink.click();
    });

    // --- 4. FITUR UNGGAH GAMBAR (STATIC MODE) ---
    const imageUpload = document.getElementById('image-upload');
    const btnCamera = document.getElementById('btn-camera');
    const imgElement = new Image(); // Objek gambar maya

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imgElement.src = event.target.result;
                imgElement.onload = () => {
                    renderer.setSource(imgElement); // Ganti sumber tekstur ke gambar
                    btnCamera.style.display = 'block'; // Tampilkan tombol kembali ke kamera
                }
            };
            reader.readAsDataURL(file);
        }
    });

    btnCamera.addEventListener('click', () => {
        renderer.setSource(videoElement); // Kembalikan ke kamera
        btnCamera.style.display = 'none';
    });

    // --- 5. FITUR MODAL EDUKASI ---
    const modal = document.getElementById('edu-modal');
    document.getElementById('btn-info').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('close-modal').addEventListener('click', () => modal.classList.add('hidden'));
    // --- FITUR NAVIGASI TAB DI DALAM MODAL ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Hapus status aktif dari semua tombol dan konten
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Aktifkan tombol yang diklik
            btn.classList.add('active');
            
            // Aktifkan konten yang sesuai dengan data-target
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Registrasi PWA Service Worker (Tetap)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js');
    }

    // --- 6. FITUR COLOR INSPECTOR ---
    const canvas = document.getElementById('gl-canvas');
    const inspectorPanel = document.getElementById('color-inspector');
    const colorBox = document.getElementById('color-box');
    const colorNameText = document.getElementById('color-name');
    const colorRgbText = document.getElementById('color-rgb');
    const closeInspector = document.getElementById('close-inspector');

    let isInspectorActive = true;

    closeInspector.addEventListener('click', (e) => {
        e.stopPropagation(); // Mencegah klik tembus ke canvas
        inspectorPanel.classList.add('hidden');
        isInspectorActive = false;
        // Tampilkan kembali setelah 3 detik jika ingin dipakai lagi (opsional)
        setTimeout(() => { isInspectorActive = true; }, 1000); 
    });

    // Database Warna Super Lengkap untuk Resolusi Jarak Euclidean yang Akurat
    const colorPalette = [
        // --- KELOMPOK MERAH ---
        { name: 'Merah Murni', r: 255, g: 0, b: 0 },
        { name: 'Merah Gelap', r: 139, g: 0, b: 0 },
        { name: 'Merah Marun', r: 128, g: 0, b: 0 },
        { name: 'Merah Bata', r: 178, g: 34, b: 34 },
        { name: 'Merah Tomat', r: 255, g: 99, b: 71 },
        { name: 'Merah Koral', r: 255, g: 127, b: 80 },
        { name: 'Merah Hati', r: 100, g: 20, b: 20 },

        // --- KELOMPOK MERAH MUDA (PINK) ---
        { name: 'Merah Muda / Pink', r: 255, g: 192, b: 203 },
        { name: 'Pink Cerah', r: 255, g: 105, b: 180 },
        { name: 'Fuchsia / Magenta', r: 255, g: 0, b: 255 },
        { name: 'Salem / Peach', r: 255, g: 218, b: 185 },

        // --- KELOMPOK ORANYE ---
        { name: 'Oranye', r: 255, g: 165, b: 0 },
        { name: 'Oranye Gelap', r: 255, g: 140, b: 0 },
        { name: 'Jingga', r: 255, g: 69, b: 0 },
        { name: 'Kuning Kunyit', r: 218, g: 165, b: 32 },

        // --- KELOMPOK KUNING ---
        { name: 'Kuning Murni', r: 255, g: 255, b: 0 },
        { name: 'Kuning Pucat', r: 255, g: 255, b: 224 },
        { name: 'Kuning Emas', r: 255, g: 215, b: 0 },
        { name: 'Kuning Lemon', r: 255, g: 250, b: 205 },
        { name: 'Kuning Mustard', r: 255, g: 219, b: 88 },

        // --- KELOMPOK HIJAU ---
        { name: 'Hijau Murni', r: 0, g: 255, b: 0 },
        { name: 'Hijau Daun', r: 34, g: 139, b: 34 },
        { name: 'Hijau Gelap', r: 0, g: 100, b: 0 },
        { name: 'Hijau Zaitun / Olive', r: 128, g: 128, b: 0 },
        { name: 'Hijau Lumut', r: 85, g: 107, b: 47 },
        { name: 'Hijau Army', r: 75, g: 83, b: 32 },
        { name: 'Hijau Sage', r: 138, g: 154, b: 91 },    // Akan menangkap warna pudar
        { name: 'Hijau Pudar', r: 143, g: 188, b: 143 },  // Memperbaiki deteksi RGB 132, 174, 104
        { name: 'Hijau Teh / Matcha', r: 208, g: 240, b: 192 },
        { name: 'Hijau Mint', r: 152, g: 255, b: 152 },
        { name: 'Hijau Neon', r: 57, g: 255, b: 20 },
        { name: 'Hijau Limau / Lime', r: 50, g: 205, b: 50 },

        // --- KELOMPOK BIRU & TOSCA ---
        { name: 'Hijau Tosca / Cyan', r: 0, g: 255, b: 255 },
        { name: 'Tosca Gelap / Teal', r: 0, g: 128, b: 128 },
        { name: 'Biru Kehijauan / Turquoise', r: 64, g: 224, b: 208 },
        { name: 'Biru Murni', r: 0, g: 0, b: 255 },
        { name: 'Biru Langit', r: 135, g: 206, b: 235 },
        { name: 'Biru Muda', r: 173, g: 216, b: 230 },
        { name: 'Biru Laut', r: 0, g: 105, b: 148 },
        { name: 'Biru Dongker / Navy', r: 0, g: 0, b: 128 },
        { name: 'Biru Pudar / Denim', r: 96, g: 130, b: 182 },

        // --- KELOMPOK UNGU ---
        { name: 'Ungu Murni', r: 128, g: 0, b: 128 },
        { name: 'Ungu Gelap', r: 75, g: 0, b: 130 },
        { name: 'Ungu Terang / Violet', r: 238, g: 130, b: 238 },
        { name: 'Ungu Muda / Lavender', r: 230, g: 230, b: 250 },
        { name: 'Nila / Indigo', r: 75, g: 0, b: 130 },

        // --- KELOMPOK COKELAT ---
        { name: 'Cokelat', r: 165, g: 42, b: 42 },
        { name: 'Cokelat Gelap', r: 101, g: 67, b: 33 },
        { name: 'Cokelat Kayu', r: 139, g: 69, b: 19 },
        { name: 'Cokelat Tanah', r: 210, g: 180, b: 140 },
        { name: 'Khaki', r: 240, g: 230, b: 140 },
        { name: 'Krem / Beige', r: 245, g: 245, b: 220 },

        // --- KELOMPOK NETRAL (HITAM, PUTIH, ABU) ---
        { name: 'Putih', r: 255, g: 255, b: 255 },
        { name: 'Putih Tulang / Ivory', r: 255, g: 255, b: 240 },
        { name: 'Abu-abu Terang', r: 211, g: 211, b: 211 },
        { name: 'Abu-abu', r: 128, g: 128, b: 128 },
        { name: 'Abu-abu Gelap', r: 105, g: 105, b: 105 },
        { name: 'Abu-abu Kebiruan', r: 112, g: 128, b: 144 },
        { name: 'Abu-abu Kehijauan', r: 112, g: 130, b: 112 },
        { name: 'Hitam', r: 0, g: 0, b: 0 },
        { name: 'Hitam Pekat', r: 20, g: 20, b: 20 }
    ];

    function getClosestColorName(r, g, b) {
        let minDistance = Infinity;
        let closestName = 'Tidak Diketahui';

        for (let i = 0; i < colorPalette.length; i++) {
            const c = colorPalette[i];
            
            const distance = Math.sqrt(
                Math.pow(c.r - r, 2) + 
                Math.pow(c.g - g, 2) + 
                Math.pow(c.b - b, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestName = c.name;
            }
        }
        return closestName;
    }

    // Tangkap event klik/sentuh pada kanvas
    canvas.addEventListener('click', (e) => {
        if (!isInspectorActive || isSplitActive) return;

        // Dapatkan koordinat klik sesuai resolusi canvas sebenarnya
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;   
        const scaleY = canvas.height / rect.height; 

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Ambil warna dari WebGL
        const color = renderer.getPixelColor(Math.floor(x), Math.floor(y));
        
        // --- LOGIKA BARU: DETEKSI INTENSITAS CAHAYA (LUMINANCE) ---
        // Rumus Relative Luminance (0 sangat gelap, 255 sangat terang)
        const luminance = (0.299 * color.r) + (0.587 * color.g) + (0.114 * color.b);
        const warningElement = document.getElementById('color-warning');
        
        // Ambang batas kegelapan (threshold). Nilai 40 ke bawah biasanya terlalu gelap
        if (luminance < 40) {
            warningElement.style.display = 'block'; // Tampilkan peringatan
        } else {
            warningElement.style.display = 'none';  // Sembunyikan peringatan
        }
        // ----------------------------------------------------------

        // Update UI Inspector
        inspectorPanel.classList.remove('hidden');
        colorBox.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        colorRgbText.innerText = `RGB: ${color.r}, ${color.g}, ${color.b}`;
        colorNameText.innerText = getClosestColorName(color.r, color.g, color.b);
    });

    // --- 7. IMMERSIVE MODE (SEMBUNYIKAN UI) ---
    const topControls = document.getElementById('top-controls');
    const uiPanel = document.getElementById('ui-panel');
    const btnHideUI = document.getElementById('btn-hide-ui');
    const btnShowUI = document.getElementById('btn-show-ui');

    btnHideUI.addEventListener('click', () => {
        topControls.classList.add('immersive-hidden-top');
        uiPanel.classList.add('immersive-hidden-bottom');
        if(!inspectorPanel.classList.contains('hidden')) {
            inspectorPanel.classList.add('hidden');
        }
        btnShowUI.classList.remove('hidden');
    });

    btnShowUI.addEventListener('click', () => {
        topControls.classList.remove('immersive-hidden-top');
        uiPanel.classList.remove('immersive-hidden-bottom');
        btnShowUI.classList.add('hidden');
    });

    // --- 8. CUSTOM PWA INSTALL BUTTON ---
    let deferredPrompt;
    const btnInstall = document.getElementById('btn-install');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Mencegah Chrome memunculkan prompt mini secara otomatis
        e.preventDefault();
        // Simpan event agar bisa dipicu nanti
        deferredPrompt = e;
        // Tampilkan tombol instal kita
        btnInstall.style.display = 'block';
    });

    btnInstall.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Tunculkan prompt instalasi bawaan browser
            deferredPrompt.prompt();
            // Tunggu respon pengguna
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('Pengguna menginstal PWA');
            }
            deferredPrompt = null;
            btnInstall.style.display = 'none'; // Sembunyikan tombol setelah ditekan
        }
    });

    // Sembunyikan tombol jika aplikasi sudah diinstal / dijalankan dalam mode standalone
    window.addEventListener('appinstalled', () => {
        btnInstall.style.display = 'none';
    });
});