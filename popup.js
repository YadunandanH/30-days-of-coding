// Storage utilities
class Storage {
    static async get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] || []);
            });
        });
    }

    static async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    }
}

// Todo management
class TodoManager {
    constructor() {
        this.todos = [];
        this.init();
    }

    async init() {
        this.todos = await Storage.get('todos');
        this.render();
        this.bindEvents();
    }

    async addTodo(text, priority = 'medium') {
        const todo = {
            id: Date.now(),
            text: text.trim(),
            priority,
            completed: false,
            archived: false,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(todo);
        await this.save();
        this.render();
        pomodoroManager.updateTodoList();
    }

    async toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            await this.save();
            this.render();
            pomodoroManager.updateTodoList();
        }
    }

    async editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText.trim();
            await this.save();
            this.render();
            pomodoroManager.updateTodoList();
        }
    }

    async deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        await this.save();
        this.render();
        pomodoroManager.updateTodoList();
    }

    async archiveTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.archived = !todo.archived;
            await this.save();
            this.render();
            pomodoroManager.updateTodoList();
        }
    }

    async save() {
        await Storage.set('todos', this.todos);
    }

    getFilteredTodos() {
        const filter = document.getElementById('filterSelect').value;
        let filtered = this.todos;

        switch (filter) {
            case 'high':
            case 'medium':
            case 'low':
                filtered = this.todos.filter(t => t.priority === filter && !t.archived);
                break;
            case 'archived':
                filtered = this.todos.filter(t => t.archived);
                break;
            default:
                filtered = this.todos.filter(t => !t.archived);
        }

        return filtered;
    }

    sortTodos() {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        this.todos.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed - b.completed;
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        this.save();
        this.render();
    }

    render() {
        const todosList = document.getElementById('todosList');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todosList.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">No todos found</div>';
            return;
        }

        todosList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.priority} ${todo.completed ? 'completed' : ''} ${todo.archived ? 'archived' : ''}">
                <div class="todo-header">
                    <span class="todo-text">${todo.text}</span>
                    <span class="todo-priority ${todo.priority}">${todo.priority.toUpperCase()}</span>
                </div>
                <div class="todo-actions">
                    ${!todo.archived ? `<button class="complete-btn" onclick="todoManager.toggleComplete(${todo.id})">
                        ${todo.completed ? 'Undo' : 'Complete'}
                    </button>` : ''}
                    <button class="edit-btn" onclick="todoManager.promptEdit(${todo.id})">Edit</button>
                    <button class="delete-btn" onclick="todoManager.deleteTodo(${todo.id})">Delete</button>
                    <button class="archive-btn" onclick="todoManager.archiveTodo(${todo.id})">
                        ${todo.archived ? 'Unarchive' : 'Archive'}
                    </button>
                    ${!todo.completed && !todo.archived ? `<button class="pomodoro-btn" onclick="pomodoroManager.selectTodo(${todo.id})">Pomodoro</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    promptEdit(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const newText = prompt('Edit todo:', todo.text);
            if (newText && newText.trim()) {
                this.editTodo(id, newText);
            }
        }
    }

    bindEvents() {
        document.getElementById('addTodoBtn').addEventListener('click', () => {
            const input = document.getElementById('todoInput');
            const priority = document.getElementById('prioritySelect').value;
            
            if (input.value.trim()) {
                this.addTodo(input.value, priority);
                input.value = '';
            }
        });

        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addTodoBtn').click();
            }
        });

        document.getElementById('filterSelect').addEventListener('change', () => {
            this.render();
        });

        document.getElementById('sortBtn').addEventListener('click', () => {
            this.sortTodos();
        });
    }
}

// Pomodoro Timer
class PomodoroManager {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.isBreak = false;
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.workDuration = 25 * 60;
        this.breakDuration = 5 * 60;
        this.interval = null;
        this.selectedTodoId = null;
        this.init();
    }

    init() {
        this.updateDisplay();
        this.bindEvents();
        this.updateTodoList();
    }

    selectTodo(todoId) {
        this.selectedTodoId = todoId;
        const todo = todoManager.todos.find(t => t.id === todoId);
        if (todo) {
            document.getElementById('currentTask').textContent = `Selected: ${todo.text}`;
            // Switch to Pomodoro tab
            showTab('pomodoro');
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.interval = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    this.complete();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            clearInterval(this.interval);
            this.isRunning = false;
        } else if (this.isPaused) {
            this.isPaused = false;
            this.start();
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.interval);
        this.timeLeft = this.isBreak ? this.breakDuration : this.workDuration;
        this.updateDisplay();
    }

    complete() {
        this.isRunning = false;
        clearInterval(this.interval);
        
        if (this.isBreak) {
            // Break completed, back to work
            this.isBreak = false;
            this.timeLeft = this.workDuration;
            this.showNotification('Break completed! Time to work.');
        } else {
            // Work session completed, start break
            this.isBreak = true;
            this.timeLeft = this.breakDuration;
            this.showNotification('Work session completed! Take a break.');
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerDisplay').textContent = display;
        
        // Update current task display
        if (this.selectedTodoId) {
            const todo = todoManager.todos.find(t => t.id === this.selectedTodoId);
            if (todo) {
                document.getElementById('currentTask').textContent = 
                    `${this.isBreak ? 'Break' : 'Working on'}: ${todo.text}`;
            }
        } else {
            document.getElementById('currentTask').textContent = 
                this.isBreak ? 'Break time' : 'No task selected';
        }
    }

    updateTodoList() {
        const pomodoroTodos = document.getElementById('pomodoroTodos');
        const activeTodos = todoManager.todos.filter(t => !t.completed && !t.archived);
        
        if (activeTodos.length === 0) {
            pomodoroTodos.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">No active todos</div>';
            return;
        }

        pomodoroTodos.innerHTML = activeTodos.map(todo => `
            <div class="pomodoro-todo-item ${this.selectedTodoId === todo.id ? 'selected' : ''}" 
                 onclick="pomodoroManager.selectTodo(${todo.id})">
                <span class="todo-priority ${todo.priority}">${todo.priority.charAt(0).toUpperCase()}</span>
                ${todo.text}
            </div>
        `).join('');
    }

    showNotification(message) {
        if (Notification.permission === 'granted') {
            new Notification('Productivity Hub', { body: message });
        }
    }

    bindEvents() {
        document.getElementById('startTimer').addEventListener('click', () => this.start());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pause());
        document.getElementById('resetTimer').addEventListener('click', () => this.reset());
        
        document.getElementById('workDuration').addEventListener('change', (e) => {
            this.workDuration = parseInt(e.target.value) * 60;
            if (!this.isBreak && !this.isRunning) {
                this.timeLeft = this.workDuration;
                this.updateDisplay();
            }
        });
        
        document.getElementById('breakDuration').addEventListener('change', (e) => {
            this.breakDuration = parseInt(e.target.value) * 60;
            if (this.isBreak && !this.isRunning) {
                this.timeLeft = this.breakDuration;
                this.updateDisplay();
            }
        });

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Clipboard Manager
class ClipboardManager {
    constructor() {
        this.clipboardItems = [];
        this.init();
    }

    async init() {
        this.clipboardItems = await Storage.get('clipboard');
        this.render();
        this.bindEvents();
    }

    async addClipboardItem(content, url, title) {
        const item = {
            id: Date.now(),
            content: content.trim(),
            url: url || '',
            title: title || '',
            timestamp: new Date().toISOString()
        };
        
        // Avoid duplicates
        const exists = this.clipboardItems.some(existing => 
            existing.content === item.content && existing.url === item.url
        );
        
        if (!exists) {
            this.clipboardItems.unshift(item); // Add to beginning
            // Keep only last 100 items
            this.clipboardItems = this.clipboardItems.slice(0, 100);
            await this.save();
            this.render();
        }
    }

    async editClipboardItem(id, newContent) {
        const item = this.clipboardItems.find(i => i.id === id);
        if (item) {
            item.content = newContent.trim();
            await this.save();
            this.render();
        }
    }

    async deleteClipboardItem(id) {
        this.clipboardItems = this.clipboardItems.filter(i => i.id !== id);
        await this.save();
        this.render();
    }

    async clearAll() {
        if (confirm('Are you sure you want to clear all clipboard items?')) {
            this.clipboardItems = [];
            await this.save();
            this.render();
        }
    }

    async save() {
        await Storage.set('clipboard', this.clipboardItems);
    }

    copyToClipboard(content) {
        navigator.clipboard.writeText(content).then(() => {
            // Show temporary feedback
            const feedback = document.createElement('div');
            feedback.textContent = 'Copied to clipboard!';
            feedback.style.cssText = `
                position: fixed; top: 10px; right: 10px; background: #28a745; 
                color: white; padding: 8px 12px; border-radius: 4px; 
                font-size: 12px; z-index: 1000;
            `;
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 2000);
        });
    }

    getFilteredItems() {
        const searchTerm = document.getElementById('clipboardSearch').value.toLowerCase();
        return this.clipboardItems.filter(item => 
            item.content.toLowerCase().includes(searchTerm) ||
            item.url.toLowerCase().includes(searchTerm) ||
            item.title.toLowerCase().includes(searchTerm)
        );
    }

    render() {
        const clipboardList = document.getElementById('clipboardList');
        const filteredItems = this.getFilteredItems();

        if (filteredItems.length === 0) {
            clipboardList.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">No clipboard items found</div>';
            return;
        }

        clipboardList.innerHTML = filteredItems.map(item => `
            <div class="clipboard-item">
                <div class="clipboard-content">${this.escapeHtml(item.content)}</div>
                ${item.url ? `<a href="${item.url}" target="_blank" class="clipboard-url">${item.url}</a>` : ''}
                <div class="clipboard-meta">
                    <span>Copied: ${new Date(item.timestamp).toLocaleString()}</span>
                    ${item.title ? `<span>Title: ${this.escapeHtml(item.title)}</span>` : ''}
                </div>
                <div class="clipboard-actions">
                    <button class="copy-btn" onclick="clipboardManager.copyToClipboard(\`${this.escapeBackticks(item.content)}\`)">Copy</button>
                    <button class="edit-clipboard-btn" onclick="clipboardManager.promptEdit(${item.id})">Edit</button>
                    <button class="delete-clipboard-btn" onclick="clipboardManager.deleteClipboardItem(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeBackticks(text) {
        return text.replace(/`/g, '\\`');
    }

    promptEdit(id) {
        const item = this.clipboardItems.find(i => i.id === id);
        if (item) {
            const newContent = prompt('Edit clipboard content:', item.content);
            if (newContent !== null && newContent.trim()) {
                this.editClipboardItem(id, newContent);
            }
        }
    }

    bindEvents() {
        document.getElementById('clearClipboard').addEventListener('click', () => {
            this.clearAll();
        });

        document.getElementById('clipboardSearch').addEventListener('input', () => {
            this.render();
        });
    }
}

// Tab Management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to selected tab button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    window.todoManager = new TodoManager();
    window.pomodoroManager = new PomodoroManager();
    window.clipboardManager = new ClipboardManager();
    
    // Bind tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab);
        });
    });
    
    // Load clipboard data from background script
    chrome.runtime.sendMessage({ action: 'getClipboardData' }, (response) => {
        if (response && response.items) {
            response.items.forEach(item => {
                clipboardManager.addClipboardItem(item.content, item.url, item.title);
            });
        }
    });
});