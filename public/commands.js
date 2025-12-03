// ===== Sistema de Comandos do Chat =====

// Armazenar dados de comandos localmente
let commandsData = {
  eventos: [],
  contadores: {},
  lembretes: []
};

// Dados de comandos para autocomplete
const COMMANDS_MAP = {
  'evento': {
    desc: 'Gerenciar eventos com alertas',
    subcommands: ['listar', 'criar', 'deletar']
  },
  'contador': {
    desc: 'Gerenciar contadores',
    subcommands: ['listar', 'criar', 'add', 'sub', 'deletar']
  },
  'lembrete': {
    desc: 'Gerenciar lembretes',
    subcommands: ['listar', 'adicionar', 'deletar']
  },
  'whatsapp': {
    desc: 'Integração WhatsApp',
    subcommands: ['status', 'qr']
  },
  'ajuda': {
    desc: 'Ver todos os comandos',
    subcommands: []
  }
};

// Carregar dados do localStorage
function loadCommandsData() {
  const saved = localStorage.getItem('commandsData');
  if (saved) {
    commandsData = JSON.parse(saved);
  }
}

// Salvar dados no localStorage
function saveCommandsData() {
  localStorage.setItem('commandsData', JSON.stringify(commandsData));
}

// Criar embed visual tipo Discord - MELHORADO
function createEmbed(title, fields, color = '#667CEA', icon = '') {
  let html = `<div class="embed" style="
    background: linear-gradient(135deg, ${color}12 0%, ${color}06 100%);
    border-left: 4px solid ${color};
    padding: 16px 18px;
    border-radius: 12px;
    margin: 10px 0;
    max-width: 550px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  ">`;
  
  if (title) {
    html += `<div class="embed-title" style="
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 14px;
      color: ${color};
      display: flex;
      align-items: center;
      gap: 8px;
    ">${icon} ${title}</div>`;
  }
  
  if (fields && fields.length > 0) {
    html += '<div class="embed-fields" style="display: flex; flex-direction: column; gap: 10px;">';
    fields.forEach((field, idx) => {
      html += `<div class="embed-field" style="
        padding: 10px 12px;
        background: rgba(102, 124, 234, 0.05);
        border-radius: 6px;
        border-left: 2px solid ${color}40;
        transition: all 0.2s ease;
      " onmouseover="this.style.background = 'rgba(102, 124, 234, 0.1)'" onmouseout="this.style.background = 'rgba(102, 124, 234, 0.05)'">
        <div style="font-weight: 600; color: ${color}; font-size: 14px; margin-bottom: 4px;">${field.name}</div>
        <div style="color: #a0aec0; font-size: 12px; line-height: 1.5; font-family: 'Courier New', monospace;">${field.value}</div>
      </div>`;
    });
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

// Gerar dados para autocomplete
function getAutocompleteSuggestions(input) {
  const text = input.slice(1).toLowerCase(); // Remove /
  const parts = text.split(' ');
  const command = parts[0];
  
  if (parts.length === 1) {
    // Sugerir comandos
    return Object.keys(COMMANDS_MAP)
      .filter(cmd => cmd.startsWith(command))
      .map(cmd => ({
        type: 'command',
        text: `/${cmd}`,
        full: `/${cmd} `,
        desc: COMMANDS_MAP[cmd].desc
      }));
  } else {
    // Sugerir subcomandos
    if (command in COMMANDS_MAP) {
      const subcommands = COMMANDS_MAP[command].subcommands;
      const subPrefix = parts.slice(1).join('').toLowerCase();
      
      return subcommands
        .filter(sub => sub.startsWith(subPrefix))
        .map(sub => ({
          type: 'subcommand',
          text: `/${command} ${sub}`,
          full: `/${command} ${sub} `,
          desc: `Subcomando: ${sub}`
        }));
    }
  }
  
  return [];
}

// Processar comandos
function processCommand(text, socket) {
  // Verificar se começa com /
  if (!text.startsWith('/')) {
    return null;
  }
  
  const args = text.slice(1).split(' ');
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'evento':
      return handleEventoCommand(args.slice(1), socket);
    case 'contador':
      return handleContadorCommand(args.slice(1), socket);
    case 'lembrete':
      return handleLembreteCommand(args.slice(1), socket);
    case 'ajuda':
    case 'help':
      return handleHelpCommand();
    case 'whatsapp':
      return handleWhatsappCommand(args.slice(1), socket);
    default:
      return {
        type: 'embed',
        embed: createEmbed('Comando Desconhecido', [
          { name: '❌ Erro', value: `Comando <code>/${command}</code> não existe` },
          { name: '💡 Dica', value: 'Use <code>/ajuda</code> para ver comandos disponíveis' }
        ], '#EF4444', '⚠️')
      };
  }
}

// Comando: /evento
function handleEventoCommand(args, socket) {
  const subcommand = args[0]?.toLowerCase();
  
  if (!subcommand || subcommand === 'listar') {
    if (commandsData.eventos.length === 0) {
      return {
        type: 'embed',
        embed: createEmbed('Eventos', [
          { name: '📭 Lista Vazia', value: 'Nenhum evento registrado ainda' },
          { name: '💡 Como criar', value: '<code>/evento criar Nome do Evento 2025-12-25</code>' }
        ], '#FF6B6B', '📅')
      };
    }
    
    const fields = commandsData.eventos.map((evt, idx) => {
      const now = new Date();
      const eventDate = new Date(evt.data);
      const diasFaltam = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      const status = diasFaltam < 0 ? '⏰ Passado' : diasFaltam === 0 ? '🎉 HOJE!' : `📆 em ${diasFaltam} dias`;
      
      return {
        name: evt.nome,
        value: `📆 <strong>${evt.data}</strong> • ${status}`
      };
    });
    
    return {
      type: 'embed',
      embed: createEmbed(`Eventos (${commandsData.eventos.length})`, fields, '#FF6B6B', '📅')
    };
  }
  
  if (subcommand === 'criar') {
    const nome = args.slice(1, args.length - 1).join(' ');
    const data = args[args.length - 1];
    
    if (!nome || !data) {
      return {
        type: 'embed',
        embed: createEmbed('Criar Evento', [
          { name: '❌ Parâmetros faltando', value: 'Nome e data são obrigatórios' },
          { name: '📝 Uso correto', value: '<code>/evento criar Nome do Evento 2025-12-25</code>' }
        ], '#EF4444', '⚠️')
      };
    }
    
    // Validar data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return {
        type: 'embed',
        embed: createEmbed('Criar Evento', [
          { name: '❌ Data inválida', value: `"${data}" não é uma data válida` },
          { name: '📝 Formato correto', value: '<code>YYYY-MM-DD</code> (ex: 2025-12-25)' }
        ], '#EF4444', '⚠️')
      };
    }
    
    commandsData.eventos.push({ nome, data, criadoEm: new Date() });
    saveCommandsData();
    
    const eventDate = new Date(data);
    const now = new Date();
    const diasFaltam = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      type: 'embed',
      embed: createEmbed('Evento Criado', [
        { name: '📌 Nome', value: nome },
        { name: '📆 Data', value: data },
        { name: '⏳ Faltam', value: `${diasFaltam} dias` }
      ], '#10B981', '✅')
    };
  }
  
  if (subcommand === 'deletar') {
    const nome = args.slice(1).join(' ');
    const idx = commandsData.eventos.findIndex(e => e.nome.toLowerCase() === nome.toLowerCase());
    
    if (idx === -1) {
      return {
        type: 'embed',
        embed: createEmbed('Deletar Evento', [
          { name: '❌ Não encontrado', value: `Evento "${nome}" não existe` },
          { name: '💡 Dica', value: 'Use <code>/evento listar</code> para ver eventos' }
        ], '#EF4444', '⚠️')
      };
    }
    
    const removido = commandsData.eventos.splice(idx, 1)[0];
    saveCommandsData();
    
    return {
      type: 'embed',
      embed: createEmbed('Evento Deletado', [
        { name: '🗑️ Removido', value: removido.nome },
        { name: '📆 Data era', value: removido.data }
      ], '#10B981', '✅')
    };
  }
  
  return {
    type: 'embed',
    embed: createEmbed('Comando Evento', [
      { name: '❌ Subcomando inválido', value: `"${args[0]}" não é válido` },
      { name: '📋 Subcomandos', value: '<code>listar</code> • <code>criar</code> • <code>deletar</code>' }
    ], '#EF4444', '⚠️')
  };
}

