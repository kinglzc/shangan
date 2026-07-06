// ============================================================
// 评分数据 — 来自 Excel「评分标准」工作表
// ============================================================

const OBJECTIVE_DIMS = [
    {
        key: 'school_level',
        label: '本科院校层次',
        weight: 2,
        options: [
            { label: 'Top5', score: 5 },
            { label: '985', score: 3 },
            { label: '211', score: 2 },
            { label: '双非', score: 1 },
            { label: '专升本', score: 0 },
        ]
    },
    {
        key: 'cet6',
        label: '六级分数',
        weight: 2,
        options: [
            { label: '600+', score: 6 },
            { label: '550+', score: 5 },
            { label: '500+', score: 4 },
            { label: '通过', score: 2 },
            { label: '未通过', score: 0 },
        ]
    },
    {
        key: 'ranking',
        label: '本科排名百分比',
        weight: 2,
        options: [
            { label: '前15%', score: 4 },
            { label: '前30%', score: 3 },
            { label: '前50%', score: 2 },
            { label: '50%开外', score: 1 },
        ]
    },
    {
        key: 'research',
        label: '科研经历',
        weight: 3,
        options: [
            { label: 'SCI一作', score: 6 },
            { label: '国创负责人/竞赛国家级奖项', score: 4 },
            { label: '校创负责人', score: 2 },
            { label: '无', score: 1 },
        ]
    },
    {
        key: 'target_type',
        label: '目标类型',
        weight: 5,
        options: [
            { label: '专硕', score: 2 },
            { label: '学硕', score: 5 },
        ]
    },
    {
        key: 'target_dept',
        label: '目标科室',
        weight: 5,
        options: [
            { label: '修复(学硕)/黏膜/预防/病理/基础/影像/医技', score: 5 },
            { label: '口内/口外/正畸/修复(专硕)', score: 2 },
        ]
    },
    {
        key: 'mentality',
        label: '心态稳定性',
        weight: 3,
        options: [
            { label: '易焦虑，遇到挫折很难恢复', score: 1 },
            { label: '心态一般', score: 3 },
            { label: '心态稳定', score: 6 },
        ]
    },
    {
        key: 'environment',
        label: '外部环境支持',
        weight: 3,
        options: [
            { label: '二战脱产考研，爸妈支持', score: 3 },
            { label: '一战，在学校，实习轻松', score: 5 },
            { label: '一战，但实习很严', score: 2 },
            { label: '已工作，白天上班', score: 0 },
        ]
    },
];

const SUBJECTIVE_DIMS = [
    {
        key: 'review_start',
        label: '复习开始时间',
        weight: 0.2,
        maxScore: 11,
        options: [
            { label: '2月', score: 11 },
            { label: '4月', score: 9 },
            { label: '5月', score: 7 },
            { label: '6月', score: 5 },
            { label: '7月及以后', score: 3 },
        ]
    },
    {
        key: 'review_progress',
        label: '复习进度',
        weight: 0.2,
        maxScore: 10,
        options: [
            { label: '已过二轮，模拟题可答出80%', score: 10 },
            { label: '已过一轮，熟悉所有真题', score: 7 },
            { label: '看过几本北医书', score: 4 },
            { label: '看的人卫书', score: 3 },
            { label: '还没开始', score: 1 },
        ]
    },
    {
        key: 'daily_time',
        label: '每日可用时间',
        weight: 0.3,
        maxScore: 9,
        options: [
            { label: '10小时+', score: 9 },
            { label: '8小时', score: 7 },
            { label: '6小时', score: 5 },
            { label: '4小时', score: 3 },
            { label: '实习忙，没啥时间', score: 1 },
        ]
    },
    {
        key: 'efficiency',
        label: '效率',
        weight: 0.3,
        maxScore: 6,
        options: [
            { label: '高效(每小时能背三道大题)', score: 6 },
            { label: '一般(知识不进脑子)', score: 3 },
            { label: '糟糕(看不懂/想玩手机)', score: 1 },
        ]
    },
];

const OBJ_MAX = 131;

// 检测是否有后端 API（本地开发环境有，部署后无）
const API_BASE = (() => {
    try {
        // 尝试同源 /api/，如果存在则用后端模式
        return window.location.origin + '/api';
    } catch {
        return null;
    }
})();

let _hasBackend = null; // null=未检测, true/false=已检测

async function detectBackend() {
    if (_hasBackend !== null) return _hasBackend;
    try {
        const resp = await fetch(API_BASE + '/stats', { method: 'GET', signal: AbortSignal.timeout(3000) });
        _hasBackend = resp.ok;
    } catch {
        _hasBackend = false;
    }
    return _hasBackend;
}

// ============================================================
// 状态
// ============================================================

const selections = {
    objective: {},
    subjective: {},
};

let _lastPrompt = ''; // 保存最后一次 AI 提示词，供离线复制用

// ============================================================
// 构建表单
// ============================================================

