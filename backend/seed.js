// ============================================================
//  Dados de exemplo do "Instaclone"
//
//  Para usar:  npm run seed
//
//  Apaga o que existe no banco e cria 5 contas de desenvolvimento.
//  A senha de todas elas é 123456.
// ============================================================

import bcrypt from 'bcryptjs'
import banco from './banco.js'

const exemplos = [
  {
    usuario: 'ana',
    nome: 'Ana Souza',
    bio: 'UX Designer',
    localidade: 'Fortaleza, Brasil',
    foto: 'https://images.pexels.com/photos/9492602/pexels-photo-9492602.jpeg',
  },
  {
    usuario: 'bruno',
    nome: 'Bruno Lima',
    bio: 'Product Owner.',
    localidade: 'Fortaleza, Brasil',
    foto: 'https://images.pexels.com/photos/6804096/pexels-photo-6804096.jpeg',
  },
  {
    usuario: 'carla',
    nome: 'Carla Mendes',
    bio: 'Product Manager',
    localidade: 'Fortaleza, Brasil',
    foto: 'https://images.pexels.com/photos/7793153/pexels-photo-7793153.jpeg',
  },
  {
    usuario: 'diego',
    nome: 'Diego Rocha',
    bio: 'Engenheiro de Software',
    localidade: 'Fortaleza, Brasil',
    foto: 'https://images.pexels.com/photos/19805885/pexels-photo-19805885.jpeg',
  },
  {
    usuario: 'elisa',
    nome: 'Elisa Torres',
    bio: 'Cientista de Dados',
    localidade: 'Fortaleza, Brasil',
    foto: 'https://media.istockphoto.com/id/1321462048/pt/foto/digital-transformation-concept-system-engineering-binary-code-programming.jpg?s=1024x1024&w=is&k=20&c=w4ZPf_KXX-a2PhoDMpbWiz7pzJQ5_NeuqzTjhq4eA-4=',
  },
]

// Apaga os dados antigos (as tabelas continuam existindo)
banco.exec('DELETE FROM seguidores')
banco.exec('DELETE FROM story_views')
banco.exec('DELETE FROM posts')
banco.exec('DELETE FROM usuarios')
banco.exec('DELETE FROM sqlite_sequence') // faz os ids voltarem a começar do 1

// A senha nunca é guardada como está: guardamos só a "mistura" (hash) dela
const senhaComHash = bcrypt.hashSync('123456', 10)

exemplos.forEach((pessoa) => {
  banco
    .prepare('INSERT INTO usuarios (usuario, senha, nome, bio, localidade, foto) VALUES (?, ?, ?, ?, ?, ?)')
    .run(pessoa.usuario, senhaComHash, pessoa.nome, pessoa.bio, pessoa.localidade, pessoa.foto)
})

console.log('Pronto! Criei 5 contas de desenvolvimento, sem publicações de exemplo.')
console.log('Para entrar, use ana, bruno, carla, diego ou elisa, com a senha 123456.')

banco.prepare(
  'INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)'
).run(2, 1)