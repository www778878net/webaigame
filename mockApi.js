/**
 * API 层 - 游戏数据接口
 */

const CONFIG = {
    API_BASE_URL: window.GAME_API_URL || 'http://127.0.0.1:3781',
    SYNC_INTERVAL: 10000,
    ROUND_DURATION: 300
};

const GameAPI = {

    _createUpInfo() {
        let sid = localStorage.getItem('game_sid');
        if (!sid) {
            sid = 'GUEST888-8888-8888-8888-GUEST88GUEST';
            localStorage.setItem('game_sid', sid);
        }
        return {
            sid: sid
        };
    },

    async post(apiPath, body = {}) {
        try {
            const url = `${CONFIG.API_BASE_URL}${apiPath}`;
            const upInfo = { ...this._createUpInfo(), ...body };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(upInfo)
            });
            return await response.json();
        } catch (error) {
            console.error('API post error:', error);
            return { res: -1, errmsg: error.message };
        }
    },

    async getGameState() {
        const result = await this.post('/apigame/mock/game_state/GetInit', {});
        if (result.res === 0 && result.back) {
            const data = JSON.parse(result.back);
            if (data.success) {
                return { success: true, data: data.data };
            }
        }
        return { success: false, error: result.errmsg };
    },

    async getSync() {
        try {
            // 暂时返回默认数据，避免调用不存在的API
            return {
                success: true,
                data: {
                    round: 1,
                    countdown: 300,
                    points: 0,
                    coins: 0,
                    agent_count: 1
                }
            };
        } catch (error) {
            console.error('getSync error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    async signIn() {
        const result = await this.post('/apigame/mock/game_state/SignIn', {});
        if (result.res === 0 && result.back) {
            const data = JSON.parse(result.back);
            if (data.success) {
                return { success: true, data: data.data };
            }
        }
        return { success: false, error: result.errmsg };
    },

    async buyService() {
        return { success: true, data: { coins: 50 } };
    },

    async provideService() {
        return { success: true, data: { coins: 30 } };
    },

    async getLogs(limit = 20) {
        return { success: true, data: { logs: window._gameState?.logs || [] } };
    },

    async clearLogs() {
        if (window._gameState) {
            window._gameState.logs = [];
        }
        return { success: true, data: { message: '日志已清空' } };
    },

    _addLog(source, message, type = 'info') {
        if (!window._gameState) return;
        const now = new Date();
        const log = {
            time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
            source, message, type
        };
        window._gameState.logs.unshift(log);
        if (window._gameState.logs.length > 50) window._gameState.logs.pop();
    },

    _tick() {
        if (window._gameState && window._gameState.countdown > 0) {
            window._gameState.countdown--;
        }
    },

    async getInit() {
        const result = await this.post('/apigame/aigame/init/Get', {});
        // 检查后端返回的标准格式
        if (result.res === 0 && result.back) {
            return { 
                success: true, 
                data: result.back
            };
        }
        return { success: false, error: result.errmsg || 'API调用失败' };
    },

    async getGodNpcs() {
        const result = await this.getInit();
        if (result.success) {
            return { 
                success: true, 
                data: result.data
            };
        }
        return { success: false, error: result.error };
    },
};

window._gameState = {
    round: 1,
    countdown: CONFIG.ROUND_DURATION,
    points: 0,
    coins: 0,
    agentCount: 0,
    lord: null,
    agents: [],
    logs: []
};

window.GameAPI = GameAPI;
window.GameConfig = CONFIG;