function buildObjectiveForm() {
    const container = document.getElementById('objective-form');
    OBJECTIVE_DIMS.forEach(dim => {
        const item = document.createElement('div');
        item.className = 'form-item unselected';
        item.innerHTML = `
            <label>${dim.label}</label>
            <select data-type="objective" data-key="${dim.key}">
                <option value="">请选择</option>
                ${dim.options.map((opt, i) => `<option value="${i}">${opt.label}</option>`).join('')}
            </select>
        `;
        container.appendChild(item);
    });
}

function buildSubjectiveForm() {
    const container = document.getElementById('subjective-form');
    SUBJECTIVE_DIMS.forEach(dim => {
        const item = document.createElement('div');
        item.className = 'form-item unselected';
        item.innerHTML = `
            <label>${dim.label}</label>
            <select data-type="subjective" data-key="${dim.key}">
                <option value="">请选择</option>
                ${dim.options.map((opt, i) => `<option value="${i}">${opt.label}</option>`).join('')}
            </select>
        `;
        container.appendChild(item);
    });
}

// ============================================================
// 计算逻辑
// ============================================================

function calculateObjective() {
    let score = 0;
    OBJECTIVE_DIMS.forEach(dim => {
        const sel = selections.objective[dim.key];
        if (sel) score += dim.weight * sel.score;
    });
    return {
        score,
        normalized: score / OBJ_MAX,
        contribution: (score / OBJ_MAX) * 0.5,
    };
}

function calculateSubjective() {
    let exponent = 0;
    let allFilled = true;
    SUBJECTIVE_DIMS.forEach(dim => {
        const sel = selections.subjective[dim.key];
        if (sel) {
            const ratio = sel.score / dim.maxScore;
            if (ratio > 0) {
                exponent += dim.weight * Math.log(ratio);
            } else {
                exponent = -Infinity;
            }
        } else {
            allFilled = false;
        }
    });
    if (!allFilled) return { geometric: null, contribution: 0, ready: false };
    const geometric = Math.exp(exponent);
    return { geometric, contribution: geometric * 0.5, ready: true };
}

function checkAllFilled() {
    const objFilled = OBJECTIVE_DIMS.every(d => selections.objective[d.key]);
    const subFilled = SUBJECTIVE_DIMS.every(d => selections.subjective[d.key]);
    return objFilled && subFilled;
}

// ============================================================
// 生成按钮 — 计算 + 显示概率 + 自动请求 AI 建议
// ============================================================

async function generate() {
    if (!checkAllFilled()) return;

    const obj = calculateObjective();
    const sub = calculateSubjective();
    const probability = obj.contribution + sub.contribution;
    const pct = probability * 100;

    // --- 显示结果 ---
    const resultSection = document.getElementById('result-section');
    const aiSection = document.getElementById('ai-section');
    resultSection.style.display = 'block';
    aiSection.style.display = 'block';

    // 仪表盘
    const gaugeFill = document.getElementById('gauge-fill');
    const gaugeText = document.getElementById('gauge-text');
    const resultStatus = document.getElementById('result-status');
    gaugeText.textContent = pct.toFixed(1) + '%';

    const circumference = 534;
    gaugeFill.style.strokeDashoffset = circumference * (1 - probability);

    gaugeFill.classList.remove('red', 'yellow', 'green');
    resultStatus.classList.remove('red', 'yellow', 'green');

    if (pct < 30) {
        gaugeFill.classList.add('red');
        resultStatus.classList.add('red');
        resultStatus.textContent = '🔴 风险较高，需要认真评估策略';
    } else if (pct < 60) {
        gaugeFill.classList.add('yellow');
        resultStatus.classList.add('yellow');
        resultStatus.textContent = '🟡 有一定希望，继续努力提升空间';
    } else {
        gaugeFill.classList.add('green');
        resultStatus.classList.add('green');
        resultStatus.textContent = '🟢 概率较好，保持状态冲刺';
    }

    // 滚动到结果
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // --- 保存数据 ---
    saveData(probability, obj, sub);

    // --- 自动请求 AI 建议 ---
    await requestAIAdvice(probability, obj, sub);
}

// ============================================================
// 数据保存 — 优先后端，回退 localStorage
// ============================================================

function saveData(probability, obj, sub) {
    const payload = {
        selections: {},
        scores: {
            objective_score: obj.score,
            objective_normalized: obj.normalized,
            objective_contribution: obj.contribution,
            subjective_geometric: sub.geometric,
            subjective_contribution: sub.contribution,
            final_probability: probability,
        }
    };
    OBJECTIVE_DIMS.forEach(dim => {
        const sel = selections.objective[dim.key];
        payload.selections[dim.key] = sel ? sel.label : null;
    });
    SUBJECTIVE_DIMS.forEach(dim => {
        const sel = selections.subjective[dim.key];
        payload.selections[dim.key] = sel ? sel.label : null;
    });

    // 尝试后端 API
    if (API_BASE) {
        fetch(API_BASE + '/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }).catch(() => {
            // 后端不可用 → 存 localStorage
            saveToLocal(payload);
        });
    } else {
        saveToLocal(payload);
    }
}

