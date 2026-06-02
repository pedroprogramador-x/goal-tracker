'use strict';

// ── Dados ────────────────────────────────────────────────────────────────────

const MONTHS = [
  {
    id: "jun1", name: "Junho — fase 1", period: "02/06 – 21/06", color: "#185FA5",
    categories: [
      { label: "Provas", goals: ["Passar em Banco de Dados (prova dia 22/06)", "Passar em Engenharia de Usabilidade (prova dia 23/06)"] },
      { label: "Estudo técnico", goals: ["Revisar Python OOP — conceitos que já estão no sports bot", "Fazer 1 mini projeto FastAPI do zero (sem copiar código existente)"] }
    ]
  },
  {
    id: "jun2", name: "Junho — fase 2", period: "22/06 – 30/06", color: "#0F6E56",
    categories: [
      { label: "Trabalho", goals: ["Completar treinamento antes do dia 22", "Primeiro dia no Carrefour — entregar bem", "Entender a rotina real do expediente"] },
      { label: "Estudo técnico", goals: ["Fazer 2 mini projetos FastAPI + JWT do zero", "Conseguir explicar JWT sem precisar consultar nada"] }
    ]
  },
  {
    id: "jul", name: "Julho", period: "01/07 – 31/07", color: "#854F0B",
    categories: [
      { label: "React", goals: ["Entender componentes, props e estado (useState)", "Fazer 1 projeto pequeno consumindo uma API pública", "Verificar nova turma do Atlântico Avanti Bootcamp"] },
      { label: "Job Hunter Bot", goals: ["Migrar bot para FastAPI com banco de dados real", "Implementar autenticação JWT multi-usuário", "Cada usuário consegue se cadastrar e fazer login"] },
      { label: "Rotina", goals: ["Revisar rotina com dados reais do primeiro mês", "Decidir se VoltVault entra no plano agora ou não"] }
    ]
  },
  {
    id: "ago", name: "Agosto", period: "01/08 – 31/08", color: "#534AB7",
    categories: [
      { label: "Faculdade", goals: ["Volta das aulas — encaixar matérias na rotina nova", "Definir prioridade entre as matérias do semestre"] },
      { label: "Job Hunter Bot", goals: ["Sistema de preferências por usuário funcionando", "Pipeline do bot rodando por usuário individualmente", "Interface React básica: login + dashboard de vagas"] }
    ]
  },
  {
    id: "set", name: "Setembro", period: "01/09 – 30/09", color: "#993C1D",
    categories: [
      { label: "Job Hunter Bot", goals: ["Frontend React completo: configurações + histórico", "Deploy da versão multi-usuário no ar com URL pública", "README atualizado como peça de portfólio"] },
      { label: "Freelance / extra", goals: ["Avaliar VoltVault: vale investir em tráfego agora?", "Mapear vagas dev junior para candidatura em jan/2027"] }
    ]
  },
  {
    id: "out", name: "Outubro", period: "01/10 – 31/10", color: "#3B6D11",
    categories: [
      { label: "3º projeto", goals: ["Definir tema do 3º projeto (full-stack Python + React)", "Ter escopo e entregáveis claros antes de começar", "Iniciar estrutura base do backend"] },
      { label: "Carrefour", goals: ["Mapear quem é do time de TI internamente", "Entender como funciona mobilidade interna na empresa"] }
    ]
  },
  {
    id: "nov", name: "Novembro", period: "01/11 – 30/11", color: "#72243E",
    categories: [
      { label: "3º projeto", goals: ["Backend do 3º projeto funcionando com testes básicos", "Frontend React conectado ao backend", "Deploy no ar"] },
      { label: "Preparação para candidatura", goals: ["Atualizar LinkedIn com os 3 projetos", "Atualizar currículo com stack real e links dos projetos"] }
    ]
  },
  {
    id: "dez", name: "Dezembro", period: "01/12 – 31/12", color: "#444441",
    categories: [
      { label: "Portfólio final", goals: ["3 projetos documentados, deployados e com README profissional", "GitHub organizado e apresentável", "LinkedIn revisado e ativo"] },
      { label: "Preparação técnica", goals: ["Revisar algoritmos e estruturas de dados básicos", "Fazer pelo menos 10 simulações de entrevista técnica", "Definir lista de empresas-alvo para jan/2027"] }
    ]
  }
];

