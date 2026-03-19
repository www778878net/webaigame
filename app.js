/**
 * AGENT ERA - 前端展示层
 * 所有业务逻辑通过API调用，前端只负责展示
 */

class AgentEra {
    constructor() {
        this.state = null;
        this.syncInterval = null;
        
        this.init();
    }

    get api() {
        return window.GameAPI;
    }

    get config() {
        return window.GameConfig;
    }

    async init() {
        await this.loadInitialState();
        this.bindEvents();
        this.startSyncLoop();
        this.addLog('System', '前端初始化完成，已连接到API服务', 'success');
    }

    async loadInitialState() {
        try {
            const result = await this.api.getGodNpcs();
            console.log('API result:', result);
            if (result.success) {
                const data = result.data;
                console.log('events data:', data.events);
                this.state = {
                    round: 1,
                    countdown: 300,
                    points: data.lord?.points || 0,
                    coins: data.lord?.coins || 0,
                    agentCount: data.npcs?.length || 0,
                    lord: data.lord || null,
                    npcs: data.npcs || [],
                    events: data.events || [],
                    logs: []
                };
                window._gameState = this.state;
                this.renderGodView();
            }
        } catch (error) {
            console.error('loadInitialState error:', error);
            this.state = {
                round: 1,
                countdown: 300,
                points: 0,
                coins: 0,
                agentCount: 0,
                lord: null,
                npcs: [],
                events: [],
                logs: []
            };
            window._gameState = this.state;
            this.renderGodView();
        }
    }

    renderGodView() {
        if (!this.state || !this.state.lord) return;
        
        document.getElementById('world-time').textContent = `创世神`;
        document.getElementById('points').textContent = this.state.lord.points?.toLocaleString() || '0';
        document.getElementById('coins').textContent = this.state.lord.coins?.toLocaleString() || '0';
        document.getElementById('agent-count').textContent = this.state.npcs?.length || 0;
        
        this.renderState();
        
        const npcList = document.getElementById('npc-list');
        npcList.innerHTML = '';
        
        if (this.state.npcs && this.state.npcs.length > 0) {
            this.state.npcs.forEach(npc => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card new';
                eventCard.innerHTML = `
                    <div class="event-time">Lv.${npc.lv}</div>
                    <div class="event-icon-wrapper info">
                        <span class="event-icon">👤</span>
                    </div>
                    <div class="event-content">
                        <div class="event-title">${npc.uname}</div>
                        <div class="event-desc">${npc.job} | 武力:${npc.wuli} 智力:${npc.zhili} 体力:${npc.tili}</div>
                    </div>
                `;
                
                eventCard.addEventListener('click', () => this.showNpcDetail(npc));
                npcList.appendChild(eventCard);
            });
        }
        
