# LNF Fantasy - Sistema Profissional

Sistema completo de Fantasy Game para a Liga Nacional de Futsal.

## 📋 Características

- **Design Profissional** - Interface limpa e responsiva
- **Sistema Completo** - Login, Dashboard, Mercado e Admin
- **Banco de Dados Otimizado** - PostgreSQL com RLS
- **Segurança** - Autenticação via Supabase
- **Responsivo** - Funciona em desktop e mobile

## 🚀 Instalação

### 1. Banco de Dados

Execute o arquivo `database.sql` no seu Supabase:

```sql
-- Cole todo o conteúdo de database.sql no SQL Editor do Supabase
-- e execute
```

### 2. Configuração

Edite `assets/js/config.js` e adicione suas credenciais do Supabase:

```javascript
const CONFIG = {
    SUPABASE_URL: 'SUA_URL_AQUI',
    SUPABASE_ANON_KEY: 'SUA_CHAVE_AQUI',
    // ...
};
```

### 3. Estrutura de Arquivos

```
lnf-fantasy/
├── index.html              # Página de login
├── dashboard.html          # Dashboard do usuário
├── mercado.html           # Mercado de jogadores
├── admin.html             # Painel administrativo
├── database.sql           # Schema do banco de dados
└── assets/
    ├── css/
    │   └── style.css      # Estilos profissionais
    └── js/
        ├── config.js      # Configurações
        ├── auth.js        # Autenticação
        ├── dashboard.js   # Lógica do dashboard
        ├── mercado.js     # Lógica do mercado
        └── admin.js       # Lógica do admin
```

### 4. Hospedar

Você pode hospedar de várias formas:

**Opção 1: Vercel/Netlify (Recomendado)**
```bash
# Clone ou baixe os arquivos
# Faça deploy direto pela interface
```

**Opção 2: GitHub Pages**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
# Habilite GitHub Pages nas configurações
```

**Opção 3: Servidor Local**
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# Acesse: http://localhost:8000
```

## 📖 Como Usar

### 1. Primeiro Acesso

1. Abra `index.html`
2. Clique em "Cadastro"
3. Preencha:
   - Nome do Time
   - Email
   - Senha (mínimo 6 caracteres)
4. Clique em "Criar Conta"

### 2. Criar Usuário Admin

Execute no SQL Editor do Supabase:

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'seu@email.com';
```

### 3. Adicionar Times e Jogadores

1. Faça login como admin
2. Acesse "Admin" no menu
3. Na aba "Times":
   - Adicione os times da LNF
4. Na aba "Jogadores":
   - Adicione jogadores
   - Defina posição (GOL, FIX, ALA, PIV)
   - Defina preço (C$ 1.00 a C$ 15.00)

### 4. Criar Rodada

1. No painel Admin, aba "Rodadas"
2. Digite o nome (ex: "Rodada 1")
3. Clique em "Criar"
4. Status inicial: "pending" (mercado aberto)

### 5. Escalar Time

1. Acesse "Mercado"
2. Selecione 5 jogadores:
   - 1 Goleiro
   - 1 Fixo
   - 2 Alas
   - 1 Pivô
3. Clique em "Salvar Escalação"

### 6. Iniciar Rodada (Admin)

1. No painel Admin, aba "Rodadas"
2. Selecione a rodada em "Gerenciar Rodada"
3. Clique em "Iniciar"
4. Mercado fecha automaticamente

### 7. Lançar Scouts (Admin)

1. No painel Admin, aba "Scouts"
2. Selecione a rodada ativa
3. Selecione o jogador
4. Preencha estatísticas:
   - Gols (+8 pts)
   - Assistências (+5 pts)
   - Finalizações (+3 pts)
   - Defesas (+7 pts)
   - Sem sofrer gol (+5 pts)
   - Gols contra (-3 pts)
   - Cartões amarelos (-1 pt)
   - Cartões vermelhos (-5 pts)
   - Faltas (-0.3 pts)
5. Clique em "Salvar Scouts"
6. Pontos são calculados automaticamente

### 8. Finalizar Rodada (Admin)

1. No painel Admin, aba "Rodadas"
2. Selecione a rodada ativa
3. Clique em "Finalizar"
4. Mercado reabre automaticamente

## 🎮 Regras do Jogo

### Formação Obrigatória
- **1 Goleiro** (GOL)
- **1 Fixo** (FIX)
- **2 Alas** (ALA)
- **1 Pivô** (PIV)

### Orçamento
- Saldo inicial: **C$ 100,00**
- Preço dos jogadores: **C$ 1,00 a C$ 15,00**
- Ao salvar escalação, o saldo é debitado
- Saldo é resetado a cada rodada

### Pontuação

| Ação | Pontos |
|------|--------|
| ⚽ Gol | +8 |
| 🎯 Assistência | +5 |
| 🎪 Finalização na trave | +3 |
| 🧤 Defesa difícil | +7 |
| 🛡️ Jogo sem sofrer gol | +5 |
| ⚽ Gol contra | -3 |
| 🟨 Cartão amarelo | -1 |
| 🟥 Cartão vermelho | -5 |
| ⚠️ Falta | -0.3 |

### Ranking
- Usuários ordenados por **total de pontos**
- Soma de todas as rodadas participadas
- Posições: 🥇 🥈 🥉

## 🔧 Manutenção

### Resetar Cartoletas

Execute no SQL Editor:

```sql
SELECT reset_cartoletas();
```

### Recalcular Pontos

```sql
-- Recalcular uma lineup específica
SELECT recalculate_lineup_points(LINEUP_ID);

