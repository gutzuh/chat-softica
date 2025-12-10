// ===== Sistema de Preview de Avatar =====
let pendingAvatarData = null;
let pendingAvatarContext = null; // 'login' ou 'chat'

function showAvatarPreview(base64Data, fileName, context) {
    pendingAvatarData = base64Data;
    pendingAvatarContext = context;
    
    // Remover preview anterior se existir
    hideAvatarPreview();
    
    // Criar modal de preview
    const previewModal = document.createElement('div');
    previewModal.id = 'avatar-preview-modal';
    previewModal.className = 'avatar-preview-modal';
    
    previewModal.innerHTML = `
        <div class="avatar-preview-backdrop" onclick="hideAvatarPreview()"></div>
        <div class="avatar-preview-container">
            <div class="avatar-preview-header">
                <div class="avatar-preview-title">
                    <span class="avatar-preview-icon">📷</span>
                    <span>Confirmar Foto de Perfil</span>
                </div>
                <button class="avatar-preview-close" onclick="hideAvatarPreview()" title="Cancelar">✕</button>
            </div>
            <div class="avatar-preview-content">
                <div class="avatar-preview-image-wrapper">
                    <img src="${base64Data}" alt="Preview" class="avatar-preview-img">
                </div>
                <div class="avatar-preview-info">
                    <div class="avatar-preview-filename">${escapeHtml(fileName)}</div>
                    <div class="avatar-preview-hint">Esta será sua foto de perfil</div>
                </div>
            </div>
            <div class="avatar-preview-footer">
                <button class="btn-avatar-cancel" onclick="hideAvatarPreview()">
                    <span>Cancelar</span>
                </button>
                <button class="btn-avatar-confirm" onclick="confirmAvatarChange()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Confirmar</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewModal);
    
    // Animação de entrada
    requestAnimationFrame(() => {
        previewModal.classList.add('visible');
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', handleAvatarPreviewKeydown);
}

function handleAvatarPreviewKeydown(e) {
    if (e.key === 'Escape') {
        hideAvatarPreview();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmAvatarChange();
    }
}

function hideAvatarPreview() {
    const modal = document.getElementById('avatar-preview-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 200);
    }
    pendingAvatarData = null;
    pendingAvatarContext = null;
    document.removeEventListener('keydown', handleAvatarPreviewKeydown);
}

function confirmAvatarChange() {
    if (!pendingAvatarData) {
        hideAvatarPreview();
        return;
    }
    
    // Salvar no localStorage
    try {
        localStorage.setItem(AVATAR_STORAGE_KEY, pendingAvatarData);
        console.log('✅ Avatar salvo no localStorage');
    } catch (e) {
        console.warn('Erro ao salvar avatar:', e);
        alert('Erro ao salvar avatar. Tente uma imagem menor.');
        hideAvatarPreview();
        return;
    }
    
    // Atualizar variável global
    currentAvatar = pendingAvatarData;
    
    // Atualizar UI em ambas as telas
    updateLoginAvatarUI(pendingAvatarData);
    updateCurrentAvatarUI(pendingAvatarData);
    
    // Se estiver logado, notificar servidor
    if (socket && socket.connected && currentUser) {
        socket.emit('user:login', { username: currentUser, avatar: currentAvatar });
        console.log('✅ Avatar sincronizado com servidor');
    }
    
    console.log('✅ Avatar atualizado e salvo com sucesso');
    hideAvatarPreview();
}

// Handler para avatar selecionado na tela de LOGIN
function handleLoginAvatarSelect(file) {
    if (!file) return;
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
        alert('Avatar muito grande. Máx 500KB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = ev.target.result;
        showAvatarPreview(data, file.name, 'login');
    };
    reader.readAsDataURL(file);
}

// Handler para avatar selecionado na tela de CHAT
function handleAvatarSelect(file) {
    if (!file) return;
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
        alert('Avatar muito grande. Máx 500KB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = ev.target.result;
        showAvatarPreview(data, file.name, 'chat');
    };
    reader.readAsDataURL(file);
}