        this.renderEvents();
    }

    renderEvents() {
        const eventList = document.getElementById('event-list');
        if (!eventList) return;
        
        eventList.innerHTML = '';
        
        if (this.state.events && this.state.events.length > 0) {
            const npcMap = {};
            if (this.state.npcs) {
                this.state.npcs.forEach(npc => {
                    npcMap[npc.id] = npc;
                });
            }
            
            this.state.events.forEach(event => {
                const npc = npcMap[event.npc_id];
                const npcName = npc ? npc.uname : `NPC-${event.npc_id?.slice(-4) || '?'}`;
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card new';
                eventCard.dataset.round = event.round;
                eventCard.dataset.npcId = event.npc_id || '';
                
                const hasAiInfo = event.thinking || event.reason;
                
                eventCard.innerHTML = `
                    <div class="event-main">
                        <div class="event-time">${event.time || `回合${event.round}`}</div>
                        <div class="event-icon-wrapper info">
                            <span class="event-icon">🤖</span>
                        </div>
                        <div class="event-content">
                            <div class="event-title">${npcName} 的行动</div>
                            <div class="event-desc">${event.action || ''}</div>
                        </div>
                        ${hasAiInfo ? '<div class="event-expand-icon">▼</div>' : ''}
                    </div>
                    <div class="event-ai-detail" style="display: none;">
                        ${event.thinking ? `
                            <div class="ai-section">
                                <div class="ai-label">🧠 AI思考过程：</div>
                                <div class="ai-content">${event.thinking}</div>
                            </div>
                        ` : ''}
                        ${event.reason ? `
                            <div class="ai-section">
                                <div class="ai-label">💡 选择理由：</div>
                                <div class="ai-content">${event.reason}</div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                if (hasAiInfo) {
                    eventCard.addEventListener('click', () => {
                        const detail = eventCard.querySelector('.event-ai-detail');
                        const icon = eventCard.querySelector('.event-expand-icon');
                        if (detail.style.display === 'none') {
                            detail.style.display = 'block';
                            icon.textContent = '▲';
                            eventCard.classList.add('expanded');
                        } else {
                            detail.style.display = 'none';
                            icon.textContent = '▼';
                            eventCard.classList.remove('expanded');
                        }
                    });
                }
                
                eventList.appendChild(eventCard);
            });
        }
    }

    showNpcDetail(npc) {
        document.getElementById('npc-detail-name').textContent = npc.uname;
        document.getElementById('npc-detail-lv').textContent = npc.lv;
        document.getElementById('npc-detail-job').textContent = npc.job;
        document.getElementById('npc-detail-wuli').textContent = npc.wuli;
        document.getElementById('npc-detail-zhili').textContent = npc.zhili;
        document.getElementById('npc-detail-zhengzhi').textContent = npc.zhengzhi;
        document.getElementById('npc-detail-meili').textContent = npc.meili;
        document.getElementById('npc-detail-tili').textContent = npc.tili;
        
        const maxAttr = 100;
        document.getElementById('npc-detail-wuli-bar').style.width = `${(npc.wuli / maxAttr) * 100}%`;
        document.getElementById('npc-detail-zhili-bar').style.width = `${(npc.zhili / maxAttr) * 100}%`;
        document.getElementById('npc-detail-zhengzhi-bar').style.width = `${(npc.zhengzhi / maxAttr) * 100}%`;
        document.getElementById('npc-detail-meili-bar').style.width = `${(npc.meili / maxAttr) * 100}%`;
        document.getElementById('npc-detail-tili-bar').style.width = `${(npc.tili / maxAttr) * 100}%`;
        
        this.switchView({ target: { closest: (sel) => sel.querySelector('[data-view="npc-detail"]') } });
        this.addLog('UI', `查看NPC ${npc.uname} 的详细属性`, 'info');
    }

    bindEvents() {
        document.querySelectorAll('.menu-btn').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchView(e));
        });

        document.getElementById('btn-signin').addEventListener('click', (e) => {
            e.stopPropagation();
            this.signIn();
        });
        document.getElementById('btn-game-intro').addEventListener('click', (e) => this.switchView(e));
        document.getElementById('btn-buy-service').addEventListener('click', (e) => this.switchView(e));
        document.getElementById('btn-provide-service').addEventListener('click', (e) => this.switchView(e));

        document.getElementById('log-query').addEventListener('click', () => this.queryLogs());
        document.getElementById('clear-log').addEventListener('click', () => this.clearLogs());
    }

    startSyncLoop() {
        this.syncInterval = setInterval(async () => {
            this.api._tick();
            await this.syncState();
        }, this.config.SYNC_INTERVAL);
    }

    async syncState() {
        try {
            const result = await this.api.getSync();
            if (result.success) {
                this.state.round = result.data.round;
                this.state.countdown = result.data.countdown;
                this.state.points = result.data.points;
                this.state.coins = result.data.coins;
                this.renderState();
            }
        } catch (error) {
            console.error('syncState error:', error);
        }
    }

    renderState() {
        if (!this.state) return;
        
        const minutes = Math.floor(this.state.countdown / 60);
        const seconds = this.state.countdown % 60;
        
        document.getElementById('world-time').textContent = `第 ${this.state.round} 轮`;
        document.getElementById('world-subtime').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('points').textContent = this.state.points?.toLocaleString() || '0';
        document.getElementById('coins').textContent = this.state.coins?.toLocaleString() || '0';
        document.getElementById('agent-count').textContent = this.state.agentCount || 0;
        
        if (this.state.lord) {
            const lord = this.state.lord;
            const expNeeded = lord.exp_needed || lord.expNeeded || 10000;
            document.getElementById('lord-level').textContent = lord.level;
            document.getElementById('lord-exp-text').textContent = 
                `${lord.exp?.toLocaleString() || 0} / ${expNeeded.toLocaleString()}`;
            const expPercent = ((lord.exp || 0) / expNeeded) * 100;
            document.getElementById('lord-exp-fill').style.width = `${expPercent}%`;
            document.getElementById('hero-bonus').textContent = `+${lord.hero_bonus || lord.heroBonus || 0}%`;
            document.getElementById('quest-bonus').textContent = `+${lord.quest_bonus || lord.questBonus || 0}%`;
            document.getElementById('resource-bonus').textContent = `+${lord.resource_bonus || lord.resourceBonus || 0}%`;
        }
        
        const systemLogView = document.getElementById('view-system-log');
        if (systemLogView && systemLogView.classList.contains('active')) {
            this.renderSystemLogView();
        }
    }

    switchView(e) {
        const btn = e.target.closest('[data-view]');
        if (!btn) return;
        
        const view = btn.dataset.view;
        
        document.querySelectorAll('.menu-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.quick-btn').forEach(quickBtn => {
            quickBtn.classList.remove('primary');
        });
        
        if (btn.classList.contains('menu-btn')) {
            btn.classList.add('active');
        } else if (btn.classList.contains('quick-btn')) {
            btn.classList.add('primary');
        }
        
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetContent = document.getElementById(`view-${view}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        this.addLog('UI', `切换到 ${btn.textContent.trim()} 视图`, 'info');
    }

    async signIn() {
        this.addLog('Player', '执行每日签到...', 'info');
        
        const result = await this.api.signIn();
        
        if (result.success) {
            this.addLog('Player', `签到成功！获得 ${result.data.points} 积分，${result.data.coins} 金币`, 'success');
            await this.syncState();
            this.switchToOverview();
        }
    }

    switchToOverview() {
        document.querySelectorAll('.menu-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.quick-btn').forEach(quickBtn => {
            quickBtn.classList.remove('primary');
        });
        
        const overviewBtn = document.querySelector('.menu-btn[data-view="overview"]');
        if (overviewBtn) {
            overviewBtn.classList.add('active');
        }
        
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetContent = document.getElementById('view-overview');
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }

    async queryLogs() {
        this.addLog('UI', '切换到系统日志视图', 'info');
        
        document.querySelectorAll('.menu-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.quick-btn').forEach(quickBtn => {
            quickBtn.classList.remove('primary');
        });
        
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetContent = document.getElementById('view-system-log');
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        this.renderSystemLogView();
    }

    renderSystemLogView() {
        const logView = document.getElementById('system-log-view');
        if (!logView) return;
        
        const logs = window._gameState?.logs || [];
        logView.innerHTML = '';
        
        logs.slice(0, 50).forEach(log => {
            const logEl = document.createElement('div');
            logEl.className = `log-entry ${log.type}`;
            logEl.innerHTML = `
                <div class="log-time">${log.time}</div>
                <div class="log-source">${log.source}</div>
                <div class="log-message">${log.message}</div>
            `;
            logView.appendChild(logEl);
        });
    }

    addLog(source, message, type = 'info') {
        this.api._addLog(source, message, type);
        this.renderSystemLogView();
    }

    async clearLogs() {
        const result = await this.api.clearLogs();
        
        if (result.success) {
            this.addLog('System', result.data.message, 'info');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new AgentEra();
});
