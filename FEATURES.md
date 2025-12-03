# 🎯 Features do Chat LAN - Guia Completo

## 📱 Interface Principal

```
┌─────────────────────────────────────────────────────────┐
│         💬 Chat LAN - Usuários Online              [⊕] │
├─────────────────────┬─────────────────────────────────┤
│ Usuários:           │  Chat Geral          ● Conectado│
│ • João (👤)         │  ┌───────────────────────────────┤
│ • Maria (👤)        │  │ João: Oi pessoal!             │
│ • Pedro (👤)        │  │ Maria: E aí? 😊                │
│ • (Você) Seu Avatar │  │ Pedro: [Imagem 300x300]       │
│                     │  │ João: Olha esse vídeo 🎥      │
│ 👤 Você            │  ├───────────────────────────────┤
│ [⬆] [📷] [⬇]       │  │ [😊] [📷] [📁] [texto...] [→] │
│                     │  └───────────────────────────────┘
└─────────────────────┴─────────────────────────────────┘
```

## 🎮 Controles Principais

### Barra de Entrada
| Botão | Nome | Função |
|-------|------|--------|
| 😊 | Sticker | Abre painel de emojis/figurinhas |
| 📷 | Imagem | Seleciona imagem do computador |
| 📁 | Arquivo | Seleciona qualquer arquivo |
| ✏️ | Texto | Digite sua mensagem aqui |
| → | Enviar | Envia a mensagem (Enter também funciona) |

### Atalhos de Teclado
```
Ctrl+V              → Colar imagem da área de transferência
Enter               → Enviar mensagem
Shift+Enter         → Quebra de linha (quando implementado)
```

### Avatar e Perfil
```
[👤] Seu Nome Online
 ↓
[Clique para alterar avatar]
 ↓
[📷] Botão para selecionar nova imagem
 ↓
[Avatar salvo localmente no navegador]
```

## 📸 Enviando Imagens

### Método 1: Botão de Upload
1. Clique no botão 📷 (Enviar Imagem)
2. Selecione uma imagem do computador
3. Aguarde o processamento (até 5MB)
4. Imagem aparece inline no chat

### Método 2: Atalho de Teclado (Recomendado)
1. Copie uma imagem para área de transferência (Ctrl+C)
2. Pressione **Ctrl+V** no chat
3. Imagem é enviada automaticamente

### Tipos Suportados
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif, animado)
- ✅ WebP (.webp)

### Tamanho Máximo
- **Base64**: 5MB (para não travar servidor)
- **Disco**: Unlimited (salvo em `/public/uploads/images/`)

## 🎥 Enviando Vídeos

### Como Enviar
1. Clique no botão 📁 (Enviar Arquivo)
2. Selecione um arquivo de vídeo
3. Aguarde upload (em chunks de 5MB)
4. Vídeo aparece com player inline

### Tipos Suportados
- ✅ MP4 (.mp4)
- ✅ WebM (.webm)
- ✅ AVI (.avi)
- ✅ MOV (.mov, Apple QuickTime)
- ✅ MKV (.mkv)

### Controles do Player
```
[▶ ⏸ ⏱ 🔊 ⛶]
 ↓
Play/Pause, Tempo, Volume, Fullscreen
```

### Tamanho Máximo
- **Total**: 1GB por arquivo
- **Upload**: Em chunks automáticos de 5MB
- **Armazenamento**: `/public/uploads/files/`

## 📄 Enviando Documentos

### Como Enviar
1. Clique no botão 📁 (Enviar Arquivo)
2. Selecione um documento qualquer
3. Arquivo é enviado e renderizado com ícone

### Tipos com Ícones Customizados
```
📄 PDF, Documents (doc, docx, txt, md)
📊 Spreadsheets (xls, xlsx, csv)
🎬 Presentations (ppt, pptx)
🗜️ Archives (zip, rar, 7z)
⚙️ Executables (exe, msi)
🎵 Audio (mp3, wav, flac)
🎥 Video (mp4, webm, avi, mov, mkv)
🖼️ Images (jpg, jpeg, png, gif)
📎 Outros (qualquer extensão)
```

### Context Menu para Documentos
```
[Clique Direito]
    ↓
⬇️ Download
🔗 Copiar Link
```

## 😊 Enviando Stickers/Emojis

### Como Usar
1. Clique no botão 😊 (Figurinhas)
2. Painel abre com abas de categorias
3. Selecione uma figurinha
4. Clique para enviar

### Categorias Disponíveis
```
😊 Emoções  → 😀😃😄😁😆😅🤣😂😈😇
👍 Reações  → 👍❤️🔥💯✨🎉🙌👏🙏💪
🐶 Animais  → 🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯
⚽ Objetos  → ⚽🏀🏈⚾🎾🏐🏉🥏🎳⛳
⭐ Minhas   → (Salvas localmente)
```

### Busca de Emoji
- Digite na caixa "🔍 Buscar emoji..."
- Busca funciona por descrição em inglês
- Ex: "smile", "fire", "party"

## 🖱️ Context Menu (Clique Direito)

