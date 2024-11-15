import { Conversation } from '@11labs/client';

let conversation = null;
let messageHistory = [];
const MAX_RECONNECT_ATTEMPTS = 3;
let reconnectAttempts = 0;

// Додамо змінну для відстеження стану
let isIntentionalDisconnect = false;

const MESSAGES = {
    NEW_CONVERSATION: 'New Conversation Started',
    RECONNECTED: 'Connection Reestablished',
    DISCONNECTED: 'Conversation Ended',
    ERROR: 'Error: '
};

// Додаємо новий тип статусу
const STATUS = {
    DISCONNECTED: 'disconnected',
    LISTENING: 'listening',
    SPEAKING: 'speaking'
};

// Додаємо шляхи до відео
const VIDEOS = {
    [STATUS.DISCONNECTED]: '/public/videos/idle.mp4',
    [STATUS.LISTENING]: '/public/videos/listening.mp4',
    [STATUS.SPEAKING]: '/public/videos/speaking.mp4'
};

class ChatMessage {
    constructor(content, role, timestamp) {
        this.content = content;
        this.role = role;
        this.timestamp = timestamp || new Date().toISOString();
    }

    static fromJSON(json) {
        return new ChatMessage(json.content, json.role, json.timestamp);
    }
}

async function getSignedUrl() {
    try {
        const response = await fetch('http://localhost:3030/api/signed-url', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Отримано signed URL:', data);
        return data.signedUrl;
    } catch (error) {
        console.error('Помилка отримання signed URL:', error);
        throw error;
    }
}

async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Помилка доступу до мікрофона:', error);
        return false;
    }
}

// Оновлюємо функцію оновлення статусу
function updateStatus(status) {
    const statusDot = document.querySelector('.status-dot');
    const avatar = document.querySelector('.avatar');
    
    statusDot.classList.remove('connected', 'speaking');
    avatar.classList.remove('speaking');
    
    // Перемикаємо відео
    window.switchAvatarVideo(status);
    
    switch(status) {
        case STATUS.LISTENING:
            statusDot.classList.add('connected');
            break;
        case STATUS.SPEAKING:
            statusDot.classList.add('speaking');
            avatar.classList.add('speaking');
            break;
        case STATUS.DISCONNECTED:
        default:
            break;
    }
}

function showSystemNotification(message) {
    const messagesList = document.getElementById('messagesList');
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'system-notification';
    notificationDiv.textContent = message;
    messagesList.appendChild(notificationDiv);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function addMessage(content, role) {
    const messagesList = document.getElementById('messagesList');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const time = new Date().toLocaleTimeString();
    
    messageDiv.innerHTML = `
        ${content}
        <div class="message-time">${time}</div>
    `;
    
    messagesList.appendChild(messageDiv);
    messagesList.scrollTop = messagesList.scrollHeight;

    // Зберігаємо повідомлення в історію
    const chatMessage = new ChatMessage(content, role);
    messageHistory.push(chatMessage);
    saveHistoryToStorage();
}

function formatHistoryContext() {
    return messageHistory
        .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
        .join('\n');
}

async function startConversation(isReconnect = false) {
    try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Потрібен дозвіл на використання мікрофона.');
            return;
        }

        const signedUrl = await getSignedUrl();
        const initialContext = messageHistory.length > 0 ? formatHistoryContext() : '';
        
        const config = {
            signedUrl,
            initialContext,
            contextType: 'conversation_history',
            audioConfig: {
                sampleRate: 16000,
                channelCount: 1
            },
            onConnect: () => {
                console.log('Connected to conversation');
                updateStatus(STATUS.LISTENING);
                startButton.disabled = true;
                endButton.disabled = false;
                showSystemNotification(isReconnect ? MESSAGES.RECONNECTED : MESSAGES.NEW_CONVERSATION);
            },
            onDisconnect: async () => {
                console.log('Disconnect event received');
                updateStatus(STATUS.DISCONNECTED);
                startButton.disabled = false;
                endButton.disabled = true;
                showSystemNotification(MESSAGES.DISCONNECTED);
            },
            onModeChange: (modeObj) => {
                console.log('Mode changed:', modeObj);
                
                // Отримуємо значення mode з об'кта
                const mode = modeObj.mode;
                
                switch(mode) {
                    case 'speaking':
                        console.log('AI почав говорити');
                        updateStatus(STATUS.SPEAKING);
                        break;
                    case 'listening':
                        console.log('AI почав слухати');
                        updateStatus(STATUS.LISTENING);
                        break;
                    default:
                        console.log('Невідомий режим:', mode);
                        break;
                }
            },
            onMessage: (message) => {
                if (message && message.source === 'ai' && message.message) {
                    addMessage(message.message, 'assistant');
                } else if (message && message.source === 'user' && message.message) {
                    addMessage(message.message, 'user');
                }
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                showSystemNotification(MESSAGES.ERROR + error.message);
            }
        };

        if (initialContext) {
            console.log('Передаємо контекст при ' + 
                (isReconnect ? 'перепідключенні' : 'новій розмові'), initialContext);
        }
        
        conversation = await Conversation.startSession(config);
        
    } catch (error) {
        console.error('Помилка при створенні розмови:', error);
        showSystemNotification(MESSAGES.ERROR + error.message);
    }
}

