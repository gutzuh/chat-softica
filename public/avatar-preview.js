// ===== Sistema de Preview de Avatar =====
let pendingAvatarData = null;
let pendingAvatarFile = null;
let pendingAvatarContext = null; // 'login' ou 'chat'

function showAvatarPreview(base64Data, file, context) {
    // Remover preview anterior se existir e limpar estado
    hideAvatarPreview();

    pendingAvatarData = base64Data;
    pendingAvatarFile = file;
    pendingAvatarContext = context;

    // Criar modal de preview
    const previewModal = document.createElement('div');
    previewModal.id = 'avatar-preview-modal';
    previewModal.className = 'avatar-preview-modal';

    previewModal.innerHTML = `
        <div class="avatar-preview-backdrop"></div>
        <div class="avatar-preview-container">
            <div class="avatar-preview-header">
                <div class="avatar-preview-title">
                    <span class="avatar-preview-icon">📷</span>
                    <span>Confirmar Foto de Perfil</span>
                </div>
                <button class="avatar-preview-close" title="Cancelar">✕</button>
            </div>
            <div class="avatar-preview-content">
                <div class="avatar-preview-image-wrapper">
                    <img src="${base64Data}" alt="Preview" class="avatar-preview-img">
                </div>
                <div class="avatar-preview-info">
                    <div class="avatar-preview-filename">${escapeHtml(file.name)}</div>
                    <div class="avatar-preview-hint">Esta será sua foto de perfil</div>
                    ${file.size > 1 * 1024 * 1024 ? `<div style="color: #667eea; font-size: 0.75rem; margin-top: 5px;">☁️ Foto grande: será feito upload para o servidor</div>` : ''}
                </div>
            </div>
            <div class="avatar-preview-footer">
                <button class="btn-avatar-cancel">
                    <span>Cancelar</span>
                </button>
                <button class="btn-avatar-confirm" id="btn-avatar-confirm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Confirmar</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(previewModal);

    // Bind events manually (safest way)
    previewModal.querySelector('.avatar-preview-backdrop').addEventListener('click', hideAvatarPreview);
    previewModal.querySelector('.avatar-preview-close').addEventListener('click', hideAvatarPreview);
    previewModal.querySelector('.btn-avatar-cancel').addEventListener('click', hideAvatarPreview);

    // IMPORTANT: Bind confirm with debug logs
    const confirmBtn = previewModal.querySelector('#btn-avatar-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
            console.log('👆 Click no botão Confirmar detectado!');
            confirmAvatarChange();
        });
    } else {
        console.error('❌ Botão de confirmação não encontrado no DOM');
    }

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
    pendingAvatarFile = null;
    pendingAvatarContext = null;
    document.removeEventListener('keydown', handleAvatarPreviewKeydown);
}

async function confirmAvatarChange() {
    if (!pendingAvatarData || !pendingAvatarFile) {
        hideAvatarPreview();
        return;
    }

    const btnConfirm = document.getElementById('btn-avatar-confirm');
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = '<span>Processando...</span>';
    }

    let finalAvatarPath = pendingAvatarData;

    // Se a imagem for grande (> 1MB), fazer upload para o servidor
    if (pendingAvatarFile.size > 1 * 1024 * 1024) {
        try {
            console.log('📦 Avatar grande (>1MB), iniciando upload...');
            if (window.uploadFileInChunks) {
                const result = await window.uploadFileInChunks(pendingAvatarFile, false);
                if (result && result.url) {
                    finalAvatarPath = result.url;
                    console.log('✅ Upload do avatar concluído:', finalAvatarPath);
                }
            } else {
                console.warn('⚠️ uploadFileInChunks não disponível, usando base64');
            }
        } catch (err) {
            console.error('❌ Erro no upload do avatar:', err);
            alert('Não foi possível fazer upload da foto grande. Tentando salvar localmente...');
            // Fallback para base64 se falhar
        }
    }

    // Salvar no localStorage
    try {
        localStorage.setItem(AVATAR_STORAGE_KEY, finalAvatarPath);
        console.log('✅ Avatar salvo no localStorage:', finalAvatarPath.startsWith('data:') ? 'Base64' : 'Caminho/' + finalAvatarPath);
    } catch (e) {
        console.warn('⚠️ Erro ao salvar avatar no localStorage (provavelmente cota cheia):', e);
        // Se falhar o localStorage, ainda tentamos manter na variável global para sessão atual
    }

    // Atualizar variável global
    if (typeof window !== 'undefined') {
        window.currentAvatar = finalAvatarPath;
        if (typeof currentAvatar !== 'undefined') currentAvatar = finalAvatarPath;
    }

    // Atualizar UI em ambas as telas
    if (typeof updateLoginAvatarUI === 'function') updateLoginAvatarUI(finalAvatarPath);
    if (typeof updateCurrentAvatarUI === 'function') updateCurrentAvatarUI(finalAvatarPath);

    // Obter socket e currentUser globais
    const s = window.socket || socket;
    const u = window.currentUser || currentUser;

    // Se estiver logado, notificar servidor
    if (s && s.connected && u) {
        s.emit('user:login', { username: u, avatar: finalAvatarPath });
        console.log('✅ [AVATAR] Sincronizado com servidor (Socket)');
    } else {
        console.warn('⚠️ [AVATAR] Não sincronizado: Socket ou User desconectado', { socket: !!s, connected: s?.connected, user: u });
    }

    console.log('✅ [AVATAR] Atualizado com sucesso');
    hideAvatarPreview();
}

// Tornar funções globais para acesso via onclick
window.showAvatarPreview = showAvatarPreview;
window.hideAvatarPreview = hideAvatarPreview;
window.confirmAvatarChange = confirmAvatarChange;
window.handleLoginAvatarSelect = handleLoginAvatarSelect;
window.handleAvatarSelect = handleAvatarSelect;

// Handler para avatar selecionado na tela de LOGIN
function handleLoginAvatarSelect(file) {
    if (!file) return;
    console.log('📸 [AVATAR] Lendo arquivo para preview (login):', file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = ev.target.result;
        showAvatarPreview(data, file, 'login');
    };
    reader.readAsDataURL(file);
}

// Handler para avatar selecionado na tela de CHAT
function handleAvatarSelect(file) {
    if (!file) return;
    console.log('📸 [AVATAR] Lendo arquivo para preview (chat):', file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = ev.target.result;
        showAvatarPreview(data, file, 'chat');
    };
    reader.readAsDataURL(file);
}

