import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../componentes/Navbar'
import API_URL from '../api'
import './Foto.css'

const TAMANHO_MAXIMO = 5 * 1024 * 1024
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

function converterCanvas(canvas, qualidade) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Não foi possível processar a foto capturada.'))
    }, 'image/jpeg', qualidade)
  })
}

function PublicarFoto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const campoFoto = useRef(null)
  const videoCamera = useRef(null)
  const streamCamera = useRef(null)
  const previaUrlRef = useRef('')
  const componenteAtivo = useRef(true)
  const [foto, setFoto] = useState(null)
  const [previaUrl, setPreviaUrl] = useState('')
  const [legenda, setLegenda] = useState('')
  const [erro, setErro] = useState('')
  const [erroCamera, setErroCamera] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cameraAberta, setCameraAberta] = useState(false)
  const [cameraCarregando, setCameraCarregando] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraFrontal, setCameraFrontal] = useState(false)

  useEffect(() => {
    if (!cameraAberta || !cameraStream || !videoCamera.current) return

    videoCamera.current.srcObject = cameraStream
    videoCamera.current.play().catch(() => {
      setErroCamera('Não foi possível iniciar a prévia da câmera.')
    })
  }, [cameraAberta, cameraStream])

  useEffect(() => {
    componenteAtivo.current = true
    return () => {
      componenteAtivo.current = false
      streamCamera.current?.getTracks().forEach((faixa) => faixa.stop())
      if (previaUrlRef.current) URL.revokeObjectURL(previaUrlRef.current)
    }
  }, [])

  function atualizarFoto(arquivo) {
    if (previaUrlRef.current) URL.revokeObjectURL(previaUrlRef.current)
    previaUrlRef.current = arquivo ? URL.createObjectURL(arquivo) : ''
    setPreviaUrl(previaUrlRef.current)
    setFoto(arquivo)
  }

  function pararCamera() {
    streamCamera.current?.getTracks().forEach((faixa) => faixa.stop())
    streamCamera.current = null
    setCameraStream(null)
  }

  function fecharCamera() {
    pararCamera()
    setCameraAberta(false)
  }

  async function abrirCamera(frontal = cameraFrontal) {
    setErroCamera('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setErroCamera('A câmera não está disponível. Acesse o aplicativo por HTTPS ou localhost usando um navegador compatível.')
      return
    }

    setCameraCarregando(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: frontal ? 'user' : 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (!componenteAtivo.current) {
        stream.getTracks().forEach((faixa) => faixa.stop())
        return
      }

      pararCamera()
      streamCamera.current = stream
      setCameraStream(stream)
      setCameraFrontal(frontal)
      setCameraAberta(true)
    } catch (erroAcesso) {
      if (!componenteAtivo.current) return
      if (erroAcesso.name === 'NotAllowedError' || erroAcesso.name === 'SecurityError') {
        setErroCamera('Permita o acesso à câmera nas configurações do navegador e tente novamente.')
      } else if (erroAcesso.name === 'NotFoundError' || erroAcesso.name === 'DevicesNotFoundError') {
        setErroCamera('Nenhuma câmera foi encontrada neste dispositivo.')
      } else if (erroAcesso.name === 'NotReadableError' || erroAcesso.name === 'TrackStartError') {
        setErroCamera('A câmera está em uso por outro aplicativo.')
      } else {
        setErroCamera('Não foi possível acessar a câmera. Verifique a permissão e tente novamente.')
      }
    } finally {
      if (componenteAtivo.current) setCameraCarregando(false)
    }
  }

  function alternarCamera() {
    const frontal = !cameraFrontal
    fecharCamera()
    abrirCamera(frontal)
  }

  async function capturarFoto() {
    const video = videoCamera.current
    if (!video?.videoWidth || !video.videoHeight) {
      setErroCamera('Aguarde a câmera iniciar antes de tirar a foto.')
      return
    }

    const escalaInicial = Math.min(1, 1920 / video.videoWidth, 1920 / video.videoHeight)
    let largura = Math.round(video.videoWidth * escalaInicial)
    let altura = Math.round(video.videoHeight * escalaInicial)
    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura

    const contexto = canvas.getContext('2d')
    if (!contexto) {
      setErroCamera('Não foi possível processar a foto capturada.')
      return
    }

    contexto.drawImage(video, 0, 0, largura, altura)

    try {
      let blob = await converterCanvas(canvas, 0.86)
      while (blob.size > TAMANHO_MAXIMO && Math.max(largura, altura) > 640) {
        if (!componenteAtivo.current) return
        largura = Math.max(1, Math.round(largura * 0.8))
        altura = Math.max(1, Math.round(altura * 0.8))
        canvas.width = largura
        canvas.height = altura
        contexto.drawImage(video, 0, 0, largura, altura)
        blob = await converterCanvas(canvas, 0.78)
      }

      if (!componenteAtivo.current) return
      if (blob.size > TAMANHO_MAXIMO) {
        setErroCamera('A foto capturada ultrapassa o limite de 5 MB. Tente novamente.')
        return
      }

      atualizarFoto(new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      setErro('')
      if (campoFoto.current) campoFoto.current.value = ''
      fecharCamera()
    } catch (erroCaptura) {
      if (componenteAtivo.current) {
        setErroCamera(erroCaptura.message || 'Não foi possível processar a foto capturada.')
      }
    }
  }

  function cancelarFoto() {
    atualizarFoto(null)
    setErro('')
    if (campoFoto.current) campoFoto.current.value = ''
  }

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0] ?? null
    setErro('')
    setErroCamera('')
    fecharCamera()

    if (arquivo && !TIPOS_PERMITIDOS.includes(arquivo.type)) {
      setErro('Escolha uma imagem JPEG, PNG ou WEBP.')
      event.target.value = ''
      atualizarFoto(null)
      return
    }

    if (arquivo && arquivo.size > TAMANHO_MAXIMO) {
      setErro('A imagem deve ter no máximo 5 MB.')
      event.target.value = ''
      atualizarFoto(null)
      return
    }

    atualizarFoto(arquivo)
  }

  async function publicar(event) {
    event.preventDefault()
    setErro('')

    if (!foto) {
      setErro('Selecione uma foto para publicar.')
      return
    }

    const token = sessionStorage.getItem('instaclone_token')
    if (!token) {
      setErro('Entre na sua conta para publicar uma foto.')
      return
    }

    const dados = new FormData()
    dados.append('foto', foto)
    dados.append('legenda', legenda)
    setEnviando(true)

    try {
      const resposta = await fetch(`${API_URL}/perfis/${id}/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: dados,
      })
      const post = await resposta.json()

      if (!resposta.ok) {
        throw new Error(post.mensagem || 'Não foi possível publicar a foto.')
      }

      atualizarFoto(null)
      setLegenda('')
      if (campoFoto.current) campoFoto.current.value = ''
      navigate(`/feed/${id}`)
    } catch (erroPublicacao) {
      setErro(erroPublicacao.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container-fluid min-vh-100 px-0">
      <div className="row g-0">
        <Navbar />
        <main className="col-12 p-3 p-md-4 publicar-main">
          <div className="publicar-container mx-auto">
            <div className="text-center mb-4 publicar-heading">
              <h1 className="h3 fw-bold mb-1">Nova publicação</h1>
              <p className="mb-0">Compartilhe uma foto</p>
            </div>

            <div className="card publicar-card mb-4">
              <div className="card-header publicar-card-header">
                <h2 className="h5 mb-0">Nova publicação</h2>
              </div>
              <div className="card-body">
                <form onSubmit={publicar}>
                  <div className="mb-3">
                    <label htmlFor="foto-publicacao" className="form-label">Escolha uma foto</label>
                    <input
                      ref={campoFoto}
                      id="foto-publicacao"
                      name="foto"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="form-control publicar-input"
                      disabled={enviando}
                      onChange={selecionarFoto}
                    />
                    <div className="form-text">JPEG, PNG ou WEBP; até 5 MB.</div>
                    <div className="publicar-camera-acoes">
                      {!cameraAberta && (
                        <button
                          className="publicar-camera-botao"
                          type="button"
                          disabled={cameraCarregando || enviando}
                          onClick={() => abrirCamera()}
                        >
                          <i className={`bi ${cameraCarregando ? 'bi-arrow-repeat' : 'bi-camera'}`} aria-hidden="true" />
                          {cameraCarregando ? 'Abrindo câmera...' : 'Abrir câmera'}
                        </button>
                      )}
                      {foto && (
                        <button
                          className="publicar-camera-botao publicar-camera-secundario"
                          type="button"
                          disabled={enviando}
                          onClick={cancelarFoto}
                        >
                          Cancelar foto
                        </button>
                      )}
                    </div>

                    {erroCamera && <p className="publicar-camera-erro" role="alert">{erroCamera}</p>}

                    {cameraAberta && (
                      <div className="publicar-camera">
                        <video
                          ref={videoCamera}
                          className="publicar-camera-video"
                          autoPlay
                          muted
                          playsInline
                          aria-label="Prévia da câmera"
                        />
                        <div className="publicar-camera-acoes">
                          <button
                            className="publicar-camera-botao publicar-camera-secundario"
                            type="button"
                            disabled={cameraCarregando}
                            onClick={alternarCamera}
                          >
                            <i className="bi bi-arrow-repeat" aria-hidden="true" />
                            Alternar câmera
                          </button>
                          <button
                            className="publicar-camera-botao"
                            type="button"
                            disabled={cameraCarregando}
                            onClick={capturarFoto}
                          >
                            <i className="bi bi-camera-fill" aria-hidden="true" />
                            Tirar foto
                          </button>
                          <button
                            className="publicar-camera-botao publicar-camera-secundario"
                            type="button"
                            onClick={fecharCamera}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {foto && previaUrl && (
                      <div className="publicar-previa">
                        <img src={previaUrl} alt="Prévia da foto que será publicada" />
                        <div className="publicar-previa-acoes">
                          <span>Confira sua foto antes de publicar</span>
                          <button
                            className="publicar-camera-botao publicar-camera-secundario"
                            type="button"
                            disabled={cameraCarregando || enviando}
                            onClick={() => abrirCamera()}
                          >
                            <i className="bi bi-arrow-repeat" aria-hidden="true" />
                            Tirar outra
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="legenda-publicacao" className="form-label">Legenda (opcional)</label>
                    <textarea
                      id="legenda-publicacao"
                      name="legenda"
                      className="form-control publicar-input"
                      rows="2"
                      maxLength="2000"
                      disabled={enviando}
                      value={legenda}
                      onChange={(event) => setLegenda(event.target.value)}
                    />
                  </div>

                  {erro && <div className="alert alert-danger" role="alert">{erro}</div>}

                  <button
                    type="submit"
                    className="btn rounded-pill px-4 publicar-submit"
                    disabled={enviando}
                  >
                    {enviando ? 'Publicando...' : 'Publicar foto'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default PublicarFoto
