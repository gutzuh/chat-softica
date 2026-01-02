
// Marketplace Logic
const MOCK_ADDONS = [
    // === TEMAS ===
    {
        id: 'theme-matrix',
        name: 'Matrix Theme',
        description: 'Um tema verde e preto inspirado no filme Matrix.',
        author: 'Miguel',
        version: '1.0.0',
        type: 'theme',
        css: `
            :root {
                --primary-gradient: linear-gradient(135deg, #0f0 0%, #050 100%);
                --bg-primary: #000;
                --bg-secondary: #051005;
                --text-primary: #0f0;
                --text-secondary: #0a0;
                --bg-glass: rgba(0, 255, 0, 0.05);
            }
        `
    },
    {
        id: 'theme-cyberpunk',
        name: 'Cyberpunk Neon',
        description: 'Luzes de neon rosa e azul em um fundo escuro futurista.',
        author: 'Miguel',
        version: '1.0',
        type: 'theme',
        css: `
            :root {
                --primary-gradient: linear-gradient(135deg, #ff00ff 0%, #00ffff 100%);
                --bg-primary: #050510;
                --bg-secondary: #0a0a20;
                --text-primary: #fff;
                --text-secondary: #00ffff;
                --accent-gradient: linear-gradient(90deg, #ff00ff, #00ffff);
                --bg-glass: rgba(255, 0, 255, 0.1);
            }
        `
    },
    {
        id: 'theme-dracula',
        name: 'Dracula Dark',
        description: 'Um tema escuro e elegante com tons de roxo e vampírico.',
        author: 'Miguel',
        version: '2.0',
        type: 'theme',
        css: `
            :root {
                --primary-gradient: linear-gradient(135deg, #bd93f9 0%, #6272a4 100%);
                --bg-primary: #282a36;
                --bg-secondary: #44475a;
                --text-primary: #f8f8f2;
                --text-secondary: #6272a4;
                --success: #50fa7b;
                --warning: #ffb86c;
                --error: #ff5555;
            }
        `
    },
    {
        id: 'theme-sunset',
        name: 'Sunset Vibes',
        description: 'Gradientes quentes de laranja e roxo para relaxar.',
        author: 'Miguel',
        version: '1.2',
        type: 'theme',
        css: `
            :root {
                --primary-gradient: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
                --bg-primary: #2d1b2e;
                --bg-secondary: #4a2b4b;
                --text-primary: #ffecd2;
                --text-secondary: #fcb69f;
                --bg-glass: rgba(255, 94, 98, 0.15);
            }
        `
    },
    {
        id: 'theme-ocean',
        name: 'Ocean Breeze',
        description: 'Refrescante como o mar, com tons de azul e turquesa.',
        author: 'Miguel',
        version: '1.0',
        type: 'theme',
        css: `
            :root {
                --primary-gradient: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
                --bg-primary: #e0f7fa;
                --bg-secondary: #b2ebf2;
                --text-primary: #006064;
                --text-secondary: #00838f;
                --bg-glass: rgba(0, 198, 255, 0.1);
            }
        `
    },

    // === ADDONS ===
    {
        id: 'addon-calc',
        name: 'Calculadora Rápida',
        description: 'Adiciona uma mini calculadora flutuante no canto da tela.',
        author: 'Miguel',
        version: '1.0',
        type: 'script',
        js: `
            if (document.getElementById('miguel-calc')) return;
            const calc = document.createElement('div');
            calc.id = 'miguel-calc';
            calc.style.cssText = 'position:fixed; bottom:80px; right:20px; background:#222; padding:10px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.5); z-index:9999; width:200px;';
            calc.innerHTML = \`
                <div style="margin-bottom:5px; color:#fff; font-family:monospace; text-align:right; border:1px solid #444; padding:5px; min-height:20px;" id="calc-display">0</div>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px;">
                    <button onclick="window.calcAppend('7')">7</button><button onclick="window.calcAppend('8')">8</button><button onclick="window.calcAppend('9')">9</button><button onclick="window.calcOp('/')">/</button>
                    <button onclick="window.calcAppend('4')">4</button><button onclick="window.calcAppend('5')">5</button><button onclick="window.calcAppend('6')">6</button><button onclick="window.calcOp('*')">*</button>
                    <button onclick="window.calcAppend('1')">1</button><button onclick="window.calcAppend('2')">2</button><button onclick="window.calcAppend('3')">3</button><button onclick="window.calcOp('-')">-</button>
                    <button onclick="window.calcAppend('0')">0</button><button onclick="window.calcClear()">C</button><button onclick="window.calcEval()">=</button><button onclick="window.calcOp('+')">+</button>
                </div>
                <div style="text-align:center; margin-top:5px; font-size:10px; color:#666; cursor:pointer;" onclick="this.parentElement.remove()">Fechar</div>
            \`;
            document.body.appendChild(calc);

            window.calcExpr = '';
            window.calcAppend = (v) => { window.calcExpr += v; document.getElementById('calc-display').innerText = window.calcExpr; };
            window.calcOp = (op) => { window.calcExpr += op; document.getElementById('calc-display').innerText = window.calcExpr; };
            window.calcClear = () => { window.calcExpr = ''; document.getElementById('calc-display').innerText = '0'; };
            window.calcEval = () => { try { document.getElementById('calc-display').innerText = eval(window.calcExpr); window.calcExpr = ''; } catch(e) { document.getElementById('calc-display').innerText = 'Err'; window.calcExpr = ''; } };
        `
    },
    {
        id: 'addon-confetti',
        name: 'Modo Festa',
        description: 'Solta confetes na tela sempre que você enviar "party" ou clicar no botão.',
        author: 'Miguel',
        version: '1.2',
        type: 'script',
        js: `
            // Check if canvas exists
            if (!document.getElementById('confetti-canvas')) {
                const canvas = document.createElement('canvas');
                canvas.id = 'confetti-canvas';
                canvas.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:9999;';
                document.body.appendChild(canvas);
            }
            
            window.fireConfetti = () => {
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
                const canvas = document.getElementById('confetti-canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                
                let particles = [];
                for(let i=0; i<100; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: -20,
                        vx: Math.random() * 4 - 2,
                        vy: Math.random() * 5 + 2,
                        color: colors[Math.floor(Math.random() * colors.length)]
                    });
                }
                
                function animate() {
                    ctx.clearRect(0,0,canvas.width,canvas.height);
                    let active = false;
                    particles.forEach(p => {
                        p.x += p.vx;
                        p.y += p.vy;
                        if(p.y < canvas.height) active = true;
                        ctx.fillStyle = p.color;
                        ctx.fillRect(p.x, p.y, 5, 5);
                    });
                    if(active) requestAnimationFrame(animate);
                    else ctx.clearRect(0,0,canvas.width,canvas.height);
                }
                animate();
            };

            // Click listener for "festa"
            (function() {
                if (!window._partyAddonInitialized) {
                    window._partyAddonInitialized = true;
                    
                    // Click listener for "festa"
                    document.addEventListener('click', (e) => {
                        const target = e.target;
                        if (target && target.innerText && target.innerText.toLowerCase().includes('festa')) {
                            window.fireConfetti();
                        }
                    });

                    // Observer for new "festa" messages
                    let debounceTimer;
                    const observer = new MutationObserver((mutations) => {
                        let shouldFire = false;
                        for(const mutation of mutations) {
                            if(mutation.addedNodes.length) {
                                mutation.addedNodes.forEach(node => {
                                    if(node.innerText && node.innerText.toLowerCase().includes('festa')) {
                                        shouldFire = true;
                                    }
                                });
                            }
                        }
                        
                        if(shouldFire) {
                            if(debounceTimer) clearTimeout(debounceTimer);
                            debounceTimer = setTimeout(() => {
                                window.fireConfetti();
                            }, 500); // Debounce to prevent spam
                        }
                    });

                    const chatContainer = document.getElementById('messages-container');
                    if(chatContainer) {
                        observer.observe(chatContainer, { childList: true, subtree: true });
                    }
                }
            })();
        `
    },
    {
        id: 'addon-notepad',
        name: 'Bloco de Notas',
        description: 'Um bloco de notas simples que salva automaticamente.',
        author: 'Miguel',
        version: '1.0',
        type: 'script',
        js: `
            if (document.getElementById('miguel-notes')) return;
            const container = document.createElement('div');
            container.id = 'miguel-notes';
            container.style.cssText = 'position:fixed; top:20px; right:20px; width:250px; height:300px; background:#fff; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.3); z-index:10000; overflow:hidden; display:flex; flex-direction:column;';
            
            const header = document.createElement('div');
            header.style.cssText = 'background:#f0f0f0; padding:10px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; align-items:center; color:#333; font-weight:bold; cursor:move;';
            header.innerHTML = '<span>📝 Notas</span><span style="cursor:pointer;" onclick="this.parentElement.parentElement.remove()">✕</span>';
            
            const textarea = document.createElement('textarea');
            textarea.style.cssText = 'flex:1; width:100%; border:none; padding:10px; resize:none; outline:none; font-family:sans-serif; color:#333;';
            textarea.placeholder = 'Escreva aqui...';
            textarea.value = localStorage.getItem('miguel-notes-content') || '';
            
            textarea.addEventListener('input', () => {
                localStorage.setItem('miguel-notes-content', textarea.value);
            });
            
            container.appendChild(header);
            container.appendChild(textarea);
            document.body.appendChild(container);

            // Simple drag support
            let isDragging = false, startX, startY, initialLeft, initialTop;
            header.addEventListener('mousedown', e => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initialLeft = container.offsetLeft;
                initialTop = container.offsetTop;
            });
            document.addEventListener('mousemove', e => {
                if(!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                container.style.left = (initialLeft + dx) + 'px';
                container.style.top = (initialTop + dy) + 'px';
                container.style.right = 'auto'; // Disable right content
            });
            document.addEventListener('mouseup', () => isDragging = false);
        `
    },
    {
        id: 'addon-custom-bg',
        name: 'Fundo Personalizado Pro',
        description: 'V3.1: Studio com "Salvar como Tema" e melhor limpeza.',
        author: 'Softica',
        version: '3.1',
        type: 'script',
        js: `
            (function() {
                // Prevent duplicate injection
                if(document.getElementById('bg-studio-container')) return;

                const defaultSettings = { blur: 0, brightness: 0.6, color: '#000000', intensity: 0.45 };
                let settings = JSON.parse(localStorage.getItem('custom-bg-settings')) || defaultSettings;
                let currentUrl = localStorage.getItem('custom-bg-image-url') || '';
                const styleId = 'custom-bg-styles';

                // Cleanup function attached to window for external access if needed
                window._cleanupStudio = () => {
                    const style = document.getElementById(styleId);
                    if (style) style.remove();
                    const container = document.getElementById('bg-studio-container');
                    if (container) container.remove();
                    delete window._cleanupStudio;
                };

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                function generateCSS() {
                     if (!currentUrl) return '';
                     const hexToRgb = (hex) => {
                        var result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
                        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : {r:0,g:0,b:0};
                    };

                    const rgb = hexToRgb(settings.color);
                    const colorOverlay = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + settings.intensity + ')';

                    return 'body::after { ' +
                        'content: ""; ' +
                        'position: fixed; ' +
                        'top: -30px; left: -30px; right: -30px; bottom: -30px; ' +
                        'background-image: linear-gradient(' + colorOverlay + ', ' + colorOverlay + '), url("' + currentUrl + '") !important; ' +
                        'background-size: cover !important; ' +
                        'background-position: center !important; ' +
                        'background-attachment: fixed !important; ' +
                        'filter: blur(' + settings.blur + 'px) brightness(' + settings.brightness + ') !important; ' +
                        'z-index: -10 !important; ' +
                        'pointer-events: none !important; ' +
                        '} ' +
                        'body { background: #000 !important; } ' +
                        '.chat-container, .screen, .chat-main, .messages-container { background: transparent !important; } ' +
                        '.sidebar, .addons-sidebar { background-color: rgba(5,5,7,0.85) !important; backdrop-filter: blur(25px) !important; border-color: rgba(255,255,255,0.03) !important; } ' +
                        '.chat-header, .chat-footer { background-color: rgba(10,10,15,0.6) !important; backdrop-filter: blur(15px) !important; border-bottom: 1px solid rgba(255,255,255,0.03) !important; } ' +
                        '.message-text { backdrop-filter: blur(16px) !important; background-color: rgba(15, 15, 20, 0.85) !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important; padding: 0.8rem 1rem !important; font-weight: 500 !important; } ' +
                        '.message.own .message-text, .message.own-message .message-text { background-color: rgba(15, 15, 20, 0.85) !important; background-image: none !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.1) !important; } ' +
                        '.studio-range { -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; outline: none; margin: 10px 0; } ' +
                        '.studio-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #ef4444; border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); transition: 0.2s; } ' +
                        '.studio-range::-webkit-slider-thumb:hover { transform: scale(1.2); background: #ff6b6b; }';
                }

                function applyStyles() {
                    let styleEl = document.getElementById(styleId);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = styleId;
                        document.head.appendChild(styleEl);
                    }
                    styleEl.innerHTML = generateCSS();
                }

                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                        const result = await window.uploadFileInChunks(file, false);
                        if (result && result.url) {
                            currentUrl = result.url;
                            localStorage.setItem('custom-bg-image-url', currentUrl);
                            applyStyles();
                        }
                    } catch (err) { alert('Erro no upload: ' + err.message); }
                };

                function createControl(label, type, min, max, step, key, unit = '') {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'margin-top: 12px; font-size: 0.8rem;';
                    const lblWrap = document.createElement('div');
                    lblWrap.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 2px; color: #999;';
                    lblWrap.innerHTML = '<span>' + label + '</span><span id="val-' + key + '" style="color: #ef4444; font-weight: 600;">' + settings[key] + unit + '</span>';
                    const input = document.createElement('input');
                    input.type = type;
                    input.className = type === 'range' ? 'studio-range' : '';
                    if(type === 'range') { input.min = min; input.max = max; input.step = step; input.value = settings[key]; }
                    else { 
                        input.value = settings[key]; 
                        input.style.cssText = 'width: 100%; height: 30px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(0,0,0,0.2); cursor: pointer; padding: 2px;'; 
                    }
                    input.oninput = () => {
                        settings[key] = input.value;
                        document.getElementById('val-' + key).innerText = input.value + unit;
                        localStorage.setItem('custom-bg-settings', JSON.stringify(settings));
                        applyStyles();
                    };
                    wrap.appendChild(lblWrap);
                    wrap.appendChild(input);
                    return wrap;
                }
                
                function saveAsTheme() {
                    if (!currentUrl) return alert('Escolha uma imagem de fundo primeiro!');
                    const name = prompt('Nome do Tema:', 'Meu Tema Personalizado');
                    if (!name) return;
                    
                    const css = generateCSS();
                    const newTheme = {
                        id: 'theme-custom-' + Date.now(),
                        name: name,
                        type: 'theme',
                        version: '1.0',
                        enabled: true,
                        css: css,
                        author: 'User'
                    };
                    
                    if (window.addonManager) {
                        window.addonManager.installAddon(newTheme);
                        // Disable Studio to see result
                        // window.addonManager.toggleAddon('addon-custom-bg', false); 
                        // Actually, let's just alert
                        if(confirm('Tema salvo! Deseja desativar o Studio para usar o novo tema?')) {
                             window.addonManager.toggleAddon('addon-custom-bg', false);
                             // Enable the new theme (it is enabled by default installAddon but check conflicts)
                             window.selectTheme(newTheme.id);
                        }
                    }
                }

                function injectStudio() {
                    const sections = Array.from(document.querySelectorAll('.addon-section'));
                    const settingsSection = sections.find(s => s.querySelector('h3')?.innerText.includes('Configurações'));
                    if (settingsSection) {
                        if (document.getElementById('bg-studio-container')) return true;
                        const container = document.createElement('div');
                        container.id = 'bg-studio-container';
                        container.style.cssText = 'margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);';
                        const title = document.createElement('div');
                        title.innerText = '🏙️ Studio de Fundo';
                        title.style.cssText = 'font-weight: 700; margin-bottom: 15px; color: #fff; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;';
                        container.appendChild(title);
                        
                        const btn = document.createElement('button');
                        btn.className = 'btn-premium';
                        btn.style.cssText = 'width: 100%; margin-bottom: 5px;';
                        btn.innerHTML = '📸 Escolher Imagem';
                        btn.onclick = () => fileInput.click();
                        container.appendChild(btn);
                        
                        // Controls
                        container.appendChild(createControl('Desfoque', 'range', 0, 20, 1, 'blur', 'px'));
                        container.appendChild(createControl('Brilho', 'range', 0, 2, 0.1, 'brightness'));
                        container.appendChild(createControl('Cor do Filtro', 'color', 0, 0, 0, 'color'));
                        container.appendChild(createControl('Intensidade', 'range', 0, 1, 0.05, 'intensity'));
                        
                        // Save Button
                        const saveBtn = document.createElement('button');
                        saveBtn.className = 'btn-premium';
                        saveBtn.style.cssText = 'width: 100%; margin-top: 15px; background: linear-gradient(135deg, #10b981, #059669);';
                        saveBtn.innerHTML = '💾 Salvar como Tema';
                        saveBtn.onclick = saveAsTheme;
                        container.appendChild(saveBtn);
                        
                        settingsSection.appendChild(container);
                        return true;
                    }
                    return false;
                }

                if (!injectStudio()) {
                    const interval = setInterval(() => { if (injectStudio()) clearInterval(interval); }, 1000);
                    setTimeout(() => clearInterval(interval), 10000);
                }
                if (currentUrl) applyStyles();
            })();
        `
    }
];

