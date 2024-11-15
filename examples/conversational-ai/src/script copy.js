window.VideoController = {
    initialized: false,
    
    init() {
        const videos = {
            disconnected: document.querySelector('.disconnected-video'),
            listening: document.querySelector('.listening-video'),
            speaking: document.querySelector('.speaking-video')
        };
        
        // Налаштовуємо всі відео
        Object.values(videos).forEach(video => {
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.play().catch(err => console.log('Автоплей відкладено до взаємодії'));
        });
        
        // Функція для перемикання відео
        this.switchVideo = (status) => {
            console.log('Перемикання відео на статус:', status);
            // Приховуємо всі відео
            Object.values(videos).forEach(video => {
                video.classList.remove('active');
            });
            
            // Показуємо потрібне відео
            switch(status) {
                case 'disconnected':
                    videos.disconnected.classList.add('active');
                    break;
                case 'listening':
                    videos.listening.classList.add('active');
                    break;
                case 'speaking':
                    videos.speaking.classList.add('active');
                    break;
            }
        };
        
        this.initialized = true;
        console.log('VideoController ініціалізовано');
        
        // Встановлюємо початковий стан
        this.switchVideo('disconnected');
    }
};

// Ініціалізуємо контролер при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    window.VideoController.init();
    
    // Додаємо обробник кліку для початку відтворення на мобільних
    document.addEventListener('click', () => {
        const videos = document.querySelectorAll('.avatar-video');
        videos.forEach(video => {
            video.play().catch(err => console.log('Помилка відтворення'));
        });
    }, { once: true });
});

// Створюємо глобальну функцію для сумісності
window.switchAvatarVideo = (status) => {
    if (window.VideoController.initialized) {
        window.VideoController.switchVideo(status);
    } else {
        console.warn('VideoController ще не ініціалізовано');
    }
}; 