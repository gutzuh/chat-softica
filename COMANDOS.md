# 📚 Sistema de Comandos do Chat LAN

## 🎯 Como Usar

Digite `/` seguido do comando para executar. O chat irá sugerir comandos automaticamente!

---

## 📅 Sistema de Eventos (`/evento`)

### Listar eventos
```
/evento
/evento listar
```
Mostra todos os eventos registrados com contagem de dias.

### Criar evento
```
/evento criar <nome> <data>
```
- **Nome**: Nome do evento
- **Data**: Formato YYYY-MM-DD (ex: 2025-12-25)

**Exemplo:**
```
/evento criar Natal 2025-12-25
/evento criar Aniversário da Maria 2025-05-15
/evento criar Reunião 2025-12-10
```

### Deletar evento
```
/evento deletar <nome>
```

**Exemplo:**
```
/evento deletar Natal
```

### Recursos
- ✅ Alertas automáticos (hoje, amanhã, em 1 semana)
- ✅ Conta regressiva em dias
- ✅ Notificações do navegador
- ✅ Embed visual colorido

---

## 🔢 Contadores (`/contador`)

### Listar contadores
```
/contador
/contador listar
```
Mostra todos os contadores e seus valores.

### Criar contador
```
/contador criar <nome>
```
Inicia com valor 0.

**Exemplo:**
```
/contador criar Mensagens
/contador criar Café bebido
```

### Aumentar contador
```
/contador add <nome> [valor]
```
- **valor**: Opcional (padrão: 1)

**Exemplo:**
```
/contador add Mensagens
/contador add Café bebido 2
```

### Diminuir contador
```
/contador sub <nome> [valor]
```

**Exemplo:**
```
/contador sub Mensagens 5
```

### Deletar contador
```
/contador deletar <nome>
```

---

## 🔔 Lembretes (`/lembrete`)

### Listar lembretes
```
/lembrete
/lembrete listar
```

### Adicionar lembrete
```
/lembrete adicionar <texto>
```

**Exemplo:**
```
/lembrete adicionar Estudar JavaScript
/lembrete adicionar Ligar para a mãe
```

### Deletar lembrete
```
/lembrete deletar <número>
```

Use `/lembrete listar` para ver os números.

---

## 📱 WhatsApp (`/whatsapp`)

### Ver status
```
/whatsapp
/whatsapp status
```
Mostra status da integração WhatsApp.

### Mostrar QR Code
```
/whatsapp qr
```
Exibe o código QR para escanear com WhatsApp.

---

## ❓ Ajuda

```
/ajuda
/help
```
Mostra todos os comandos disponíveis.

---

## 💾 Armazenamento

Todos os dados são salvos automaticamente em:
- **localStorage** do navegador
- **messages.json** do servidor (para backup)

Seus dados persistem mesmo após fechar o navegador!

---

## 🎨 Embeds Visuais

Cada comando retorna um embed colorido tipo Discord:

```
┌─────────────────────────────┐
│ 📅 Eventos Registrados      │
│                             │
│ 📅 Natal                    │
│ Data: 2025-12-25            │
│ Faltam: 23 dias             │
└─────────────────────────────┘
```

---

## 🤖 Sugestões Automáticas

Ao digitar `/`, aparecerá um painel com sugestões de comandos:
- Clique em uma sugestão para preenchê-la
- Ou continue digitando para filtrar

---

## 📝 Exemplos Práticos

### Rastrear projeto
```
/evento criar Deadline do Projeto 2025-01-15
/contador criar Tasks concluídas
/contador add Tasks concluídas 5
/lembrete adicionar Fazer code review
```

### Planejamento pessoal
```
/evento criar Viagem 2025-03-20
/evento criar Aniversário 2025-06-10
/contador criar Livros lidos
/lembrete adicionar Estudar para prova
```

### Trabalho em equipe
```
/evento criar Sprint 1 2025-12-10
/contador criar Bugs reportados
/contador criar Issues fechadas
/lembrete adicionar Atualizar documentação
```

---

## 🔐 Dados Locais

Os dados ficam salvos no seu navegador e sincronizados com o servidor.
Ninguém mais pode editar seus eventos, contadores ou lembretes!

---

## ⚡ Dicas

1. **Use nomes descritivos** para contadores e eventos
2. **Datas no formato correto** (YYYY-MM-DD)
3. **Lembretes** funcionam melhor para coisas rápidas
4. **Eventos** são para datas importantes com alertas

---

Desenvolvido com ❤️ para tornar seu chat mais útil!
