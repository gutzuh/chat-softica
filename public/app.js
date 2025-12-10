// ===== Estado da Aplicação =====
let socket = null;
let currentUser = null;
let isAdmin = false;
let users = [];
let typingTimeout = null;
let notificationsEnabled = false;
let currentAvatar = null; // base64 data URL
let authToken = null; // JWT token
let currentTheme = 'default'; // Tema atual

// Constantes de armazenamento - SIMPLES E DIRETO
const TOKEN_KEY = 'chatAuthToken';
const USER_STORAGE_KEY = 'chatUsername';
const AVATAR_STORAGE_KEY = 'chatUserAvatar';
const THEME_KEY = 'chatTheme';

// Estado para resposta/edição
let replyingTo = null;
let editingMessage = null;

// ===== Elementos do DOM =====
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const usersList = document.getElementById('users-list');
const userCount = document.getElementById('user-count');
const currentUsername = document.getElementById('current-username');
const currentUserInitial = document.getElementById('current-user-initial');
const currentUserAvatar = document.getElementById('current-user-avatar');
const avatarInput = document.getElementById('avatar-input');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const logoutBtn = document.getElementById('logout-btn');
const typingIndicator = document.getElementById('typing-indicator');
const connectionDot = document.getElementById('connection-dot');
const connectionText = document.getElementById('connection-text');
const clearChatBtn = document.getElementById('clear-chat-btn');
const stickerBtn = document.getElementById('sticker-btn');
const stickerPicker = document.getElementById('sticker-picker');
const closeStickerBtn = document.getElementById('close-sticker-btn');
const stickerContent = document.getElementById('sticker-content');
const stickerTabs = document.querySelectorAll('.sticker-tab');
const imageBtn = document.getElementById('image-btn');
const imageInput = document.getElementById('image-input');
const fileBtn = document.getElementById('file-btn');
const fileInput = document.getElementById('file-input');
const addonsBtn = document.getElementById('addons-btn');
const addonsSidebar = document.getElementById('addons-sidebar');
const closeAddonsBtn = document.getElementById('close-addons-btn');
const newCounterBtn = document.getElementById('new-counter-btn');
const countersList = document.getElementById('counters-list');
const themeBtn = document.getElementById('theme-btn');
const clearDbBtn = document.getElementById('clear-db-btn');

// Elementos do avatar na tela de login
const loginAvatar = document.getElementById('login-avatar');
const loginAvatarInitial = document.getElementById('login-avatar-initial');
const loginAvatarInput = document.getElementById('login-avatar-input');

// ===== Inicialização =====
document.addEventListener('DOMContentLoaded', () => {
    // Carregar tema salvo
    loadSavedTheme();
    
    // Carregar dados de comandos
    Commands.loadCommandsData();
    
    // Iniciar sistema de alertas de eventos
    Commands.startEventAlerts();
    
    // Verificar se usuário está logado no localStorage
    checkAndAutoLogin();
    
    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    messageForm.addEventListener('submit', handleSendMessage);
    logoutBtn.addEventListener('click', handleLogout);
    messageInput.addEventListener('input', handleTyping);
    
    // Botão de tema
    if (themeBtn) {
        themeBtn.addEventListener('click', openThemeModal);
    }
    
    // Botão de limpar banco (só para admin)
    if (clearDbBtn) {
        clearDbBtn.addEventListener('click', handleClearDatabase);
    }
    
    messageInput.addEventListener('keydown', (e) => {
        // Enter para enviar (sem Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('send-btn').click();
        }
    });
    clearChatBtn.addEventListener('click', handleClearChat);
    stickerBtn.addEventListener('click', toggleStickerPicker);
    closeStickerBtn.addEventListener('click', closeStickerPicker);
    imageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelect);
    fileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Tabs de figurinhas
    stickerTabs.forEach(tab => {
        tab.addEventListener('click', () => switchStickerCategory(tab.dataset.category));
    });
    
    // Inicializar figurinhas
    initializeStickers();
    
    // Clipboard paste para imagens
    document.addEventListener('paste', handlePaste);
    
    // Addons
    addonsBtn.addEventListener('click', toggleAddonsPanel);
    closeAddonsBtn.addEventListener('click', toggleAddonsPanel);
    newCounterBtn.addEventListener('click', openNewCounterModal);
    
    // Inicializar contadores
    loadCounters();
    renderCounters();
    
    // Foco no input de username
    usernameInput.focus();
    
    // Carregar avatar salvo de logins anteriores
    loadAvatarFromStorage();
    
    // Avatar clicável na tela de LOGIN
    // Usando <label for="..."> no HTML, não precisa de event listener de click
    // Apenas adicionar listener de change no input
    if (loginAvatarInput) {
        loginAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                console.log('📸 Arquivo selecionado (login):', file.name, file.size, 'bytes');
                handleLoginAvatarSelect(file);
            }
            // Reset input para permitir selecionar o mesmo arquivo novamente
            e.target.value = '';
        });
        console.log('✅ Event listener do avatar de login configurado');
    } else {
        console.warn('⚠️ Input do avatar de login não encontrado');
    }
    
    // Atualizar inicial do avatar quando digita o nome
    if (usernameInput && loginAvatarInitial) {
        usernameInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val && !currentAvatar) {
                loginAvatarInitial.textContent = val.charAt(0).toUpperCase();
            } else if (!val && !currentAvatar) {
                loginAvatarInitial.textContent = '?';
            }
        });
    }
    
    // Try to extract theme colors from logo.png (if present)
    try {
        extractColorsFromLogo();
    } catch (err) {
        // fail silently
        console.warn('Color extraction failed:', err);
    }

    // Avatar clicável na tela de CHAT
    // Usando <label for="..."> no HTML, não precisa de event listener de click
    // Apenas adicionar listener de change no input
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                console.log('📸 Arquivo selecionado (chat):', file.name, file.size, 'bytes');
                handleAvatarSelect(file);
            }
            // Reset input para permitir selecionar o mesmo arquivo novamente
            e.target.value = '';
        });
        console.log('✅ Event listener do avatar de chat configurado');
    } else {
        console.warn('⚠️ Input do avatar de chat não encontrado');
    }
    
    // Manter compatibilidade com botão antigo
    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', () => avatarInput.click());
    }
});

// ===== Sistema de Autenticação JWT =====

// Tentar auto-login usando token salvo
// Login com geração de token
async function loginWithToken(username, avatar) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, avatar })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
            authToken = data.token;
            localStorage.setItem(TOKEN_KEY, authToken);
            
            console.log(`🔐 Token gerado para ${username}`);
            return true;
        }
        return false;
    } catch (error) {
        console.warn('Erro ao gerar token:', error);
        return false;
    }
}

// Atualizar token quando avatar muda
async function updateTokenWithNewAvatar(avatar) {
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/auth/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: authToken, 
                avatar 
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.token) {
            authToken = data.token;
            localStorage.setItem(TOKEN_KEY, authToken);
            console.log('🔄 Token atualizado com novo avatar');
        }
    } catch (error) {
        console.warn('Erro ao atualizar token:', error);
    }
}

// ===== SISTEMA SIMPLES DE LOGIN COM LOCALSTORAGE =====

// Carregar avatar do localStorage (quando app inicia)
function loadAvatarFromStorage() {
    try {
        const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
        if (storedAvatar) {
            currentAvatar = storedAvatar;
            updateLoginAvatarUI(storedAvatar);
            console.log('✅ Avatar anterior carregado');
        }
    } catch (e) {
        console.warn('Erro ao carregar avatar', e);
    }
}

// Verificar e fazer auto-login se usuário está salvo
function checkAndAutoLogin() {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    
    if (savedUser && savedUser.length >= 2) {
        console.log(`🔐 Usuário encontrado no localStorage: ${savedUser}`);
        currentUser = savedUser;
        currentAvatar = savedAvatar;
        
        // Carregar avatar na tela de login
        if (savedAvatar) {
            updateLoginAvatarUI(savedAvatar);
        }
        
        // Auto-login
        performLogin(savedUser);
    }
}

// ===== Funções de Login =====
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    
    if (username.length < 2) {
        alert('Nome de usuário deve ter pelo menos 2 caracteres');
        return;
    }
    
    performLogin(username);
}

// Login simples e direto
function performLogin(username) {
    if (!username || username.length < 2) return;

    currentUser = username;
    
    // Salvar no localStorage
    localStorage.setItem(USER_STORAGE_KEY, username);
    if (currentAvatar) {
        localStorage.setItem(AVATAR_STORAGE_KEY, currentAvatar);
    }

    // Solicitar permissão para notificações
    requestNotificationPermission();

    // Conectar ao servidor
    connectToServer();

    // Atualizar UI
    currentUsername.textContent = username;
    currentUserInitial.textContent = username.charAt(0).toUpperCase();
    if (currentAvatar) {
        updateCurrentAvatarUI(currentAvatar);
    }
    
    // Mostrar botão de limpar BD apenas para admin
    const clearDbBtn = document.getElementById('clear-db-btn');
    if (clearDbBtn) {
        clearDbBtn.style.display = (username.toLowerCase() === 'admin') ? 'flex' : 'none';
    }
    
    console.log(`✅ Login realizado: ${username}`);
    console.log(`📸 Avatar: ${currentAvatar ? 'Sim' : 'Não'}`);

    // Trocar telas
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');

    setTimeout(() => messageInput.focus(), 300);
}

// Centralized login so we can reuse (auto-login, manual login)
async function performLogin(username) {
    if (!username || username.length < 2) return;

    currentUser = username;

    // Gerar token JWT
    await loginWithToken(username, currentAvatar);

    // Save for persistent login (backup)
    try { localStorage.setItem('chatUsername', username); } catch (e) { /* ignore */ }

    // Solicitar permissão para notificações
    requestNotificationPermission();

    // Conectar ao servidor
    connectToServer();

    // Atualizar UI - Nome do usuário
    currentUsername.textContent = username;
    currentUserInitial.textContent = username.charAt(0).toUpperCase();
    
    // Atualizar UI - Avatar (garantir que apareça após login)
    if (currentAvatar) {
        updateCurrentAvatarUI(currentAvatar);
    }
    
    // Mostrar botão de limpar BD apenas para admin
    const clearDbBtn = document.getElementById('clear-db-btn');
    if (clearDbBtn) {
        clearDbBtn.style.display = (username.toLowerCase() === 'admin') ? 'flex' : 'none';
    }
    
    console.log(`✅ Login realizado: ${username}, avatar: ${currentAvatar ? 'sim' : 'não'}`);

    // Trocar telas
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');

    // Foco no input de mensagem
    setTimeout(() => messageInput.focus(), 300);
}

