import * as SQLite from 'expo-sqlite';
const DB_NAME = 'projetoDispositivos.db';

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    return await SQLite.openDatabaseAsync(DB_NAME);
};

export const migrateDbIfNeeded = async (): Promise<void> => {
    const db = await getDatabase();

    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.execAsync('PRAGMA foreign_keys = ON');

    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA journal_mode = WAL')
    const currentVersion = result?.user_version ?? 0;

    if (currentVersion < 1) {
        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL,
            celular TEXT NOT NULL
        );    
    `);

        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercicios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            grupo_muscular TEXT,
            tipo TEXT,
            nivel_dificuldade TEXT,
            criado_em TEXT DEFAULT (datetime('now'))
        );
    `);

        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS treinos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            descricao TEXT,
            criado_em TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (aluno_id) REFERENCES alunos(id)
        );
    `);

        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS treino_exercicios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            treino_id INTEGER NOT NULL,
            exercicio_id INTEGER NOT NULL,
            series INTEGER,
            repeticoes INTEGER,
            duracao_segundos INTEGER,
            ordem INTEGER,
            FOREIGN KEY (treino_id) REFERENCES treinos(id),
            FOREIGN KEY (exercicio_id) REFERENCES exercicios(id)
        );
    `);

    }; // fechamento do IF
};

export interface Aluno {
    id: number;
    nome: string;
    email: string;
    celular: string;
};

export interface Exercicio {
    id: number;
    nome: string;
    descricao: string;
    grupo_muscular: string;
    tipo: string;
    nivel_dificuldade: string;
    criado_em: Date;
};

export interface Treino {
  id: number;
  aluno_id: number;
  nome_aluno?: string;
  nome: string;
  descricao: string;
  criado_em: string;
}

export interface TreinoExercicio {
    id: number;
    treino_id: number;
    exercicio_id: number;
    series: number;
    repeticoes: number;
    duracao_segundos: number;
    ordem: number;
}

export const getAllAlunos = async (): Promise<Aluno[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Aluno>('SELECT * FROM alunos ORDER BY nome');
};

export const getAlunoById = async (id: number): Promise<Aluno | null> => {
    const db = await getDatabase();
    return await db.getFirstAsync<Aluno>('SELECT * FROM alunos WHERE id = ?', id);
};

export const createAluno = async (nome: string, email: string, celular: string): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO alunos (nome, email, celular) VALUES (?, ?, ?)',
        [nome, email, celular]
    );
    return result.lastInsertRowId;
};

export const updateAluno = async (id: number, nome: string, email: string, celular: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE alunos SET nome = ?, email = ?, celular = ? WHERE id = ?',
        [nome, email, celular, id]
    );
};

export const deleteAluno = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM alunos WHERE id = ?', [id]);
};

export const searchAlunos = async (searchText: string): Promise<Aluno[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Aluno>(
        'SELECT * FROM alunos WHERE nome LIKE ? ORDER BY nome',
        [`%${searchText}%`]
    );
};

//  EXERCICIOS

export const getAllExercicios = async (): Promise<Exercicio[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Exercicio>('SELECT * FROM exercicios ORDER BY nome');
};

export const getExercicioById = async (id: number): Promise<Exercicio | null> => {
    const db = await getDatabase();
    return await db.getFirstAsync<Exercicio>('SELECT * FROM exercicios WHERE id = ?', id);
};

export const createExercicio = async (
    nome: string,
    descricao: string,
    grupo_muscular: string,
    tipo: string,
    nivel_dificuldade: string
): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO exercicios (nome, descricao, grupo_muscular, tipo, nivel_dificuldade) VALUES (?, ?, ?, ?, ?)',
        [nome, descricao, grupo_muscular, tipo, nivel_dificuldade]
    );
    return result.lastInsertRowId;
};

export const updateExercicio = async (
    id: number,
    nome: string,
    descricao: string,
    grupo_muscular: string,
    tipo: string,
    nivel_dificuldade: string
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE exercicios SET nome = ?, descricao = ?, grupo_muscular = ?, tipo = ?, nivel_dificuldade = ? WHERE id = ?',
        [nome, descricao, grupo_muscular, tipo, nivel_dificuldade, id]
    );
};

export const deleteExercicio = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM exercicios WHERE id = ?', [id]);
};

export const searchExercicios = async (searchText: string): Promise<Exercicio[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Exercicio>(
        'SELECT * FROM exercicios WHERE nome LIKE ? ORDER BY nome',
        [`%${searchText}%`]
    );
};

// TREINOS 

export const getAllTreinos = async (): Promise<Treino[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Treino>(`
    SELECT treinos.*, alunos.nome as nome_aluno
    FROM treinos
    LEFT JOIN alunos ON treinos.aluno_id = alunos.id
    ORDER BY alunos.nome
  `);
};

export const getTreinosByAluno = async (aluno_id: number): Promise<Treino[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Treino>(
        'SELECT * FROM treinos WHERE aluno_id = ? ORDER BY nome',
        [aluno_id]
    );
};

export const getTreinoById = async (id: number): Promise<Treino | null> => {
    const db = await getDatabase();
    return await db.getFirstAsync<Treino>(`
    SELECT treinos.*, alunos.nome as nome_aluno
    FROM treinos
    LEFT JOIN alunos ON treinos.aluno_id = alunos.id
    WHERE treinos.id = ?
  `, id);
};

export const createTreino = async (
    aluno_id: number,
    nome: string,
    descricao: string
): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO treinos (aluno_id, nome, descricao) VALUES (?, ?, ?)',
        [aluno_id, nome, descricao]
    );
    return result.lastInsertRowId;
};

export const updateTreino = async (
    id: number,
    aluno_id: number,
    nome: string,
    descricao: string
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE treinos SET aluno_id = ?, nome = ?, descricao = ? WHERE id = ?',
        [aluno_id, nome, descricao, id]
    );
};

export const deleteTreino = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM treinos WHERE id = ?', [id]);
};

// TREINO_EXERCICIOS

export const getExerciciosByTreino = async (treino_id: number): Promise<TreinoExercicio[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<TreinoExercicio>(`
    SELECT treino_exercicios.*, exercicios.nome as nome_exercicio,
           exercicios.grupo_muscular, exercicios.tipo
    FROM treino_exercicios
    LEFT JOIN exercicios ON treino_exercicios.exercicio_id = exercicios.id
    WHERE treino_exercicios.treino_id = ?
    ORDER BY treino_exercicios.ordem
  `, [treino_id]);
};

export const addExercicioAoTreino = async (
    treino_id: number,
    exercicio_id: number,
    series: number,
    repeticoes: number,
    duracao_segundos: number,
    ordem: number
): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO treino_exercicios (treino_id, exercicio_id, series, repeticoes, duracao_segundos, ordem) VALUES (?, ?, ?, ?, ?, ?)',
        [treino_id, exercicio_id, series, repeticoes, duracao_segundos, ordem]
    );
    return result.lastInsertRowId;
};

export const updateExercicioNoTreino = async (
    id: number,
    series: number,
    repeticoes: number,
    duracao_segundos: number,
    ordem: number
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE treino_exercicios SET series = ?, repeticoes = ?, duracao_segundos = ?, ordem = ? WHERE id = ?',
        [series, repeticoes, duracao_segundos, ordem, id]
    );
};

export const removeExercicioDoTreino = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM treino_exercicios WHERE id = ?', [id]);
};

export const removeAllExerciciosDoTreino = async (treino_id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM treino_exercicios WHERE treino_id = ?', [treino_id]);
};