// Оновлюємо функцію завершення розмови
async function endConversation() {
    if (conversation) {
        try {
            await conversation.endSession();
            conversation = null;
            
            updateStatus(STATUS.DISCONNECTED);
            const startButton = document.getElementById('startButton');
            const endButton = document.getElementById('endButton');
            startButton.disabled = false;
            endButton.disabled = true;
            
            showSystemNotification(MESSAGES.DISCONNECTED);
        } catch (error) {
            console.error('Помилка при завершенні розмови:', error);
            showSystemNotification(MESSAGES.ERROR + error.message);
        }
    }
}

function saveHistoryToStorage() {
    try {
        localStorage.setItem('chatHistory', JSON.stringify(messageHistory));
        console.log('Історію збережено в localStorage:', messageHistory.length, 'повідомлень');
    } catch (error) {
        console.error('Помилка при збереженні історії:', error);
    }
}

function loadHistoryFromStorage() {
    try {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            const parsedHistory = JSON.parse(saved);
            messageHistory = parsedHistory.map(msg => ChatMessage.fromJSON(msg));
            console.log('Завантажено історію:', messageHistory.length, 'повідомлень');
            
            const messagesList = document.getElementById('messagesList');
            messagesList.innerHTML = '';
            
            messageHistory.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.role}`;
                
                const time = new Date(msg.timestamp).toLocaleTimeString();
                
                messageDiv.innerHTML = `
                    ${msg.content}
                    <div class="message-time">${time}</div>
                `;
                
                messagesList.appendChild(messageDiv);
            });
        } else {
            console.log('Історію не знайдено в localStorage');
        }
    } catch (error) {
        console.error('Помилка при завантаженні історії:', error);
    }
}

function clearHistory() {
    messageHistory = [];
    localStorage.removeItem('chatHistory');
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';
    showSystemNotification('Історію очищено');
}

function clearHistoryWithConfirmation() {
    if (confirm('Ви впевнені, що хочете очистити всю історію розмови?')) {
        clearHistory();
    }
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    
    startButton.addEventListener('click', () => startConversation());
    endButton.addEventListener('click', async () => await endConversation());
    
    loadHistoryFromStorage();
    updateStatus(STATUS.DISCONNECTED);
});

// Додаємо функцію для тестування
function debugHistory() {
    console.group('Стан історії повідомлень');
    console.log('Кількість повідомлень:', messageHistory.length);
    console.log('Поідомлення:', messageHistory);
    console.log('Розмір в localStorage:', new Blob([localStorage.getItem('chatHistory')]).size, 'байт');
    console.groupEnd();
}

// Додайте цю функцію до існуючого коду
function updateAISpeakingState(isSpeaking) {
    const mainContent = document.querySelector('.main-content');
    const messagesWrapper = document.querySelector('.messages-wrapper');
    
    if (isSpeaking) {
        mainContent.classList.add('ai-speaking');
        messagesWrapper.classList.add('ai-speaking');
    } else {
        mainContent.classList.remove('ai-speaking');
        messagesWrapper.classList.remove('ai-speaking');
    }
}

// Викликайте цю функцію при зміні стану розмови
// Наприклад, в onModeChange:
onModeChange: (mode) => {
    switch(mode) {
        case 'speaking':
            updateStatus(STATUS.SPEAKING);
            updateAISpeakingState(true);
            break;
        case 'listening':
            updateStatus(STATUS.LISTENING);
            updateAISpeakingState(false);
            break;
        case 'disconnected':
            updateStatus(STATUS.DISCONNECTED);
            updateAISpeakingState(false);
            break;
    }
}