// Avatar handlers
function handleAvatarSelect(file) {
    if (!file) return;
    const maxSize = 1 * 1024 * 1024; // 500KB
    if (file.size > maxSize) {
        alert('Avatar muito grande. Máx 500KB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        const data = ev.target.result;
        
        // Salvar no localStorage com a chave correta
        try { 
            localStorage.setItem(AVATAR_STORAGE_KEY, data);
            console.log('✅ Avatar salvo no localStorage');
        } catch (e) { 
            console.warn('Erro ao salvar avatar:', e);
        }
        
        currentAvatar = data;
        updateCurrentAvatarUI(data);
        updateLoginAvatarUI(data);
        
        // Notificar servidor do novo avatar
        if (socket && socket.connected && currentUser) {
            socket.emit('user:login', { username: currentUser, avatar: currentAvatar });
        }
        
        console.log('✅ Avatar atualizado e sincronizado');
    };
    reader.readAsDataURL(file);
}

// Handler para avatar selecionado na tela de LOGIN
function handleLoginAvatarSelect(file) {
    if (!file) return;
    const maxSize = 1 * 1024 * 1024; // 500KB
    if (file.size > maxSize) {
        alert('Avatar muito grande. Máx 500KB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = ev.target.result;
        
        // Salvar no localStorage com a chave correta
        try { 
            localStorage.setItem(AVATAR_STORAGE_KEY, data);
            console.log('✅ Avatar salvo no localStorage');
        } catch (e) { 
            console.warn('Erro ao salvar avatar:', e);
        }
        
        currentAvatar = data;
        updateLoginAvatarUI(data);
        updateCurrentAvatarUI(data); // Sincronizar com tela de chat
        console.log('✅ Avatar salvo na tela de login e sincronizado');
    };
    reader.readAsDataURL(file);
}

function updateCurrentAvatarUI(dataUrl) {
    const avatarEl = document.getElementById('current-user-avatar');
    const initialEl = document.getElementById('current-user-initial');
    if (!avatarEl || !initialEl) return;
    if (dataUrl) {
        avatarEl.style.backgroundImage = `url(${dataUrl})`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        initialEl.style.display = 'none';
    } else {
        avatarEl.style.backgroundImage = '';
        initialEl.style.display = 'block';
    }
}

// Atualizar UI do avatar na tela de LOGIN
function updateLoginAvatarUI(dataUrl) {
    const avatarEl = document.getElementById('login-avatar');
    const initialEl = document.getElementById('login-avatar-initial');
    const labelEl = document.querySelector('.login-avatar-label');
    if (!avatarEl) return;
    
    if (dataUrl) {
        avatarEl.style.backgroundImage = `url(${dataUrl})`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        if (initialEl) initialEl.style.display = 'none';
        if (labelEl) labelEl.textContent = 'Clique para trocar foto';
    } else {
        avatarEl.style.backgroundImage = '';
        if (initialEl) initialEl.style.display = 'block';
        if (labelEl) labelEl.textContent = 'Clique para escolher foto';
    }
}

function handleLogout() {
    if (confirm('Deseja realmente sair do chat?')) {
        if (socket) {
            socket.disconnect();
        }
        
        // Resetar estado
        currentUser = null;
        users = [];
        authToken = null;

        // Limpar dados de login (mas MANTER o avatar para próximo login)
        localStorage.removeItem(USER_STORAGE_KEY);
        // Avatar permanece no localStorage
        
        // Limpar mensagens
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">👋</div>
                <h3>Bem-vindo ao Chat!</h3>
                <p>Comece a conversar com seus colegas de trabalho</p>
            </div>
        `;
        
        // Esconder botão de limpar BD
        const clearDbBtn = document.getElementById('clear-db-btn');
        if (clearDbBtn) {
            clearDbBtn.style.display = 'none';
        }
        
        // Trocar telas
        chatScreen.classList.remove('active');
        loginScreen.classList.add('active');
        
        // Limpar input de username mas manter avatar carregado
        usernameInput.value = '';
        usernameInput.focus();
        
        console.log('❌ Logout realizado - Avatar mantido para próximo login');
    }
}

/* Theme extraction: try to read /logo.png and set CSS variables dynamically.
   This is optional and non-blocking; if `logo.png` is present in `public/`, the
   script will compute an average color and update primary gradients. */
function extractColorsFromLogo() {
    const img = document.getElementById('app-logo');
    if (!img) return;

    // Only proceed if image actually loads
    if (!img.complete) {
        img.onload = () => computeAndApply(img);
        img.onerror = () => {/* ignore */};
    } else {
        computeAndApply(img);
    }

    function computeAndApply(image) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const w = Math.min(128, image.naturalWidth || 128);
            const h = Math.min(128, image.naturalHeight || 128);
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(image, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha === 0) continue;
                r += data[i]; g += data[i + 1]; b += data[i + 2];
                count++;
            }
            if (count === 0) return;
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            const primary = `rgb(${r}, ${g}, ${b})`;
            // darker variant
            const darker = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
            const root = document.documentElement.style;
            root.setProperty('--primary-color', primary);
            root.setProperty('--primary-color-darker', darker);
            root.setProperty('--primary-gradient', `linear-gradient(135deg, ${primary} 0%, ${darker} 100%)`);
            // small accent
            root.setProperty('--accent-gradient', `linear-gradient(135deg, ${darker} 0%, ${primary} 100%)`);
            console.log('Applied theme colors from logo:', primary);
        } catch (err) {
            console.warn('Failed to compute logo colors', err);
        }
    }
}

// ===== Conexão com Servidor =====
function connectToServer() {
    // Conectar ao servidor Socket.io
    socket = io();
    
    // Event: Conexão estabelecida
    socket.on('connect', () => {
        console.log('Conectado ao servidor');
        updateConnectionStatus(true);
        
        // Fazer login
        socket.emit('user:login', { username: currentUser, avatar: currentAvatar });
    });
    
    // Event: Desconexão
    socket.on('disconnect', () => {
        console.log('Desconectado do servidor');
        updateConnectionStatus(false);
    });
    
    // Event: Lista de usuários
    socket.on('users:list', (usersList) => {
        users = usersList;
        renderUsersList();
    });
    
    // Event: Histórico de mensagens
    socket.on('messages:history', (history) => {
        // Limpar mensagem de boas-vindas
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Adicionar mensagens do histórico
        history.forEach(msg => addMessage(msg, false));
        scrollToBottom();
    });
    
    // Event: Status de admin
    socket.on('user:admin-status', (data) => {
        isAdmin = data.isAdmin;
        
        // Mostrar/ocultar botão de limpar chat
        if (isAdmin) {
            clearChatBtn.style.display = 'flex';
        } else {
            clearChatBtn.style.display = 'none';
        }
    });
    
    // Event: Chat foi limpo
    socket.on('chat:cleared', (data) => {
        // Limpar todas as mensagens
        messagesContainer.innerHTML = '';
        
        // Mostrar mensagem do sistema
        // addSystemMessage(`💥 Chat limpo por ${data.by}`);
    });

    // Server-side error handler for custom server errors
    socket.on('server:error', (data) => {
        console.warn('Server error:', data);
        addSystemMessage(`[Servidor] ${data.message || 'Erro'}`);
        // Optionally show a browser alert for critical messages
        if (data.message === 'IMAGE_TOO_LARGE') {
            alert('Imagem rejeitada pelo servidor: tamanho excedido.');
        }
    });
    
    // Event: Novo usuário entrou
    socket.on('user:joined', (data) => {
        // Adicionar à lista se não for o próprio usuário
        if (data.id !== socket.id) {
            users.push({
                id: data.id,
                username: data.username,
                avatar: data.avatar || null,
                isAdmin: data.isAdmin,
                joinedAt: data.timestamp
            });
            renderUsersList();
            
            // Mostrar mensagem do sistema
            const adminBadge = data.isAdmin ? ' 👑' : '';
            addSystemMessage(`${data.username}${adminBadge} entrou no chat`);
            
            // Notificação desktop
            showNotification('Novo usuário', `${data.username} entrou no chat`, '👋');
        }
    });
    
    // Event: Usuário saiu
    socket.on('user:left', (data) => {
        // Remover da lista
        users = users.filter(u => u.id !== data.id);
        renderUsersList();
        
        // Mostrar mensagem do sistema
        addSystemMessage(`${data.username} saiu do chat`);
        
        // Notificação desktop
        showNotification('Usuário saiu', `${data.username} saiu do chat`, '👋');
    });
    
    // Event: Mensagem recebida
    socket.on('message:received', (message) => {
        // Log para arquivos
        if (message.text && message.text.startsWith('FILE:')) {
            const fileParts = message.text.split('|');
            console.log(`📎 Arquivo recebido de ${message.username}: ${fileParts[1] || 'unknown'}`);
        } else if (message.file) {
            console.log(`📎 Arquivo (novo formato) recebido de ${message.username}: ${message.file.name}`);
        }
        
        addMessage(message);
        
        // Notificação apenas para mensagens de outros usuários
        const savedUsername = localStorage.getItem('chat-username');
        if (message.username !== savedUsername) {
            // Verificar se a mensagem menciona o usuário
            const mentionsMe = message.text && message.text.includes(`@${savedUsername}`);
            showNotification(
                mentionsMe ? '📢 Menção!' : message.username,
                message.text,
                mentionsMe ? '📢' : '💬'
            );
        }
    });
    
    // Event: Mensagem editada
    socket.on('message:edited', (data) => {
        const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (messageEl) {
            const textEl = messageEl.querySelector('.message-text');
            if (textEl) {
                // Processar menções no texto editado
                let processedText = escapeHtml(data.newText);
                processedText = processedText.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
                textEl.innerHTML = processedText;
            }
            // Adicionar badge de editado
            const timeEl = messageEl.querySelector('.message-time');
            if (timeEl && !timeEl.innerHTML.includes('editado')) {
                timeEl.innerHTML += ' <span class="edited-badge">(editado)</span>';
            }
        }
    });
    
    // Event: Usuário digitando
    socket.on('user:typing', (data) => {
        typingIndicator.textContent = `${data.username} está digitando...`;
    });
    
    // Event: Usuário parou de digitar
    socket.on('user:stop-typing', () => {
        typingIndicator.textContent = '';
    });
 

    // Event: WhatsApp QR Code
    socket.on('whatsapp:qr', (url) => {
        const img = document.getElementById('whatsapp-qr-code');
        if (img) {
            img.src = url;
            const container = document.getElementById('whatsapp-qr-container');
            if (container) container.style.display = 'block';
        }
    });

    // Event: WhatsApp Ready
    socket.on('whatsapp:ready', () => {
        const container = document.getElementById('whatsapp-qr-container');
        if (container) container.style.display = 'none';
        fetchWhatsAppChats();
        showNotification('WhatsApp', 'Conectado com sucesso!', '');
    });

    // Event: WhatsApp message
    socket.on('whatsapp:message', (msg) => {
        // Se estiver no chat aberto, adicionar mensagem
        if (currentChatId === msg.chatId) {
            appendWhatsAppMessage(msg);
        } else {
            // Notificação de nova mensagem
            showNotification('WhatsApp', `Nova mensagem de ${msg.chatName}`, '');
        }
    });
}

function updateConnectionStatus(connected) {
    if (connected) {
        connectionDot.classList.add('connected');
        connectionText.textContent = 'Conectado';
    } else {
        connectionDot.classList.remove('connected');
        connectionText.textContent = 'Desconectado';
    }
}

// ===== Funções de Mensagens =====
function handleSendMessage(e) {
    e.preventDefault();
    
    const text = messageInput.value.trim();
    
    if (text.length === 0) {
        return;
    }
    
    // Se estiver editando, emitir edição
    if (editingMessage) {
        socket.emit('message:edit', {
            messageId: editingMessage.message.id,
            newText: text
        });
        cancelEdit();
        messageInput.value = '';
        socket.emit('user:stop-typing');
        return;
    }
    
    // Verificar se é um comando
    if (text.startsWith('/')) {
        const result = Commands.processCommand(text, socket);
        
        if (result) {
            if (result.type === 'system') {
                addSystemMessage(result.text);
            } else if (result.type === 'embed') {
                addEmbedMessage(result.embed, socket.id);
            }
            
            messageInput.value = '';
            socket.emit('user:stop-typing');
            typingIndicator.textContent = '';
            return;
        }
    }
    
    // Preparar dados da mensagem
    const messageData = { text };
    
    // Se estiver respondendo, incluir referência
    if (replyingTo) {
        // console.log('🔵 [REPLY] Enviando com reply ATIVO:', { id: replyingTo.id, username: replyingTo.username });
        messageData.replyTo = {
            id: replyingTo.id,
            username: replyingTo.username,
            text: replyingTo.text.substring(0, 100)
        };
    }
    
    // Enviar mensagem
    console.log('📤 [SEND] Enviando messageData:', messageData);
    socket.emit('message:send', messageData);
    
    // Cancelar reply DEPOIS de enviar
    if (replyingTo) {
        cancelReply();
    }
    
    // Limpar input
    messageInput.value = '';
    
    // Notificar que parou de digitar
    socket.emit('user:stop-typing');
    typingIndicator.textContent = '';
}

function handleClearChat() {
    if (confirm('Tem certeza que deseja limpar todas as mensagens do chat?')) {
        socket.emit('chat:clear');
    }
}

function handleTyping() {
    // Mostrar sugestões de comando se começar com /
    const text = messageInput.value;
    if (text.startsWith('/')) {
        showCommandSuggestions(text);
    } else {
        hideCommandSuggestions();
    }
    
    // Notificar que está digitando
    socket.emit('user:typing');
    
    // Limpar timeout anterior
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Após 2 segundos sem digitar, notificar que parou
    typingTimeout = setTimeout(() => {
        socket.emit('user:stop-typing');
    }, 2000);
}

function showCommandSuggestions(text) {
    let suggestions = document.getElementById('command-suggestions');
    if (!suggestions) {
        suggestions = document.createElement('div');
        suggestions.id = 'command-suggestions';
        // Attach to chat-footer for better positioning
        const chatFooter = document.querySelector('.chat-footer');
        if (chatFooter) {
            chatFooter.style.position = 'relative';
            chatFooter.appendChild(suggestions);
        } else {
            document.body.appendChild(suggestions);
        }
    }
    
    // Usar função de autocomplete do Commands
    const filtered = Commands.getAutocompleteSuggestions ? Commands.getAutocompleteSuggestions(text) : [];
    
    if (filtered.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.className = 'command-suggestions-panel';
    suggestions.innerHTML = filtered.map((item, idx) => `
        <div class="command-suggestion-item" onclick="document.getElementById('message-input').value = '${item.full}'; document.getElementById('message-input').focus(); hideCommandSuggestions();">
            <div class="command-suggestion-content">
                <span class="command-suggestion-name">${item.text}</span>
                <span class="command-suggestion-desc">${item.desc}</span>
            </div>
            <span class="command-suggestion-enter">↵</span>
        </div>
    `).join('');
    
    suggestions.style.display = 'block';
}

function hideCommandSuggestions() {
    const suggestions = document.getElementById('command-suggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
    }
}

function addMessage(message, autoScroll = true) {
    // Remover mensagem de boas-vindas se existir
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    // Usar username como identificador persistente (não muda entre reconexões)
    const savedUsername = localStorage.getItem('chat-username');
    const isOwnMessage = message.username === savedUsername || message.userId === socket.id;
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isOwnMessage ? 'own-message' : ''}`;
    messageEl.dataset.messageId = message.id;
    messageEl.dataset.username = message.username;
    
    const time = formatTime(new Date(message.timestamp));
    
    const adminBadge = users.find(u => u.id === message.userId)?.isAdmin ? ' 👑' : '';
    
    // Verificar se é uma figurinha
    const isSticker = message.text.startsWith('STICKER:');
    const isCustomSticker = message.text.startsWith('STICKER_CUSTOM:');
    const isImage = message.text.startsWith('IMAGE:');
    const isImageUrl = message.text.startsWith('IMAGE_URL:');
    const isFile = message.text.startsWith('FILE:') || message.file;
    
    let content;
    if (isSticker) {
        content = message.text.replace('STICKER:', '');
    } else if (isCustomSticker) {
        const imageData = message.text.replace('STICKER_CUSTOM:', '');
        content = `<img src="${imageData}" class="message-sticker" style="max-width: 150px; max-height: 150px; border-radius: 8px;" alt="Figurinha">`;
    } else if (isImage) {
        const imageData = message.text.replace('IMAGE:', '');
        content = `<img src="${imageData}" class="message-image" onclick="openLightbox('${imageData}')" alt="Imagem enviada">`;
    } else if (isImageUrl) {
        const url = message.text.replace('IMAGE_URL:', '');
        content = `<img src="${url}" class="message-image" onclick="openLightbox('${url}')" alt="Imagem enviada">`;
    } else if (isFile) {
        // Suportar nova estrutura message.file e estrutura antiga FILE: prefix
        let fileUrl, fileName, fileSize;
        
        if (message.file) {
            fileUrl = message.file.url;
            fileName = message.file.name;
            fileSize = message.file.size;
        } else {
            const fileParts = message.text.replace('FILE:', '').split('|');
            fileUrl = fileParts[0];
            fileName = fileParts[1] || 'arquivo';
            fileSize = fileParts[2] || 0;
        }
        
        // Definir ícone baseado no tipo de arquivo
        let fileIcon = '📎';
        const ext = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝', 'txt': '📝', 'md': '📝',
            'xls': '📊', 'xlsx': '📊', 'csv': '📊',
            'ppt': '🎬', 'pptx': '🎬',
            'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️',
            'exe': '⚙️', 'msi': '⚙️',
            'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
            'mp4': '🎥', 'avi': '🎥', 'mkv': '🎥', 'mov': '🎥', 'webm': '🎥',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️'
        };
        fileIcon = iconMap[ext] || '📎';
        
        // Renderizar imagens inline como preview
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            content = `
                <div class="file-preview-container">
                    <div class="file-image-preview">
                        <img src="${fileUrl}" alt="${escapeHtml(fileName)}" onclick="openLightbox('${fileUrl}')" class="file-image-thumb">
                        <div class="file-preview-overlay">
                            <span class="file-preview-icon">🔍</span>
                        </div>
                    </div>
                    <div class="file-details">
                        <div class="file-name-header">${escapeHtml(fileName)}</div>
                        <div class="file-size">${formatBytes(parseInt(fileSize))}</div>
                        <button onclick="downloadFileWithName('${fileUrl}', '${escapeHtml(fileName)}')" class="file-action-btn">
                            <span class="file-action-icon">⬇️</span>
                            <span>Baixar</span>
                        </button>
                    </div>
                </div>
            `;
        }
        // Renderizar vídeo inline se for mp4, webm ou avi
        else if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) {
            // Determinar tipo MIME correto
            let mimeType = 'video/mp4';
            if (ext === 'webm') mimeType = 'video/webm';
            else if (ext === 'avi') mimeType = 'video/x-msvideo';
            else if (ext === 'mov') mimeType = 'video/quicktime';
            else if (ext === 'mkv') mimeType = 'video/x-matroska';
            
            content = `
                <div class="file-preview-container">
                    <video 
                        class="file-video-player"
                        controls 
                        controlsList="nodownload"
                        preload="metadata"
                    >
                        <source src="${fileUrl}" type="${mimeType}">
                        <p>Seu navegador não suporta vídeo HTML5.</p>
                    </video>
                    <div class="file-details">
                        <div class="file-name-header">${escapeHtml(fileName)}</div>
                        <div class="file-size">${formatBytes(parseInt(fileSize))}</div>
                        <button onclick="downloadFileWithName('${fileUrl}', '${escapeHtml(fileName)}')" class="file-action-btn">
                            <span class="file-action-icon">⬇️</span>
                            <span>Baixar</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            content = `
                <div class="file-card">
                    <div class="file-card-icon">${fileIcon}</div>
                    <div class="file-card-info">
                        <div class="file-card-name">${escapeHtml(fileName)}</div>
                        <div class="file-card-size">${formatBytes(parseInt(fileSize))}</div>
                    </div>
                    <button onclick="downloadFileWithName('${fileUrl}', '${escapeHtml(fileName)}')" class="file-card-action" title="Baixar arquivo">
                        <span>⬇️</span>
                    </button>
                </div>
            `;
        }
    } else {
        // Processar menções (@usuario)
        let processedText = escapeHtml(message.text);
        processedText = processedText.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
        content = processedText;
    }
    
    // Construir HTML de resposta se existir
    let replyHtml = '';
    if (message.replyTo) {
        console.log('🟢 [DISPLAY] Mensagem com reply recebida:', message);
        const replyText = message.replyTo.text.startsWith('IMAGE') || message.replyTo.text.startsWith('FILE')
            ? '📎 Mídia'
            : message.replyTo.text.substring(0, 60) + (message.replyTo.text.length > 60 ? '...' : '');
        const replyId = message.replyTo.id;
        replyHtml = `
            <div class="message-reply-preview" onclick="scrollToMessage('${replyId}')">
                <div class="reply-preview-header">
                    <span class="reply-icon">↩️</span>
                    <span class="reply-preview-user">${escapeHtml(message.replyTo.username)}</span>
                </div>
                <div class="reply-preview-msg">${escapeHtml(replyText)}</div>
            </div>
        `;
    }
    
    // Indicador de edição
    const editedBadge = message.edited ? '<span class="edited-badge">(editado)</span>' : '';
    
    // Badge de resposta
    const replyBadge = message.replyTo ? `<span class="reply-badge" title="Respondendo a ${escapeHtml(message.replyTo.username)}">RESPOSTA</span>` : '';
    
    // avatar: image if available, otherwise initial
    const avatarHtml = message.avatar ?
        `<div class="message-avatar" style="background-image:url(${message.avatar}); background-size:cover; background-position:center;"></div>` :
        `<div class="message-avatar">${message.username.charAt(0).toUpperCase()}</div>`;

    messageEl.innerHTML = `
        ${avatarHtml}
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(message.username)}${adminBadge}</span>
                <span class="message-time">${time} ${replyBadge} ${editedBadge}</span>
                <button class="message-menu-btn" title="Mais opções">⋮</button>
            </div>
            ${replyHtml}
            <div class="message-text ${isSticker && !isCustomSticker ? 'message-sticker' : ''}">
                ${content}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    
    // Determinar se é vídeo (suportar ambas estruturas)
    let fileNameForVideo = '';
    if (message.file) {
        fileNameForVideo = message.file.name;
    } else if (isFile) {
        fileNameForVideo = message.text.replace('FILE:', '').split('|')[1] || '';
    }
    const isVideo = isFile && ['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(
        fileNameForVideo.split('.').pop().toLowerCase()
    );
    
    // Adicionar eventos de menu
    setupMessageMenu(messageEl, message, isImage, isImageUrl, isFile, isVideo);
    
    // Scroll para o final (apenas se autoScroll estiver ativado)
    if (autoScroll) {
        scrollToBottom();
    }
}

function addSystemMessage(text, id = null) {
    const messageEl = document.createElement('div');
    messageEl.className = 'system-message';
    messageEl.textContent = text;
    if (id) {
        messageEl.id = id;
    }
    
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
    
    return messageEl;
}

function addEmbedMessage(embedHtml, userId = null) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    const time = formatTime(new Date());
    
    const avatarHtml = currentUsername ?
        `<div class="message-avatar">${currentUsername.charAt(0).toUpperCase()}</div>` :
        `<div class="message-avatar">📌</div>`;
    
    messageEl.innerHTML = `
        ${avatarHtml}
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">Comando</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">
                ${embedHtml}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageEl);
    scrollToBottom();
    
    return messageEl;
}

function updateSystemMessage(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
        scrollToBottom();
    }
}

// ===== Context Menu para Mensagens =====

function setupMessageMenu(messageEl, message, isImage, isImageUrl, isFile, isVideo) {
    // Botão de 3 pontinhos
    const menuBtn = messageEl.querySelector('.message-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = menuBtn.getBoundingClientRect();
            showMessageMenu(rect.left, rect.bottom + 5, message, messageEl, isImage, isImageUrl, isFile, isVideo);
        });
    }
    
    // Double-click para responder
    messageEl.addEventListener('dblclick', () => {
        console.log('📌 [DBLCLICK] Double-click para responder em:', message.username);
        setReplyingTo(message);
    });
    
    // Também suportar clique direito
    messageEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showMessageMenu(e.clientX, e.clientY, message, messageEl, isImage, isImageUrl, isFile, isVideo);
    });
}

function showMessageMenu(x, y, message, messageEl, isImage, isImageUrl, isFile, isVideo) {
    // Remover menu anterior se existir
    const existingMenu = document.querySelector('.message-context-menu');
    if (existingMenu) existingMenu.remove();
    
    // Verificar se é mensagem própria
    const savedUsername = localStorage.getItem('chat-username');
    const isOwnMessage = message.username === savedUsername;
    
    // Criar menu
    const menu = document.createElement('div');
    menu.className = 'message-context-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        z-index: 10000;
        background: var(--bg-secondary, #1a1a2e);
        border: 1px solid rgba(102, 126, 234, 0.3);
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        min-width: 180px;
        overflow: hidden;
        animation: menuFadeIn 0.15s ease;
    `;
    
    // Items do menu
    let menuHtml = '';
    
    // Responder
    menuHtml += `<div class="menu-item" data-action="reply">
        <span class="menu-icon">↩️</span>
        <span>Responder</span>
    </div>`;
    
    // Mencionar
    menuHtml += `<div class="menu-item" data-action="mention">
        <span class="menu-icon">@</span>
        <span>Mencionar ${message.username}</span>
    </div>`;
    
    // Editar (só se for própria mensagem de texto)
    if (isOwnMessage && !isImage && !isImageUrl && !isFile) {
        menuHtml += `<div class="menu-item" data-action="edit">
            <span class="menu-icon">✏️</span>
            <span>Editar</span>
        </div>`;
    }
    
    menuHtml += `<div class="menu-separator"></div>`;
    
    // Copiar texto
    if (!isImage && !isImageUrl && !isFile) {
        menuHtml += `<div class="menu-item" data-action="copy">
            <span class="menu-icon">📋</span>
            <span>Copiar texto</span>
        </div>`;
    }
    
    // Para imagens
    if (isImage || isImageUrl) {
        menuHtml += `<div class="menu-item" data-action="save-image">
            <span class="menu-icon">💾</span>
            <span>Salvar imagem</span>
        </div>`;
    }
    
    // Para arquivos
    if (isFile) {
        menuHtml += `<div class="menu-item" data-action="download">
            <span class="menu-icon">⬇️</span>
            <span>Download</span>
        </div>`;
    }
    
    menu.innerHTML = menuHtml;
    document.body.appendChild(menu);
    
    // Ajustar posição se sair da tela
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
    
    // Event listeners para os items
    menu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            handleMenuAction(action, message, messageEl, isImage, isImageUrl, isFile);
            menu.remove();
        });
    });
    
    // Fechar ao clicar fora
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 10);
}