// Comando: /contador
function handleContadorCommand(args, socket) {
  const subcommand = args[0]?.toLowerCase();
  
  if (!subcommand || subcommand === 'listar') {
    if (Object.keys(commandsData.contadores).length === 0) {
      return {
        type: 'embed',
        embed: createEmbed('Contadores', [
          { name: '📭 Lista Vazia', value: 'Nenhum contador registrado ainda' },
          { name: '💡 Como criar', value: '<code>/contador criar Nome do Contador</code>' }
        ], '#4ECDC4', '🔢')
      };
    }
    
    const fields = Object.entries(commandsData.contadores).map(([nome, valor]) => ({
      name: nome,
      value: `<span style="color: #4ECDC4; font-size: 20px; font-weight: bold;">${valor}</span>`
    }));
    
    return {
      type: 'embed',
      embed: createEmbed(`Contadores (${Object.keys(commandsData.contadores).length})`, fields, '#4ECDC4', '🔢')
    };
  }
  
  if (subcommand === 'criar') {
    const nome = args.slice(1).join(' ');
    
    if (!nome) {
      return {
        type: 'embed',
        embed: createEmbed('Criar Contador', [
          { name: '❌ Nome obrigatório', value: 'Você precisa dar um nome ao contador' },
          { name: '📝 Uso correto', value: '<code>/contador criar Nome do Contador</code>' }
        ], '#EF4444', '⚠️')
      };
    }
    
    if (commandsData.contadores[nome]) {
      return {
        type: 'embed',
        embed: createEmbed('Criar Contador', [
          { name: '❌ Já existe', value: `Contador "${nome}" já foi criado` },
          { name: '📊 Valor atual', value: `<strong>${commandsData.contadores[nome]}</strong>` }
        ], '#EF4444', '⚠️')
      };
    }
    
    commandsData.contadores[nome] = 0;
    saveCommandsData();
    
    return {
      type: 'embed',
      embed: createEmbed('Contador Criado', [
        { name: '📌 Nome', value: nome },
        { name: '📊 Valor inicial', value: '<strong>0</strong>' }
      ], '#10B981', '✅')
    };
  }
  
  if (subcommand === 'add') {
    const nome = args.slice(1, args.length - 1).join(' ');
    const valor = parseInt(args[args.length - 1]) || 1;
    
    if (!nome) {
      return {
        type: 'embed',
        embed: createEmbed('Adicionar ao Contador', [
          { name: '❌ Nome obrigatório', value: 'Especifique o contador' },
          { name: '📝 Uso correto', value: '<code>/contador add Nome 5</code>' }
        ], '#EF4444', '⚠️')
      };
    }
    
    if (!(nome in commandsData.contadores)) {
      return {
        type: 'embed',
        embed: createEmbed('Adicionar ao Contador', [
          { name: '❌ Não encontrado', value: `Contador "${nome}" não existe` },
          { name: '💡 Dica', value: 'Use <code>/contador criar</code> primeiro' }
        ], '#EF4444', '⚠️')
      };
    }
    
    const valorAnterior = commandsData.contadores[nome];
    commandsData.contadores[nome] += valor;
    saveCommandsData();
    
    return {
      type: 'embed',
      embed: createEmbed('Contador Atualizado', [
        { name: '📌 Contador', value: nome },
        { name: '➕ Adicionado', value: `+${valor}` },
        { name: '📊 Novo valor', value: `<span style="color: #4ECDC4; font-size: 18px; font-weight: bold;">${valorAnterior} → ${commandsData.contadores[nome]}</span>` }
      ], '#10B981', '✅')
    };
  }
  
  if (subcommand === 'sub') {
    const nome = args.slice(1, args.length - 1).join(' ');
    const valor = parseInt(args[args.length - 1]) || 1;
    
    if (!nome) {
      return {
        type: 'embed',
        embed: createEmbed('Subtrair do Contador', [
          { name: '❌ Nome obrigatório', value: 'Especifique o contador' },
          { name: '📝 Uso correto', value: '<code>/contador sub Nome 5</code>' }
        ], '#EF4444', '⚠️')
      };
    }
    
    if (!(nome in commandsData.contadores)) {
      return {
        type: 'embed',
        embed: createEmbed('Subtrair do Contador', [
          { name: '❌ Não encontrado', value: `Contador "${nome}" não existe` },
          { name: '💡 Dica', value: 'Use <code>/contador listar</code> para ver contadores' }
        ], '#EF4444', '⚠️')
      };
    }
    
    const valorAnterior = commandsData.contadores[nome];
    commandsData.contadores[nome] -= valor;
    saveCommandsData();
    
    return {
      type: 'embed',
      embed: createEmbed('Contador Atualizado', [
        { name: '📌 Contador', value: nome },
        { name: '➖ Subtraído', value: `-${valor}` },
        { name: '📊 Novo valor', value: `<span style="color: #4ECDC4; font-size: 18px; font-weight: bold;">${valorAnterior} → ${commandsData.contadores[nome]}</span>` }
      ], '#10B981', '✅')
    };
  }
  
  if (subcommand === 'deletar') {
    const nome = args.slice(1).join(' ');
    
    if (!(nome in commandsData.contadores)) {
      return {
        type: 'embed',
        embed: createEmbed('Deletar Contador', [
          { name: '❌ Não encontrado', value: `Contador "${nome}" não existe` },
          { name: '💡 Dica', value: 'Use <code>/contador listar</code> para ver contadores' }
        ], '#EF4444', '⚠️')
      };
    }
    
    const valorFinal = commandsData.contadores[nome];
    delete commandsData.contadores[nome];
    saveCommandsData();
    
    return {
      type: 'embed',
      embed: createEmbed('Contador Deletado', [
        { name: '🗑️ Removido', value: nome },
        { name: '📊 Valor final era', value: `<strong>${valorFinal}</strong>` }
      ], '#10B981', '✅')
    };
  }
  
  return {
    type: 'embed',
    embed: createEmbed('Comando Contador', [
      { name: '❌ Subcomando inválido', value: `"${args[0]}" não é válido` },
      { name: '📋 Subcomandos', value: '<code>listar</code> • <code>criar</code> • <code>add</code> • <code>sub</code> • <code>deletar</code>' }
    ], '#EF4444', '⚠️')
  };
}