class AddonManager {
    constructor() {
        this.installedAddons = this.loadInstalled();
        this.activeTab = 'explore';
        this.init();
    }

    init() {
        // Auto-update addons from Store (MOCK_ADDONS)
        let updated = false;
        this.installedAddons = this.installedAddons.map(installed => {
            const fromStore = MOCK_ADDONS.find(m => m.id === installed.id);
            if (fromStore && fromStore.version > installed.version) {
                console.log(`🆙 Updating Addon ${installed.name} from v${installed.version} to v${fromStore.version}`);
                updated = true;
                return { ...fromStore, enabled: installed.enabled }; // Keep enabled state, update code
            }
            return installed;
        });

        if (updated) {
            this.saveInstalled();
        }

        // Apply installed addons on boot
        this.installedAddons.forEach(addon => {
            if (addon.enabled) this.applyAddon(addon);
        });

        // Setup event listener for opening
        const btn = document.getElementById('marketplace-btn');
        if (btn) btn.addEventListener('click', () => this.open());
    }

    loadInstalled() {
        try {
            return JSON.parse(localStorage.getItem('chat_installed_addons') || '[]');
        } catch (e) { return []; }
    }

    saveInstalled() {
        localStorage.setItem('chat_installed_addons', JSON.stringify(this.installedAddons));
    }

