const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const { Octokit } = require('@octokit/rest');
const jwt = require('jsonwebtoken');

// Database SQLite
const database = require('./database');

// Chave secreta para JWT (em produção, use variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'chat-lan-secret-key-2024';
const JWT_EXPIRES_IN = '24h'; // Token expira em 24 horas

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Arquivo de persistência (mantido para migração)
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads', 'files');
const TEMP_UPLOADS_DIR = path.join(__dirname, 'public', 'uploads', 'temp');

// Flag para usar banco de dados
const USE_DATABASE = true;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentado para chunks de 5MB
app.use(express.urlencoded({ limit: '50mb' }));
// Middleware customizado para servir imagens com o MIME type correto (com suporte a GIFs animados)
app.use('/uploads/images/', (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  const mimeTypes = {
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp'
  };
  if (mimeTypes[ext]) {
    res.type(mimeTypes[ext]);
  }
  next();
});

// Middleware para servir arquivos com headers corretos de download
app.use('/uploads/files/', (req, res, next) => {
  const filename = path.basename(req.path);
  const ext = path.extname(filename).toLowerCase();

  // Usar nome original se fornecido no query param, senão usar nome do servidor
  const originalFilename = req.query.filename || filename;
  const displayFilename = decodeURIComponent(originalFilename);

  // Tipos que devem ser exibidos inline (não downloaded)
  const inlineTypes = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.pdf', '.txt'];

  if (inlineTypes.includes(ext)) {
    // Permitir visualização inline
    res.setHeader('Content-Disposition', `inline; filename="${displayFilename}"`);
  } else {
    // Forçar download para outros tipos com nome original
    res.setHeader('Content-Disposition', `attachment; filename="${displayFilename}"`);
  }

  // Adicionar MIME types corretos para vídeos
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf'
  };

  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }

  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 1 dia
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ===== APIs de Autenticação JWT =====

