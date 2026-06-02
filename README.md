# Tracker de Metas 2026

Aplicação web para acompanhar metas de carreira de junho a dezembro de 2026. O estado persiste automaticamente via commit no próprio repositório GitHub — funciona em qualquer dispositivo sem backend, sem banco de dados, sem servidor.

## Stack

- HTML, CSS e JavaScript vanilla (sem frameworks, sem build step)
- GitHub Contents API para persistência de dados
- GitHub Pages para hospedagem gratuita

---

## Como configurar

### 1. Criar um Personal Access Token no GitHub

1. Acesse **GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**
2. Clique em **Generate new token (classic)**
3. Dê um nome (ex: `goal-tracker`) e selecione o escopo **`repo`**
4. Clique em **Generate token** e copie o valor — ele começa com `ghp_`

> O token é salvo apenas no `localStorage` do seu navegador e enviado somente à API do GitHub.

### 2. Inserir as configurações no app

1. Abra a aplicação no GitHub Pages
2. Clique no ícone **⚙** no canto superior direito
3. Preencha os campos:
   | Campo | Valor |
   |---|---|
   | GitHub Token | `ghp_...` (token gerado acima) |
   | Owner | seu nome de usuário no GitHub |
   | Repositório | `goal-tracker` (nome deste repo) |
   | Branch | `main` |
4. Clique em **Salvar e sincronizar**

O progresso salvo será carregado automaticamente.

---

## Deploy no GitHub Pages

1. No repositório GitHub, vá em **Settings → Pages**
2. Em **Source**, selecione **Deploy from a branch**
3. Escolha a branch **`main`** e a pasta **`/ (root)`**
4. Clique em **Save**

Após 1–2 minutos a aplicação estará em:
```
https://<seu-usuario>.github.io/<nome-do-repo>/
```

---

## Como funciona a persistência

Cada vez que uma meta é marcada ou desmarcada, a aplicação:

1. Atualiza o estado local imediatamente (sem reload)
2. Aguarda 800ms de inatividade (debounce)
3. Faz um `PUT` na GitHub Contents API para `data/progress.json`
4. Cria um commit automático com a mensagem `chore: atualiza progresso [DD/MM/YYYY HH:MM]`
5. Ao abrir em qualquer dispositivo, busca o estado mais recente do repositório via `GET`

O formato das chaves em `progress.json` é `"mesId_categoriaIndex_metaIndex": true`, por exemplo:
```json
{
  "jun1_0_0": true,
  "jun1_1_1": true
}
```

---

## Estrutura

```
goal-tracker/
├── index.html          # Estrutura da aplicação
├── app.js              # Lógica, dados e integração com GitHub API
├── style.css           # Estilos (responsivo, sem dependências)
└── data/
    └── progress.json   # Estado das metas (atualizado automaticamente a cada check)
```