-- Recalcular todos os usuários
SELECT recalculate_user_points(id) FROM users;
```

### Ver Ranking

```sql
SELECT * FROM vw_ranking;
```

### Ver Escalações Detalhadas

```sql
SELECT * FROM vw_lineups_detail;
```

## 📱 Responsividade

O sistema é totalmente responsivo:

- **Desktop** - Layout em grid com sidebar
- **Tablet** - Layout adaptado
- **Mobile** - Layout em coluna única

## 🎨 Personalização

### Cores

Edite `assets/css/style.css`:

```css
:root {
    --primary: #FF6B00;      /* Laranja LNF */
    --secondary: #003366;    /* Azul LNF */
    --success: #10b981;      /* Verde */
    --danger: #ef4444;       /* Vermelho */
    --warning: #f59e0b;      /* Amarelo */
}
```

### Logo

Substitua o emoji no HTML:

```html
<h1 class="text-primary">⚽ LNF Fantasy</h1>
```

Por uma imagem:

```html
<h1 class="text-primary">
    <img src="logo.png" alt="LNF Fantasy">
</h1>
```

## 🐛 Troubleshooting

### Erro: "Supabase não encontrado"

Verifique se a biblioteca está incluída:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Erro: "Acesso negado"

Verifique as políticas RLS no Supabase. Execute novamente o `database.sql`.

### Escalação não aparece

1. Verifique se há rodada criada
2. Verifique se a escalação foi salva
3. Abra o Console (F12) e veja os erros

### Pontos não atualizam

1. Verifique se a rodada está ativa
2. Verifique se os scouts foram salvos
3. Execute: `SELECT recalculate_lineup_points(id) FROM lineups;`

## 📊 Consultas Úteis

### Ver todos os jogadores de um time

```sql
SELECT p.name, p.position, p.price
FROM players p
JOIN teams t ON p.team_id = t.id
WHERE t.name = 'Magnus Futsal'
ORDER BY p.position, p.name;
```

### Ver escalação de um usuário

```sql
SELECT 
    u.team_name,
    p.name as jogador,
    p.position,
    lp.points
FROM lineup_players lp
JOIN lineups l ON lp.lineup_id = l.id
JOIN users u ON l.user_id = u.id
JOIN players p ON lp.player_id = p.id
WHERE u.email = 'usuario@email.com'
AND l.round_id = 1
ORDER BY p.position;
```

### Top 10 jogadores mais escalados

```sql
SELECT 
    p.name,
    p.position,
    COUNT(*) as vezes_escalado
FROM lineup_players lp
JOIN players p ON lp.player_id = p.id
GROUP BY p.id, p.name, p.position
ORDER BY vezes_escalado DESC
LIMIT 10;
```

## 📝 Licença

Este projeto é de código aberto para uso em ligas de fantasy.

## 🤝 Contribuindo

Pull requests são bem-vindos!

## 📧 Suporte

Para dúvidas ou problemas, abra uma issue no GitHub.

---

**Desenvolvido para a Liga Nacional de Futsal** ⚽