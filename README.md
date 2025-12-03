# 💬 Sistema de Chat LAN

Sistema de chat em tempo real para comunicação em rede local (LAN), construído com Node.js, Express e Socket.io.

## 🚀 Características

- ✅ Comunicação em tempo real via WebSocket (Socket.io)
- ✅ Interface moderna com design compacto e intuitivo (tema red/black/gray/white)
- ✅ Lista de usuários online com avatares
- ✅ Indicador de digitação em tempo real
- ✅ Notificações de entrada/saída de usuários
- ✅ Design responsivo para desktop e mobile
- ✅ Suporte a múltiplos usuários simultâneos
- ✅ **Upload de Imagens**: Envie imagens com Ctrl+V ou botão de upload
- ✅ **Visualização de Fotos**: Display inline de imagens com max-width 300px
- ✅ **Upload de Vídeos**: Suporte a mp4, webm, avi, mov, mkv com player inline
- ✅ **Upload de Arquivos**: Envie qualquer tipo de arquivo (documentos, PDFs, zips, etc)
- ✅ **Stickers/Emojis**: Painel de figurinhas com categorias (emoções, reações, animais, objetos)
- ✅ **Avatar Persistente**: Salve seu avatar localmente e exiba em todas as mensagens
- ✅ **Context Menu (Clique Direito)**:
  - Fotos: Copiar, Salvar Imagem, Abrir em Nova Aba
  - Vídeos: Download, Copiar Link, Abrir Vídeo em Nova Aba
  - Arquivos: Download, Copiar Link
  - Texto: Copiar Mensagem
  - Sempre: Copiar Nome do Usuário
- ✅ **GitHub Integration**: Receba notificações de eventos do GitHub (push, PR, issues)
- ✅ **Deduplicação de Mensagens**: Evita envios duplicados (cliente + servidor)
- ✅ **Histórico Persistente**: Mensagens são salvass em JSON
- ✅ **Sem Bloat**: Layout limpo focado em chat, fotos, vídeos, documentos e stickers

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com Node.js)

## 🔧 Instalação

1. **Clone ou navegue até o diretório do projeto**

2. **Instale as dependências:**
```bash
npm install
```

## 🎮 Como Usar

### 1. Iniciar o Servidor

```bash
npm start
```

O servidor iniciará na porta 3000 (ou a porta definida na variável de ambiente PORT).

### 2. Acessar Localmente

Abra seu navegador e acesse:
```
http://localhost:3000
```

### 3. Acessar em LAN (Rede Local)

Para que outros dispositivos na mesma rede possam acessar:

**a) Descubra seu IP local:**

- **Windows:** Abra o PowerShell e digite `ipconfig`
  - Procure por "Endereço IPv4" (geralmente algo como 192.168.1.X)

- **Linux/Mac:** Abra o terminal e digite `ifconfig` ou `ip addr`
  - Procure pelo endereço IP da sua interface de rede

**b) Compartilhe o endereço:**

Outros usuários na mesma rede podem acessar:
```
http://<SEU-IP-LOCAL>:3000
```

Exemplo: `http://192.168.1.100:3000`

### 4. Usar o Chat

1. Digite seu nome de usuário
2. Clique em "Entrar no Chat"
3. Comece a conversar!

### 5. Enviar Conteúdo

**📸 Imagens:**
- Clique no botão 📷 "Enviar imagem"
- Ou use **Ctrl+V** para colar de sua área de transferência
- Clique direito para: salvar, copiar link ou abrir em nova aba

**🎥 Vídeos:**
- Clique no botão 📷 e selecione um vídeo (mp4, webm, avi, mov, mkv)
- Vídeo será exibido inline com player
- Clique direito para: download, copiar link ou abrir em nova aba

**📁 Arquivos/Documentos:**
- Adicione um botão de upload de arquivos (a ser implementado em breve)
- Clique direito para: download ou copiar link

**😊 Stickers/Emojis:**
- Clique no botão 😊 para abrir painel de figurinhas
- Categorias: Emoções, Reações, Animais, Objetos, Minhas Figurinhas
- Selecione para enviar

