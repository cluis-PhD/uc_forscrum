import { Hono } from "npm:hono@^4.0.0";
import { cors } from "npm:hono@^4.0.0/cors";
import { logger } from "npm:hono@^4.0.0/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// ✅ MIGRADO PARA KV_STORE - Persistência permanente garantida
// Todos os dados agora são salvos no Supabase e não são perdidos ao reiniciar o servidor

app.get("/make-server-42b5d594/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== COURSES ====================

app.post("/make-server-42b5d594/courses", async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, studentsList } = body;
    
    if (!name?.trim()) {
      return c.json({ error: "Nome do curso é obrigatório" }, 400);
    }
    
    const courseId = Date.now().toString();
    const course = {
      id: courseId,
      name: name.trim(),
      description: description?.trim() || "",
      students: studentsList?.filter((e: string) => e.trim()).length || 0,
      teams: 0,
      sprints: 0,
      status: "new",
      startDate: new Date().toLocaleDateString("pt-PT"),
      endDate: "",
      progress: 0,
      studentsList: studentsList?.filter((e: string) => e.trim()) || [],
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`course:${courseId}`, course);
    console.log(`[BACKEND] ✅ Curso criado: ${courseId} - ${name}`);
    return c.json({ success: true, course }, 201);
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao criar curso:", error);
    return c.json({ error: `Erro ao criar curso: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/courses", async (c) => {
  try {
    const courses = await kv.getByPrefix("course:");
    courses.sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return c.json({ success: true, courses });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao listar cursos:", error);
    return c.json({ error: `Erro ao listar cursos: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/courses/:id", async (c) => {
  try {
    const courseId = c.req.param("id");
    const course = await kv.get(`course:${courseId}`);
    
    if (!course) {
      return c.json({ error: "Curso não encontrado" }, 404);
    }
    return c.json({ success: true, course });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao buscar curso:", error);
    return c.json({ error: `Erro ao buscar curso: ${error.message}` }, 500);
  }
});

app.put("/make-server-42b5d594/courses/:id", async (c) => {
  try {
    const courseId = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`course:${courseId}`);
    
    if (!existing) {
      return c.json({ error: "Curso não encontrado" }, 404);
    }
    
    const updated = { ...existing, ...body, id: courseId, updatedAt: new Date().toISOString() };
    await kv.set(`course:${courseId}`, updated);
    console.log(`[BACKEND] ✅ Curso atualizado: ${courseId}`);
    return c.json({ success: true, course: updated });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao atualizar curso:", error);
    return c.json({ error: `Erro ao atualizar curso: ${error.message}` }, 500);
  }
});

app.delete("/make-server-42b5d594/courses/:id", async (c) => {
  try {
    const courseId = c.req.param("id");
    const existing = await kv.get(`course:${courseId}`);
    
    if (!existing) {
      return c.json({ error: "Curso não encontrado" }, 404);
    }
    
    await kv.del(`course:${courseId}`);
    console.log(`[BACKEND] ✅ Curso arquivado: ${courseId}`);
    return c.json({ success: true, message: "Curso arquivado com sucesso" });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao arquivar curso:", error);
    return c.json({ error: `Erro ao arquivar curso: ${error.message}` }, 500);
  }
});

// ==================== SPRINTS ====================

