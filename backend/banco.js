import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const caminhoBanco = fileURLToPath(new URL('./banco.db', import.meta.url))
const banco = new DatabaseSync(caminhoBanco)

banco.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    senha   TEXT NOT NULL,
    nome    TEXT NOT NULL DEFAULT '',
    bio     TEXT NOT NULL DEFAULT '',
    foto    TEXT NOT NULL DEFAULT 'sem-foto.svg',
    localidade TEXT NOT NULL DEFAULT '',
    capa    TEXT NOT NULL DEFAULT ''
  );

 CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    imagem     TEXT NOT NULL,
    legenda    TEXT NOT NULL DEFAULT ''
  );


  CREATE TABLE IF NOT EXISTS seguidores (
  seguidor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  PRIMARY KEY (seguidor_id, seguido_id),
  CHECK (seguidor_id <> seguido_id)
);

  CREATE TABLE IF NOT EXISTS story_views (
    visualizador_id INTEGER NOT NULL REFERENCES usuarios(id),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    visualizado_em TEXT NOT NULL,
    PRIMARY KEY (visualizador_id, post_id)
  );
`)



const colunasUsuarios = banco.prepare('PRAGMA table_info(usuarios)').all()
if (!colunasUsuarios.some((coluna) => coluna.name === 'localidade')) {
  banco.exec("ALTER TABLE usuarios ADD COLUMN localidade TEXT NOT NULL DEFAULT ''")
}
if (!colunasUsuarios.some((coluna) => coluna.name === 'email')) {
  banco.exec('ALTER TABLE usuarios ADD COLUMN email TEXT')
}
if (!colunasUsuarios.some((coluna) => coluna.name === 'capa')) {
  banco.exec("ALTER TABLE usuarios ADD COLUMN capa TEXT NOT NULL DEFAULT ''")
}

const colunasPosts = banco.prepare('PRAGMA table_info(posts)').all()
if (!colunasPosts.some((coluna) => coluna.name === 'publicado_em')) {
  banco.exec('ALTER TABLE posts ADD COLUMN publicado_em TEXT')
}

banco.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unique
  ON usuarios(lower(email))
  WHERE email IS NOT NULL AND email <> ''
`)

// Deixa o "banco" disponível para os outros arquivos usarem
export default banco