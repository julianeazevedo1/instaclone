import { useParams } from 'react-router-dom'
import Navbar from '../componentes/Navbar'
import Perfil from '../componentes/Perfil'
import Feed from '../componentes/Feed'

function PaginaPerfil() {
  const { id } = useParams()

  return (
    <div className="container-fluid min-vh-100 px-0" >
      <div className="row g-0">
        <Navbar />
        <main className="col-12 perfil-main">
          <Perfil />
          <Feed perfilId={id} />
        </main>
      </div>
    </div>
  )
}

export default PaginaPerfil
