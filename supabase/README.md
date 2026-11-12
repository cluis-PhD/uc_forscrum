# Base de dados relacional (versão de teste)

## O que muda
- Os dados deixam de estar numa única tabela chave-valor (`kv_store_1184b871`) e passam a tabelas próprias: `courses`, `teams`, `students`, `sprints`, `user_stories`, `votes`, `alerts`.
- Chaves estrangeiras com `ON DELETE CASCADE`: apagar um curso apaga as suas equipas, formandos, sprints, user stories e votos; apagar um sprint apaga as suas user stories; apagar uma equipa deixa os formandos "sem equipa".
- Os votos do Scrum Poker ficam guardados na base de dados (partilhados entre dispositivos).
- Edição de cursos e de sprints (nome, descrição/objetivo, datas).

## Como ativar
1. Supabase → projeto → **SQL Editor** → **New query**.
2. Colar o conteúdo de `migrations/001_relacional.sql` e carregar em **Run**.
3. O resultado mostra quantos registos foram copiados para cada tabela.

O script não apaga nada: a tabela antiga fica intacta e o site em produção continua a usá-la. Pode ser executado mais de uma vez sem duplicar dados.

## Como funciona na aplicação
`src/app/data/relationalApi.ts` interceta os pedidos às rotas antigas e responde a partir das novas tabelas, com o mesmo formato JSON. Se as tabelas não existirem, a aplicação usa o servidor antigo, como antes.

## Segurança
É um protótipo sem autenticação: a chave pública pode ler e escrever nas tabelas. Antes de uso real, as políticas RLS devem passar a exigir Supabase Auth.