// Comando: /lembrete
function handleLembreteCommand(args, socket) {
  const subcommand = args[0]?.toLowerCase();
  
  if (!subcommand || subcommand === 'listar') {
    if (commandsData.lembretes.length === 0) {
      return {
        type: 'embed',
        embed: createEmbed('Lembretes', [
          { name: '📭 Lista Vazia', value: 'Nenhum lembrete registrado ainda' },
          { name: '💡 Como criar', value: '<code>/lembrete adicionar Texto do lembrete</code>' }
        ], '#FFD93D', '🔔')
      };
    }
    
    const fields = commandsData.lembretes.map((lem, idx) => ({
      name: `#${idx + 1}`,
      value: `📝 ${lem.texto}<br><small style="opacity: 0.6;">Criado: ${new Date(lem.criadoEm).toLocaleString('pt-BR')}</small>`
    }));
    
    return {
      type: 'embed',
      embed: createEmbed(`Lembretes (${commandsData.lembretes.length})`, fields, '#FFD93D', '🔔')
    };
  }
  
  if (subcommand === 'adicionar') {
    const texto = args.slice(1).join(' ');
    
    if (!texto) {
      return {
        type: 'embed',
        embed: createEmbed('Adicionar Lembrete', [
          { name: '❌ Texto obrigatório', value: 'Você precisa escrever o lembrete' },
          { name: '📝 Uso correto', value: '<code>/lembrete adicionar Texto do lembrete</code>' }
        ], '#EF4444', '⚠️')
      };
    }
    
    commandsData.lembretes.push({ texto, criadoEm: new Date() });
    saveCommandsData();
    
    return {
      type: 'embed',
      embed: createEmbed('Lembrete Adicionado', [
        { name: '📝 Texto', value: texto },
        { name: '🕐 Criado em', value: new Date().toLocaleString('pt-BR') }
      ], '#10B981', '✅')
    };
  }
  
  if (subcommand === 'deletar') {
    const idx = parseInt(args[1]) - 1;
    
    if (isNaN(idx) || idx < 0 || idx >= commandsData.lembretes.length) {
      return {
        type: 'embed',
        embed: createEmbed('Deletar Lembrete', [
          { name: '❌ Índice inválido', value: `Use um número de 1 a ${commandsData.lembretes.length}` },
          { name: '💡 Dica', value: 'Use <code>/lembrete listar</code> para ver índices' }
        ], '#EF4444', '⚠️')
      };
    }
    
    const removido = commandsData.lembretes.splice(idx, 1)[0];
    saveCommandsData();
    
    return {
      type: 'embed',
      embed: createEmbed('Lembrete Deletado', [
        { name: '🗑️ Removido', value: removido.texto },
        { name: '📊 Restantes', value: `${commandsData.lembretes.length} lembretes` }
      ], '#10B981', '✅')
    };
  }
  
  return {
    type: 'embed',
    embed: createEmbed('Comando Lembrete', [
      { name: '❌ Subcomando inválido', value: `"${args[0]}" não é válido` },
      { name: '📋 Subcomandos', value: '<code>listar</code> • <code>adicionar</code> • <code>deletar</code>' }
    ], '#EF4444', '⚠️')
  };
}