// Gerar token JWT
function generateToken(userData) {
  return jwt.sign(
    {
      username: userData.username,
      avatar: userData.avatar || null,
      createdAt: Date.now()
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verificar e decodificar token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// POST /api/auth/login - fazer login e receber token
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, avatar } = req.body;

    if (!username || username.length < 2) {
      return res.status(400).json({ error: 'Nome de usuário inválido' });
    }

    const token = generateToken({ username, avatar });

    // console.log(`🔐 Token gerado para ${username}`);

    res.json({
      success: true,
      token,
      user: {
        username,
        avatar: avatar || null
      },
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/verify - verificar token e renovar se válido
app.post('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token não fornecido' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ valid: false, error: 'Token inválido ou expirado' });
    }

    // Renovar token (gerar novo com dados atuais)
    const newToken = generateToken({
      username: decoded.username,
      avatar: decoded.avatar
    });

    // // console.log(`🔄 Token renovado para ${decoded.username}`);

    res.json({
      valid: true,
      token: newToken, // Token renovado
      user: {
        username: decoded.username,
        avatar: decoded.avatar
      },
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ valid: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/update - atualizar dados do usuário (ex: avatar) e gerar novo token
app.post('/api/auth/update', (req, res) => {
  try {
    const { token, username, avatar } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Gerar novo token com dados atualizados
    const newToken = generateToken({
      username: username || decoded.username,
      avatar: avatar !== undefined ? avatar : decoded.avatar
    });

    // // console.log(`📝 Dados atualizados para ${username || decoded.username}`);

    res.json({
      success: true,
      token: newToken,
      user: {
        username: username || decoded.username,
        avatar: avatar !== undefined ? avatar : decoded.avatar
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/clear-database - Limpar todo o banco de dados
app.post('/api/admin/clear-database', (req, res) => {
  try {
    const { token, confirmPhrase } = req.body;

    // Verificar token
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar frase de confirmação
    if (confirmPhrase !== 'LIMPAR TUDO') {
      return res.status(400).json({ error: 'Frase de confirmação incorreta' });
    }

    // Limpar banco de dados
    database.clearAllMessages();

    // Limpar array de mensagens em memória
    messages = [];

    // Notificar todos os clientes
    io.emit('chat:cleared', { by: decoded.username, timestamp: new Date() });

    // // console.log(`🗑️ Banco de dados limpo por ${decoded.username}`);

    res.json({ success: true, message: 'Banco de dados limpo com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar banco:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rastreador de uploads em progresso (sessionId -> { filename, chunks: Set, totalChunks, uploadedBytes })
const uploadSessions = new Map();

// Armazenamento de usuários conectados e mensagens
const users = new Map();
const rooms = new Map();
let messages = [];
const lastMessageBySocket = new Map();

// ===== APIs de Upload com Chunking =====
// POST /api/upload/init - iniciar upload
app.post('/api/upload/init', async (req, res) => {
  try {
    const { filename, totalChunks, filesize, userId, username } = req.body;

    if (!filename || !totalChunks || !filesize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validar tamanho (1GB max)
    const MAX_FILESIZE = 1024 * 1024 * 1024; // 1GB
    if (filesize > MAX_FILESIZE) {
      return res.status(400).json({ error: 'File too large (max 1GB)' });
    }

    // Gerar sessionId único
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Preparar diretórios
    await fs.mkdir(TEMP_UPLOADS_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Registrar sessão
    uploadSessions.set(sessionId, {
      filename: path.basename(filename), // sanitize filename
      chunks: new Set(),
      totalChunks,
      uploadedBytes: 0,
      filesize,
      userId,
      username,
      startTime: Date.now()
    });

    // console.log(`[upload] initialized session ${sessionId} for ${filename} (${totalChunks} chunks, ${filesize} bytes)`);

    res.json({ sessionId });
  } catch (error) {
    console.error('Upload init error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload/chunk - receber chunk
app.post('/api/upload/chunk', async (req, res) => {
  try {
    const { sessionId, chunkIndex } = req.body;

    if (!sessionId || chunkIndex === undefined) {
      return res.status(400).json({ error: 'Missing sessionId or chunkIndex' });
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Obter chunk data (pode vir como buffer ou base64)
    let chunkData = req.body.chunk;
    if (typeof chunkData === 'string') {
      // Assumir base64
      chunkData = Buffer.from(chunkData, 'base64');
    } else if (Buffer.isBuffer(req.body.chunk)) {
      chunkData = req.body.chunk;
    } else {
      return res.status(400).json({ error: 'Invalid chunk data format' });
    }

    // Salvar chunk temporário
    const tempFilePath = path.join(TEMP_UPLOADS_DIR, `${sessionId}_${chunkIndex}`);
    await fs.writeFile(tempFilePath, chunkData);

    session.chunks.add(chunkIndex);
    session.uploadedBytes += chunkData.length;

    const progress = Math.round((session.chunks.size / session.totalChunks) * 100);
    // console.log(`[upload] ${sessionId} chunk ${chunkIndex} received (${progress}% complete)`);

    res.json({
      received: true,
      progress,
      uploadedBytes: session.uploadedBytes,
      totalBytes: session.filesize
    });
  } catch (error) {
    console.error('Upload chunk error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload/complete - finalizar upload
app.post('/api/upload/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const session = uploadSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verificar se todos os chunks foram recebidos
    if (session.chunks.size !== session.totalChunks) {
      return res.status(400).json({
        error: 'Not all chunks received',
        received: session.chunks.size,
        expected: session.totalChunks
      });
    }

    // Juntar chunks na ordem
    const ext = path.extname(session.filename);
    const timestamp = Date.now();
    const finalFilename = `file_${timestamp}${ext}`;
    const finalPath = path.join(UPLOADS_DIR, finalFilename);

    // Stream de escrita
    const writeStream = fsSync.createWriteStream(finalPath);

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(TEMP_UPLOADS_DIR, `${sessionId}_${i}`);
      const data = await fs.readFile(chunkPath);
      writeStream.write(data);
      // Deletar chunk temporário
      await fs.unlink(chunkPath).catch(() => { });
    }

    // IMPORTANTE: Fechar o stream antes de aguardar finish
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Calcular URL final
    const fileUrl = `/uploads/files/${finalFilename}`;
    const uploadTime = Date.now() - session.startTime;

    // console.log(`[upload] ${sessionId} completed: ${finalFilename} (${session.filesize} bytes, ${uploadTime}ms)`);

    // Limpar sessão
    uploadSessions.delete(sessionId);

    res.json({
      success: true,
      filename: session.filename,
      url: fileUrl,
      filesize: session.filesize
    });
  } catch (error) {
    console.error('Upload complete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Funções de persistência
async function loadMessages() {
  if (USE_DATABASE) {
    try {
      messages = database.getAllMessages();
      console.log(`🗄️ ${messages.length} mensagens carregadas do SQLite`);
    } catch (e) {
      console.error('Erro ao carregar do SQLite:', e);
      messages = [];
    }
  } else {
    // Fallback para arquivo JSON
    try {
      const data = await fs.readFile(MESSAGES_FILE, 'utf8');
      messages = JSON.parse(data);
    } catch (e) {
      messages = [];
    }
  }
}

async function saveMessages() {
  if (USE_DATABASE) return;

  try {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar mensagens:', error);
  }
}

// Verificar se usuário é admin
function isAdmin(username) {
  return username.toLowerCase() === 'admin';
}

// Carregar mensagens ao iniciar
loadMessages();

// ===== WhatsApp Integration - DISABLED =====
// Desabilitado devido a problemas com whatsapp-web.js e puppeteer
// A biblioteca tenta manter uma sessão Chromium aberta que causa erros de fechamento
// Se precisar de WhatsApp, considere usar uma API alternativa como:
// - Twilio SendGrid
// - AWS SNS
// - Outras APIs WhatsApp Business
// let whatsapp = null;
// let whatsappReady = false;
// let lastQrCode = null;
// let whatsappInitializing = false;

// Configuração do Socket.io
io.on('connection', (socket) => {
  // console.log('Novo usuário conectado:', socket.id);

  // Evento: Usuário faz login
  socket.on('user:login', (payload) => {
    // payload can be a string (username) or object { username, avatar }
    const username = typeof payload === 'string' ? payload : (payload && payload.username) || 'Usuário';
    const avatar = (payload && payload.avatar) || null;
    const userIsAdmin = isAdmin(username);

    const already = users.has(socket.id);

    // Armazena/atualiza informações do usuário
    users.set(socket.id, {
      id: socket.id,
      username: username,
      avatar: avatar,
      isAdmin: userIsAdmin,
      joinedAt: new Date()
    });

    // Envia lista de usuários online para o novo usuário
    socket.emit('users:list', Array.from(users.values()));

    // Envia histórico de mensagens ao novo usuário (filtrado para privacidade)
    const filteredHistory = messages.filter(msg => {
      if (msg.type === 'public') return true;
      return msg.username === username || msg.recipientId === username;
    });
    socket.emit('messages:history', filteredHistory);

    // Envia status de admin
    socket.emit('user:admin-status', { isAdmin: userIsAdmin });

    if (!already) {
      // Notifica todos sobre o novo usuário (apenas na primeira vez que faz login neste socket)
      io.emit('user:joined', {
        id: socket.id,
        username: username,
        avatar: avatar,
        isAdmin: userIsAdmin,
        timestamp: new Date()
      });

      // console.log(`Usuário ${username} entrou no chat${userIsAdmin ? ' (ADMIN)' : ''}`);
    } else {
      // Atualização de dados (avatar/nome) — notificar apenas a lista atualizada
      io.emit('users:list', Array.from(users.values()));
      // console.log(`Usuário ${username} (socket ${socket.id}) atualizou dados`);
    }
  });

  // Evento: Enviar mensagem para todos
  socket.on('message:send', async (data) => {
    const user = users.get(socket.id);

    if (user) {
      // Handle IMAGE:base64 payload specially to avoid storing huge base64 in messages array
      try {
        const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB limit server-side
        if (typeof data.text === 'string' && data.text.startsWith('IMAGE:')) {
          const payload = data.text.split('IMAGE:')[1] || '';
          // compute approximate bytes
          const payloadOnly = payload.replace(/\s+/g, '');
          const padding = (payloadOnly.endsWith('==') ? 2 : (payloadOnly.endsWith('=') ? 1 : 0));
          const approximateBytes = Math.floor((payloadOnly.length * 3) / 4) - padding;
          if (approximateBytes > MAX_IMAGE_BYTES) {
            socket.emit('server:error', { message: 'IMAGE_TOO_LARGE', maxBytes: MAX_IMAGE_BYTES });
            console.warn(`Rejected image from ${user.username} (${socket.id}) size=${approximateBytes}`);
            return;
          }

          // Save image to disk, preserving the MIME type (including GIF)
          const base64data = payloadOnly.split(',').pop();
          const buffer = Buffer.from(base64data, 'base64');
          // Extract MIME type from data URI (e.g., image/gif, image/png, image/jpeg)
          const mimeMatch = payload.match(/data:image\/(\w+)/);
          const ext = mimeMatch ? mimeMatch[1] : 'png';
          const filename = `img_${Date.now()}_${socket.id}.${ext}`;
          const uploadsDir = path.join(__dirname, 'public', 'uploads', 'images');
          await fs.mkdir(uploadsDir, { recursive: true });
          const destPath = path.join(uploadsDir, filename);
          await fs.writeFile(destPath, buffer);

          // Replace message text with a lightweight URL reference
          data.text = `IMAGE_URL:/uploads/images/${filename}`;
          // console.log(`Saved image from ${user.username} as ${filename} (${buffer.length} bytes)`);
        }
      } catch (err) {
        console.error('Error saving image:', err);
        // If image write fails, return error to client
        socket.emit('server:error', { message: 'IMAGE_SAVE_ERROR', error: err.message });
        return;
      }
      // Server-side dedupe: compute a short key for message content and skip duplicates
      try {
        const text = data.text || '';
        // For images starting with IMAGE: base64... strip header
        const payload = text.startsWith('IMAGE:') ? text.split('IMAGE:')[1] : text;
        const key = `${payload.length}:${payload.slice(0, 32)}:${payload.slice(-32)}`;
        const last = lastMessageBySocket.get(socket.id);
        const now = Date.now();
        if (last && last.key === key && (now - last.time) < 2000) {
          // console.log(`Skipping duplicate message from ${user.username} (${socket.id})`);
          return; // skip duplicate
        }
        lastMessageBySocket.set(socket.id, { key, time: now });
      } catch (err) {
        // ignore dedupe errors
      }
      const message = {
        id: Date.now(),
        userId: socket.id,
        username: user.username,
        avatar: user.avatar || null,
        text: data.text,
        timestamp: new Date(),
        type: 'public',
        replyTo: data.replyTo || null, // Suporte a resposta
        edited: false // Inicializa como não editada
      };

      // Log de resposta se houver
      if (data.replyTo) {
        // console.log(`↩️ ${user.username} respondendo a ${data.replyTo.username} (ID: ${data.replyTo.id})`);
      }

      // Adiciona à lista de mensagens em memória
      messages.push(message);

      // Salvar no banco de dados SQLite
      if (USE_DATABASE) {
        database.saveMessage(message);
      }

      // Salva no arquivo (se não usar banco)
      saveMessages();

      // Broadcast da mensagem para todos
      io.emit('message:received', message);
      // Debug log: show first 40 chars to help detect duplicate receives
      if (message.text && message.text.startsWith('IMAGE:')) {
        // console.log(`IMAGE message received from ${user.username} (${socket.id}) size=${message.text.length}`);
      } else {
        // console.log(`message received from ${user.username} (${socket.id}): ${message.text ? message.text.substr(0, 40) : ''}`);
      }
      // console.log(`Mensagem de ${user.username}: ${data.text}`);
    }
  });

  // Evento: Editar mensagem
  socket.on('message:edit', (data) => {
    const user = users.get(socket.id);

    if (user) {
      const { messageId, newText } = data;

      // Encontrar a mensagem
      const message = messages.find(m => m.id === messageId);

      if (message && message.username === user.username) {
        // Apenas o autor pode editar
        message.text = newText;
        message.edited = true;
        message.editedAt = new Date();

        // Salvar no banco de dados SQLite
        if (USE_DATABASE) {
          database.updateMessage(messageId, newText);
        }

        // Salvar e notificar
        saveMessages();

        io.emit('message:edited', {
          messageId: messageId,
          newText: newText,
          editedAt: message.editedAt
        });

        // console.log(`✏️ Mensagem ${messageId} editada por ${user.username}`);
      } else {
        socket.emit('server:error', { message: 'Você só pode editar suas próprias mensagens' });
      }
    }
  });

  // Evento: Limpar chat (apenas admin)
  socket.on('chat:clear', () => {
    const user = users.get(socket.id);

    if (user && user.isAdmin) {
      // Limpa todas as mensagens
      messages = [];

      // Limpar no banco de dados SQLite
      if (USE_DATABASE) {
        database.clearAllMessages();
      }

      // Salva arquivo vazio
      saveMessages();

      // Notifica todos que o chat foi limpo
      io.emit('chat:cleared', {
        by: user.username,
        timestamp: new Date()
      });

      // console.log(`💥 Chat limpo por ${user.username}`);
    } else {
      socket.emit('server:error', { message: 'Apenas administradores podem limpar o chat' });
    }
  });

  // Evento: Deletar mensagem
  socket.on('message:delete', (data) => {
    const user = users.get(socket.id);
    const { messageId } = data;

    if (user) {
      const messageIndex = messages.findIndex(m => m.id === messageId);

      if (messageIndex === -1) return; // Mensagem não encontrada

      const message = messages[messageIndex];

      // Verificar permissão (Admin ou Dono da mensagem)
      if (user.isAdmin || message.username === user.username) {
        // Remover da memória
        messages.splice(messageIndex, 1);

        // Remover do banco de dados SQLite
        if (USE_DATABASE) {
          database.deleteMessage(messageId);
        }

        // Salvar arquivo
        saveMessages();

        // Notificar clientes
        io.emit('message:deleted', { messageId });

        // console.log(`🗑️ Mensagem ${messageId} deletada por ${user.username}`);
      } else {
        socket.emit('server:error', { message: 'Sem permissão para deletar esta mensagem' });
      }
    }
  });

  // Evento: Enviar mensagem privada
  socket.on('message:private', (data) => {
    const sender = users.get(socket.id);

    if (sender) {
      // data.recipientId no frontend agora é o username
      const recipientUsername = data.recipientId;

      const message = {
        id: Date.now(),
        userId: socket.id,
        username: sender.username,
        avatar: sender.avatar,
        text: data.text,
        timestamp: new Date(),
        type: 'private',
        recipientId: recipientUsername,
        senderId: socket.id
      };

      // Envia para o destinatário (todos os seus sockets)
      for (const [sId, u] of users.entries()) {
        if (u.username === recipientUsername) {
          io.to(sId).emit('message:received', message);
        }
      }

      // Envia de volta para o remetente (todos os seus sockets)
      for (const [sId, u] of users.entries()) {
        if (u.username === sender.username) {
          io.to(sId).emit('message:received', message);
        }
      }

      // Adiciona à lista de mensagens em memória para persistência
      messages.push(message);

      // Salvar no banco de dados SQLite
      if (USE_DATABASE) {
        database.saveMessage(message);
      }

      // Salva no arquivo (se não usar banco)
      saveMessages();
    }
  });

  // Evento: Usuário está digitando
  socket.on('user:typing', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user:typing', {
        userId: socket.id,
        username: user.username
      });
    }
  });

  // Evento: Usuário parou de digitar
  socket.on('user:stop-typing', () => {
    socket.broadcast.emit('user:stop-typing', {
      userId: socket.id
    });
  });

  // ===== CONTADORES SINCRONIZADOS =====
  // Obter todos os contadores
  socket.on('counters:get', () => {
    const counters = database.getAllCounters();
    socket.emit('counters:list', counters);
  });

  // Criar novo contador
  socket.on('counter:create', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const counter = {
      id: `counter_${Date.now()}`,
      name: data.name,
      value: data.value || 0,
      color: data.color || '#667eea',
      createdBy: user.username
    };

    if (database.createCounter(counter)) {
      // Broadcast para todos os usuários
      io.emit('counter:created', counter);
      // console.log(`📊 Contador "${counter.name}" criado por ${user.username}`);
    }
  });

  // Atualizar valor do contador
  socket.on('counter:update', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const counter = database.getCounter(data.id);
    if (counter) {
      const newValue = counter.value + data.amount;
      if (database.updateCounterValue(data.id, newValue)) {
        // Broadcast para todos os usuários
        io.emit('counter:updated', {
          id: data.id,
          value: newValue,
          updatedBy: user.username
        });
        // console.log(`📊 Contador "${counter.name}" atualizado por ${user.username}: ${counter.value} → ${newValue}`);
      }
    }
  });

  // Resetar contador
  socket.on('counter:reset', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const counter = database.getCounter(data.id);
    if (counter) {
      if (database.updateCounterValue(data.id, 0)) {
        io.emit('counter:updated', {
          id: data.id,
          value: 0,
          updatedBy: user.username
        });
        // console.log(`📊 Contador "${counter.name}" resetado por ${user.username}`);
      }
    }
  });

  // Renomear contador
  socket.on('counter:rename', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (database.updateCounterName(data.id, data.name)) {
      io.emit('counter:renamed', {
        id: data.id,
        name: data.name,
        updatedBy: user.username
      });
      // console.log(`📊 Contador renomeado para "${data.name}" por ${user.username}`);
    }
  });

  // Deletar contador
  socket.on('counter:delete', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const counter = database.getCounter(data.id);
    if (counter) {
      if (database.deleteCounter(data.id)) {
        io.emit('counter:deleted', { id: data.id });
        // console.log(`📊 Contador "${counter.name}" deletado por ${user.username}`);
      }
    }
  });

  // Evento: Desconexão
  socket.on('disconnect', () => {
    const user = users.get(socket.id);

    if (user) {
      // Remove usuário da lista
      users.delete(socket.id);

      // Notifica todos sobre a saída
      io.emit('user:left', {
        id: socket.id,
        username: user.username,
        timestamp: new Date()
      });

      // console.log(`Usuário ${user.username} saiu do chat`);
    }
  });

  // Evento comentado: WhatsApp reset (WhatsApp está desabilitado)
  // socket.on('whatsapp:reset', async () => {
  //     const user = users.get(socket.id);
  //     if (user && whatsapp) { 
  //         // console.log(`WhatsApp reset solicitado por ${user.username}`);
  //         try {
  //             await whatsapp.destroy();
  //             whatsappReady = false;
  //             lastQrCode = null;
  //             whatsapp.initialize();
  //             io.emit('whatsapp:status', { status: 'resetting' });
  //         } catch (error) {
  //             console.error('Erro ao resetar WhatsApp:', error);
  //         }
  //     }
  //   });
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota de status (útil para verificar se o servidor está rodando)
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    users: users.size,
    messages: messages.length,
    database: USE_DATABASE ? 'SQLite' : 'JSON',
    uptime: process.uptime()
  });
});

// API de Emojis Apple
let emojiData = null;

// Tentar carregar emojis do pacote instalado
try {
  emojiData = require('emoji-datasource-apple/emoji.json');
  console.log(`😀 ${emojiData.length} emojis Apple carregados do pacote npm`);
} catch (e) {
  console.warn('⚠️ emoji-datasource-apple não instalado - emojis serão servidos via fallback no cliente');
  console.log('💡 Para instalar: npm install emoji-datasource-apple');
}

app.get('/api/emojis', (req, res) => {
  if (!emojiData) {
    return res.json({ error: 'Emoji data not available' });
  }

  const category = req.query.category;
  const search = req.query.search?.toLowerCase();
  const limit = parseInt(req.query.limit) || 100;

  let filtered = emojiData.filter(e => e.has_img_apple);

  if (category) {
    filtered = filtered.filter(e => e.category === category);
  }

  if (search) {
    filtered = filtered.filter(e =>
      e.short_name.includes(search) ||
      e.short_names.some(n => n.includes(search)) ||
      (e.name && e.name.toLowerCase().includes(search))
    );
  }

  // Ordenar e limitar
  filtered = filtered
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, limit);

  // Retornar dados simplificados
  const result = filtered.map(e => ({
    unified: e.unified,
    short_name: e.short_name,
    category: e.category,
    char: String.fromCodePoint(...e.unified.split('-').map(u => parseInt(u, 16))),
    sheet_x: e.sheet_x,
    sheet_y: e.sheet_y
  }));

  res.json(result);
});

app.get('/api/emojis/categories', (req, res) => {
  if (!emojiData) {
    return res.json({ error: 'Emoji data not available' });
  }

  const categories = [...new Set(emojiData.filter(e => e.has_img_apple).map(e => e.category))];
  res.json(categories);
});

// Middleware para log de todas as requisições (útil para debug)
app.use((req, res, next) => {
  // console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rota catch-all para retornar JSON em vez de HTML
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    message: 'A rota solicitada não existe'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 6767;
server.listen(PORT, () => {
});

// Global error handlers to prevent unhandled exceptions from taking down the server
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
