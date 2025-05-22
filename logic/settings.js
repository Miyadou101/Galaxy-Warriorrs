document.addEventListener('DOMContentLoaded', () => {
    const sfxSlider = document.getElementById('sfxVolume');
    const musicSlider = document.getElementById('musicVolume');

    // Load saved or fallback volumes
    const savedSFX = parseFloat(localStorage.getItem('sfxVolume')) || 0.5;
    const savedMusic = parseFloat(localStorage.getItem('musicVolume')) || 0.5;

    sfxSlider.value = savedSFX;
    musicSlider.value = savedMusic;

    sfxSlider.addEventListener('input', () => {
        localStorage.setItem('sfxVolume', sfxSlider.value);
    });

    musicSlider.addEventListener('input', () => {
        localStorage.setItem('musicVolume', musicSlider.value);
    });
});