function handleMenuAction(action, message, messageEl, isImage, isImageUrl, isFile) {
    switch (action) {
        case 'reply':
            // Permitir reply - se há um já em progresso, substitui automaticamente
            setReplyingTo(message);
            break;
            
        case 'mention':
            messageInput.value += `@${message.username} `;
            messageInput.focus();
            break;
            
        case 'edit':
            startEditingMessage(message, messageEl);
            break;
            
        case 'copy':
            navigator.clipboard.writeText(message.text).then(() => {
                showNotification('Sucesso', 'Texto copiado!', 'success');
            });
            break;
            
        case 'save-image':
            const imageUrl = isImageUrl 
                ? message.text.replace('IMAGE_URL:', '') 
                : message.text.replace('IMAGE:', '');
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `imagem-${Date.now()}.png`;
            link.click();
            break;
            
        case 'download':
            const fileParts = message.text.replace('FILE:', '').split('|');
            const fileUrl = fileParts[0];
            const fileName = fileParts[1] || 'arquivo';
            
            // Fazer fetch com nome original como query param
            fetch(`${fileUrl}?filename=${encodeURIComponent(fileName)}`)
                .then(response => response.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;  // Nome original
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                })
                .catch(err => console.error('Erro ao baixar arquivo:', err));
            break;
    }
}

