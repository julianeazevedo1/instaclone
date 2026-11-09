import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';


function Configuracao() {
  
  //js
const { id } = useParams();
const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState('')
   const [mensagem, setMensagem] = useState('')


   useEffect(() => {
    async function carregarPerfil() {
      try {
        const resposta = await fetch(`http://localhost:3000/perfis/${id}`)
        if (!resposta.ok) throw new Error('Não foi possível carregar o perfil')
        setPerfil(await resposta.json())
      } catch (erro) {
        setErro(erro.message)
      }
    }

    carregarPerfil()
  }, [id])
function alterarCampo(campo, valor) {
    setPerfil((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvarPerfil(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')

    const parametros = new URLSearchParams({
      nome: perfil.nome,
      bio: perfil.bio,
      localidade: perfil.localidade,
    })

    try {
      const resposta = await fetch(
        `http://localhost:3000/perfis/${id}?${parametros}`,
        { method: 'PATCH' }
      )

      if (!resposta.ok) throw new Error('Não foi possível salvar as alterações')

      setPerfil(await resposta.json())
      setMensagem('Perfil atualizado!')
    } catch (erro) {
      setErro(erro.message)
    }
  }

  if (erro && !perfil) return <p role="alert">{erro}</p>
  if (!perfil) return <p>Carregando perfil...</p>



  //html
return (
<>
<div>
  <label htmlFor="sizesTextareaSmall" className="form-label">nome</label>
  
   <input
        id="nome"
        name="nome"
        className="form-control"
        value={perfil.nome ?? ''}
          onChange={(event) => alterarCampo('nome', event.target.value)}
      />
</div>

<div>
  <label htmlFor="sizesTextareaDefault" className="form-label">Bio</label>
  <input
    id="bio"
    name="bio"
    className="form-control"
    rows="3"
    value={perfil.bio ?? ''}
    onChange={(event) => alterarCampo('bio', event.target.value)}
  />
</div>
<div>
  <label htmlFor="sizesTextareaLarge" className="form-label">Localidade</label>
  <input
    id="localidade"
    name="localidade"
    className="form-control"
    value={perfil.localidade ?? ''}
    onChange={(event) => alterarCampo('localidade', event.target.value)}

    
  />


</div> 


<div style={{margin:'20px',padding:'10px'}}>
  <button type="button" className="btn-solid theme-primary" onClick={salvarPerfil}>
    Salvar
  </button>
  {mensagem && <p role="status">{mensagem}</p>}
  </div>
 

  </>
)



  


}

export default Configuracao