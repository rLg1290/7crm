import React, { useState, useEffect } from 'react'
import { Download, Eye, Edit, MapPin, Calendar, Tag, Star, Plane, Building, X } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface PromocoesProps {
  user: SupabaseUser
}

interface Promocao {
  id: string
  destino: string
  valor_de: number
  valor_por: number
  tipo: string
  observacoes?: string
  imagem?: string
  ativo: boolean
}

interface EmpresaConfig {
  cor_secundaria?: string
  cor_personalizada?: string
  cor_primaria?: string
  logotipo?: string
  logotipo_2?: string
  nome: string
}

const Promocoes: React.FC<PromocoesProps> = ({ user }) => {
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig | null>(null)
  const [promocaoSelecionada, setPromocaoSelecionada] = useState<Promocao | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewPromocao, setPreviewPromocao] = useState<Promocao | null>(null)


  useEffect(() => {
    carregarPromocoes()
    carregarConfigEmpresa()
  }, [])

  const carregarPromocoes = async () => {
    try {
      const { data: promocoesData, error } = await supabase
        .from('promocoes')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar promoções:', error)
        throw error
      }

      setPromocoes(promocoesData || [])
    } catch (error) {
      console.error('Erro ao carregar promoções:', error)
      alert('Erro ao carregar promoções. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const carregarConfigEmpresa = async () => {
    try {
      const empresaId = user.user_metadata?.empresa_id
      console.log('🔍 Buscando empresa com ID:', empresaId)
      console.log('👤 User metadata completo:', user.user_metadata)
      
      const { data: empresa, error } = await supabase
        .from('empresas')
        .select('nome, logotipo, logotipo_2, cor_personalizada, cor_secundaria, cor_primaria')
        .eq('id', empresaId)
        .single()

      console.log('📊 Resposta do Supabase:', { data: empresa, error })

      if (empresa) {
        console.log('🏢 Dados da empresa carregados:', empresa)
        console.log('🎨 Cor personalizada:', empresa.cor_personalizada)
        console.log('🖼️ Logotipo:', empresa.logotipo)
        setEmpresaConfig(empresa)
      } else {
        // Configuração padrão para demonstração
        setEmpresaConfig({
          nome: 'Sua Agência',
          cor_secundaria: '#1E40AF',
          cor_personalizada: '#3B82F6',
          cor_primaria: '#3B82F6',
          logotipo: '',
          logotipo_2: ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configuração da empresa:', error)
      setEmpresaConfig({
        nome: 'Sua Agência',
        cor_secundaria: '#1E40AF',
        cor_personalizada: '#3B82F6',
        cor_primaria: '#3B82F6',
        logotipo: '',
        logotipo_2: ''
      })
    }
  }

  const calcularDesconto = (valorDe: number, valorPor: number) => {
    return Math.round(((valorDe - valorPor) / valorDe) * 100)
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const gerarImagemPromocao = (promocao: Promocao) => {
    setPromocaoSelecionada(promocao)
    setShowPreview(true)
  }

  const previewTemplate = (promocao: Promocao) => {
    setPreviewPromocao(promocao)
    setShowPreview(true)
  }

  const renderPreviewCanvas = async (canvas: HTMLCanvasElement, promocao: Promocao) => {
    if (!empresaConfig) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Escala para preview (50% do tamanho original)
    const scale = 0.5
    const originalWidth = 1080
    const originalHeight = 1080

    // Função para carregar imagem
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    // Função para desenhar círculo
    const drawCircle = (x: number, y: number, radius: number, color: string, alpha: number = 1) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x * scale, y * scale, radius * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Função para desenhar forma orgânica/blob
    const drawBlob = (x: number, y: number, size: number, color: string, alpha: number = 1) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo((x + size) * scale, y * scale)
      ctx.bezierCurveTo((x + size) * scale, (y - size * 0.6) * scale, (x + size * 0.6) * scale, (y - size) * scale, x * scale, (y - size) * scale)
      ctx.bezierCurveTo((x - size * 0.6) * scale, (y - size) * scale, (x - size) * scale, (y - size * 0.6) * scale, (x - size) * scale, y * scale)
      ctx.bezierCurveTo((x - size) * scale, (y + size * 0.6) * scale, (x - size * 0.6) * scale, (y + size) * scale, x * scale, (y + size) * scale)
      ctx.bezierCurveTo((x + size * 0.6) * scale, (y + size) * scale, (x + size) * scale, (y + size * 0.6) * scale, (x + size) * scale, y * scale)
      ctx.fill()
      ctx.restore()
    }

    const primaryColor = empresaConfig.cor_primaria || '#3B82F6'
    const secondaryColor = empresaConfig.cor_secundaria || '#1E40AF'
    
    console.log('🎨 Usando cor primária das promoções:', primaryColor)
    console.log('🏢 Config da empresa:', empresaConfig)

    try {
        // Verificar se a URL da imagem é válida
        const imageUrl = promocao.imagem || 'https://picsum.photos/800/600?random=1'
        console.log('🖼️ Carregando imagem do preview:', imageUrl)
        
        const destinoImg = await loadImage(imageUrl)
        
        // Calcular dimensões para cobrir todo o canvas mantendo proporção
        const canvasRatio = (originalWidth * scale) / (originalHeight * scale)
        const imgRatio = destinoImg.width / destinoImg.height
        
        let drawWidth, drawHeight, drawX, drawY
        
        if (imgRatio > canvasRatio) {
          // Imagem mais larga que o canvas
          drawHeight = originalHeight * scale
          drawWidth = drawHeight * imgRatio
          drawX = ((originalWidth * scale) - drawWidth) / 2
          drawY = 0
        } else {
          // Imagem mais alta que o canvas
          drawWidth = originalWidth * scale
          drawHeight = drawWidth / imgRatio
          drawX = 0
          drawY = ((originalHeight * scale) - drawHeight) / 2
        }
        
        // Desenhar a imagem cobrindo todo o fundo
        ctx.drawImage(destinoImg, drawX, drawY, drawWidth, drawHeight)
        
      } catch (error) {
        // Se não conseguir carregar a imagem, usar gradiente
        console.error('❌ Erro ao carregar imagem do preview:', error)
        console.log('🔄 Usando gradiente como fallback')
        const imgGradient = ctx.createLinearGradient(0, 0, 0, originalHeight * scale)
        imgGradient.addColorStop(0, primaryColor)
        imgGradient.addColorStop(1, secondaryColor)
        
        ctx.fillStyle = imgGradient
        ctx.fillRect(0, 0, originalWidth * scale, originalHeight * scale)
      }

    // Badge quadrado centralizado no topo
    const badgeSize = 200 * scale
    const badgeX = (originalWidth * scale - badgeSize) / 2
    const badgeY = 0
    
    // Fundo do badge com cor primária (bordas arredondadas apenas embaixo)
    ctx.fillStyle = primaryColor
    ctx.beginPath()
    ctx.moveTo(badgeX, badgeY)
    ctx.lineTo(badgeX + badgeSize, badgeY)
    ctx.lineTo(badgeX + badgeSize, badgeY + badgeSize - 20 * scale)
    ctx.quadraticCurveTo(badgeX + badgeSize, badgeY + badgeSize, badgeX + badgeSize - 20 * scale, badgeY + badgeSize)
    ctx.lineTo(badgeX + 20 * scale, badgeY + badgeSize)
    ctx.quadraticCurveTo(badgeX, badgeY + badgeSize, badgeX, badgeY + badgeSize - 20 * scale)
    ctx.closePath()
    ctx.fill()
    
    // Logo da agência no badge
    const iconCenterX = badgeX + badgeSize/2
    const iconCenterY = badgeY + badgeSize/2
    
    // Tentar carregar logo da agência (usando logotipo_2 para promoções)
    const logoUrl = empresaConfig.logotipo_2
    
    console.log('🖼️ URL da logo a ser usada:', logoUrl)
    console.log('🖼️ Logotipo_2 da empresa:', empresaConfig.logotipo_2)
    
    if (logoUrl) {
      try {
        const logoImg = await loadImage(logoUrl)
        const logoSize = 120 * scale
        const logoX = iconCenterX - logoSize/2
        const logoY = iconCenterY - logoSize/2
        
        // Desenhar logo da agência centralizada no badge
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
      } catch (error) {
        console.log('Erro ao carregar logo:', error)
        // Se não conseguir carregar a logo, mostrar nome da empresa
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${16 * scale}px Arial`
        ctx.textAlign = 'center'
        ctx.fillText(empresaConfig.nome || 'AGÊNCIA', iconCenterX, iconCenterY + 5 * scale)
      }
    } else {
      // Se não tiver logo, mostrar nome da empresa
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${16 * scale}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(empresaConfig.nome || 'AGÊNCIA', iconCenterX, iconCenterY + 5 * scale)
    }
    
    // Campo de pesquisa com nome do destino (com moldura curva mais larga)
    const searchBoxY = badgeY + badgeSize + 50 * scale
    const searchBoxWidth = 700 * scale
    const searchBoxHeight = 100 * scale
    const searchBoxX = (originalWidth * scale - searchBoxWidth) / 2
    
    // Moldura curva transparente para manter sensação de busca (maior)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 6 * scale
    ctx.beginPath()
    ctx.roundRect(searchBoxX, searchBoxY, searchBoxWidth, searchBoxHeight, 50 * scale)
    ctx.stroke()
    
    // Ícone de lupa (maior e branco)
      const lupaX = searchBoxX + 50 * scale
      const lupaY = searchBoxY + searchBoxHeight/2
      const lupaRadius = 15 * scale
      
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 4 * scale
      ctx.beginPath()
      ctx.arc(lupaX, lupaY - 5 * scale, lupaRadius, 0, 2 * Math.PI)
      ctx.stroke()
      
      // Cabo da lupa
      ctx.beginPath()
      ctx.moveTo(lupaX + lupaRadius * 0.7, lupaY - 5 * scale + lupaRadius * 0.7)
      ctx.lineTo(lupaX + lupaRadius * 1.5, lupaY - 5 * scale + lupaRadius * 1.5)
      ctx.stroke()
      
      // Texto do destino (maior e branco com sombra)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${28 * scale}px Arial`
      ctx.textAlign = 'left'
      
      // Adicionar sombra ao texto para melhor legibilidade
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 8 * scale
      ctx.shadowOffsetX = 2 * scale
      ctx.shadowOffsetY = 2 * scale
      
      ctx.fillText(promocao.destino, lupaX + 70 * scale, lupaY + 8 * scale)
    
    // Resetar sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // Layout com elementos ainda maiores e mais impactantes
    const bottomAreaY = originalHeight * scale - 280 * scale
    const centerX = (originalWidth * scale) / 2
    const leftOffset = centerX - 220 * scale // Posição à esquerda do centro
    
    // Fundo escuro semi-transparente para toda a área inferior
    const overlayHeight = 280 * scale
    const gradient = ctx.createLinearGradient(0, originalHeight * scale - overlayHeight, 0, originalHeight * scale)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, originalHeight * scale - overlayHeight, originalWidth * scale, overlayHeight)
    
    // Texto "De:" moderno com valor riscado
    ctx.fillStyle = '#e2e8f0'
    ctx.font = `${24 * scale}px Arial`
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 6 * scale
    ctx.shadowOffsetX = 2 * scale
    ctx.shadowOffsetY = 2 * scale
    
    const valorDeFormatado = promocao.valor_de.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    
    // Desenhar o texto "De:" e valor
    const deText = `De: ${valorDeFormatado}`
    ctx.fillText(deText, leftOffset, bottomAreaY + 30 * scale)
    
    // Adicionar linha riscando o valor
    const textWidth = ctx.measureText(deText).width
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3 * scale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(leftOffset + ctx.measureText('De: ').width, bottomAreaY + 25 * scale)
    ctx.lineTo(leftOffset + textWidth, bottomAreaY + 25 * scale)
    ctx.stroke()
    
    // Texto "Por:" moderno
    ctx.fillStyle = primaryColor
    ctx.font = `bold ${32 * scale}px Arial`
    ctx.fillText('Por apenas:', leftOffset, bottomAreaY + 65 * scale)
    
    // Fundo azul para o preço principal - ainda maior
    const priceBoxY = bottomAreaY + 85 * scale
    const priceBoxWidth = 450 * scale
    const priceBoxHeight = 95 * scale
    const borderRadius = 18 * scale
    
    // Desenhar retângulo com bordas arredondadas
    ctx.fillStyle = primaryColor
    ctx.beginPath()
    ctx.roundRect(leftOffset, priceBoxY, priceBoxWidth, priceBoxHeight, borderRadius)
    ctx.fill()
    
    // Preço principal em branco sobre fundo azul - ainda maior
    ctx.fillStyle = 'white'
    ctx.font = `bold ${58 * scale}px Arial`
    ctx.textAlign = 'left'
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    const priceTextY = priceBoxY + 62 * scale
    const valorFormatado = promocao.valor_por.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    ctx.fillText(valorFormatado, leftOffset + 25 * scale, priceTextY)
    
    // Container inferior para badge e descrição
    const bottomContainerY = priceBoxY + priceBoxHeight + 30 * scale
    
    // Badge laranja "4 diárias" ainda maior
    const orangeBadgeWidth = 170 * scale
    const orangeBadgeHeight = 55 * scale
    const orangeBadgeX = leftOffset
    const orangeBadgeY = bottomContainerY
    
    // Badge com bordas arredondadas
    ctx.fillStyle = secondaryColor
    ctx.beginPath()
    ctx.roundRect(orangeBadgeX, orangeBadgeY, orangeBadgeWidth, orangeBadgeHeight, 10 * scale)
    ctx.fill()
    
    // Texto do badge ainda maior
    ctx.fillStyle = 'white'
    ctx.font = `bold ${24 * scale}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(promocao.tipo, orangeBadgeX + orangeBadgeWidth / 2, orangeBadgeY + 36 * scale)
    
    // Texto descritivo ao lado do badge - responsivo
    ctx.fillStyle = 'white'
    ctx.textAlign = 'left'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 8 * scale
    ctx.shadowOffsetX = 3 * scale
    ctx.shadowOffsetY = 3 * scale
    
    const descriptionX = orangeBadgeX + orangeBadgeWidth + 30 * scale
    
    // Exibir observações da promoção (se houver) com texto responsivo
    if (promocao.observacoes) {
      // Limitar a largura do texto para não ultrapassar o limite do fundo do valor
      const priceBoxEndX = leftOffset + priceBoxWidth
      const maxWidth = priceBoxEndX - descriptionX - (20 * scale)
      const maxHeight = 80 * scale // Altura máxima disponível
      const startY = orangeBadgeY + 22 * scale
      
      // Função para calcular se o texto cabe no espaço disponível
      const fitTextInSpace = (text: string, maxW: number, maxH: number, startFontSize: number) => {
        let fontSize = startFontSize
        let bestFit = null
        
        // Tenta diferentes tamanhos de fonte (de maior para menor)
        for (let size = fontSize; size >= 14 * scale; size -= 2 * scale) {
          ctx.font = `${size}px Arial`
          const lineHeight = size * 1.2
          const words = text.split(' ')
          const lines = []
          let currentLine = ''
          
          // Quebra o texto em linhas
          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + (currentLine ? ' ' : '') + words[i]
            const metrics = ctx.measureText(testLine)
            
            if (metrics.width > maxW && currentLine) {
              lines.push(currentLine)
              currentLine = words[i]
            } else {
              currentLine = testLine
            }
          }
          if (currentLine) lines.push(currentLine)
          
          // Verifica se todas as linhas cabem na altura disponível
          const totalHeight = lines.length * lineHeight
          if (totalHeight <= maxH) {
            bestFit = { fontSize: size, lineHeight, lines }
            break
          }
        }
        
        return bestFit
      }
      
      const textFit = fitTextInSpace(promocao.observacoes, maxWidth, maxHeight, 26 * scale)
      
      if (textFit) {
        ctx.font = `${textFit.fontSize}px Arial`
        let y = startY
        
        textFit.lines.forEach(line => {
          ctx.fillText(line, descriptionX, y)
          y += textFit.lineHeight
        })
      }
    }
    
    // Resetar sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  const baixarImagem = async () => {
    if (!promocaoSelecionada || !empresaConfig) return

    try {
      // Criar canvas para gerar a imagem
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Definir dimensões do canvas (formato Instagram post)
      canvas.width = 1080
      canvas.height = 1080

      // Função para carregar imagem
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      }

      // Função para desenhar círculo
      const drawCircle = (x: number, y: number, radius: number, color: string, alpha: number = 1) => {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Função para desenhar forma orgânica/blob
      const drawBlob = (x: number, y: number, size: number, color: string, alpha: number = 1) => {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(x + size, y)
        ctx.bezierCurveTo(x + size, y - size * 0.6, x + size * 0.6, y - size, x, y - size)
        ctx.bezierCurveTo(x - size * 0.6, y - size, x - size, y - size * 0.6, x - size, y)
        ctx.bezierCurveTo(x - size, y + size * 0.6, x - size * 0.6, y + size, x, y + size)
        ctx.bezierCurveTo(x + size * 0.6, y + size, x + size, y + size * 0.6, x + size, y)
        ctx.fill()
        ctx.restore()
      }



      // Cores da empresa (mesmas do preview)
      const primaryColor = empresaConfig.cor_primaria || '#3B82F6'
      const secondaryColor = empresaConfig.cor_secundaria || '#1E40AF'

      try {
        // Verificar se a URL da imagem é válida
        const imageUrl = promocaoSelecionada.imagem || 'https://picsum.photos/800/600?random=1'
        console.log('🖼️ Carregando imagem do download:', imageUrl)
        
        const destinoImg = await loadImage(imageUrl)
        
        // Calcular dimensões para cobrir todo o canvas mantendo proporção
        const canvasRatio = canvas.width / canvas.height
        const imgRatio = destinoImg.width / destinoImg.height
        
        let drawWidth, drawHeight, drawX, drawY
        
        if (imgRatio > canvasRatio) {
          // Imagem mais larga que o canvas
          drawHeight = canvas.height
          drawWidth = drawHeight * imgRatio
          drawX = (canvas.width - drawWidth) / 2
          drawY = 0
        } else {
          // Imagem mais alta que o canvas
          drawWidth = canvas.width
          drawHeight = drawWidth / imgRatio
          drawX = 0
          drawY = (canvas.height - drawHeight) / 2
        }
        
        // Desenhar a imagem cobrindo todo o fundo
        ctx.drawImage(destinoImg, drawX, drawY, drawWidth, drawHeight)
        
      } catch (error) {
        console.error('❌ Erro ao carregar imagem do download:', error)
        console.log('🔄 Usando gradiente como fallback no download')
        // Fallback: fundo gradiente
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, primaryColor)
        gradient.addColorStop(1, secondaryColor)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      // Usar o mesmo scale do preview
      const scale = canvas.width / 1080
      const originalWidth = 1080
      const originalHeight = 1080

      // Badge quadrado centralizado no topo (mesmo do preview)
      const badgeSize = 200 * scale
      const badgeX = (originalWidth * scale - badgeSize) / 2
      const badgeY = 0
      
      // Fundo do badge com cor primária (bordas arredondadas apenas embaixo)
      ctx.fillStyle = primaryColor
      ctx.beginPath()
      ctx.moveTo(badgeX, badgeY)
      ctx.lineTo(badgeX + badgeSize, badgeY)
      ctx.lineTo(badgeX + badgeSize, badgeY + badgeSize - 20 * scale)
      ctx.quadraticCurveTo(badgeX + badgeSize, badgeY + badgeSize, badgeX + badgeSize - 20 * scale, badgeY + badgeSize)
      ctx.lineTo(badgeX + 20 * scale, badgeY + badgeSize)
      ctx.quadraticCurveTo(badgeX, badgeY + badgeSize, badgeX, badgeY + badgeSize - 20 * scale)
      ctx.closePath()
      ctx.fill()
      
      // Tentar carregar e desenhar logo da empresa no badge
      const iconCenterX = badgeX + badgeSize/2
      const iconCenterY = badgeY + badgeSize/2
      
      if (empresaConfig.logotipo_2) {
        try {
          const logoImg = await loadImage(empresaConfig.logotipo_2)
          const logoSize = 120 * scale
          const logoX = iconCenterX - logoSize/2
          const logoY = iconCenterY - logoSize/2
          
          // Desenhar logo da agência centralizada no badge
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        } catch (error) {
          console.log('Erro ao carregar logo:', error)
          // Se não conseguir carregar a logo, mostrar nome da empresa
          ctx.fillStyle = '#FFFFFF'
          ctx.font = `bold ${16 * scale}px Arial`
          ctx.textAlign = 'center'
          ctx.fillText(empresaConfig.nome || 'AGÊNCIA', iconCenterX, iconCenterY + 5 * scale)
        }
      } else {
        // Se não tiver logo, mostrar nome da empresa
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${16 * scale}px Arial`
        ctx.textAlign = 'center'
        ctx.fillText(empresaConfig.nome || 'AGÊNCIA', iconCenterX, iconCenterY + 5 * scale)
      }
      
      // Campo de pesquisa com nome do destino (mesmo do preview)
      const searchBoxY = badgeY + badgeSize + 50 * scale
      const searchBoxWidth = 700 * scale
      const searchBoxHeight = 100 * scale
      const searchBoxX = (originalWidth * scale - searchBoxWidth) / 2
      
      // Moldura curva transparente
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 6 * scale
      ctx.beginPath()
      ctx.roundRect(searchBoxX, searchBoxY, searchBoxWidth, searchBoxHeight, 50 * scale)
      ctx.stroke()
      
      // Ícone de lupa
      const lupaX = searchBoxX + 50 * scale
      const lupaY = searchBoxY + searchBoxHeight/2
      const lupaRadius = 15 * scale
      
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 4 * scale
      ctx.beginPath()
      ctx.arc(lupaX, lupaY - 5 * scale, lupaRadius, 0, 2 * Math.PI)
      ctx.stroke()
      
      // Cabo da lupa
      ctx.beginPath()
      ctx.moveTo(lupaX + lupaRadius * 0.7, lupaY - 5 * scale + lupaRadius * 0.7)
      ctx.lineTo(lupaX + lupaRadius * 1.5, lupaY - 5 * scale + lupaRadius * 1.5)
      ctx.stroke()
      
      // Texto do destino
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${28 * scale}px Arial`
      ctx.textAlign = 'left'
      
      // Adicionar sombra ao texto
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 8 * scale
      ctx.shadowOffsetX = 2 * scale
      ctx.shadowOffsetY = 2 * scale
      
      ctx.fillText(promocaoSelecionada.destino, lupaX + 70 * scale, lupaY + 8 * scale)
    
      // Resetar sombra
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Layout com elementos (mesmo do preview)
      const bottomAreaY = originalHeight * scale - 280 * scale
      const centerX = (originalWidth * scale) / 2
      const leftOffset = centerX - 220 * scale
      
      // Fundo escuro semi-transparente para toda a área inferior
      const overlayHeight = 280 * scale
      const gradient = ctx.createLinearGradient(0, originalHeight * scale - overlayHeight, 0, originalHeight * scale)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, originalHeight * scale - overlayHeight, originalWidth * scale, overlayHeight)
      
      // Texto "De:" moderno com valor riscado
      ctx.fillStyle = '#e2e8f0'
      ctx.font = `${24 * scale}px Arial`
      ctx.textAlign = 'left'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
      ctx.shadowBlur = 6 * scale
      ctx.shadowOffsetX = 2 * scale
      ctx.shadowOffsetY = 2 * scale
      
      const valorDeFormatado = promocaoSelecionada.valor_de.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      
      // Desenhar o texto "De:" e valor
      const deText = `De: ${valorDeFormatado}`
      ctx.fillText(deText, leftOffset, bottomAreaY + 30 * scale)
      
      // Adicionar linha riscando o valor
      const textWidth = ctx.measureText(deText).width
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 3 * scale
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(leftOffset + ctx.measureText('De: ').width, bottomAreaY + 25 * scale)
      ctx.lineTo(leftOffset + textWidth, bottomAreaY + 25 * scale)
      ctx.stroke()
      
      // Texto "Por:" moderno
      ctx.fillStyle = primaryColor
      ctx.font = `bold ${32 * scale}px Arial`
      ctx.fillText('Por apenas:', leftOffset, bottomAreaY + 65 * scale)
      
      // Fundo azul para o preço principal
      const priceBoxY = bottomAreaY + 85 * scale
      const priceBoxWidth = 450 * scale
      const priceBoxHeight = 95 * scale
      const borderRadius = 18 * scale
      
      // Desenhar retângulo com bordas arredondadas
      ctx.fillStyle = primaryColor
      ctx.beginPath()
      ctx.roundRect(leftOffset, priceBoxY, priceBoxWidth, priceBoxHeight, borderRadius)
      ctx.fill()
      
      // Preço principal em branco sobre fundo azul
      ctx.fillStyle = 'white'
      ctx.font = `bold ${58 * scale}px Arial`
      ctx.textAlign = 'left'
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      const priceTextY = priceBoxY + 62 * scale
      const valorFormatado = promocaoSelecionada.valor_por.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      ctx.fillText(valorFormatado, leftOffset + 25 * scale, priceTextY)
      
      // Container inferior para badge e descrição
      const bottomContainerY = priceBoxY + priceBoxHeight + 30 * scale
      
      // Badge laranja
      const orangeBadgeWidth = 170 * scale
      const orangeBadgeHeight = 55 * scale
      const orangeBadgeX = leftOffset
      const orangeBadgeY = bottomContainerY
      
      // Badge com bordas arredondadas
      ctx.fillStyle = secondaryColor
      ctx.beginPath()
      ctx.roundRect(orangeBadgeX, orangeBadgeY, orangeBadgeWidth, orangeBadgeHeight, 10 * scale)
      ctx.fill()
      
      // Texto do badge
      ctx.fillStyle = 'white'
      ctx.font = `bold ${24 * scale}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(promocaoSelecionada.tipo, orangeBadgeX + orangeBadgeWidth / 2, orangeBadgeY + 36 * scale)
      
      // Texto descritivo ao lado do badge - responsivo
      ctx.fillStyle = 'white'
      ctx.textAlign = 'left'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 8 * scale
      ctx.shadowOffsetX = 3 * scale
      ctx.shadowOffsetY = 3 * scale
      
      const descriptionX = orangeBadgeX + orangeBadgeWidth + 30 * scale
      
      // Exibir observações da promoção (se houver) com texto responsivo
      if (promocaoSelecionada.observacoes) {
        // Limitar a largura do texto para não ultrapassar o limite do fundo do valor
        const priceBoxEndX = leftOffset + priceBoxWidth
        const maxWidth = priceBoxEndX - descriptionX - (20 * scale)
        const maxHeight = 80 * scale
        const startY = orangeBadgeY + 22 * scale
        
        // Função para calcular se o texto cabe no espaço disponível
        const fitTextInSpace = (text: string, maxW: number, maxH: number, startFontSize: number) => {
          let fontSize = startFontSize
          let bestFit = null
          
          // Tenta diferentes tamanhos de fonte (de maior para menor)
          for (let size = fontSize; size >= 14 * scale; size -= 2 * scale) {
            ctx.font = `${size}px Arial`
            const lineHeight = size * 1.2
            const words = text.split(' ')
            const lines = []
            let currentLine = ''
            
            // Quebra o texto em linhas
            for (let i = 0; i < words.length; i++) {
              const testLine = currentLine + (currentLine ? ' ' : '') + words[i]
              const metrics = ctx.measureText(testLine)
              
              if (metrics.width > maxW && currentLine) {
                lines.push(currentLine)
                currentLine = words[i]
              } else {
                currentLine = testLine
              }
            }
            if (currentLine) lines.push(currentLine)
            
            // Verifica se todas as linhas cabem na altura disponível
            const totalHeight = lines.length * lineHeight
            if (totalHeight <= maxH) {
              bestFit = { fontSize: size, lineHeight, lines }
              break
            }
          }
          
          return bestFit
        }
        
        const textFit = fitTextInSpace(promocaoSelecionada.observacoes, maxWidth, maxHeight, 26 * scale)
        
        if (textFit) {
          ctx.font = `${textFit.fontSize}px Arial`
          let y = startY
          
          textFit.lines.forEach(line => {
            ctx.fillText(line, descriptionX, y)
            y += textFit.lineHeight
          })
        }
      }
      
      // Resetar sombra
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Converter canvas para blob e fazer download
      canvas.toBlob((blob) => {
        if (!blob) return
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `promocao-${promocaoSelecionada.destino.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')

    } catch (error) {
      console.error('Erro ao gerar imagem:', error)
      alert('Erro ao gerar a imagem. Tente novamente.')
    }
  }

  const TemplatePromocao = ({ promocao }: { promocao: Promocao }) => {
    if (!empresaConfig) return null

    const desconto = calcularDesconto(promocao.valor_de, promocao.valor_por)

    return (
      <div 
        className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ aspectRatio: '3/4' }}
      >
        {/* Header com logo e cores da agência */}
        <div 
          className="relative h-20 flex items-center justify-between px-6"
          style={{ 
            background: `linear-gradient(135deg, ${empresaConfig.cor_personalizada || '#3B82F6'}, ${empresaConfig.cor_secundaria || '#1E40AF'})` 
          }}
        >
          <div className="flex items-center space-x-3">
            {empresaConfig.logotipo_2 ? (
              <img 
                src={empresaConfig.logotipo_2} 
                alt="Logo" 
                className="h-12 w-12 object-contain bg-white rounded-lg p-1"
              />
            ) : (
              <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-gray-600" />
              </div>
            )}
            <div className="text-white">
              <h3 className="font-bold text-lg">{empresaConfig.nome}</h3>
              <p className="text-xs opacity-90">Sua viagem dos sonhos</p>
            </div>
          </div>
          
          {/* Badge de desconto */}
          <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-sm">
            -{desconto}%
          </div>
        </div>

        {/* Imagem do destino */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={promocao.imagem || 'https://picsum.photos/800/600?random=5'} 
            alt={promocao.destino}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Tipo */}
          <div className="absolute top-4 left-4">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
              {promocao.tipo === 'AEREO' && <Plane className="h-4 w-4 text-blue-600" />}
              {promocao.tipo === 'HOTEL' && <Building className="h-4 w-4 text-green-600" />}
              {promocao.tipo === 'PACOTE' && <Star className="h-4 w-4 text-purple-600" />}
              <span className="text-sm font-medium">{promocao.tipo}</span>
            </div>
          </div>

          {/* Nome do destino */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center space-x-2 text-white">
              <MapPin className="h-5 w-5" />
              <h2 className="text-2xl font-bold">{promocao.destino}</h2>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{promocao.destino}</h3>
            {promocao.observacoes && <p className="text-gray-600 text-sm">{promocao.observacoes}</p>}
          </div>

          {/* Preços */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">De:</span>
              <span className="text-gray-500 line-through text-lg">
                {formatarMoeda(promocao.valor_de)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Por apenas:</span>
              <span 
                className="text-3xl font-bold"
                style={{ color: empresaConfig.cor_personalizada }}
              >
                {formatarMoeda(promocao.valor_por)}
              </span>
            </div>
          </div>

          {/* Tipo de promoção */}
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <Tag className="h-4 w-4" />
            <span>Tipo: {promocao.tipo}</span>
          </div>

          {/* Call to action */}
          <div 
            className="text-center py-3 rounded-lg text-white font-bold"
            style={{ backgroundColor: empresaConfig.cor_personalizada }}
          >
            RESERVE JÁ!
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <div className="text-center text-xs text-gray-500">
            📞 Entre em contato conosco • 🌐 www.suaagencia.com.br
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando promoções...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Promoções</h1>
              <p className="text-gray-600 mt-1">Personalize e baixe materiais promocionais</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Tag className="h-4 w-4" />
                <span>{promocoes.length} promoções disponíveis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {promocoes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma promoção encontrada</h3>
              <p className="text-gray-600 mb-6">As promoções são gerenciadas pelo sistema administrativo interno. Entre em contato com o suporte para adicionar novas promoções.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Informação:</strong> Este sistema permite visualizar e gerar materiais promocionais das promoções cadastradas pelo time administrativo.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Grid de promoções */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promocoes.map((promocao) => (
            <div key={promocao.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Preview da promoção */}
              <div className="relative">
                <img 
                  src={promocao.imagem || 'https://picsum.photos/400/300?random=6'}
                  alt={promocao.destino}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                    -{calcularDesconto(promocao.valor_de, promocao.valor_por)}%
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{promocao.destino}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{promocao.destino}</h3>
                {promocao.observacoes && <p className="text-gray-600 text-sm mb-4">{promocao.observacoes}</p>}
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-gray-500 line-through text-sm">
                      {formatarMoeda(promocao.valor_de)}
                    </span>
                    <span className="text-xl font-bold text-green-600 ml-2">
                      {formatarMoeda(promocao.valor_por)}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                    <button
                      onClick={() => previewTemplate(promocao)}
                      className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                  <button
                    onClick={() => {
                      setPromocaoSelecionada(promocao)
                      baixarImagem()
                    }}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Baixar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Modal de Preview do Template */}
      {showPreview && previewPromocao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Preview do Template</h2>
                <button
                   onClick={() => setShowPreview(false)}
                   className="text-gray-500 hover:text-gray-700"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="flex justify-center">
                <div className="relative">
                  <canvas
                    ref={(canvas) => {
                      if (canvas && previewPromocao) {
                        renderPreviewCanvas(canvas, previewPromocao)
                      }
                    }}
                    width={540}
                    height={540}
                    className="border border-gray-300 rounded-lg shadow-lg"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">Preview em 50% do tamanho original (1080x1080px)</p>
                    <button
                      onClick={() => {
                        setPromocaoSelecionada(previewPromocao)
                        baixarImagem()
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Download className="w-5 h-5" />
                      Baixar Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização da Promoção */}
      {showModal && promocaoSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Preview da Promoção</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex justify-center mb-6">
                <TemplatePromocao promocao={promocaoSelecionada} />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={baixarImagem}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Imagem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

export default Promocoes