// ===== Sistema de Resposta =====
function setReplyingTo(message) {
    if (replyingTo && replyingTo.id === message.id) {
        // console.log('ℹ️  [REPLY] Já respondendo à mesma mensagem, ignorando');
        return;
    }
    
    replyingTo = message;
    // console.log('🔵 [REPLY] setReplyingTo ATIVO para:', { id: replyingTo.id, username: replyingTo.username, text: replyingTo.text.substring(0, 30) });
    // console.trace('[REPLY] Stack trace - chamada de setReplyingTo');
    
    // Mostrar preview de resposta
    let replyPreview = document.getElementById('reply-preview');
    if (!replyPreview) {
        replyPreview = document.createElement('div');
        replyPreview.id = 'reply-preview';
        replyPreview.className = 'reply-preview';
        const inputWrapper = document.querySelector('.input-wrapper');
        inputWrapper.parentNode.insertBefore(replyPreview, inputWrapper);
    }
    
    const previewText = message.text.startsWith('IMAGE') || message.text.startsWith('FILE') 
        ? '📎 Mídia' 
        : message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '');
    
    replyPreview.innerHTML = `
        <div class="reply-preview-content">
            <span class="reply-preview-label">Respondendo a <strong>${escapeHtml(message.username)}</strong></span>
            <span class="reply-preview-text">${escapeHtml(previewText)}</span>
        </div>
        <button class="reply-preview-close" onclick="cancelReply()">✕</button>
    `;
    replyPreview.style.display = 'flex';
    
    messageInput.focus();
}

function cancelReply() {
    console.log('❌ [REPLY] Cancelando reply. Era:', replyingTo ? { id: replyingTo.id, username: replyingTo.username } : 'null');
    replyingTo = null;
    const replyPreview = document.getElementById('reply-preview');
    if (replyPreview) {
        replyPreview.style.display = 'none';
    }
}

// ===== Sistema de Edição =====
function startEditingMessage(message, messageEl) {
    editingMessage = { message, element: messageEl };
    
    // Mostrar preview de edição
    let editPreview = document.getElementById('edit-preview');
    if (!editPreview) {
        editPreview = document.createElement('div');
        editPreview.id = 'edit-preview';
        editPreview.className = 'edit-preview';
        const inputWrapper = document.querySelector('.input-wrapper');
        inputWrapper.parentNode.insertBefore(editPreview, inputWrapper);
    }
    
    editPreview.innerHTML = `
        <div class="edit-preview-content">
            <span class="edit-preview-label">✏️ Editando mensagem</span>
        </div>
        <button class="edit-preview-close" onclick="cancelEdit()">✕</button>
    `;
    editPreview.style.display = 'flex';
    
    // Colocar texto atual no input
    messageInput.value = message.text;
    messageInput.focus();
    messageInput.select();
}

function cancelEdit() {
    editingMessage = null;
    messageInput.value = '';
    const editPreview = document.getElementById('edit-preview');
    if (editPreview) {
        editPreview.style.display = 'none';
    }
}

