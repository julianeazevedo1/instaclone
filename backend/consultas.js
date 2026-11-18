import banco from './banco.js'

banco.prepare(
  'UPDATE usuarios SET foto = ? WHERE usuario = ?'
).run(
  'https://images.pexels.com/photos/9492602/pexels-photo-9492602.jpeg',
  'ana'
)

console.log(
  banco.prepare('SELECT usuario, foto FROM usuarios WHERE usuario = ?').get('ana')
)

banco.close()