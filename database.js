// database.js - SQLite Database Module
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'chat.db');
const db = new Database(DB_PATH);

// Habilitar WAL mode para melhor performance
db.pragma('journal_mode = WAL');

// ===== Criar Tabelas =====
function initializeDatabase() {
    // Tabela de mensagens
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            username TEXT NOT NULL,
            avatar TEXT,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            type TEXT DEFAULT 'public',
            replyToId TEXT,
            replyToUsername TEXT,
            replyToText TEXT,
            edited INTEGER DEFAULT 0,
            createdAt INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);

    // Tabela de contadores (sincronizados)
    db.exec(`
        CREATE TABLE IF NOT EXISTS counters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            value INTEGER DEFAULT 0,
            color TEXT DEFAULT '#667eea',
            createdBy TEXT,
            createdAt INTEGER DEFAULT (strftime('%s', 'now')),
            updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);

    // Tabela de usuários (para persistência futura)
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            avatar TEXT,
            lastSeen INTEGER,
            createdAt INTEGER DEFAULT (strftime('%s', 'now'))
        )
    `);

    // Índices para melhor performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
        CREATE INDEX IF NOT EXISTS idx_messages_userId ON messages(userId);
        CREATE INDEX IF NOT EXISTS idx_counters_name ON counters(name);
    `);

    console.log('✅ Database initialized successfully');
}

// IMPORTANTE: Inicializar tabelas ANTES de criar os prepared statements
initializeDatabase();

// ===== MENSAGENS =====
const messagesStmt = {
    insert: db.prepare(`
        INSERT INTO messages (id, userId, username, avatar, text, timestamp, type, replyToId, replyToUsername, replyToText, edited)
        VALUES (@id, @userId, @username, @avatar, @text, @timestamp, @type, @replyToId, @replyToUsername, @replyToText, @edited)
    `),
    getAll: db.prepare('SELECT * FROM messages ORDER BY timestamp ASC'),
    getLast: db.prepare('SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?'),
    getById: db.prepare('SELECT * FROM messages WHERE id = ?'),
    update: db.prepare(`
        UPDATE messages SET text = @text, edited = 1
        WHERE id = @id
    `),
    delete: db.prepare('DELETE FROM messages WHERE id = ?'),
    deleteAll: db.prepare('DELETE FROM messages'),
    count: db.prepare('SELECT COUNT(*) as count FROM messages')
};

function saveMessage(message) {
    try {
        // Debug: mostrar o que está sendo salvo
        // console.log('Salvando mensagem:', JSON.stringify(message, null, 2));
        
        // Tratar replyTo - pode ser objeto ou null/undefined
        let replyToId = null;
        let replyToUsername = null;
        let replyToText = null;
        
        if (message.replyTo && typeof message.replyTo === 'object') {
            replyToId = message.replyTo.id ? String(message.replyTo.id) : null;
            replyToUsername = message.replyTo.username ? String(message.replyTo.username) : null;
            replyToText = message.replyTo.text ? String(message.replyTo.text) : null;
        }
        
        // Converter timestamp - pode ser Date, string ou número
        let timestamp;
        if (message.timestamp instanceof Date) {
            timestamp = message.timestamp.toISOString();
        } else if (typeof message.timestamp === 'number') {
            timestamp = new Date(message.timestamp).toISOString();
        } else if (message.timestamp) {
            timestamp = String(message.timestamp);
        } else {
            timestamp = new Date().toISOString();
        }
        
        // Garantir que todos os valores são tipos primitivos válidos
        const params = {
            id: String(message.id || Date.now()),
            userId: String(message.userId || ''),
            username: String(message.username || 'Anônimo'),
            avatar: typeof message.avatar === 'string' ? message.avatar : null,
            text: String(message.text || ''),
            timestamp: timestamp,
            type: String(message.type || 'public'),
            replyToId: replyToId,
            replyToUsername: replyToUsername,
            replyToText: replyToText,
            edited: message.edited ? 1 : 0
        };
        
        messagesStmt.insert.run(params);
        return true;
    } catch (error) {
        console.error('Error saving message:', error);
        console.error('Message data:', JSON.stringify(message, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                return `[Object: ${Object.keys(value).join(', ')}]`;
            }
            return value;
        }, 2));
        return false;
    }
}

function getAllMessages() {
    try {
        const rows = messagesStmt.getAll.all();
        return rows.map(row => ({
            id: row.id,
            userId: row.userId,
            username: row.username,
            avatar: row.avatar,
            text: row.text,
            timestamp: row.timestamp,
            type: row.type,
            replyTo: row.replyToId ? {
                id: row.replyToId,
                username: row.replyToUsername,
                text: row.replyToText
            } : null,
            edited: row.edited === 1
        }));
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
}

function getLastMessages(limit = 100) {
    try {
        const rows = messagesStmt.getLast.all(limit);
        return rows.reverse().map(row => ({
            id: row.id,
            userId: row.userId,
            username: row.username,
            avatar: row.avatar,
            text: row.text,
            timestamp: row.timestamp,
            type: row.type,
            replyTo: row.replyToId ? {
                id: row.replyToId,
                username: row.replyToUsername,
                text: row.replyToText
            } : null,
            edited: row.edited === 1
        }));
    } catch (error) {
        console.error('Error getting last messages:', error);
        return [];
    }
}

function updateMessage(id, newText) {
    try {
        messagesStmt.update.run({ id, text: newText });
        return true;
    } catch (error) {
        console.error('Error updating message:', error);
        return false;
    }
}

function deleteMessage(id) {
    try {
        messagesStmt.delete.run(id);
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        return false;
    }
}

function clearAllMessages() {
    try {
        messagesStmt.deleteAll.run();
        return true;
    } catch (error) {
        console.error('Error clearing messages:', error);
        return false;
    }
}

// ===== CONTADORES =====
const countersStmt = {
    insert: db.prepare(`
        INSERT INTO counters (id, name, value, color, createdBy)
        VALUES (@id, @name, @value, @color, @createdBy)
    `),
    getAll: db.prepare('SELECT * FROM counters ORDER BY createdAt ASC'),
    getById: db.prepare('SELECT * FROM counters WHERE id = ?'),
    updateValue: db.prepare(`
        UPDATE counters SET value = @value, updatedAt = strftime('%s', 'now')
        WHERE id = @id
    `),
    updateName: db.prepare(`
        UPDATE counters SET name = @name, updatedAt = strftime('%s', 'now')
        WHERE id = @id
    `),
    delete: db.prepare('DELETE FROM counters WHERE id = ?')
};

function createCounter(counter) {
    try {
        countersStmt.insert.run({
            id: counter.id,
            name: counter.name,
            value: counter.value || 0,
            color: counter.color || '#667eea',
            createdBy: counter.createdBy || null
        });
        return true;
    } catch (error) {
        console.error('Error creating counter:', error);
        return false;
    }
}

function getAllCounters() {
    try {
        const rows = countersStmt.getAll.all();
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            value: row.value,
            color: row.color,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        }));
    } catch (error) {
        console.error('Error getting counters:', error);
        return [];
    }
}

function updateCounterValue(id, newValue) {
    try {
        countersStmt.updateValue.run({ id, value: newValue });
        return true;
    } catch (error) {
        console.error('Error updating counter:', error);
        return false;
    }
}

function updateCounterName(id, newName) {
    try {
        countersStmt.updateName.run({ id, name: newName });
        return true;
    } catch (error) {
        console.error('Error updating counter name:', error);
        return false;
    }
}

function deleteCounter(id) {
    try {
        countersStmt.delete.run(id);
        return true;
    } catch (error) {
        console.error('Error deleting counter:', error);
        return false;
    }
}

function getCounter(id) {
    try {
        return countersStmt.getById.get(id);
    } catch (error) {
        console.error('Error getting counter:', error);
        return null;
    }
}

// ===== Migração de JSON para SQLite =====
function migrateFromJson(jsonMessages) {
    console.log('📦 Starting migration from JSON...');
    const insertMany = db.transaction((messages) => {
        for (const msg of messages) {
            try {
                saveMessage(msg);
            } catch (e) {
                // Ignorar duplicatas
            }
        }
    });
    
    try {
        insertMany(jsonMessages);
        console.log(`✅ Migrated ${jsonMessages.length} messages to SQLite`);
        return true;
    } catch (error) {
        console.error('Migration error:', error);
        return false;
    }
}

// Inicializar
module.exports = {
    db,
    // Messages
    saveMessage,
    getAllMessages,
    getLastMessages,
    updateMessage,
    deleteMessage,
    clearAllMessages,
    // Counters
    createCounter,
    getAllCounters,
    getCounter,
    updateCounterValue,
    updateCounterName,
    deleteCounter,
    // Migration
    migrateFromJson
};