// ===== Função para rolar até mensagem =====
function scrollToMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight temporário
        messageEl.classList.add('message-highlight');
        setTimeout(() => {
            messageEl.classList.remove('message-highlight');
        }, 2000);
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===== Funções de Usuários =====
function renderUsersList() {
    userCount.textContent = users.length;
    
    usersList.innerHTML = users
        .filter(user => user.id !== socket.id) // Não mostrar o próprio usuário
        .map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-avatar" style="${user.avatar ? `background-image: url(${user.avatar}); background-size: cover; background-position: center;` : ''}">
                    ${!user.avatar ? user.username.charAt(0).toUpperCase() : ''}
                </div>
                <div class="user-info">
                    <span class="username">${escapeHtml(user.username)}${user.isAdmin ? ' 👑' : ''}</span>
                    <span class="status">Online</span>
                </div>
                <div class="status-indicator"></div>
            </div>
        `)
        .join('');
}

// ===== Funções Utilitárias =====
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Sistema de Notificações =====
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações desktop');
        return;
    }
    
    if (Notification.permission === 'granted') {
        notificationsEnabled = true;
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificationsEnabled = true;
                console.log('Notificações habilitadas');
            }
        });
    }
}

function showNotification(title, body, icon = '💬') {
    // Não mostrar notificação se:
    // 1. Notificações não estão habilitadas
    // 2. A janela está em foco (usuário já está vendo)
    if (!notificationsEnabled || document.hasFocus()) {
        return;
    }
    
    try {
        // Converter emoji para data URI (SVG com emoji) para evitar erro 404
        let notificationIcon = icon;
        if (icon && icon.match(/\p{Emoji}/u)) {
            // Se for emoji, usar data URI com canvas
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#007AFF';
                ctx.fillRect(0, 0, 32, 32);
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(icon, 16, 16);
                notificationIcon = canvas.toDataURL();
            } catch (e) {
                notificationIcon = undefined;
            }
        }
        
        const notification = new Notification(title, {
            body: body,
            icon: notificationIcon,
            tag: 'chat-notification',
            requireInteraction: false,
            silent: false
        });
        
        // Focar na janela quando clicar na notificação
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // Fechar automaticamente após 5 segundos
        setTimeout(() => {
            notification.close();
        }, 5000);
    } catch (error) {
        console.error('Erro ao mostrar notificação:', error);
    }
}

// ===== Atalhos de Teclado =====
document.addEventListener('keydown', (e) => {
    // ESC para sair (apenas se estiver no chat)
    if (e.key === 'Escape' && chatScreen.classList.contains('active')) {
        handleLogout();
    }
});


// ===== Sistema de Figurinhas com Emojis Apple =====
let appleEmojis = [];
let emojiCategories = [];
let currentCategory = 'Smileys & Emotion';
let customStickers = [];
const CUSTOM_STICKERS_KEY = 'chatCustomStickers';
const MAX_CUSTOM_STICKERS = 20;

// Fallback emojis caso a API não funcione
const fallbackStickers = {
    'Smileys & Emotion': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
    'People & Body': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'],
    'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞'],
    'Food & Drink': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎮', '🕹️', '🎯', '🎲'],
    'Objects': ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📀', '📷', '📹', '🎥', '📽️', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏰', '🕰️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '💰', '💵'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💗', '💓', '💕', '💖', '💘', '💝', '⭐', '🌟', '✨', '💫', '🔥', '💥', '💯', '✅', '❌', '⚠️', '🔴', '🟠']
};

// Carregar emojis Apple do servidor (com fallback automático)
async function loadAppleEmojis() {
    try {
        // Tentar carregar categorias do servidor
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const catResponse = await fetch('/api/emojis/categories', { signal: controller.signal });
        clearTimeout(timeout);
        
        if (catResponse.ok) {
            emojiCategories = await catResponse.json();
            renderEmojiTabs();
            // Tentar carregar emojis da categoria atual
            await loadEmojiCategory(currentCategory);
        } else {
            throw new Error('Categories API failed');
        }
    } catch (error) {
        console.warn('❌ Emojis Apple não disponíveis, usando fallback:', error.message);
        // Usar emojis fallback
        emojiCategories = Object.keys(fallbackStickers);
        renderEmojiTabs();
        renderStickers(currentCategory);
    }
}

async function loadEmojiCategory(category) {
    try {
        // Se for custom, renderizar stickers customizados
        if (category === 'custom') {
            renderCustomStickers();
            return;
        }
        
        // Tentar carregar do servidor
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`/api/emojis?category=${encodeURIComponent(category)}&limit=200`, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                appleEmojis = data;
                renderAppleEmojis();
                return;
            }
        }
        // Se não retornar dados, usar fallback
        renderStickers(category);
    } catch (error) {
        console.warn('❌ Erro ao carregar emojis, usando fallback:', error.message);
        renderStickers(category);
    }
}

function renderEmojiTabs() {
    const tabsContainer = document.querySelector('.sticker-tabs');
    if (!tabsContainer) return;
    
    // Mapear ícones para categorias
    const categoryIcons = {
        'Smileys & Emotion': '😊',
        'People & Body': '👍',
        'Animals & Nature': '🐶',
        'Food & Drink': '🍎',
        'Travel & Places': '✈️',
        'Activities': '⚽',
        'Objects': '📱',
        'Symbols': '❤️',
        'Flags': '🏳️',
        'Component': '🔧'
    };
    
    tabsContainer.innerHTML = emojiCategories
        .filter(cat => cat !== 'Component') // Esconder componentes
        .slice(0, 8) // Limitar a 8 tabs
        .map(cat => `
            <button class="sticker-tab ${cat === currentCategory ? 'active' : ''}" 
                    data-category="${cat}">
                ${categoryIcons[cat] || '📦'} ${cat.split(' ')[0]}
            </button>
        `).join('');
    
    // Adicionar tab de customizados
    tabsContainer.innerHTML += `
        <button class="sticker-tab ${currentCategory === 'custom' ? 'active' : ''}" 
                data-category="custom">
            ⭐ Minhas
        </button>
    `;
    
    // Re-adicionar event listeners
    document.querySelectorAll('.sticker-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sticker-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            
            if (currentCategory === 'custom') {
                renderCustomStickers();
            } else {
                loadEmojiCategory(currentCategory);
            }
        });
    });
}

function renderAppleEmojis() {
    const content = document.getElementById('sticker-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    if (!appleEmojis || appleEmojis.length === 0) {
        console.warn('⚠️ Nenhum emoji carregado, usando fallback');
        renderStickers(currentCategory);
        return;
    }
    
    appleEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'sticker-item apple-emoji';
        
        // Criar canvas para renderizar o emoji com melhor qualidade
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        
        // Configurar fonte e desenhar emoji
        ctx.font = '38px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji.char, 24, 26);
        
        // Converter canvas para imagem
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.alt = emoji.short_name;
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.imageRendering = 'crisp-edges';
        
        btn.appendChild(img);
        btn.title = emoji.short_name.replace(/_/g, ' ');
        btn.addEventListener('click', () => {
            console.log('😊 Enviando emoji:', emoji.char);
            sendSticker(emoji.char);
        });
        content.appendChild(btn);
    });
    
    console.log(`✅ ${appleEmojis.length} emojis renderizados`);
}

// Carregar figurinhas personalizadas do localStorage
function loadCustomStickers() {
    try {
        const stored = localStorage.getItem(CUSTOM_STICKERS_KEY);
        if (stored) {
            customStickers = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Erro ao carregar figurinhas personalizadas:', error);
        customStickers = [];
    }
}

// Salvar figurinhas personalizadas no localStorage
function saveCustomStickers() {
    try {
        localStorage.setItem(CUSTOM_STICKERS_KEY, JSON.stringify(customStickers));
    } catch (error) {
        console.error('Erro ao salvar figurinhas personalizadas:', error);
        alert('Erro ao salvar figurinha. Espaço de armazenamento pode estar cheio.');
    }
}

function initializeStickers() {
    loadCustomStickers();
    console.log('🎉 Sistema de emojis inicializado');
    
    // Renderizar emojis fallback imediatamente
    emojiCategories = Object.keys(fallbackStickers);
    renderEmojiTabs();
    renderStickers(currentCategory);
    
    // Tentar carregar emojis Apple do servidor em background
    setTimeout(() => {
        loadAppleEmojis().catch(err => {
            console.warn('❌ Falha ao carregar emojis Apple:', err);
            // Já está usando fallback
        });
    }, 300);
    
    // Busca de emojis
    const searchInput = document.getElementById('sticker-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleStickerSearch);
    }
}

async function handleStickerSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const content = document.getElementById('sticker-content');
    if (!content) return;
    
    if (!query) {
        if (currentCategory === 'custom') {
            renderCustomStickers();
        } else {
            loadEmojiCategory(currentCategory);
        }
        return;
    }
    
    // Buscar emojis no servidor
    try {
        const response = await fetch(`/api/emojis?search=${encodeURIComponent(query)}&limit=100`);
        if (response.ok) {
            const emojis = await response.json();
            content.innerHTML = '';
            
            if (emojis.length === 0) {
                content.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Nenhum emoji encontrado</div>';
                return;
            }
            
            emojis.forEach(emoji => {
                const btn = document.createElement('button');
                btn.className = 'sticker-item apple-emoji';
                btn.textContent = emoji.char;
                btn.title = emoji.short_name.replace(/_/g, ' ');
                btn.addEventListener('click', () => sendSticker(emoji.char));
                content.appendChild(btn);
            });
        }
    } catch (error) {
        // Fallback para busca local
        searchFallbackStickers(query);
    }
}

function searchFallbackStickers(query) {
    const content = document.getElementById('sticker-content');
    if (!content) return;
    
    const results = [];
    Object.values(fallbackStickers).forEach(emojis => {
        emojis.forEach(emoji => {
            if (emoji.includes(query)) {
                results.push(emoji);
            }
        });
    });
    
    content.innerHTML = '';
    if (results.length === 0) {
        content.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Nenhum emoji encontrado</div>';
        return;
    }
    
    results.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'sticker-item';
        btn.textContent = emoji;
        btn.addEventListener('click', () => sendSticker(emoji));
        content.appendChild(btn);
    });
}

function renderStickers(category) {
    const content = document.getElementById('sticker-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    if (category === 'custom') {
        renderCustomStickers();
        return;
    }
    
    // Usar fallback stickers
    const categoryStickers = fallbackStickers[category] || [];
    
    categoryStickers.forEach(sticker => {
        const stickerEl = document.createElement('div');
        stickerEl.className = 'sticker-item';
        stickerEl.textContent = sticker;
        stickerEl.addEventListener('click', () => sendSticker(sticker));
        content.appendChild(stickerEl);
    });
}

function renderCustomStickers() {
    const content = document.getElementById('sticker-content');
    if (!content) return;
    
    content.innerHTML = '';
    
    // Botão para adicionar nova figurinha
    const addBtn = document.createElement('div');
    addBtn.className = 'btn-add-sticker';
    addBtn.innerHTML = '+';
    addBtn.title = 'Adicionar figurinha';
    addBtn.addEventListener('click', handleAddCustomSticker);
    content.appendChild(addBtn);
    
    // Renderizar figurinhas existentes
    customStickers.forEach((sticker, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-sticker-wrapper';
        
        const stickerEl = document.createElement('div');
        stickerEl.className = 'sticker-item';
        stickerEl.style.backgroundImage = `url(${sticker.data})`;
        stickerEl.addEventListener('click', () => sendCustomSticker(sticker.data));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete-sticker';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'Deletar';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomSticker(index);
        });
        
        wrapper.appendChild(stickerEl);
        wrapper.appendChild(deleteBtn);
        content.appendChild(wrapper);
    });
}

function handleAddCustomSticker() {
    if (customStickers.length >= MAX_CUSTOM_STICKERS) {
        alert(`Você atingiu o limite de ${MAX_CUSTOM_STICKERS} figurinhas personalizadas.`);
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/webp';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar tamanho (3MB)
        const maxSize = 3 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Figurinha muito grande! Tamanho máximo: 3MB');
            return;
        }
        
        // Converter para base64
        const reader = new FileReader();
        reader.onload = (event) => {
            const newSticker = {
                id: `sticker_${Date.now()}`,
                data: event.target.result,
                addedAt: Date.now()
            };
            
            customStickers.push(newSticker);
            saveCustomStickers();
            renderCustomStickers();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function deleteCustomSticker(index) {
    if (confirm('Deseja realmente deletar esta figurinha?')) {
        customStickers.splice(index, 1);
        saveCustomStickers();
        renderCustomStickers();
    }
}

function sendCustomSticker(imageData) {
    socket.emit('message:send', { text: `STICKER_CUSTOM:${imageData}` });
    closeStickerPicker();
    messageInput.focus();
}

function switchStickerCategory(category) {
    currentCategory = category;
    
    // Atualizar tabs visuais
    document.querySelectorAll('.sticker-tab').forEach(tab => {
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Carregar emojis da categoria
    if (category === 'custom') {
        renderCustomStickers();
    } else {
        loadEmojiCategory(category);
    }
}

function toggleStickerPicker() {
    if (stickerPicker.style.display === 'none' || !stickerPicker.style.display) {
        stickerPicker.style.display = 'flex';
        stickerBtn.classList.add('active');
    } else {
        closeStickerPicker();
    }
}

function closeStickerPicker() {
    stickerPicker.style.display = 'none';
    stickerBtn.classList.remove('active');
}

function sendSticker(sticker) {
    // Enviar figurinha como mensagem especial
    socket.emit('message:send', { text: `STICKER:${sticker}` });
    
    // Fechar painel
    closeStickerPicker();
    
    // Focar no input
    messageInput.focus();
}

// ===== Sistema de Upload de Imagens =====
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    processImageFile(file);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    processFileUpload(file);
    
    // Reset input
    fileInput.value = '';
}

// ===== Clipboard Paste =====
let lastImagePasteTime = 0;
const IMAGE_PASTE_DEBOUNCE_MS = 800; // ms

function handlePaste(e) {
    // If clipboard contains image data, process it and prevent default paste.
    try {
        const items = e.clipboardData && e.clipboardData.items;
        if (!items) return; // nothing to do

        for (let item of items) {
            if (item && item.type && item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    // set the last image paste time to avoid duplicate handling
                    lastImagePasteTime = Date.now();
                    processImageFile(file);
                }
                return;
            }
        }
        // If no image, allow default paste (text) to proceed normally
    } catch (err) {
        console.warn('handlePaste error', err);
    }
}

// Fallback: when Ctrl+V pressed, try to read image from clipboard via Clipboard API
document.addEventListener('keydown', async (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const pastePressed = isMac ? (e.metaKey && e.key.toLowerCase() === 'v') : (e.ctrlKey && e.key.toLowerCase() === 'v');
    if (!pastePressed) return;

    // If the focus is inside an input/textarea/contenteditable, let the paste event handle it.
    const active = document.activeElement;
    const activeTag = active && active.tagName ? active.tagName.toLowerCase() : '';
    const isEditable = active && (active.isContentEditable || activeTag === 'input' || activeTag === 'textarea' || (active.getAttribute && active.getAttribute('role') === 'textbox'));
    if (isEditable) return;

    // If recent paste event already handled an image, skip to avoid duplicates.
    if (Date.now() - lastImagePasteTime < IMAGE_PASTE_DEBOUNCE_MS) return;
    if (!navigator.clipboard || !navigator.clipboard.read) return;

    try {
        const items = await navigator.clipboard.read();
        for (const clipboardItem of items) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    // Convert blob to File-like object and process
                    // mark paste handled and process
                    lastImagePasteTime = Date.now();
                    const clippedFile = new File([blob], `clipboard.${type.split('/')[1] || 'png'}`, { type: type });
                    console.log('[clipboard] fallback send (keydown) file:', clippedFile.type, clippedFile.size);
                    processImageFile(clippedFile);
                    // prevent default paste behavior to avoid inserting binary into input
                    e.preventDefault();
                    return;
                }
            }
        }
    } catch (err) {
        // clipboard.read may be unavailable or rejected; ignore silently
    }
});

// ===== Sistema de Preview de Imagem (Estilo Discord) =====
let pendingImageFile = null;
let pendingImageBase64 = null;

function showImagePreview(file, base64Data) {
    pendingImageFile = file;
    pendingImageBase64 = base64Data;
    
    // Remover preview anterior se existir
    hideImagePreview();
    
    // Criar modal de preview
    const previewModal = document.createElement('div');
    previewModal.id = 'image-preview-modal';
    previewModal.className = 'image-preview-modal';
    
    const fileSize = formatBytes(file.size);
    const fileName = file.name || 'imagem.png';
    
    previewModal.innerHTML = `
        <div class="image-preview-backdrop" onclick="hideImagePreview()"></div>
        <div class="image-preview-container">
            <div class="image-preview-header">
                <div class="image-preview-title">
                    <span class="image-preview-icon">🖼️</span>
                    <span>Enviar Imagem</span>
                </div>
                <button class="image-preview-close" onclick="hideImagePreview()" title="Cancelar">✕</button>
            </div>
            <div class="image-preview-content">
                <div class="image-preview-image-wrapper">
                    <img src="${base64Data}" alt="Preview" class="image-preview-img">
                </div>
                <div class="image-preview-info">
                    <div class="image-preview-filename">${escapeHtml(fileName)}</div>
                    <div class="image-preview-filesize">${fileSize}</div>
                </div>
            </div>
            <div class="image-preview-caption">
                <input type="text" id="image-caption-input" placeholder="Adicionar legenda (opcional)..." maxlength="200">
            </div>
            <div class="image-preview-footer">
                <button class="btn-preview-cancel" onclick="hideImagePreview()">
                    <span>Cancelar</span>
                </button>
                <button class="btn-preview-send" onclick="confirmSendImage()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Enviar</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewModal);
    
    // Animação de entrada
    requestAnimationFrame(() => {
        previewModal.classList.add('visible');
    });
    
    // Focar no input de legenda
    setTimeout(() => {
        const captionInput = document.getElementById('image-caption-input');
        if (captionInput) captionInput.focus();
    }, 100);
    
    // Fechar com ESC
    document.addEventListener('keydown', handlePreviewKeydown);
}