    open() {
        document.getElementById('marketplace-modal').style.display = 'flex';
        this.render();
    }

    close() {
        document.getElementById('marketplace-modal').style.display = 'none';
    }

    render() {
        const content = document.getElementById('marketplace-content');
        content.innerHTML = '';

        // Update active tab UI
        document.querySelectorAll('.mk-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === this.activeTab);
        });

        if (this.activeTab === 'explore') this.renderExplore(content);
        else if (this.activeTab === 'installed') this.renderInstalled(content);
        else if (this.activeTab === 'create') this.renderCreate(content);
    }

    renderExplore(container) {
        container.innerHTML = `<h2>🔍 Explorar Addons</h2><div class="addon-grid"></div>`;
        const grid = container.querySelector('.addon-grid');

        MOCK_ADDONS.forEach(addon => {
            const isInstalled = this.installedAddons.some(a => a.id === addon.id);
            const card = document.createElement('div');
            card.className = 'addon-card';
            card.innerHTML = `
                <div class="addon-header">
                    <h4>${addon.name}</h4>
                    <span class="addon-badge">${addon.type}</span>
                </div>
                <p>${addon.description}</p>
                <div class="addon-footer">
                    <small>by ${addon.author}</small>
                    ${isInstalled
                    ? `<button disabled class="btn-installed">Instalado</button>`
                    : `<button class="btn-install" data-id="${addon.id}">Instalar</button>`}
                </div>
            `;

            if (!isInstalled) {
                card.querySelector('.btn-install').addEventListener('click', () => this.installFromStore(addon));
            }
            grid.appendChild(card);
        });
    }

    renderInstalled(container) {
        container.innerHTML = `<h2>✅ Meus Addons</h2><div class="addon-list"></div>`;
        const list = container.querySelector('.addon-list');

        if (this.installedAddons.length === 0) {
            list.innerHTML = `<p style="color:var(--text-muted)">Nenhum addon instalado.</p>`;
            return;
        }

        this.installedAddons.forEach(addon => {
            const el = document.createElement('div');
            el.className = 'addon-row';
            el.innerHTML = `
                <div class="addon-info">
                    <strong>${addon.name}</strong>
                    <small>${addon.version}</small>
                </div>
                <div class="addon-actions">
                    <label class="switch">
                        <input type="checkbox" ${addon.enabled ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <button class="btn-delete" title="Remover">🗑️</button>
                </div>
            `;

            // Toggle logic
            el.querySelector('input').addEventListener('change', (e) => {
                this.toggleAddon(addon.id, e.target.checked);
            });

            // Delete logic
            el.querySelector('.btn-delete').addEventListener('click', () => {
                if (confirm('Remover este addon?')) this.removeAddon(addon.id);
            });

            list.appendChild(el);
        });
    }

    renderCreate(container) {
        container.innerHTML = `
            <h2>🛠️ Criar Addon</h2>
            <div class="create-form">
                <input type="text" id="new-addon-name" placeholder="Nome do Addon">
                <select id="new-addon-type">
                    <option value="css">Tema / CSS</option>
                    <option value="js">Script / JS</option>
                </select>
                <textarea id="new-addon-code" placeholder="Cole seu código aqui...CSS ou JS"></textarea>
                <button id="save-custom-addon" class="btn-primary">Salvar Addon</button>
            </div>
        `;

        container.querySelector('#save-custom-addon').addEventListener('click', () => {
            const name = document.getElementById('new-addon-name').value;
            const type = document.getElementById('new-addon-type').value;
            const code = document.getElementById('new-addon-code').value;

            if (!name || !code) return alert('Preencha nome e código');

            const newAddon = {
                id: 'custom-' + Date.now(),
                name,
                type: type === 'css' ? 'theme' : 'script',
                version: '1.0',
                enabled: true,
                [type]: code // store as css: "..." or js: "..."
            };

            this.installAddon(newAddon);
            this.activeTab = 'installed';
            this.render();
        });
    }

    installFromStore(addon) {
        const newAddon = { ...addon, enabled: true };
        this.installAddon(newAddon);
        this.render();
    }

    installAddon(addon) {
        // Se for um tema, desabilitar outros temas antes de instalar/ativar este
        if (addon.type === 'theme' || addon.css) {
            this.installedAddons.forEach(a => {
                if ((a.type === 'theme' || a.css) && a.enabled) {
                    a.enabled = false;
                    this.removeAddonEffect(a);
                }
            });
        }

        this.installedAddons.push(addon);
        this.saveInstalled();
        this.applyAddon(addon);

        // Se o tema instalado for ativado, atualizar o sistema de temas global
        if (addon.enabled && (addon.type === 'theme' || addon.css)) {
            if (window.selectTheme) {
                // Sincronizar com o app.js sem disparar recursão
                localStorage.setItem('chat_current_theme', addon.id);
                if (window.currentTheme) window.currentTheme = addon.id;
            }
        }

        alert(`Addon ${addon.name} instalado!`);

        // Atualizar lista de temas se o modal estiver aberto (ou para refletir mudanças)
        if (window.renderThemeOptions) window.renderThemeOptions();
    }

    removeAddon(id) {
        const addon = this.installedAddons.find(a => a.id === id);
        if (addon) {
            this.removeAddonEffect(addon);
            this.installedAddons = this.installedAddons.filter(a => a.id !== id);
            this.saveInstalled();
            this.render();
            if (window.renderThemeOptions) window.renderThemeOptions();
        }
    }

    toggleAddon(id, enabled) {
        const addon = this.installedAddons.find(a => a.id === id);
        if (addon) {
            // Exclusividade para temas
            if (enabled && (addon.type === 'theme' || addon.css)) {
                this.installedAddons.forEach(a => {
                    if (a.id !== id && (a.type === 'theme' || a.css) && a.enabled) {
                        a.enabled = false;
                        this.removeAddonEffect(a);
                    }
                });

                // Atualizar o THEME_KEY no localStorage para o seletor saber qual está ativo
                localStorage.setItem('chat_current_theme', id);
                if (window.currentTheme) window.currentTheme = id;
            }

            addon.enabled = enabled;
            this.saveInstalled();
            if (enabled) this.applyAddon(addon);
            else this.removeAddonEffect(addon);

            // Re-renderizar painel de addons e temas
            this.render();
            if (window.renderThemeOptions) window.renderThemeOptions();
        }
    }

    applyAddon(addon) {
        try {
            if (addon.type === 'theme' || addon.css) {
                const style = document.createElement('style');
                style.id = `style-${addon.id}`;
                style.textContent = addon.css;
                document.head.appendChild(style);
            }
            if (addon.type === 'script' || addon.js) {
                // Dangerous but requested feature
                try {
                    // We can't easily "unload" JS, but we can run it
                    // To support unload, we'd need structured plugins
                    const script = document.createElement('script');
                    script.id = `script-${addon.id}`;
                    script.textContent = `(function(){ ${addon.js} })();`;
                    document.body.appendChild(script);
                } catch (e) { console.error('Script error', e); }
            }
        } catch (e) {
            console.error('Error applying addon', e);
        }
    }

    removeAddonEffect(addon) {
        // Remove style
        const style = document.getElementById(`style-${addon.id}`);
        if (style) style.remove();

        // JS cannot be purely removed if it modified runtime, but we can remove the script tag
        const script = document.getElementById(`script-${addon.id}`);
        if (script) script.remove();

        // Reload might be needed for clean JS removal
        if (addon.type === 'script') {
            console.log('Script addon disabled. Reload may be required to fully clear effects.');
        }
    }
}

// Global instance
let addonManager;
window.switchMarketplaceTab = (tab) => {
    if (addonManager) {
        addonManager.activeTab = tab;
        addonManager.render();
    }
}

window.closeMarketplaceModal = () => {
    if (addonManager) addonManager.close();
}

document.addEventListener('DOMContentLoaded', () => {
    addonManager = new AddonManager();
});