// ── Estado ───────────────────────────────────────────────────────────────────

let progress = {};
let fileSha = null;
let saveTimer = null;
let isSaving = false;

// ── Config ───────────────────────────────────────────────────────────────────

function loadConfig() {
  return {
    token:  localStorage.getItem('gh_token')  || '',
    owner:  localStorage.getItem('gh_owner')  || '',
    repo:   localStorage.getItem('gh_repo')   || '',
    branch: localStorage.getItem('gh_branch') || 'main',
  };
}

function saveConfig(cfg) {
  localStorage.setItem('gh_token',  cfg.token);
  localStorage.setItem('gh_owner',  cfg.owner);
  localStorage.setItem('gh_repo',   cfg.repo);
  localStorage.setItem('gh_branch', cfg.branch);
}

// ── GitHub API ───────────────────────────────────────────────────────────────

async function fetchProgress() {
  const { token, owner, repo, branch } = loadConfig();
  if (!token || !owner || !repo) return;

  showStatus('Carregando...', 'saving');
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/data/progress.json?ref=${branch}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    fileSha = data.sha;
    progress = JSON.parse(atob(data.content.replace(/\n/g, '')));
    renderAll();
    showStatus('Sincronizado ✓', 'saved');
  } catch (err) {
    showStatus(`Erro ao carregar: ${err.message}`, 'error');
  }
}