function handlePreviewKeydown(e) {
    if (e.key === 'Escape') {
        hideImagePreview();
    } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        confirmSendImage();
    }
}

function hideImagePreview() {
    const modal = document.getElementById('image-preview-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 200);
    }
    pendingImageFile = null;
    pendingImageBase64 = null;
    document.removeEventListener('keydown', handlePreviewKeydown);
    
    // Limpar input de imagem
    if (imageInput) {
        imageInput.value = '';
    }
}

function confirmSendImage() {
    if (!pendingImageBase64) {
        hideImagePreview();
        return;
    }
    
    const captionInput = document.getElementById('image-caption-input');
    const caption = captionInput ? captionInput.value.trim() : '';
    
    // Verificar tamanho para decidir método de envio
    const socketLimit = 1 * 1024 * 1024;
    
    if (pendingImageFile && pendingImageFile.size > socketLimit) {
        // Upload por chunks para imagens grandes
        console.log('[image] Large image, using chunk upload');
        uploadFileInChunks(pendingImageFile);
        
        // Se tem legenda, enviar como mensagem separada
        if (caption) {
            setTimeout(() => {
                socket.emit('message:send', { text: caption });
            }, 500);
        }
    } else {
        // Envio direto via socket para imagens pequenas
        try {
            // Deduplicate check
            if (!window._lastBase64SendTime) window._lastBase64SendTime = 0;
            if (!window._lastBase64SendKey) window._lastBase64SendKey = null;
            const now = Date.now();
            const debounce = 800;
            const payload = pendingImageBase64.split(',')[1] || pendingImageBase64;
            const key = `${payload.length}:${payload.substr(0, 32)}:${payload.substr(payload.length - 32, 32)}`;
            
            if (!(window._lastBase64SendKey === key && (now - window._lastBase64SendTime) < debounce)) {
                window._lastBase64SendTime = now;
                window._lastBase64SendKey = key;
                
                console.log('[image] Sending image via socket, size=', pendingImageBase64.length);
                socket.emit('message:send', { text: `IMAGE:${pendingImageBase64}` });
                
                // Enviar legenda como mensagem separada se existir
                if (caption) {
                    setTimeout(() => {
                        socket.emit('message:send', { text: caption });
                    }, 100);
                }
            }
        } catch (e) {
            console.error('[image] Error sending:', e);
        }
    }
    
    hideImagePreview();
}

function processImageFile(file) {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB max total
    
    if (file.size > maxSize) {
        alert('Imagem muito grande! Tamanho máximo: 10MB');
        return;
    }
    
    // Ler a imagem e mostrar preview
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64Image = event.target.result;
        showImagePreview(file, base64Image);
    };
    
    reader.onerror = () => {
        alert('Erro ao ler a imagem. Tente novamente.');
    };
    
    reader.readAsDataURL(file);
}

function processFileUpload(file) {
    // Validar tamanho (1GB)
    const maxSize = 1024 * 1024 * 1024; // 1GB em bytes
    if (file.size > maxSize) {
        alert('Arquivo muito grande! Tamanho máximo: 1GB');
        return;
    }
    
    // Mostrar status de upload
    addSystemMessage(`📤 Uploadando arquivo: ${file.name}... (${formatBytes(file.size)})`);
    
    // Iniciar upload em chunks
    uploadFileInChunks(file);
}

// ===== Upload de Arquivos em Chunks =====
async function uploadFileInChunks(file) {
    const chunkSize = 5 * 1024 * 1024; // 5MB por chunk
    const fileName = file.name;
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / chunkSize);
    let sessionId = null;
    
    // Mostrar progress bar
    showUploadProgress(fileName);
    
    try {
        // Iniciar upload
        const initRes = await fetch('/api/upload/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                filename: fileName, 
                filesize: fileSize, 
                totalChunks 
            })
        });
        
        if (!initRes.ok) throw new Error('Erro ao iniciar upload');
        
        const initData = await initRes.json();
        sessionId = initData.sessionId;
        
        // Enviar chunks
        let uploadedSize = 0;
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fileSize);
            const chunk = file.slice(start, end);
            
            // Converter chunk para base64 de forma não-bloqueante
            const base64Chunk = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    // Extrair base64 do data URL
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = () => {
                    reject(new Error(`Erro ao ler chunk ${i}`));
                };
                // Usar readAsArrayBuffer e depois converter para base64
                reader.readAsDataURL(chunk);
            });
            
            const chunkRes = await fetch('/api/upload/chunk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    chunkIndex: i,
                    chunk: base64Chunk
                })
            });
            
            if (!chunkRes.ok) {
                const errorData = await chunkRes.json();
                throw new Error(`Erro no chunk ${i}: ${errorData.error}`);
            }
            
            uploadedSize += (end - start);
            const percent = Math.round((uploadedSize / fileSize) * 100);
            updateUploadProgress(percent, uploadedSize, fileSize);
            console.log(`Upload ${percent}% completo (chunk ${i + 1}/${totalChunks})`);
        }
        
        // Finalizar upload
        const completeRes = await fetch('/api/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, filename: fileName, filesize: fileSize })
        });
        
        if (!completeRes.ok) throw new Error('Erro ao finalizar upload');
        
        const result = await completeRes.json();
        
        console.log('Upload response:', result);
        
        if (result.success && result.url) {
            // Remover progress bar silenciosamente
            hideUploadProgress();
            
            // Enviar mensagem com link do arquivo para o servidor
            if (!socket || !socket.connected) {
                console.error('Socket não conectado ao tentar enviar arquivo');
                addSystemMessage(`❌ Socket desconectado. Tente novamente.`);
                return;
            }
            
            console.log(`📁 Arquivo uploadado: ${result.filename}`);
            console.log(`📦 URL: ${result.url}`);
            console.log(`💾 Tamanho: ${result.filesize} bytes`);
            
            // Pequeno delay para garantir que arquivo foi escrito no disco
            setTimeout(() => {
                console.log(`📤 ENVIANDO mensagem socket: FILE:${result.url}|${fileName}|${fileSize}`);
                console.log(`⏳ Aguardando confirmação do servidor...`);
                
                // Enviar com callback de confirmação
                socket.emit('message:send', { 
                    text: `FILE:${result.url}|${fileName}|${fileSize}` 
                }, (response) => {
                    console.log('🎉 CONFIRMADO pelo servidor:', response);
                    console.log(`📨 Message ID: ${response?.messageId}`);
                    console.log(`📝 Texto registrado: ${response?.text}`);
                    addSystemMessage(`✅ Arquivo enviado e registrado: ${fileName}`);
                });
                
                // Timeout se não receber confirmação em 5 segundos
                setTimeout(() => {
                    console.warn('⚠️ Nenhuma confirmação recebida em 5s');
                }, 5000);
                
            }, 500);
        } else {
            hideUploadProgress();
            throw new Error('Resposta inválida do servidor: ' + JSON.stringify(result));
        }
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        hideUploadProgress();
        addSystemMessage(`❌ Erro: ${error.message}`);
    }
}

// ===== Funções do Progress Bar de Upload =====
function showUploadProgress(fileName) {
    let progressDiv = document.getElementById('upload-progress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'upload-progress';
        progressDiv.className = 'upload-progress';
        progressDiv.innerHTML = `
            <div class="upload-progress-title">
                <span class="upload-spinner"></span>
                ${escapeHtml(fileName)}
            </div>
            <div class="upload-progress-bar-container">
                <div class="upload-progress-bar"></div>
            </div>
            <div class="upload-progress-text">
                <span>0%</span>
                <span>0 MB / 0 MB</span>
            </div>
        `;
        document.body.appendChild(progressDiv);
    }
    progressDiv.classList.remove('hidden');
}

function updateUploadProgress(percent, uploaded, total) {
    const progressDiv = document.getElementById('upload-progress');
    if (progressDiv) {
        const bar = progressDiv.querySelector('.upload-progress-bar');
        if (bar) bar.style.width = percent + '%';
        
        const textDiv = progressDiv.querySelector('.upload-progress-text');
        if (textDiv) {
            textDiv.innerHTML = `
                <span>${percent}%</span>
                <span>${formatBytes(uploaded)} / ${formatBytes(total)}</span>
            `;
        }
    }
}

function hideUploadProgress() {
    const progressDiv = document.getElementById('upload-progress');
    if (progressDiv) {
        progressDiv.style.animation = 'slideDown 0.3s ease-out forwards';
        setTimeout(() => progressDiv.remove(), 300);
    }
}