app.post("/make-server-42b5d594/sprints", async (c) => {
  try {
    const body = await c.req.json();
    const { name, goal, startDate, endDate, courseId, courseName } = body;
    
    if (!name?.trim()) {
      return c.json({ error: "Nome do sprint é obrigatório" }, 400);
    }
    
    if (!courseId) {
      return c.json({ error: "ID do curso é obrigatório" }, 400);
    }
    
    const sprintId = `sprint_${Date.now()}`;
    const sprint = {
      id: sprintId,
      name: name.trim(),
      goal: goal?.trim() || "",
      startDate: startDate || "",
      endDate: endDate || "",
      courseId,
      courseName: courseName || "",
      status: "planning",
      stories: 0,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`sprint:${sprintId}`, sprint);
    console.log(`[BACKEND] ✅ Sprint criado: ${sprintId} - ${name}`);
    return c.json({ success: true, sprint }, 201);
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao criar sprint:", error);
    return c.json({ error: `Erro ao criar sprint: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/sprints", async (c) => {
  try {
    const sprints = await kv.getByPrefix("sprint:");
    
    // ✅ Calcular estatísticas de cada sprint
    const stories = await kv.getByPrefix("story:");
    
    const sprintsWithStats = sprints.map(sprint => {
      const sprintStories = stories.filter((story: any) => story.sprintId === sprint.id);
      
      const userStoryCount = sprintStories.length;
      const totalStoryPoints = sprintStories.reduce((sum, story) => sum + (Number(story.points) || 0), 0);
      const completedStories = sprintStories.filter(story => story.status === 'done').length;
      const completionRate = userStoryCount > 0 
        ? Math.round((completedStories / userStoryCount) * 100) 
        : 0;
      
      return {
        ...sprint,
        userStoryCount,
        totalStoryPoints,
        completionRate
      };
    });
    
    sprintsWithStats.sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return c.json({ success: true, sprints: sprintsWithStats });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao listar sprints:", error);
    return c.json({ error: `Erro ao listar sprints: ${error.message}` }, 500);
  }
});

app.delete("/make-server-42b5d594/sprints/:id", async (c) => {
  try {
    const sprintId = c.req.param("id");
    const existing = await kv.get(`sprint:${sprintId}`);
    
    if (!existing) {
      return c.json({ error: "Sprint não encontrado" }, 404);
    }
    
    // Delete associated stories
    const stories = await kv.getByPrefix("story:");
    const storiesToDelete = stories
      .filter((story: any) => story.sprintId === sprintId)
      .map((story: any) => `story:${story.id}`);
    
    if (storiesToDelete.length > 0) {
      await kv.mdel(storiesToDelete);
      console.log(`[BACKEND] 🗑️ ${storiesToDelete.length} user stories apagadas`);
    }
    
    await kv.del(`sprint:${sprintId}`);
    console.log(`[BACKEND] ✅ Sprint apagado: ${sprintId}`);
    return c.json({ success: true, message: "Sprint apagado com sucesso" });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao apagar sprint:", error);
    return c.json({ error: `Erro ao apagar sprint: ${error.message}` }, 500);
  }
});

// ==================== STORIES ====================

app.post("/make-server-42b5d594/stories", async (c) => {
  try {
    const body = await c.req.json();
    const { title, description, priority, team, acceptanceCriteria, sprintId, courseId } = body;
    
    if (!title?.trim()) {
      return c.json({ error: "Título é obrigatório" }, 400);
    }
    
    if (!sprintId) {
      return c.json({ error: "Sprint é obrigatório" }, 400);
    }
    
    if (!courseId) {
      return c.json({ error: "Curso é obrigatório" }, 400);
    }
    
    const storyId = `story_${Date.now()}`;
    const story = {
      id: storyId,
      title: title.trim(),
      description: description?.trim() || "",
      priority: priority || "medium",
      team: team || "",
      acceptanceCriteria: acceptanceCriteria || [],
      sprintId,
      courseId,
      status: "backlog",
      points: 0,
      votes: [],
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`story:${storyId}`, story);
    
    // Update sprint story count
    const sprint = await kv.get(`sprint:${sprintId}`);
    if (sprint) {
      sprint.stories = (sprint.stories || 0) + 1;
      await kv.set(`sprint:${sprintId}`, sprint);
    }
    
    console.log(`[BACKEND] ✅ User story criada: ${storyId} - ${title}`);
    return c.json({ success: true, userStory: story }, 201);
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao criar user story:", error);
    return c.json({ error: `Erro ao criar user story: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/stories", async (c) => {
  try {
    const stories = await kv.getByPrefix("story:");
    
    // 🔧 MIGRAÇÃO AUTOMÁTICA: Garantir que votes existe
    const migratedStories = stories.map((story: any) => ({
      ...story,
      votes: story.votes || []
    }));
    
    migratedStories.sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return c.json({ success: true, stories: migratedStories });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao listar user stories:", error);
    return c.json({ error: `Erro ao listar user stories: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/stories/:id", async (c) => {
  try {
    const storyId = c.req.param("id");
    console.log('[BACKEND] 🔍 GET /stories/:id - storyId recebido:', storyId);
    
    const story = await kv.get(`story:${storyId}`);
    
    console.log('[BACKEND] 📦 Story encontrada:', story ? 'SIM' : 'NÃO');
    
    if (!story) {
      console.log('[BACKEND] ❌ Story não encontrada');
      return c.json({ error: "User story não encontrada" }, 404);
    }
    
    // 🔧 MIGRAÇÃO AUTOMÁTICA: Garantir que votes existe
    if (!story.votes) {
      console.log('[BACKEND] ⚠️ Story sem votes, adicionando votes: []');
      story.votes = [];
      await kv.set(`story:${storyId}`, story);
    }
    
    console.log('[BACKEND] ✅ Retornando story:', { id: story.id, title: story.title, votes: story.votes });
    
    return c.json({ success: true, story });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao buscar user story:", error);
    return c.json({ error: `Erro ao buscar user story: ${error.message}` }, 500);
  }
});

app.put("/make-server-42b5d594/stories/:id", async (c) => {
  try {
    const storyId = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`story:${storyId}`);
    
    if (!existing) {
      return c.json({ error: "User story não encontrada" }, 404);
    }
    
    const updated = { 
      ...existing, 
      ...body, 
      id: storyId, 
      updatedAt: new Date().toISOString() 
    };
    
    await kv.set(`story:${storyId}`, updated);
    console.log(`[BACKEND] ✅ User story atualizada: ${storyId}`);
    return c.json({ success: true, story: updated });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao atualizar user story:", error);
    return c.json({ error: `Erro ao atualizar user story: ${error.message}` }, 500);
  }
});

app.delete("/make-server-42b5d594/stories/:id", async (c) => {
  try {
    const storyId = c.req.param("id");
    const story = await kv.get(`story:${storyId}`);
    
    if (!story) {
      return c.json({ error: "User story não encontrada" }, 404);
    }
    
    // Update sprint story count
    const sprintId = story.sprintId;
    if (sprintId) {
      const sprint = await kv.get(`sprint:${sprintId}`);
      if (sprint && sprint.stories > 0) {
        sprint.stories -= 1;
        await kv.set(`sprint:${sprintId}`, sprint);
      }
    }
    
    await kv.del(`story:${storyId}`);
    console.log(`[BACKEND] ✅ User story apagada: ${storyId}`);
    return c.json({ success: true, message: "User story apagada com sucesso" });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao apagar user story:", error);
    return c.json({ error: `Erro ao apagar user story: ${error.message}` }, 500);
  }
});

// ==================== TEAMS ====================

app.post("/make-server-42b5d594/teams", async (c) => {
  try {
    const body = await c.req.json();
    const { name, members, courseId } = body;
    
    if (!name?.trim()) {
      return c.json({ error: "Nome da equipa é obrigatório" }, 400);
    }
    
    const teamId = `team_${Date.now()}`;
    const team = {
      id: teamId,
      name: name.trim(),
      members: members || [],
      courseId: courseId || "",
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`team:${teamId}`, team);
    console.log(`[BACKEND] ✅ Equipa criada: ${teamId} - ${name}`);
    return c.json({ success: true, team }, 201);
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao criar equipa:", error);
    return c.json({ error: `Erro ao criar equipa: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/teams", async (c) => {
  try {
    const teams = await kv.getByPrefix("team:");
    teams.sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return c.json({ success: true, teams });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao listar equipas:", error);
    return c.json({ error: `Erro ao listar equipas: ${error.message}` }, 500);
  }
});

app.delete("/make-server-42b5d594/teams/:id", async (c) => {
  try {
    const teamId = c.req.param("id");
    const existing = await kv.get(`team:${teamId}`);
    
    if (!existing) {
      return c.json({ error: "Equipa não encontrada" }, 404);
    }
    
    await kv.del(`team:${teamId}`);
    console.log(`[BACKEND] ✅ Equipa apagada: ${teamId}`);
    return c.json({ success: true, message: "Equipa apagada com sucesso" });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao apagar equipa:", error);
    return c.json({ error: `Erro ao apagar equipa: ${error.message}` }, 500);
  }
});

// ==================== STUDENTS ====================

app.post("/make-server-42b5d594/students", async (c) => {
  try {
    const body = await c.req.json();
    const { id, name, email, courseId, teamId } = body;
    
    if (!name?.trim()) {
      return c.json({ error: "Nome do formando é obrigatório" }, 400);
    }
    
    if (!courseId?.trim()) {
      return c.json({ error: "Curso do formando é obrigatório" }, 400);
    }
    
    // 🔧 MIGRAÇÃO: Aceitar ID customizado OU gerar novo
    const studentId = id?.trim() || `student_${Date.now()}`;
    
    console.log(`[BACKEND POST] 📝 Criando/atualizando formando com ID: ${studentId}${id ? ' (customizado)' : ' (gerado)'}`);
    
    const student = {
      id: studentId,
      name: name.trim(),
      email: email?.trim() || "",
      courseId: courseId || "",
      teamId: teamId || "",
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(`student:${studentId}`, student);
    console.log(`[BACKEND POST] ✅ Formando criado/atualizado: ${studentId} - ${name}`);
    return c.json({ success: true, student }, 201);
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao criar formando:", error);
    return c.json({ error: `Erro ao criar formando: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/students", async (c) => {
  try {
    const students = await kv.getByPrefix("student:");
    students.sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return c.json({ success: true, students });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao listar formandos:", error);
    return c.json({ error: `Erro ao listar formandos: ${error.message}` }, 500);
  }
});

// ✅ ROTA PUT ADICIONADA - Esta era a rota que faltava e causava o erro 404!
app.put("/make-server-42b5d594/students/:id", async (c) => {
  try {
    const studentId = c.req.param("id");
    const body = await c.req.json();
    
    console.log(`[BACKEND PUT] 🔄 Atualizando formando: ${studentId}`);
    console.log(`[BACKEND PUT] 📦 Dados recebidos:`, JSON.stringify(body, null, 2));
    
    const existing = await kv.get(`student:${studentId}`);
    
    if (!existing) {
      console.log(`[BACKEND PUT] ℹ️ Formando não encontrado: ${studentId}`);
      
      // Listar todos os formandos para debug
      const allStudents = await kv.getByPrefix("student:");
      console.log(`[BACKEND PUT] 📊 Total de formandos na base de dados: ${allStudents.length}`);
      console.log(`[BACKEND PUT] 📋 IDs disponíveis:`, allStudents.map((s: any) => s.id));
      
      return c.json({ 
        error: "Formando não encontrado",
        details: "O formando pode ter sido apagado ou o ID está incorreto",
        requestedId: studentId,
        availableIds: allStudents.map((s: any) => s.id)
      }, 404);
    }
    
    console.log(`[BACKEND PUT] ✓ Formando encontrado:`, JSON.stringify(existing, null, 2));
    
    const updated = { 
      ...existing, 
      ...body, 
      id: studentId, 
      updatedAt: new Date().toISOString() 
    };
    
    console.log(`[BACKEND PUT] 📝 Dados após merge:`, JSON.stringify(updated, null, 2));
    
    await kv.set(`student:${studentId}`, updated);
    
    // Verificar se realmente salvou
    const verified = await kv.get(`student:${studentId}`);
    console.log(`[BACKEND PUT] 🔍 Verificação após salvar:`, JSON.stringify(verified, null, 2));
    
    console.log(`[BACKEND PUT] ✅ Formando atualizado com sucesso!`);
    
    return c.json({ success: true, student: updated });
  } catch (error) {
    console.error(`[BACKEND] ❌ Erro ao atualizar formando:`, error);
    return c.json({ 
      error: `Erro ao atualizar formando: ${error.message}`,
      stack: error.stack 
    }, 500);
  }
});

// 🔧 ROTA ESPECIAL: Sincronizar/Recriar formando preservando o ID original
app.post("/make-server-42b5d594/students/:id/sync", async (c) => {
  try {
    const studentId = c.req.param("id");
    const body = await c.req.json();
    
    console.log(`[BACKEND] 🔄 POST /students/${studentId}/sync - Sincronizando formando antigo...`);
    console.log(`[BACKEND] Dados recebidos:`, body);
    
    const { name, email, courseId, teamId } = body;
    
    if (!name?.trim()) {
      return c.json({ error: "Nome do formando é obrigatório" }, 400);
    }
    
    if (!courseId?.trim()) {
      return c.json({ error: "Curso do formando é obrigatório" }, 400);
    }
    
    // Criar/recriar formando com ID preservado
    const student = {
      id: studentId,  // ✅ Usar o ID fornecido, não gerar novo!
      name: name.trim(),
      email: email?.trim() || "",
      courseId: courseId || "",
      teamId: teamId || "",
      createdAt: new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };
    
    await kv.set(`student:${studentId}`, student);
    console.log(`[BACKEND] ✅ Formando sincronizado com ID preservado: ${studentId} - ${name}`);
    
    return c.json({ success: true, student }, 201);
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao sincronizar formando:", error);
    return c.json({ error: `Erro ao sincronizar formando: ${error.message}` }, 500);
  }
});

app.delete("/make-server-42b5d594/students/:id", async (c) => {
  try {
    const studentId = c.req.param("id");
    const existing = await kv.get(`student:${studentId}`);
    
    if (!existing) {
      return c.json({ error: "Formando não encontrado" }, 404);
    }
    
    await kv.del(`student:${studentId}`);
    console.log(`[BACKEND] ✅ Formando apagado: ${studentId}`);
    return c.json({ success: true, message: "Formando apagado com sucesso" });
  } catch (error) {
    console.error("[BACKEND] ❌ Erro ao apagar formando:", error);
    return c.json({ error: `Erro ao apagar formando: ${error.message}` }, 500);
  }
});

// ==================== DEBUG ====================

// 🧹 ROTA DE LIMPEZA: Remove formandos duplicados (mantém o mais recente)
app.post("/make-server-42b5d594/cleanup/duplicates", async (c) => {
  try {
    const students = await kv.getByPrefix("student:");
    
    // Agrupar por courseId + nome (case-insensitive)
    const groups = new Map<string, any[]>();
    
    students.forEach((student: any) => {
      const key = `${student.courseId}:${student.name.toLowerCase().trim()}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(student);
    });
    
    // Encontrar e remover duplicados
    let duplicatesRemoved = 0;
    const removedIds: string[] = [];
    
    for (const [key, group] of groups.entries()) {
      if (group.length > 1) {
        console.log(`[CLEANUP] 🔍 Duplicados encontrados para "${key}":`, group.map(s => s.id));
        
        // Ordenar por data de criação (mais recente primeiro)
        group.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        
        // Manter o primeiro (mais recente), apagar os restantes
        const toKeep = group[0];
        const toDelete = group.slice(1);
        
        console.log(`[CLEANUP] ✅ Mantendo: ${toKeep.id} (${toKeep.name})`);
        console.log(`[CLEANUP] 🗑️ Apagando ${toDelete.length} duplicado(s)`);
        
        for (const dup of toDelete) {
          await kv.del(`student:${dup.id}`);
          removedIds.push(dup.id);
          duplicatesRemoved++;
          console.log(`[CLEANUP] ✅ Apagado: ${dup.id}`);
        }
      }
    }
    
    console.log(`[CLEANUP] ✅ Limpeza concluída: ${duplicatesRemoved} duplicados removidos`);
    
    return c.json({ 
      success: true, 
      message: `${duplicatesRemoved} formando(s) duplicado(s) removido(s)`,
      removedIds,
      duplicatesRemoved
    });
  } catch (error) {
    console.error("[CLEANUP] ❌ Erro:", error);
    return c.json({ error: `Erro na limpeza: ${error.message}` }, 500);
  }
});

app.get("/make-server-42b5d594/debug/storage-keys", async (c) => {
  try {
    const courses = await kv.getByPrefix("course:");
    const sprints = await kv.getByPrefix("sprint:");
    const stories = await kv.getByPrefix("story:");
    const teams = await kv.getByPrefix("team:");
    const students = await kv.getByPrefix("student:");
    
    console.log('[BACKEND DEBUG] 📋 Estatísticas do KV Store:');
    console.log(`  - Cursos: ${courses.length}`);
    console.log(`  - Sprints: ${sprints.length}`);
    console.log(`  - User Stories: ${stories.length}`);
    console.log(`  - Equipas: ${teams.length}`);
    console.log(`  - Formandos: ${students.length}`);
    
    return c.json({ 
      success: true, 
      stats: {
        courses: courses.length,
        sprints: sprints.length,
        stories: stories.length,
        teams: teams.length,
        students: students.length,
        total: courses.length + sprints.length + stories.length + teams.length + students.length
      },
      data: {
        courseIds: courses.map((c: any) => c.id),
        sprintIds: sprints.map((s: any) => s.id),
        storyIds: stories.map((s: any) => s.id),
        teamIds: teams.map((t: any) => t.id),
        studentIds: students.map((s: any) => s.id),
      }
    });
  } catch (error) {
    console.error("[BACKEND DEBUG] ❌ Erro:", error);
    return c.json({ error: `Erro ao listar dados: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);