async function saveProgress() {
  if (isSaving) {
    // Reagenda para depois que a requisição atual terminar
    saveTimer = setTimeout(saveProgress, 600);
    return;
  }

  const { token, owner, repo, branch } = loadConfig();
  if (!token || !owner || !repo) {
    showStatus('Configure o token e repositório primeiro', 'error');
    return;
  }

  isSaving = true;
  showStatus('Salvando...', 'saving');

  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  const msg = `chore: atualiza progresso [${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}]`;
  const content = btoa(JSON.stringify(progress, null, 2));

  try {
    const body = { message: msg, content, branch };
    if (fileSha) body.sha = fileSha;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/data/progress.json`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    fileSha = data.content.sha;
    showStatus('Salvo ✓', 'saved');
  } catch (err) {
    showStatus(`Erro ao salvar: ${err.message}`, 'error');
  } finally {
    isSaving = false;
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  showStatus('Aguardando...', 'saving');
  saveTimer = setTimeout(saveProgress, 800);
}

// ── Status ───────────────────────────────────────────────────────────────────

let statusTimer = null;

function showStatus(msg, type) {
  const el = document.getElementById('save-status');
  el.textContent = msg;
  el.className = `save-status ${type}`;
  clearTimeout(statusTimer);
  if (type === 'saved') {
    statusTimer = setTimeout(() => {
      el.textContent = '';
      el.className = 'save-status';
    }, 3000);
  }
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderSummary() {
  let total = 0, done = 0;
  MONTHS.forEach(m => {
    m.categories.forEach((cat, ci) => {
      cat.goals.forEach((_, gi) => {
        total++;
        if (progress[`${m.id}_${ci}_${gi}`]) done++;
      });
    });
  });

  document.getElementById('total-goals').textContent = total;
  document.getElementById('completed-goals').textContent = done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('global-bar').style.width = `${pct}%`;
}

function renderMonths() {
  const container = document.getElementById('months-container');
  container.innerHTML = '';

  MONTHS.forEach(month => {
    let total = 0, done = 0;
    month.categories.forEach((cat, ci) => {
      cat.goals.forEach((_, gi) => {
        total++;
        if (progress[`${month.id}_${ci}_${gi}`]) done++;
      });
    });
    const pct = total ? Math.round((done / total) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'month-card';
    card.innerHTML = `
      <div class="month-header" style="border-left-color:${month.color}">
        <div class="month-title">
          <span class="month-name">${month.name}</span>
          <span class="month-period">${month.period}</span>
        </div>
        <div class="month-meta">
          <span class="month-count">${done}/${total}</span>
          <div class="progress-bar small">
            <div class="progress-fill" style="width:${pct}%;background:${month.color}"></div>
          </div>
          <span class="chevron">&#9662;</span>
        </div>
      </div>
      <div class="month-body" id="body-${month.id}">
        ${month.categories.map((cat, ci) => `
          <div class="category">
            <h4 class="category-label">${cat.label}</h4>
            <ul class="goals-list">
              ${cat.goals.map((goal, gi) => {
                const key = `${month.id}_${ci}_${gi}`;
                const checked = !!progress[key];
                return `<li class="goal-item${checked ? ' done' : ''}">
                  <label>
                    <input type="checkbox" data-key="${key}"${checked ? ' checked' : ''}>
                    <span>${goal}</span>
                  </label>
                </li>`;
              }).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;

    card.querySelector('.month-header').addEventListener('click', e => {
      if (e.target.type === 'checkbox') return;
      document.getElementById(`body-${month.id}`).classList.toggle('collapsed');
      card.querySelector('.chevron').classList.toggle('rotated');
    });

    card.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', e => {
        e.stopPropagation();
        if (cb.checked) progress[cb.dataset.key] = true;
        else delete progress[cb.dataset.key];

        cb.closest('.goal-item').classList.toggle('done', cb.checked);

        // Atualiza contadores do card sem re-renderizar tudo
        const body = document.getElementById(`body-${month.id}`);
        const allCbs = body.querySelectorAll('input[type="checkbox"]');
        const cardDone = [...allCbs].filter(c => c.checked).length;
        const cardTotal = allCbs.length;
        const cardPct = cardTotal ? Math.round((cardDone / cardTotal) * 100) : 0;
        card.querySelector('.month-count').textContent = `${cardDone}/${cardTotal}`;
        card.querySelector('.progress-fill').style.width = `${cardPct}%`;

        renderSummary();
        scheduleSave();
      });
    });

    container.appendChild(card);
  });
}

function renderAll() {
  renderSummary();
  renderMonths();
}

// ── Settings UI ──────────────────────────────────────────────────────────────

document.getElementById('settings-btn').addEventListener('click', () => {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    const cfg = loadConfig();
    document.getElementById('gh-token').value  = cfg.token;
    document.getElementById('gh-owner').value  = cfg.owner;
    document.getElementById('gh-repo').value   = cfg.repo;
    document.getElementById('gh-branch').value = cfg.branch || 'main';
  }
});

document.getElementById('save-settings-btn').addEventListener('click', () => {
  saveConfig({
    token:  document.getElementById('gh-token').value.trim(),
    owner:  document.getElementById('gh-owner').value.trim(),
    repo:   document.getElementById('gh-repo').value.trim(),
    branch: document.getElementById('gh-branch').value.trim() || 'main',
  });
  document.getElementById('settings-panel').classList.add('hidden');
  fetchProgress();
});

document.getElementById('sync-btn').addEventListener('click', () => {
  saveConfig({
    token:  document.getElementById('gh-token').value.trim(),
    owner:  document.getElementById('gh-owner').value.trim(),
    repo:   document.getElementById('gh-repo').value.trim(),
    branch: document.getElementById('gh-branch').value.trim() || 'main',
  });
  fetchProgress();
});

// ── Init ─────────────────────────────────────────────────────────────────────

renderAll();
fetchProgress();