// ===== Drag and Drop de Imagens e Arquivos =====
function initializeDragAndDrop() {
    const dropZone = messagesContainer;
    dropZone.classList.add('drop-zone');
    
    // Prevenir comportamento padrão
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight ao arrastar sobre a área
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('active');
            dropZone.style.borderWidth = '2px';
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('active');
            dropZone.style.borderWidth = '';
        }, false);
    });
    
    // Handle drop
    dropZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const file = files[0];
        // Se for imagem, processar como antes; senão, fazer upload de arquivo grande
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        } else {
            uploadLargeFile(file);
        }
    }
}

// ===== Upload de Arquivos Grandes com Chunking =====
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

async function uploadLargeFile(file) {
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
        alert(`Arquivo muito grande! Tamanho máximo: 1GB (você tentou enviar ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB)`);
        return;
    }
    
    console.log(`[upload] starting upload of ${file.name} (${file.size} bytes)`);
    
    // Adicionar mensagem de progresso
    const statusMsgId = `upload_${Date.now()}`;
    addSystemMessage(`📤 Iniciando upload: ${file.name} (${formatBytes(file.size)})`, statusMsgId);
    
    try {
        // 1. Inicializar upload session no servidor
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const initResponse = await fetch('/api/upload/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: file.name,
                totalChunks,
                filesize: file.size,
                userId: currentUser?.id,
                username: currentUser?.username
            })
        });
        
        if (!initResponse.ok) {
            throw new Error(await initResponse.text());
        }
        
        const { sessionId } = await initResponse.json();
        console.log(`[upload] session ${sessionId} initialized`);
        
        // 2. Upload chunks em paralelo (máx 3 simultâneos para não sobrecarregar)
        const chunks = [];
        for (let i = 0; i < totalChunks; i++) {
            chunks.push(i);
        }
        
        let successCount = 0;
        for (let i = 0; i < chunks.length; i += 3) {
            const batch = chunks.slice(i, i + 3);
            await Promise.all(batch.map(chunkIndex => uploadChunk(file, sessionId, chunkIndex, totalChunks, statusMsgId, (count) => {
                successCount = count;
            })));
        }
        
        // 3. Finalizar upload
        const completeResponse = await fetch('/api/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });
        
        if (!completeResponse.ok) {
            throw new Error(await completeResponse.text());
        }
        
        const { filename, url } = await completeResponse.json();
        console.log(`[upload] upload complete: ${filename}`);
        
        // 4. Enviar mensagem de arquivo para o chat
        const message = `FILE:${url}|${file.name}|${file.size}|${file.type}`;
        socket.emit('message:send', { text: message });
        
        // Atualizar mensagem de status
        updateSystemMessage(statusMsgId, `✅ Upload concluído: ${file.name}`);
        
    } catch (error) {
        console.error('[upload] error:', error);
        updateSystemMessage(statusMsgId, `❌ Erro no upload: ${error.message}`);
    }
}

async function uploadChunk(file, sessionId, chunkIndex, totalChunks, statusMsgId, onProgress) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    // Converter chunk para base64 para compatibilidade com JSON
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64chunk = e.target.result.split(',')[1]; // Remove data: prefix
                const response = await fetch('/api/upload/chunk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        chunkIndex,
                        chunk: base64chunk
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const { progress, uploadedBytes, totalBytes } = await response.json();
                console.log(`[upload] chunk ${chunkIndex}/${totalChunks} uploaded (${progress}%)`);
                
                // Atualizar UI
                const progressText = `📤 Upload: ${formatBytes(uploadedBytes)} / ${formatBytes(totalBytes)} (${progress}%)`;
                updateSystemMessage(statusMsgId, progressText);
                
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read chunk'));
        reader.readAsDataURL(chunk);
    });
}

// ===== Download Progress Indicator =====
function showDownloadProgress(fileName) {
    // Remover qualquer indicador anterior
    hideDownloadProgress();
    
    const progressDiv = document.createElement('div');
    progressDiv.id = 'download-progress';
    progressDiv.className = 'download-progress';
    progressDiv.innerHTML = `
        <div class="download-progress-title">
            <span class="download-spinner"></span>
            <span class="download-filename">${escapeHtml(fileName)}</span>
        </div>
        <div class="download-progress-bar-container">
            <div class="download-progress-bar"></div>
        </div>
        <div class="download-progress-text">
            <span class="download-percent">Preparando...</span>
            <span class="download-size"></span>
        </div>
    `;
    document.body.appendChild(progressDiv);
    
    // Animação de entrada
    requestAnimationFrame(() => {
        progressDiv.classList.add('visible');
    });
    
    return progressDiv;
}

function updateDownloadProgress(percent, downloadedBytes, totalBytes) {
    const progressDiv = document.getElementById('download-progress');
    if (!progressDiv) return;
    
    const bar = progressDiv.querySelector('.download-progress-bar');
    const percentText = progressDiv.querySelector('.download-percent');
    const sizeText = progressDiv.querySelector('.download-size');
    
    if (bar) bar.style.width = `${percent}%`;
    if (percentText) percentText.textContent = `${Math.round(percent)}%`;
    if (sizeText) {
        sizeText.textContent = `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}`;
    }
}

function hideDownloadProgress(success = true) {
    const progressDiv = document.getElementById('download-progress');
    if (progressDiv) {
        if (success) {
            // Mostrar mensagem de sucesso brevemente
            const title = progressDiv.querySelector('.download-progress-title');
            if (title) {
                title.innerHTML = `<span style="color: #10b981;">✅</span> Download concluído!`;
            }
            setTimeout(() => {
                progressDiv.classList.remove('visible');
                setTimeout(() => progressDiv.remove(), 300);
            }, 1000);
        } else {
            progressDiv.classList.remove('visible');
            setTimeout(() => progressDiv.remove(), 300);
        }
    }
}

// Função para baixar arquivo com nome original e feedback visual
function downloadFileWithName(fileUrl, fileName) {
    // Mostrar indicador de progresso
    showDownloadProgress(fileName);
    
    // Usando XMLHttpRequest para obter progresso do download
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${fileUrl}?filename=${encodeURIComponent(fileName)}`, true);
    xhr.responseType = 'blob';
    
    let startTime = Date.now();
    
    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            updateDownloadProgress(percent, event.loaded, event.total);
        } else {
            // Se não souber o tamanho total, mostrar bytes baixados
            const progressDiv = document.getElementById('download-progress');
            if (progressDiv) {
                const percentText = progressDiv.querySelector('.download-percent');
                const sizeText = progressDiv.querySelector('.download-size');
                if (percentText) percentText.textContent = 'Baixando...';
                if (sizeText) sizeText.textContent = formatBytes(event.loaded);
                
                // Animar a barra indeterminada
                const bar = progressDiv.querySelector('.download-progress-bar');
                if (bar) {
                    bar.style.width = '100%';
                    bar.classList.add('indeterminate');
                }
            }
        }
    };
    
    xhr.onload = () => {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
            
            // Atualizar para 100% e esconder
            updateDownloadProgress(100, 1, 1);
            hideDownloadProgress(true);
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ Download concluído: ${fileName} em ${duration}s`);
        } else {
            console.error('Erro ao baixar arquivo:', xhr.status);
            hideDownloadProgress(false);
            // Fallback: abrir em nova aba
            window.open(fileUrl, '_blank');
        }
    };
    
    xhr.onerror = () => {
        console.error('Erro de rede ao baixar arquivo');
        hideDownloadProgress(false);
        // Fallback: abrir em nova aba
        window.open(fileUrl, '_blank');
    };
    
    xhr.send();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Inicializar drag and drop quando conectar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (messagesContainer) {
            initializeDragAndDrop();
        }
    }, 1000);
});

// ===== Lightbox para Imagens =====
function openLightbox(imageSrc) {
    // Criar lightbox se não existir
    let lightbox = document.getElementById('lightbox');
    
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <button class="lightbox-close" onclick="closeLightbox()">✕</button>
            <img class="lightbox-content" id="lightbox-img" src="" alt="Imagem">
        `;
        document.body.appendChild(lightbox);
    }
    
    // Atualizar imagem e mostrar
    const img = document.getElementById('lightbox-img');
    img.src = imageSrc;
    lightbox.classList.add('active');
    
    // Fechar ao clicar fora da imagem
    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    };
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
    }
}

// Fechar lightbox com ESC (atualizar handler existente)
const originalKeyHandler = document.onkeydown;
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
        const lightbox = document.getElementById('lightbox');
        if (!lightbox || !lightbox.classList.contains('active')) {
            // Se não está no lightbox, executar handler original (logout)
            if (chatScreen.classList.contains('active')) {
                // Não fazer logout automaticamente com ESC
            }
        }
    }
});

// ===== Sistema de Contadores SINCRONIZADO (Addon) =====
let counters = [];

// Carregar contadores do servidor ao iniciar
function loadCounters() {
    socket.emit('counters:get');
}

// Ouvir lista de contadores do servidor
socket.on('counters:list', (serverCounters) => {
    counters = serverCounters;
    renderCounters();
    console.log(`📊 ${counters.length} contadores carregados do servidor`);
});

// Ouvir quando um contador é criado
socket.on('counter:created', (counter) => {
    counters.push(counter);
    renderCounters();
    addSystemMessage(`📊 Contador "${counter.name}" criado por ${counter.createdBy}`);
});

// Ouvir quando um contador é atualizado
socket.on('counter:updated', (data) => {
    const counter = counters.find(c => c.id === data.id);
    if (counter) {
        counter.value = data.value;
        // Atualizar apenas o valor com animação
        const valueEl = document.getElementById(`value-${data.id}`);
        if (valueEl) {
            valueEl.textContent = counter.value;
            valueEl.classList.add('pulse');
            setTimeout(() => valueEl.classList.remove('pulse'), 300);
        }
    }
});

// Ouvir quando um contador é renomeado
socket.on('counter:renamed', (data) => {
    const counter = counters.find(c => c.id === data.id);
    if (counter) {
        counter.name = data.name;
        renderCounters();
    }
});

// Ouvir quando um contador é deletado
socket.on('counter:deleted', (data) => {
    counters = counters.filter(c => c.id !== data.id);
    renderCounters();
});

function toggleAddonsPanel() {
    addonsSidebar.classList.toggle('open');
    addonsBtn.classList.toggle('active');
}

function openNewCounterModal() {
    const modal = document.getElementById('new-counter-modal');
    modal.style.display = 'flex';
    document.getElementById('counter-name').value = '';
    document.getElementById('counter-initial').value = '0';
    document.getElementById('counter-color').value = '#667eea';
    document.getElementById('counter-name').focus();
}

function closeNewCounterModal() {
    const modal = document.getElementById('new-counter-modal');
    modal.style.display = 'none';
}

function createNewCounter() {
    const name = document.getElementById('counter-name').value.trim();
    const initialValue = parseInt(document.getElementById('counter-initial').value) || 0;
    const color = document.getElementById('counter-color').value;
    
    if (!name) {
        alert('Por favor, digite um nome para o contador');
        return;
    }
    
    // Enviar para o servidor via Socket.io
    socket.emit('counter:create', {
        name: name,
        value: initialValue,
        color: color
    });
    
    closeNewCounterModal();
}

function renderCounters() {
    if (counters.length === 0) {
        countersList.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                <p>Nenhum contador criado</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Clique no + para criar um</p>
            </div>
        `;
        return;
    }
    
    countersList.innerHTML = counters.map(counter => `
        <div class="counter-card" style="border-left: 3px solid ${counter.color}">
            <div class="counter-header">
                <div class="counter-name" ondblclick="renameCounter('${counter.id}')" title="Clique duplo para editar">
                    ${escapeHtml(counter.name)}
                    ${counter.createdBy ? `<small style="opacity: 0.5; font-size: 0.7em;">por ${escapeHtml(counter.createdBy)}</small>` : ''}
                </div>
                <button class="btn-delete-counter" onclick="deleteCounter('${counter.id}')" title="Deletar">
                    🗑️
                </button>
            </div>
            <div class="counter-value" id="value-${counter.id}">
                ${counter.value}
            </div>
            <div class="counter-actions">
                <button class="btn-counter-action btn-decrement" onclick="updateCounterValue('${counter.id}', -5)">-5</button>
                <button class="btn-counter-action btn-decrement" onclick="updateCounterValue('${counter.id}', -1)">-1</button>
                <button class="btn-counter-action btn-increment" onclick="updateCounterValue('${counter.id}', 1)">+1</button>
                <button class="btn-counter-action btn-increment" onclick="updateCounterValue('${counter.id}', 5)">+5</button>
                <button class="btn-counter-action btn-reset" onclick="resetCounter('${counter.id}')">Reset</button>
            </div>
        </div>
    `).join('');
}

