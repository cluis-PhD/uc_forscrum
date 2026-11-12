# Base de dados relacional (versão de teste)

## O que muda
- Os dados deixam de estar numa única tabela chave-valor (`kv_store_1184b871`) e passam a tabelas próprias: `courses`, `teams`, `students`, `sprints`, `user_stories`, `votes`, `alerts`.
- Chaves estrangeiras com `ON DELETE CASCADE`: apagar um curso apaga as suas equipas, formandos, sprints, user stories e votos; apagar um sprint apaga as suas user stories; apagar uma equipa deixa os formandos "sem equipa".
- Os votos do Scrum Poker, as mensagens e os alertas (incluindo quem já os leu) ficam guardados na base de dados, partilhados entre dispositivos.
- Edição de cursos e de sprints (nome, descrição/objetivo, datas).

## Como ativar
No projeto `malixbxxfqzzszvjyrla`: **SQL Editor** → **New query**, colar e carregar em **Run**, por esta ordem:
1. `migrations/001_relacional.sql` — tabelas principais e cópia dos dados antigos.
2. `migrations/002_mensagens_alertas.sql` — mensagens e registo de alertas lidos.

O script não apaga nada: a tabela antiga fica intacta e o site em produção continua a usá-la. Pode ser executado mais de uma vez sem duplicar dados.

## Como funciona na aplicação
Os componentes fazem pedidos a `/api/...`. O ficheiro `src/app/data/database.ts` trata esses pedidos no browser e converte-os em operações sobre as tabelas (REST do Supabase). Já não é usado o servidor antigo (Edge Function com tabela chave-valor).

## Segurança
É um protótipo sem autenticação: a chave pública pode ler e escrever nas tabelas. Antes de uso real, as políticas RLS devem passar a exigir Supabase Auth.