### Em Imagens
```
[Clique Direito em Imagem]
    ↓
💾 Salvar Imagem      → Download para computador
📋 Copiar Link        → Copia URL para area de transferencia
🖼️ Abrir em Nova Aba → Abre em browser aba nova
👤 Copiar Nome Usuário → Copia nome de quem enviou
```

### Em Vídeos
```
[Clique Direito em Vídeo]
    ↓
⬇️ Download          → Download do arquivo .mp4
🔗 Copiar Link       → Copia URL para copiar
🎥 Abrir em Nova Aba → Reproduz em aba nova
👤 Copiar Nome Usuário → Copia nome de quem enviou
```

### Em Documentos/Arquivos
```
[Clique Direito em Arquivo]
    ↓
⬇️ Download        → Faz download do arquivo
🔗 Copiar Link    → Copia URL completa
👤 Copiar Nome    → Copia nome de quem enviou
```

### Em Mensagens de Texto
```
[Clique Direito em Texto]
    ↓
📋 Copiar Mensagem    → Copia texto da mensagem
👤 Copiar Nome Usuário → Copia nome de quem enviou
```

## 👥 Gerenciamento de Usuários

### Conectar
1. Digite seu nome de usuário
2. Clique "Entrar no Chat"
3. Seu avatar/inicial aparece na lista
4. Outros usuários verão você como "Online"

### Listar Usuários Online
```
Sidebar Esquerdo
├─ Usuários Online [5]
├─ João (👤)  ● Online
├─ Maria (👤) ● Online
├─ Pedro      ● Online
├─ Ana (👤)   ● Online
└─ [Você]     ● Online
    ├─ 👤 [Clique para alterar avatar]
    ├─ [Seu Nome]
    └─ [Sair do Chat]
```

### Avatar Persistente
- Seu avatar é **salvo no navegador** (localStorage)
- Próximas vezes que entrar, avatar está lá
- Cada usuário tem seu próprio avatar
- Avatar aparece em TODAS as suas mensagens

### Notificações
```
✅ João entrou no chat
❌ Maria saiu do chat
👤 Pedro está digitando...
```

## 🎨 Tema Visual

### Paleta de Cores
```
Primário:    Red (#ef4444 a #990000) - Gradiente
Fundo:       Black (#0b0b0b)
Texto:       Gray/White
Bordas:      Gray semi-transparente
Hover:       Red com transparência
```

### Dark Mode (Padrão)
- ✅ Implementado por padrão
- Reduz fadiga visual
- Melhor para ambientes com pouca luz
- Cores contrastantes

## 📊 Tipos de Mensagens

```
┌─ Mensagem de Texto
│  João: Olá pessoal!
│
├─ Mensagem com Imagem
│  Maria: Olha essa foto!
│  [Imagem renderizada inline 300x300]
│
├─ Mensagem com Vídeo
│  Pedro: Assista esse vídeo
│  [Player HTML5 integrado]
│
├─ Mensagem com Arquivo
│  Ana: Documento importante
│  📄 documento.pdf (2.5 MB) [⬇️]
│
├─ Mensagem com Sticker
│  Você: 😊😂🎉
│
└─ Mensagem do Sistema
   João entrou no chat (14:32)
```

## ⚙️ Configurações

### GitHub Integration (Opcional)
1. Clique no botão "Addons" 🧩
2. Configure GitHub:
   - Owner: seu usuário/organização
   - Repo: nome do repositório
   - Token: (opcional, para repos privados)
3. Webhook URL fornecido para GitHub Settings
4. Receba notificações de eventos em tempo real

### Salvar Avatar
1. Clique no botão 📷 ao lado do seu perfil
2. Selecione uma imagem
3. Avatar é salvo automaticamente
4. Mantém mesmo após fechar navegador

## 🔍 Busca de Mensagens (Futuro)

Será implementado em versão futura:
- Buscar por palavra-chave
- Filtrar por tipo (imagem, vídeo, arquivo, sticker)
- Filtrar por usuário
- Timeline de mensagens

## 🚀 Dicas de Performance

### Para Melhor Experiência
1. Use navegador moderno (Chrome, Firefox, Edge)
2. Conexão de rede estável
3. RAM: 2GB mínimo
4. Imagens: Comprima antes para < 5MB
5. Vídeos: Considere converter para MP4 H.264

### Otimizações Automáticas
- ✅ Deduplicação de mensagens (cliente + servidor)
- ✅ Imagens salvas em disco (não em memória)
- ✅ Upload de arquivos em chunks
- ✅ Compressão automática de base64
- ✅ Limpeza de conexões mortas

## ❓ Troubleshooting

### Imagem não aparece
- Verifique tamanho (máx 5MB)
- Tente recarregar página
- Confirme conexão com servidor

### Vídeo não reproduz
- Navegador suporta HTML5 video?
- Formato é MP4/WebM?
- Arquivo está completo no upload?

### Upload muito lento
- Teste velocidade de rede
- Reduza tamanho do arquivo
- Recarregue página e tente novamente

### Avatar não salva
- Limpe cache do navegador
- Verifique localStorage habilitado
- Tente outro navegador

---

**Version**: 2.0
**Last Updated**: 2024
**Status**: ✅ Funcional e Testado