function saveToLocal(payload) {
    try {
        const key = 'kaoyan_records';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push({ ...payload, timestamp: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
        console.warn('localStorage 保存失败:', e);
    }
}

// ============================================================
// AI 建议 — 优先后端 API，回退"复制提示词+打开DeepSeek"
// ============================================================

function buildAIPrompt(probability, obj, sub) {
    const pct = (probability * 100).toFixed(1);
    const lines = [];

    lines.push('你是一位经验丰富的考研规划顾问，请根据以下考生的评估数据给出针对性建议。');
    lines.push('');
    lines.push('## 评估结果');
    lines.push(`- 最终上岸概率：${pct}%`);
    lines.push('');
    lines.push('## 考生具体情况');
    lines.push('');
    lines.push('### 客观条件');
    OBJECTIVE_DIMS.forEach(dim => {
        const sel = selections.objective[dim.key];
        lines.push(`- ${dim.label}：${sel ? sel.label : '未填'}`);
    });

    lines.push('');
    lines.push('### 主观能动性');
    SUBJECTIVE_DIMS.forEach(dim => {
        const sel = selections.subjective[dim.key];
        lines.push(`- ${dim.label}：${sel ? sel.label : '未填'}`);
    });

    lines.push('');
    lines.push('## 请给出以下内容：');
    lines.push('1. **整体评价**：对当前上岸概率的简要分析');
    lines.push('2. **优势分析**：指出考生的有利因素');
    lines.push('3. **短板诊断**：找出最需要改进的维度');
    lines.push('4. **具体建议**：针对短板给出 3-5 条可操作的改进建议');
    lines.push('5. **备考策略**：基于当前情况给出下一阶段的备考策略');
    lines.push('');
    lines.push('请用中文回答，语言简洁有力，每条建议要具体可执行。');

    return lines.join('\n');
}

async function requestAIAdvice(probability, obj, sub) {
    const aiLoading = document.getElementById('ai-loading');
    const aiResult = document.getElementById('ai-result');
    const aiFallback = document.getElementById('ai-fallback');
    aiLoading.style.display = 'block';
    aiResult.style.display = 'none';
    aiFallback.style.display = 'none';

    // 清除之前的错误
    const existingErr = document.getElementById('ai-error');
    if (existingErr) existingErr.remove();

    // 构建提示词（无论哪种模式都需要）
    _lastPrompt = buildAIPrompt(probability, obj, sub);

    // 尝试后端 AI API
    if (API_BASE) {
        try {
            const resp = await fetch(API_BASE + '/ai-advice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: _lastPrompt }),
                signal: AbortSignal.timeout(60000),
            });
            const data = await resp.json();

            if (!resp.ok) {
                throw new Error(data.error || `请求失败 (${resp.status})`);
            }

            aiLoading.style.display = 'none';
            const content = document.getElementById('ai-result-content');
            content.textContent = data.advice;
            aiResult.style.display = 'block';
            return;
        } catch (err) {
            // 后端 AI 不可用 → 走离线模式
            console.warn('AI API 不可用，切换到离线模式:', err);
        }
    }

    // 离线模式：显示复制提示词 + 打开 DeepSeek
    aiLoading.style.display = 'none';
    aiFallback.style.display = 'block';
}

// ============================================================
// 事件绑定
// ============================================================

function bindEvents() {
    // 下拉选择
    document.querySelectorAll('select[data-type]').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const type = e.target.dataset.type;
            const key = e.target.dataset.key;
            const val = e.target.value;
            const item = e.target.closest('.form-item');

            if (val === '') {
                delete selections[type][key];
                item.classList.add('unselected');
            } else {
                const dims = type === 'objective' ? OBJECTIVE_DIMS : SUBJECTIVE_DIMS;
                const dim = dims.find(d => d.key === key);
                const opt = dim.options[parseInt(val)];
                selections[type][key] = { label: opt.label, score: opt.score };
                item.classList.remove('unselected');
            }

            // 检查是否全部填完，启用/禁用生成按钮
            document.getElementById('btn-generate').disabled = !checkAllFilled();
        });
    });

    // 生成按钮
    document.getElementById('btn-generate').addEventListener('click', generate);

    // 复制 AI 建议结果
    document.getElementById('btn-copy').addEventListener('click', () => {
        const content = document.getElementById('ai-result-content');
        navigator.clipboard.writeText(content.textContent).then(() => {
            const btn = document.getElementById('btn-copy');
            const original = btn.textContent;
            btn.textContent = '已复制';
            setTimeout(() => { btn.textContent = original; }, 2000);
        });
    });

    // 离线模式：复制提示词
    document.getElementById('btn-copy-prompt').addEventListener('click', () => {
        navigator.clipboard.writeText(_lastPrompt).then(() => {
            const btn = document.getElementById('btn-copy-prompt');
            const original = btn.textContent;
            btn.textContent = '✅ 已复制，去 DeepSeek 粘贴';
            setTimeout(() => { btn.textContent = original; }, 3000);
        });
    });
}

// ============================================================
// 初始化
// ============================================================

buildObjectiveForm();
buildSubjectiveForm();
bindEvents();
