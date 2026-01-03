// ===== Sistema de Preview de Avatar =====
let pendingAvatarData = null;
let pendingAvatarFile = null;
let pendingAvatarContext = null; // 'login' ou 'chat'

// Variável global para instância do Cropper
let avatarCropper = null;

function showAvatarPreview(base64Data, file, context) {
    // Remover preview anterior se existir e limpar estado
    hideAvatarPreview();

    pendingAvatarData = base64Data; // Fallback original
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
                    <span class="avatar-preview-icon">✂️</span>
                    <span>Editar Foto de Perfil</span>
                </div>
                <button class="avatar-preview-close" title="Cancelar">✕</button>
            </div>
            <div class="avatar-preview-content" style="padding: 0; background: #000; height: 350px; display: flex; align-items: center; justify-content: center;">
                <img id="avatar-crop-img" src="${base64Data}" alt="Preview" style="max-width: 100%; max-height: 100%; display: block;">
            </div>
            <div class="avatar-preview-info" style="padding: 10px 20px;">
                <div class="avatar-preview-hint">Arraste para ajustar e cortar a foto</div>
            </div>
            <div class="avatar-preview-footer">
                <button class="btn-avatar-cancel">
                    <span>Cancelar</span>
                </button>
                <button class="btn-avatar-confirm" id="btn-avatar-confirm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Salvar Foto</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(previewModal);

    document.body.appendChild(previewModal);

    // Inicializar Cropper APENAS se não for GIF
    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

    if (!isGif) {
        const imageElement = document.getElementById('avatar-crop-img');
        avatarCropper = new Cropper(imageElement, {
            aspectRatio: 1, // Quadrado para perfil
            viewMode: 1, // Restringir corte dentro da imagem
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    } else {
        // Ajuste visual para GIFs não cortáveis
        const img = document.getElementById('avatar-crop-img');
        img.style.objectFit = 'contain';
        previewModal.querySelector('.avatar-preview-hint').textContent = '✨ GIFs animados não podem ser cortados';
    }

    // Bind events manually
    previewModal.querySelector('.avatar-preview-backdrop').addEventListener('click', hideAvatarPreview);
    previewModal.querySelector('.avatar-preview-close').addEventListener('click', hideAvatarPreview);
    previewModal.querySelector('.btn-avatar-cancel').addEventListener('click', hideAvatarPreview);

    // Bind confirm with cropping logic
    const confirmBtn = previewModal.querySelector('#btn-avatar-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
            console.log('👆 Click no botão Salvar detectado! Processando corte...');
            confirmAvatarChange();
        });
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

    // Destruir cropper se existir
    if (avatarCropper) {
        avatarCropper.destroy();
        avatarCropper = null;
    }

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
    const btnConfirm = document.getElementById('btn-avatar-confirm');
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = '<span>Processando...</span>';
    }

    // Se tiver cropper (imagem estática), processa o corte
    if (avatarCropper) {
        // Obter imagem cortada (Canvas)
        const canvas = avatarCropper.getCroppedCanvas({
            width: 500,
            height: 500,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        const croppedDataUrl = canvas.toDataURL('image/png');

        canvas.toBlob(async (blob) => {
            processAvatarBlob(blob, croppedDataUrl);
        }, 'image/png');

    } else if (pendingAvatarFile) {
        // É GIF ou imagem sem crop -> Usar original
        console.log('🎞️ Processando arquivo original (sem crop com canvas)...');

        let finalAvatarPath = pendingAvatarData;

        // Se for grande, upload
        if (pendingAvatarFile.size > 1 * 1024 * 1024) {
            try {
                if (window.uploadFileInChunks) {
                    const result = await window.uploadFileInChunks(pendingAvatarFile, false);
                    if (result && result.url) {
                        finalAvatarPath = result.url;
                    }
                }
            } catch (err) {
                console.error('❌ Erro upload GIF:', err);
            }
        }

        saveAndApplyAvatar(finalAvatarPath);
    } else {
        hideAvatarPreview();
    }
}

async function processAvatarBlob(blob, dataUrl) {
    let finalAvatarPath = dataUrl;

    // Se o blob resultante for muito grande (> 1MB), fazer upload
    if (blob.size > 1 * 1024 * 1024) {
        console.log('📦 Avatar cortado grande (>1MB), iniciando upload...');
        try {
            // Criar arquivo simulado a partir do blob
            const fileToUpload = new File([blob], "avatar_recortado.png", { type: "image/png" });

            if (window.uploadFileInChunks) {
                const result = await window.uploadFileInChunks(fileToUpload, false);
                if (result && result.url) {
                    finalAvatarPath = result.url;
                    console.log('✅ Upload do avatar concluído:', finalAvatarPath);
                }
            }
        } catch (err) {
            console.error('❌ Erro no upload do avatar:', err);
            // Fallback para base64 se falhar
        }
    }

    // Salvar e atualizar
    saveAndApplyAvatar(finalAvatarPath);
}

function saveAndApplyAvatar(finalAvatarPath) {
    // Salvar no localStorage
    try {
        localStorage.setItem(AVATAR_STORAGE_KEY, finalAvatarPath);
        console.log('✅ Avatar salvo no localStorage');
    } catch (e) {
        console.warn('⚠️ Erro ao salvar avatar no localStorage', e);
    }

    // Atualizar globais
    if (typeof window !== 'undefined') {
        window.currentAvatar = finalAvatarPath;
        if (typeof currentAvatar !== 'undefined') currentAvatar = finalAvatarPath;
    }

    // Atualizar UI
    if (typeof updateLoginAvatarUI === 'function') updateLoginAvatarUI(finalAvatarPath);
    if (typeof updateCurrentAvatarUI === 'function') updateCurrentAvatarUI(finalAvatarPath);

    // Servidor
    const s = window.socket || socket;
    const u = window.currentUser || currentUser;
    if (s && s.connected && u) {
        s.emit('user:login', { username: u, avatar: finalAvatarPath });
        console.log('✅ [AVATAR] Sincronizado com servidor');
    }

    console.log('✅ [AVATAR] Processo concluído');
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

