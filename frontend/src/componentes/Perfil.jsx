import './Perfil.css'
import { useEffect, useState } from 'react'
import { useParams } from "react-router-dom"

const URL_API = 'http://localhost:3000/perfis'

function Perfil() {

  //--->js

  const { id } = useParams()
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState("")

useEffect(() => {
        async function carregarPerfil() {
            try {
                if (!id) {
                    throw new Error("ID do perfil não informado")
                }

                const resposta = await fetch(`${URL_API}/${id}`)

                if (!resposta.ok) {
                    throw new Error("Perfil não encontrado")
                }

                const dados = await resposta.json()
                setPerfil(dados)
            } catch (erro) {
                setErro(erro.message)
            }
        }

        carregarPerfil()
    }, [id])

    if (erro) return <p role="alert">{erro}</p>
    if (!perfil) return <p>Carregando perfil...</p>

  //--->html
  return (
  


    <div className="container">
      <div className="card rounded-0 border border-0 mb-4">
        {/* No React, o style recebe um objeto do JavaScript {{ height: '350px' }} */}
        <img
          src="https://png.pngtree.com/background/20210716/original/pngtree-gradient-blue-powder-white-point-card-light-background-picture-image_1347568.jpg"
          className="card-img"
          alt="capa"
          style={{ height: '350px', objectFit: 'cover' }}
        />

        <div className="card-img-overlay">
          <div className="row">
            <div className="col-4 col-sm-4 p-5">
              <img
                src={perfil.fotoPerfil}
                alt={`foto de perfil ${perfil.nome}`}
                className="rounded-circle"
                style={{ width: '200px', height: '200px', objectFit: 'cover' }}
              />
            </div>

            <div className="col-4 col-sm-8 d-flex justify-content-evenly flex-column">
              <div>
                <h2>{perfil.nome}</h2>
                <h6>{perfil.bio}</h6>
                <h6>{perfil.localidade}</h6>
              </div>

              <div className="d-flex justify-content-evenly">
                <div><span className="fw-bold">{perfil.posts}</span> Posts</div>
                <div><span className="fw-bold">{perfil.seguidores}</span> Seguidores</div>
                <div><span className="fw-bold">{perfil.seguindo}</span> Seguindo</div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Perfil