**👤 Avatar:**
- Clique no botão 📷 ao lado do seu perfil
- Escolha uma imagem para seu avatar
- Será exibido em todas as suas mensagens
- Salvo localmente no navegador

## 📁 Estrutura do Projeto

```
magnetic-armstrong/
├── server.js           # Servidor Node.js com Socket.io
├── package.json        # Configuração do projeto e dependências
├── public/             # Arquivos estáticos
│   ├── index.html      # Interface do usuário
│   ├── styles.css      # Estilos da aplicação
│   └── app.js          # Lógica do cliente
└── README.md           # Este arquivo
```

## 🔒 Segurança em LAN

> **Nota:** Este sistema é projetado para uso em redes locais confiáveis. Para uso em produção ou internet pública, considere adicionar:
> - Autenticação de usuários
> - Criptografia HTTPS/WSS
> - Validação de entrada
> - Rate limiting

## 🚀 Roadmap para Expansão

### Curto Prazo
- [ ] Persistência de mensagens (banco de dados)
- [ ] Histórico de conversas
- [ ] Salas/canais separados
- [ ] Mensagens privadas (DM)
- [ ] Emojis e reações

### Médio Prazo
- [ ] Autenticação de usuários (JWT)
- [ ] Upload de arquivos/imagens
- [ ] Notificações desktop
- [ ] Modo claro/escuro
- [ ] Busca de mensagens

### Longo Prazo
- [ ] Chamadas de voz/vídeo (WebRTC)
- [ ] Criptografia end-to-end
- [ ] Aplicativo mobile (React Native)
- [ ] Integração com APIs externas
- [ ] Sistema de permissões/roles

## 🛠️ Tecnologias Utilizadas

- **Backend:**
  - Node.js
  - Express.js
  - Socket.io (WebSocket)
  - CORS

- **Frontend:**
  - HTML5
  - CSS3 (Glassmorphism, Gradientes)
  - JavaScript (Vanilla)
  - Socket.io Client

## 📝 API de Eventos Socket.io

### Cliente → Servidor

| Evento | Dados | Descrição |
|--------|-------|-----------|
| `user:login` | `username` | Usuário faz login |
| `message:send` | `{ text }` | Enviar mensagem pública |
| `message:private` | `{ recipientId, text }` | Enviar mensagem privada |
| `user:typing` | - | Notificar que está digitando |
| `user:stop-typing` | - | Notificar que parou de digitar |

### Servidor → Cliente

| Evento | Dados | Descrição |
|--------|-------|-----------|
| `users:list` | `[users]` | Lista de usuários online |
| `user:joined` | `{ id, username, timestamp }` | Novo usuário entrou |
| `user:left` | `{ id, username, timestamp }` | Usuário saiu |
| `message:received` | `{ id, userId, username, text, timestamp, type }` | Nova mensagem |
| `user:typing` | `{ userId, username }` | Usuário está digitando |
| `user:stop-typing` | `{ userId }` | Usuário parou de digitar |

## 🐛 Troubleshooting

### Porta já em uso
Se a porta 3000 já estiver em uso, você pode mudar definindo a variável de ambiente:
```bash
# Windows PowerShell
$env:PORT=3001; npm start

# Linux/Mac
PORT=3001 npm start
```

### Não consigo conectar de outro dispositivo
1. Verifique se ambos os dispositivos estão na mesma rede
2. Verifique se o firewall não está bloqueando a porta
3. Confirme que está usando o IP correto

### Mensagens não aparecem
1. Verifique o console do navegador (F12) para erros
2. Confirme que o servidor está rodando
3. Recarregue a página

## 📄 Licença

MIT

## 👨‍💻 Desenvolvimento

Para contribuir ou modificar o projeto:

1. Faça suas alterações
2. Teste localmente
3. Reinicie o servidor para ver as mudanças no backend
4. Recarregue a página para ver mudanças no frontend

---

**Desenvolvido com ❤️ para comunicação em equipe**