// Comando: /whatsapp
function handleWhatsappCommand(args, socket) {
  return {
    type: 'embed',
    embed: createEmbed('WhatsApp', [
      { name: '⚠️ Desabilitado', value: 'A integração WhatsApp foi desabilitada' },
      { name: '📋 Motivo', value: 'Problemas de compatibilidade com a biblioteca whatsapp-web.js' },
      { name: '💡 Alternativas', value: 'Considere usar Twilio ou AWS SNS' }
    ], '#6B7280', '📱')
  };
}

// Comando: /ajuda
function handleHelpCommand() {
  const commands = [
    {
      name: '📅 /evento',
      value: `
        <code>/evento listar</code> - Ver eventos<br>
        <code>/evento criar Nome 2025-12-25</code><br>
        <code>/evento deletar Nome</code>
      `.trim()
    },
    {
      name: '🔢 /contador',
      value: `
        <code>/contador listar</code> - Ver contadores<br>
        <code>/contador criar Nome</code><br>
        <code>/contador add Nome 5</code><br>
        <code>/contador sub Nome 3</code><br>
        <code>/contador deletar Nome</code>
      `.trim()
    },
    {
      name: '🔔 /lembrete',
      value: `
        <code>/lembrete listar</code> - Ver lembretes<br>
        <code>/lembrete adicionar Texto</code><br>
        <code>/lembrete deletar 1</code>
      `.trim()
    },
    {
      name: '📱 /whatsapp',
      value: '<span style="opacity: 0.5;">Desabilitado temporariamente</span>'
    }
  ];
  
  return {
    type: 'embed',
    embed: createEmbed('Central de Ajuda', commands, '#667CEA', '📚')
  };
}
// Sistema de alertas de eventos
function startEventAlerts() {
  // Verificar eventos a cada minuto
  setInterval(checkUpcomingEvents, 60000);
}

function checkUpcomingEvents() {
  const now = new Date();
  
  commandsData.eventos.forEach(evt => {
    const eventDate = new Date(evt.data);
    const diasFaltam = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    
    // Alertas em dias específicos
    if (diasFaltam === 0) {
      sendEventAlert(`🎉 Hoje é ${evt.nome}!`);
    } else if (diasFaltam === 1) {
      sendEventAlert(`⏰ ${evt.nome} é amanhã!`);
    } else if (diasFaltam === 7) {
      sendEventAlert(`📅 ${evt.nome} é em uma semana!`);
    }
  });
}

function sendEventAlert(message) {
  // Mostrar em console e notificação
  console.log(`📢 ALERTA DE EVENTO: ${message}`);
  
  if (Notification.permission === 'granted') {
    new Notification('Chat LAN - Alerta de Evento', {
      body: message,
      icon: '📅'
    });
  }
}

// Solicitar permissão de notificação ao carregar
if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Exportar para uso no app.js
if (typeof window !== 'undefined') {
  window.Commands = {
    processCommand,
    createEmbed,
    loadCommandsData,
    saveCommandsData,
    startEventAlerts,
    getAutocompleteSuggestions
  };
}
