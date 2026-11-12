/**
 * Antes, este ficheiro tinha dados de demonstração fictícios que apareciam
 * quando o servidor não respondia. Foram removidos: sem servidor, a aplicação
 * mostra listas vazias em vez de dados inventados.
 */
const empty = (key: string) => async () => ({ success: true, [key]: [] as any[] });
const offline = async (..._args: any[]) => ({ success: false, error: 'Sem ligação ao servidor' } as any);

export const mockAPI = {
  getCourses: empty('courses'),
  getTeams: empty('teams'),
  getStudents: empty('students'),
  getSprints: empty('sprints'),
  getStories: empty('stories'),
  getAlerts: empty('alerts'),
  getCourse: offline, createCourse: offline, updateCourse: offline, deleteCourse: offline,
  createTeam: offline, updateTeam: offline, deleteTeam: offline,
  createStudent: offline, updateStudent: offline, deleteStudent: offline,
  createSprint: offline, updateSprint: offline, deleteSprint: offline,
  createStory: offline, updateStory: offline, deleteStory: offline,
  createAlert: offline, updateAlert: offline, deleteAlert: offline,
};
