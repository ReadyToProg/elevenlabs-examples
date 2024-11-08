document.addEventListener('DOMContentLoaded', () => {
    const avatarVideo = document.querySelector('.avatar-video');
    
    // Переконаємося, що відео завантажилось
    avatarVideo.addEventListener('loadedmetadata', () => {
        console.log('Відео завантажено, починаємо відтворення');
        
        // Встановлюємо необхідні атрибути
        avatarVideo.loop = true;
        avatarVideo.muted = true;
        avatarVideo.playsInline = true;
        
        // Намагаємося відтворити відео
        const playPromise = avatarVideo.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Відтворення почалось успішно');
                })
                .catch(error => {
                    console.error('Помилка відтворення:', error);
                    // Спробуємо відтворити при взаємодії користувача
                    document.addEventListener('click', () => {
                        avatarVideo.play();
                    }, { once: true });
                });
        }
    });
    
    // Додаємо обробники помилок
    avatarVideo.addEventListener('error', (e) => {
        console.error('Помилка відео:', e);
    });
    
    avatarVideo.addEventListener('stalled', () => {
        console.log('Відтворення призупинено');
        avatarVideo.play();
    });
    
    avatarVideo.addEventListener('pause', () => {
        console.log('Відео на паузі, відновлюємо');
        avatarVideo.play();
    });
}); 