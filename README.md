# MyforScrum

Protótipo funcional de uma aplicação para apoiar a framework **forScrum** na educação e formação de adultos, com especial atenção a adultos com baixos níveis de literacia.

Desenvolvido no âmbito da tese de doutoramento *Um contributo para a acessibilidade e a usabilidade em ambientes virtuais de aprendizagem para pessoas com baixos níveis de literacia* (Carlos Luís, Departamento de Engenharia Informática, Universidade de Coimbra, 2026), orientada pela Professora Doutora Maria José Marcelino.

## O que faz

- **Perfil de formador:** gestão de cursos, equipas, formandos, sprints e user stories; quadro Kanban; alertas e mensagens.
- **Perfil de formando:** consulta de sprints e tarefas, Scrum Poker, progresso, alertas e mensagens.
- Interface mobile-first, com navegação inferior com texto em todos os ícones, modo escuro e escolha do tamanho de letra.

## Estado do protótipo

Este é um protótipo de alta fidelidade para avaliação de usabilidade, no contexto de uma investigação em Design Science Research.

- Os fluxos centrais (cursos, equipas, formandos, sprints e user stories) funcionam com dados guardados num servidor Supabase.
- A autenticação, as mensagens e a votação do Scrum Poker estão simuladas para efeitos de teste.
- **Todos os dados são fictícios.**

A interface foi desenhada no Figma e o código inicial foi gerado com o Figma Make. O projeto foi depois exportado para este repositório, onde é mantido e desenvolvido de forma independente.

## Tecnologias

- React com TypeScript, construído com Vite
- Tailwind CSS e componentes Radix UI
- Supabase (PostgreSQL e Edge Functions)
- Publicação contínua na Vercel

## Executar localmente

```bash
npm install
npm run dev
```

## Próximos passos

App nativa em React Native, com autenticação real, controlo de acesso por perfil, sincronização entre dispositivos e integração com o Moodle.

