# Agentes de IA 🤖

Plataforma estilo ChatGPT com **3 agentes de IA independentes**, construída com Next.js + React + TypeScript + Tailwind CSS e integrada à **API do Claude (Anthropic)**.

## Agentes

| Agente | Função |
| ------ | ------ |
| 🎨 **Gerador de Imagens** | Cria prompts visuais detalhados para Midjourney, DALL·E, Stable Diffusion |
| ✍️ **Gerador de Copys** | Escreve copies persuasivas: anúncios, e-mails, landing pages |
| 🎬 **Gerador de Vídeos** | Roteiros para Reels/Shorts e prompts para Sora, Runway, Kling |

Cada agente tem um **chat independente** e um **system prompt customizado** (em `lib/agents.ts`).

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure sua chave da API no arquivo `.env.local`:

   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   Obtenha a chave em https://console.anthropic.com/settings/keys

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra http://localhost:3000

## Deploy na Vercel

1. Faça push do projeto para um repositório no GitHub.
2. Importe o repositório em https://vercel.com/new
3. Em **Settings → Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave da Anthropic
4. Deploy. A Vercel detecta o Next.js automaticamente.

> ⚠️ O arquivo `.env.local` **não** vai para o Git (está no `.gitignore`). A chave em produção é definida nas variáveis de ambiente da Vercel.

## Estrutura

```
.
├── app/
│   ├── api/chat/route.ts   # Endpoint que faz streaming da resposta do Claude
│   ├── globals.css         # Estilos + Tailwind
│   ├── layout.tsx
│   └── page.tsx            # Estado dos 3 chats
├── components/
│   ├── Sidebar.tsx        # Lista de agentes
│   ├── ChatView.tsx       # Chat com streaming
│   └── MessageBubble.tsx  # Renderização das mensagens
├── lib/
│   └── agents.ts          # Definição e system prompts dos agentes
└── .env.local             # Sua API key (não versionado)
```

## Personalização

- **Mudar os prompts dos agentes:** edite `lib/agents.ts`.
- **Adicionar um novo agente:** acrescente um objeto no array `AGENTS` (com `id` único) — a sidebar e o roteamento se ajustam automaticamente.
- **Trocar o modelo:** altere `model` em `app/api/chat/route.ts`.
