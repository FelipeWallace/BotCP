# 🤖 Bot de Discord com IA via Webhook (n8n)

Este bot permite que usuários interajam com uma Inteligência Artificial através de menções diretas ou comandos *slash*. As respostas são processadas por um fluxo no [n8n](https://n8n.io/) via Webhook.

---

## 🚀 Começando

### 1. Clone o projeto
```bash
git clone https://github.com/FelipeWallace/BotCP.git
cd seu-repo
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o arquivo `.env`
Crie um arquivo `.env` na raiz com o seguinte conteúdo:

```env
DISCORD_BOT_TOKEN=seu_token_do_bot
DISCORD_CLIENT_ID=seu_client_id
DISCORD_GUILD_ID=id_do_servidor_para_testes
N8N_WEBHOOK=https://seu-webhook.n8n.cloud/webhook/ia
```

| Variável              | Descrição                                           |
|------------------------|--------------------------------------------------------|
| `DISCORD_BOT_TOKEN`    | Token do seu bot no [Discord Developer Portal](https://discord.com/developers/applications) |
| `DISCORD_CLIENT_ID`    | ID da aplicação no portal do Discord                  |
| `DISCORD_GUILD_ID`     | ID do servidor onde serão testados os comandos slash   |
| `N8N_WEBHOOK`          | URL do webhook HTTP criado no seu fluxo n8n           |

---

## 📂 Estrutura de Arquivos

```
.
├── commands/			# Pasta com comandos slash
│   └── help.js		# Comando /help para enviar pergunta à IA
├── .env				# Variáveis de ambiente
├── deploy-commands.js	# Script para registrar comandos slash
├── index.js			# Arquivo principal do bot
├── package.json		# Dependências e scripts
```

---

## 🔹 `index.js` - Código principal

Responsável por:
- Inicializar o bot e conectar ao Discord
- Carregar comandos da pasta `commands`
- Lidar com comandos slash
- Detectar menções ao bot em mensagens comuns
- Enviar perguntas ao webhook no n8n e retornar a resposta

O bot responde automaticamente quando é mencionado, por exemplo:
```txt
@PetrinhoIA Como pode me ajudar?
→ Resposta da IA via webhook
```

---

## 🔹 `deploy-commands.js` - Registro de comandos

Este script registra os comandos slash no servidor de teste (guilda).

Uso:
```bash
node deploy-commands.js
```

Esse passo é obrigatório sempre que você:
- Criar um novo comando
- Alterar a descrição ou opções de comandos existentes

---

## 🔹 `help.js` - Comando /help

Localizado em `./commands/help.js`, esse comando permite que o usuário envie uma pergunta diretamente para a IA via webhook.

### Sintaxe:
```txt
/help pergunta: "Como pode me ajudar?"
```

### Explicação:
```js
.setName("help") // nome do comando
.setDescription("Faz uma pergunta para a IA via n8n")
.addStringOption(option =>
  option
    .setName("pergunta")
    .setDescription("Escreva sua dúvida")
    .setRequired(true)
)
```

Quando o comando é chamado:
1. Ele envia a pergunta e o ID do usuário para o webhook `N8N_WEBHOOK`
2. O n8n processa a pergunta com a IA
3. A resposta é retornada ao Discord

---