function updateCounterValue(id, amount) {
    // Enviar para o servidor via Socket.io
    socket.emit('counter:update', { id, amount });
}

function resetCounter(id) {
    const counter = counters.find(c => c.id === id);
    if (!counter) return;
    
    if (confirm(`Resetar "${counter.name}" para 0?`)) {
        socket.emit('counter:reset', { id });
    }
}

function deleteCounter(id) {
    const counter = counters.find(c => c.id === id);
    if (!counter) return;
    
    if (confirm(`Deletar contador "${counter.name}"?`)) {
        socket.emit('counter:delete', { id });
    }
}

function renameCounter(id) {
    const counter = counters.find(c => c.id === id);
    if (!counter) return;
    
    const newName = prompt('Novo nome:', counter.name);
    if (newName && newName.trim()) {
        socket.emit('counter:rename', { id, name: newName.trim() });
    }
}

// Tornar fun��es globais para onclick
window.createNewCounter = createNewCounter;
window.closeNewCounterModal = closeNewCounterModal;
window.updateCounterValue = updateCounterValue;
window.resetCounter = resetCounter;
window.deleteCounter = deleteCounter;
window.renameCounter = renameCounter;


function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'agora mesmo';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atr�s`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atr�s`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d atr�s`;
    return date.toLocaleDateString();
}

// ===== WhatsApp Integration (Addon) =====
let currentChatId = null;

function openWhatsApp() {
    document.getElementById('whatsapp-screen').style.display = 'flex';
    initializeWhatsAppIfNeeded();
}

function closeWhatsApp() {
    document.getElementById('whatsapp-screen').style.display = 'none';
}

// Inicializar WhatsApp sob demanda na primeira vez que o usuário tenta usar
async function initializeWhatsAppIfNeeded() {
    try {
        const response = await fetch('/api/whatsapp/init', { method: 'POST' });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        console.log('WhatsApp init result:', result);
        
        // Aguardar um pouco e depois tentar carregar os chats
        setTimeout(() => {
            fetchWhatsAppChats();
        }, 1000);
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp:', error);
        const contactsContainer = document.getElementById('whatsapp-contacts');
        if (error.message.includes('whatsapp-web.js')) {
            contactsContainer.innerHTML = '<div class="whatsapp-loading" style="color: #ff6b6b;">WhatsApp não instalado. Execute: npm install whatsapp-web.js</div>';
        } else {
            contactsContainer.innerHTML = '<div class="whatsapp-loading" style="color: #ff6b6b;">Falha ao conectar WhatsApp: ' + error.message + '</div>';
        }
    }
}

async function fetchWhatsAppChats() {
    const contactsContainer = document.getElementById('whatsapp-contacts');
    contactsContainer.innerHTML = '<div class="whatsapp-loading">Carregando conversas...</div>';
    
    try {
        const response = await fetch('/api/whatsapp/chats');
        const result = await response.json();
        
        if (result.success) {
            renderWhatsAppChats(result.data);
            // Se n�o estiver pronto (erro 503), vai cair no catch ou retornar erro
        } else if (result.error === 'WhatsApp not ready') {
            // Mostrar QR Code se n�o estiver pronto
            document.getElementById('whatsapp-intro').style.display = 'flex';
            document.getElementById('whatsapp-chat-main').style.display = 'none';
            document.getElementById('whatsapp-qr-container').style.display = 'block';
            contactsContainer.innerHTML = '<div class="whatsapp-loading">Aguardando conex�o...</div>';
        }
    } catch (error) {
        console.error('Erro ao buscar chats:', error);
        contactsContainer.innerHTML = '<div class="whatsapp-loading">Erro ao carregar. Tente novamente.</div>';
    }
}

function renderWhatsAppChats(chats) {
    const container = document.getElementById('whatsapp-contacts');
    container.innerHTML = '';
    
    // Esconder QR code se carregou chats
    document.getElementById('whatsapp-qr-container').style.display = 'none';
    
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = `whatsapp-contact ${currentChatId === chat.id ? 'active' : ''}`;
        div.onclick = () => selectWhatsAppChat(chat);
        
        const lastMsgTime = chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000).toLocaleDateString() : '';
        
        div.innerHTML = `
            <div class="whatsapp-contact-avatar"></div>
            <div class="whatsapp-contact-info">
                <div class="whatsapp-contact-name">${chat.name || 'Desconhecido'}</div>
                <div class="whatsapp-contact-last-msg">${chat.lastMessage ? chat.lastMessage.body : ''}</div>
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${lastMsgTime}</div>
        `;
        
        container.appendChild(div);
    });
}

async function selectWhatsAppChat(chat) {
    currentChatId = chat.id;
    
    // Atualizar UI da lista
    document.querySelectorAll('.whatsapp-contact').forEach(el => el.classList.remove('active'));
    // (Idealmente re-renderizar ou achar o elemento clicado, mas simplificando)
    
    // Atualizar header do chat
    document.getElementById('current-chat-name').innerText = chat.name || 'Desconhecido';
    document.getElementById('whatsapp-intro').style.display = 'none';
    document.getElementById('whatsapp-chat-main').style.display = 'flex';
    
    // Carregar mensagens
    const messagesContainer = document.getElementById('whatsapp-messages');
    messagesContainer.innerHTML = '<div class="whatsapp-loading">Carregando mensagens...</div>';
    
    try {
        const response = await fetch(`/api/whatsapp/messages/${chat.id}`);
        const result = await response.json();
        
        if (result.success) {
            renderWhatsAppMessages(result.data);
        }
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

function renderWhatsAppMessages(messages) {
    const container = document.getElementById('whatsapp-messages');
    container.innerHTML = '';
    
    messages.forEach(msg => {
        appendWhatsAppMessage(msg);
    });
    
    // Scroll para o final
    container.scrollTop = container.scrollHeight;
}

function appendWhatsAppMessage(msg) {
    const container = document.getElementById('whatsapp-messages');
    const div = document.createElement('div');
    div.className = `whatsapp-msg ${msg.fromMe ? 'sent' : 'received'}`;
    
    const time = new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        ${msg.body}
        <div class="whatsapp-msg-time">${time}</div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function sendWhatsAppMessage() {
    if (!currentChatId) return;
    
    const input = document.getElementById('whatsapp-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: currentChatId,
                message: message
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            input.value = '';
            // Adicionar mensagem localmente (otimista)
            appendWhatsAppMessage({
                body: message,
                fromMe: true,
                timestamp: Math.floor(Date.now() / 1000)
            });
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        alert('Erro ao enviar mensagem');
    }
}

// Eventos Socket.io do WhatsApp
socket.on('whatsapp:qr', (url) => {
    // MOVIDO PARA DENTRO DE connectToServer()
});

socket.on('whatsapp:ready', () => {
    // MOVIDO PARA DENTRO DE connectToServer()
});

socket.on('whatsapp:message', (msg) => {
    // Se estiver no chat aberto, adicionar mensagem
    if (currentChatId === msg.chatId) {
        appendWhatsAppMessage(msg);
    } else {
        // Notifica��o de nova mensagem
        showNotification('WhatsApp', `Nova mensagem de ${msg.chatName}`, '');
    }
});

// Input enter para enviar
const whatsappInputEl = document.getElementById('whatsapp-input');
if (whatsappInputEl) {
    whatsappInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendWhatsAppMessage();
    });
}

// Tornar fun��es globais
window.openWhatsApp = openWhatsApp;
window.closeWhatsApp = closeWhatsApp;
window.sendWhatsAppMessage = sendWhatsAppMessage;


function resetWhatsApp() {
    if (confirm('Isso ir� desconectar o WhatsApp e gerar um novo QR Code. Continuar?')) {
        document.getElementById('whatsapp-contacts').innerHTML = '<div class="whatsapp-loading">Reiniciando...</div>';
        document.getElementById('whatsapp-qr-container').style.display = 'none';
        socket.emit('whatsapp:reset');
    }
}

window.resetWhatsApp = resetWhatsApp;

/* ===== Lightbox para Imagens ===== */
function openLightbox(imageUrl) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = imageUrl;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Fechar lightbox ao clicar fora
document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            }
        });
    }
});

// Tornar funções globais
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

/* ===== Sistema de Temas ===== */
function openThemeModal() {
    const themeModal = document.getElementById('theme-modal');
    if (themeModal) {
        themeModal.style.display = 'flex';
        // Atualiza visual dos cards de tema
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === currentTheme);
        });
    }
}

function closeThemeModal() {
    const themeModal = document.getElementById('theme-modal');
    if (themeModal) {
        themeModal.style.display = 'none';
    }
}

function selectTheme(themeName) {
    if (themeName === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
    }
    localStorage.setItem(THEME_KEY, themeName);
    currentTheme = themeName;
    
    // Atualiza visual dos cards de tema
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('active', option.dataset.theme === themeName);
    });
    
    closeThemeModal();
}

function loadSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
        if (saved === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', saved);
        }
        currentTheme = saved;
    }
}

// Tornar funções globais
window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;
window.selectTheme = selectTheme;

/* ===== Sistema de Limpar Banco de Dados ===== */
async function handleClearDatabase() {
    if (!authToken) {
        alert('❌ Você precisa estar logado para limpar o banco de dados.');
        return;
    }
    
    const confirmed = confirm('⚠️ ATENÇÃO!\n\nVocê está prestes a LIMPAR TODO O BANCO DE DADOS.\n\nTodas as mensagens serão apagadas permanentemente.\n\nDeseja continuar?');
    
    if (!confirmed) return;
    
    const confirmPhrase = prompt('Para confirmar, digite: LIMPAR TUDO');
    
    if (confirmPhrase !== 'LIMPAR TUDO') {
        alert('❌ Frase de confirmação incorreta. Operação cancelada.');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/clear-database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: authToken, confirmPhrase })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Banco de dados limpo com sucesso!\n\nTodas as mensagens foram removidas.');
            // Limpa a interface local
            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                const welcomeMsg = messagesContainer.querySelector('.welcome-message');
                messagesContainer.innerHTML = '';
                if (welcomeMsg) messagesContainer.appendChild(welcomeMsg);
            }
        } else {
            alert('❌ Erro: ' + (data.error || 'Falha ao limpar banco de dados'));
        }
    } catch (error) {
        console.error('Erro ao limpar banco:', error);
        alert('❌ Erro de conexão ao tentar limpar o banco de dados.');
    }
}

window.handleClearDatabase = handleClearDatabase;
