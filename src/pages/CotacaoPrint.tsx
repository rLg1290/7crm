import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plane, User, MapPin, Calendar, Clock, Phone, Mail, Users, FileText, Printer, Download, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

// Função para formatar datas
function formatarDataLocal(dateString: string): string {
  if (!dateString) return '-';
  const [ano, mes, dia] = dateString.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}

// Função para formatar horário sem segundos
function formatarHorario(horario: string): string {
  if (!horario) return '-';
  
  // Se o horário tem 8 caracteres (HH:MM:SS), remove os segundos
  if (horario.length === 8 && horario.includes(':')) {
    return horario.substring(0, 5); // Pega apenas HH:MM
  }
  
  // Se já está no formato HH:MM ou outro formato, retorna como está
  return horario;
}

const CotacaoPrint: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState<string>('Agência');
  const [empresaCnpj, setEmpresaCnpj] = useState<string>('-');
  const [empresaTelefone, setEmpresaTelefone] = useState<string>('');
  const [empresaEmail, setEmpresaEmail] = useState<string>('');
  const [empresaEndereco, setEmpresaEndereco] = useState<string>('');
  const [empresaCorPersonalizada, setEmpresaCorPersonalizada] = useState<string>('#0d9488');
  const [loading, setLoading] = useState(true);
  const [cotacao, setCotacao] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [voos, setVoos] = useState<any[]>([]);
  const [passageiros, setPassageiros] = useState<any[]>([]);
  const [ciasAereas, setCiasAereas] = useState<any[]>([]);

  const gerarCoresPersonalizadas = (corPrincipal: string) => {
    const hex = corPrincipal.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const escurecerCor = (r: number, g: number, b: number, fator: number) => {
      return `rgb(${Math.round(r * fator)}, ${Math.round(g * fator)}, ${Math.round(b * fator)})`;
    };
    
    const clarearCor = (r: number, g: number, b: number, fator: number) => {
      const novoR = Math.round(r + (255 - r) * fator);
      const novoG = Math.round(g + (255 - g) * fator);
      const novoB = Math.round(b + (255 - b) * fator);
      return `rgb(${novoR}, ${novoG}, ${novoB})`;
    };
    
    return {
      primary: corPrincipal,
      gradientFrom: corPrincipal,
      gradientTo: escurecerCor(r, g, b, 0.8),
      backgroundLight: clarearCor(r, g, b, 0.9),
      backgroundMedium: clarearCor(r, g, b, 0.8),
      textColor: '#1f2937',
      borderColor: clarearCor(r, g, b, 0.6)
    };
  };

  // Função para buscar logo da companhia aérea
  const getLogoCompanhia = (nomeCompanhia: string) => {
    const cia = ciasAereas.find(c => 
      c.nome?.toLowerCase() === nomeCompanhia?.toLowerCase() ||
      c.nome?.toLowerCase().includes(nomeCompanhia?.toLowerCase())
    );
    return cia?.logo_url || null;
  };

  const buscarDadosCotacao = async () => {
      setLoading(true);
      const url = new URL(window.location.href);
      const pathParts = url.pathname.split('/').filter(Boolean);
    const cotacaoId = pathParts[pathParts.length - 2];
    
    try {
      // Buscar cotação
      const { data: cot, error: cotacaoError } = await supabase
        .from('cotacoes')
        .select('*')
        .eq('id', cotacaoId)
        .single();
      
      if (cotacaoError || !cot) {
        console.error('Erro ao buscar cotação:', cotacaoError);
        setLoading(false);
        return;
      }
      
      setCotacao(cot);

      // Buscar dados da empresa
      if (cot.empresa_id) {
        const { data: empresaData } = await supabase
            .from('empresas')
          .select('*')
          .eq('id', cot.empresa_id)
            .single();
        
        if (empresaData) {
          setEmpresaNome(empresaData.nome || 'Agência');
          setEmpresaCnpj(empresaData.cnpj || '-');
          setEmpresaLogo(empresaData.logotipo || null);
          setEmpresaTelefone(empresaData.telefone || '');
          setEmpresaEmail(empresaData.email || '');
          setEmpresaEndereco(empresaData.endereco || '');
          setEmpresaCorPersonalizada(empresaData.cor_personalizada || '#0d9488');
        }
      }

      // Buscar cliente
      if (cot.cliente_id) {
        const { data: clienteData } = await supabase
          .from('clientes')
        .select('*')
          .eq('id', cot.cliente_id)
        .single();
        
        if (clienteData) {
          setCliente(clienteData);
        }
      }

      // Buscar voos
      const { data: voosData } = await supabase
        .from('voos')
        .select('*')
        .eq('cotacao_id', cotacaoId);
      
      if (voosData) {
        setVoos(voosData);
      }

      // Buscar passageiros
      const { data: passageirosData } = await supabase
        .from('cotacao_passageiros')
          .select('*')
        .eq('cotacao_id', cotacaoId);
      
      if (passageirosData) {
      setPassageiros(passageirosData);
      }

      // Buscar companhias aéreas
      const { data: ciasData } = await supabase
        .from('CiasAereas')
        .select('*');
      
      if (ciasData) {
        setCiasAereas(ciasData);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
    
      setLoading(false);
  };

  // Função para gerar PDF nativo
  const gerarPDF = async () => {
    try {
      console.log('📄 Iniciando geração do PDF nativo...');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let currentY = 20;
      const pageHeight = 297;
      const margin = 20;
      const maxWidth = 170;
      
      // Função para adicionar texto
      const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        const lines = pdf.splitTextToSize(text, maxWidth - x);
        pdf.text(lines, x, y);
        return y + (lines.length * fontSize * 0.35);
      };
      
      // Função para verificar quebra de página
      const checkPageBreak = (neededSpace: number) => {
        if (currentY + neededSpace > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
      };
      
      // CABEÇALHO COLORIDO
      const hex = empresaCorPersonalizada.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      pdf.setFillColor(r * 255, g * 255, b * 255);
      pdf.rect(0, 0, 210, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      currentY = addText(empresaNome.toUpperCase(), margin, 25, 20, true);
      currentY = addText(`CNPJ: ${empresaCnpj}`, margin, currentY + 2, 12);
      currentY = addText('AGÊNCIA DE VIAGENS', margin, currentY + 2, 14, true);
      
      pdf.setTextColor(0, 0, 0);
      currentY = 70;

      // TÍTULO DO DOCUMENTO
      checkPageBreak(25);
      currentY = addText('CONFIRMAÇÃO DE RESERVA AÉREA', margin, currentY, 18, true);
      currentY += 10;
      
      // CÓDIGO DA COTAÇÃO
      checkPageBreak(20);
      currentY = addText(`Cotação: ${cotacao?.codigo || 'N/A'}`, margin, currentY, 14, true);
      currentY += 15;
      
      // INFORMAÇÕES DO CLIENTE
      checkPageBreak(30);
      currentY = addText('DADOS DO CLIENTE', margin, currentY, 14, true);
      currentY += 8;
      
      if (cliente) {
        const nomeCompleto = cliente.nome;
        currentY = addText(`Nome: ${nomeCompleto}`, margin, currentY, 12);
        currentY += 5;
        if (cliente.telefone) {
          currentY = addText(`Telefone: ${cliente.telefone}`, margin, currentY, 12);
          currentY += 5;
        }
      }
      currentY += 10;
      
      // PASSAGEIROS
      if (passageiros && passageiros.length > 0) {
        checkPageBreak(40);
        currentY = addText('PASSAGEIROS', margin, currentY, 14, true);
        currentY += 8;
        
        passageiros.forEach((passageiro, index) => {
          checkPageBreak(15);
          currentY = addText(`${index + 1}. ${passageiro.nome}`, margin, currentY, 12);
          currentY += 4;
          if (passageiro.documento) {
            currentY = addText(`   CPF: ${passageiro.documento}`, margin, currentY, 10);
            currentY += 4;
          }
          if (passageiro.data_nascimento) {
            currentY = addText(`   Nascimento: ${formatarDataLocal(passageiro.data_nascimento)}`, margin, currentY, 10);
            currentY += 4;
          }
          currentY += 2;
        });
        currentY += 10;
      }
      
      // VOOS DIVIDIDOS POR TRECHO
      if (voos && voos.length > 0) {
        checkPageBreak(50);
        currentY = addText('DETALHES DOS VOOS', margin, currentY, 14, true);
        currentY += 8;
        
        // Voos de Ida
        const voosIda = voos.filter(voo => voo.direcao === 'IDA');
        if (voosIda.length > 0) {
          checkPageBreak(30);
          currentY = addText('VOOS DE IDA', margin, currentY, 13, true);
          currentY += 6;
          
          voosIda.forEach((voo, index) => {
            checkPageBreak(40);
            currentY = addText(`VOO ${index + 1}`, margin, currentY, 12, true);
            currentY += 6;
            
            currentY = addText(`Companhia: ${voo.companhia || 'N/A'}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Número: ${voo.numero_voo || 'N/A'}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Rota: ${voo.origem} → ${voo.destino}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Data: ${formatarDataLocal(voo.data_ida)}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Horário: ${formatarHorario(voo.horario_partida)} - ${formatarHorario(voo.horario_chegada)}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Classe: ${voo.classe || 'Econômica'}`, margin + 5, currentY, 11);
            currentY += 8;
          });
        }
        
        // Voos Internos
        const voosInternos = voos.filter(voo => voo.direcao === 'INTERNO');
        if (voosInternos.length > 0) {
          checkPageBreak(30);
          currentY = addText('VOOS INTERNOS', margin, currentY, 13, true);
          currentY += 6;
          
          voosInternos.forEach((voo, index) => {
            checkPageBreak(40);
            currentY = addText(`VOO ${index + 1}`, margin, currentY, 12, true);
            currentY += 6;
            
            currentY = addText(`Companhia: ${voo.companhia || 'N/A'}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Número: ${voo.numero_voo || 'N/A'}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Rota: ${voo.origem} → ${voo.destino}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Data: ${formatarDataLocal(voo.data_ida)}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Horário: ${formatarHorario(voo.horario_partida)} - ${formatarHorario(voo.horario_chegada)}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Classe: ${voo.classe || 'Econômica'}`, margin + 5, currentY, 11);
            currentY += 8;
          });
        }
        
        // Voos de Volta
        const voosVolta = voos.filter(voo => voo.direcao === 'VOLTA');
        if (voosVolta.length > 0) {
          checkPageBreak(30);
          currentY = addText('VOOS DE VOLTA', margin, currentY, 13, true);
          currentY += 6;
          
          voosVolta.forEach((voo, index) => {
            checkPageBreak(40);
            currentY = addText(`VOO ${index + 1}`, margin, currentY, 12, true);
            currentY += 6;
            
            currentY = addText(`Companhia: ${voo.companhia || 'N/A'}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Número: ${voo.numero_voo || 'N/A'}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Rota: ${voo.origem} → ${voo.destino}`, margin + 5, currentY, 11);
            currentY += 4;
            const dataVoo = voo.data_volta ? formatarDataLocal(voo.data_volta) : formatarDataLocal(voo.data_ida);
            currentY = addText(`Data: ${dataVoo}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Horário: ${formatarHorario(voo.horario_partida)} - ${formatarHorario(voo.horario_chegada)}`, margin + 5, currentY, 11);
            currentY += 4;
            currentY = addText(`Classe: ${voo.classe || 'Econômica'}`, margin + 5, currentY, 11);
            currentY += 8;
          });
        }
      }
      
      // DETALHES DA VIAGEM
      checkPageBreak(50);
      currentY = addText('DETALHES DA VIAGEM', margin, currentY, 14, true);
      currentY += 8;
      
      if (cotacao) {
        currentY = addText(`Destino: ${cotacao.destino || 'N/A'}`, margin, currentY, 12);
        currentY += 5;
        currentY = addText(`Data da Viagem: ${formatarDataLocal(cotacao.data_viagem)}`, margin, currentY, 12);
        currentY += 5;
        currentY = addText(`Status: ${cotacao.status || 'N/A'}`, margin, currentY, 12);
        currentY += 5;
        
        if (cotacao.valor) {
          const valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(cotacao.valor);
          currentY = addText(`Valor Total: ${valorFormatado}`, margin, currentY, 14, true);
          currentY += 8;
        }
        
        if (cotacao.observacoes) {
          checkPageBreak(30);
          currentY = addText('OBSERVAÇÕES:', margin, currentY, 12, true);
          currentY += 5;
          currentY = addText(cotacao.observacoes, margin, currentY, 11);
          currentY += 10;
        }
      }
      
      // RODAPÉ
      checkPageBreak(40);
      currentY = Math.max(currentY, pageHeight - 60);
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY, 190, currentY);
      currentY += 8;
      
      const agora = new Date();
      const dataEmissao = agora.toLocaleString('pt-BR');
      currentY = addText(`Emitido em: ${dataEmissao}`, margin, currentY, 10);
      currentY += 4;
      
      if (empresaEndereco) {
        currentY = addText(`${empresaEndereco}`, margin, currentY, 9);
        currentY += 3;
      }
      
      if (empresaTelefone || empresaEmail) {
        const contato = [empresaTelefone, empresaEmail].filter(Boolean).join(' - ');
        currentY = addText(contato, margin, currentY, 9);
        currentY += 3;
      }
      
      currentY = addText('Esta é uma confirmação de reserva. Verificar condições e políticas da companhia aérea.', margin, currentY, 8);
      
      // Salvar PDF
      const nomeArquivo = `Cotacao_${cotacao?.codigo || 'reserva'}_${Date.now()}.pdf`;
      pdf.save(nomeArquivo);
      
      console.log('✅ PDF gerado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  // Função para impressão profissional - reproduz fielmente a página original
  const imprimirPagina = () => {
    // Criar nova janela
    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o documento');
      return;
    }

    const cores = gerarCoresPersonalizadas(empresaCorPersonalizada);
    
    // HTML completo que replica exatamente a página original
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cotação ${cotacao?.codigo || 'Documento'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f9fafb;
            color: #1f2937;
            line-height: 1.3;
            font-size: 11px; /* Reduzido de 14px */
          }
          
          .container {
            max-width: 1000px; /* Reduzido de 1280px */
            margin: 0 auto;
            padding: 8px; /* Reduzido pela metade de 16px */
            background: white;
          }
          
          /* Cabeçalho */
          .header {
            background: linear-gradient(135deg, ${cores.gradientFrom} 0%, ${cores.gradientTo} 100%);
            color: white;
            padding: 16px; /* Reduzido de 24px */
            border-radius: 8px; /* Reduzido de 12px */
            margin-bottom: 16px; /* Reduzido de 24px */
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 12px; /* Reduzido de 16px */
          }
          
          .logo {
            width: 40px; /* Reduzido de 60px */
            height: 40px; /* Reduzido de 60px */
            background: white;
            border-radius: 6px; /* Reduzido de 8px */
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: ${cores.primary};
            font-size: 14px; /* Reduzido de 20px */
          }
          
          /* Informações de Contato */
          .contact-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: right;
            font-size: 11px;
          }
          
          .contact-item {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
          }
          
          .contact-icon {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
          }
          
          .header-info h1 {
            font-size: 20px; /* Reduzido de 28px */
            font-weight: bold;
            margin-bottom: 2px; /* Reduzido de 4px */
          }
          
          .header-info p {
            font-size: 11px; /* Reduzido de 14px */
            opacity: 0.9;
          }
          
          .status-badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px; /* Reduzido de 6px 16px */
            border-radius: 20px; /* Reduzido de 24px */
            font-size: 10px; /* Reduzido de 12px */
            font-weight: 600;
          }
          
          /* Seção de Confirmação */
          .confirmacao-section {
            background: #dcfce7;
            border: 1px solid #bbf7d0;
            border-radius: 6px; /* Reduzido de 8px */
            padding: 12px; /* Reduzido de 16px */
            margin-bottom: 16px; /* Reduzido de 24px */
            text-align: center;
          }
          
          .confirmacao-badge {
            background: #16a34a;
            color: white;
            padding: 4px 12px; /* Reduzido de 6px 16px */
            border-radius: 16px; /* Reduzido de 20px */
            font-size: 10px; /* Reduzido de 12px */
            font-weight: 600;
            display: inline-block;
          }
          
          /* Grid de Informações */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px; /* Reduzido pela metade de 20px */
            margin-bottom: 15px; /* Reduzido pela metade de 30px */
          }
          
          .info-card {
            border-radius: 6px; /* Reduzido pela metade de 12px */
            padding: 10px; /* Reduzido pela metade de 20px */
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
          }
          
          .info-card.cliente {
            background: #eff6ff;
            border-color: #bfdbfe;
          }
          
          .info-card.viagem {
            background: #f0fdf4;
            border-color: #bbf7d0;
          }
          
          .info-card h3 {
            font-size: 8px; /* Reduzido pela metade de 16px */
            font-weight: 600;
            margin-bottom: 6px; /* Reduzido pela metade de 12px */
            color: #374151;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px; /* Reduzido pela metade de 8px */
          }
          
          .info-label {
            font-size: 6px; /* Reduzido pela metade de 12px */
            color: #6b7280;
          }
          
          .info-value {
            font-size: 6px; /* Reduzido pela metade de 12px */
            font-weight: 500;
            color: #1f2937;
          }

          /* Novo Design do Cabeçalho Único */
          .cabecalho-unico {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px; /* Reduzido pela metade de 16px */
            margin-bottom: 15px; /* Reduzido pela metade de 30px */
            overflow: hidden;
          }
          
          .cabecalho-principal {
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            padding: 10px 12px; /* Reduzido pela metade de 20px 24px */
            color: white;
          }
          
          .reservado-por-titulo {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px; /* Reduzido pela metade de 20px 24px */
          }
          
          .reservado-por-left {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .codigo-agencia-right {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px; /* Reduzido pela metade de 8px 16px */
            border-radius: 4px; /* Reduzido pela metade de 8px */
            font-size: 7px; /* Reduzido pela metade de 14px */
            font-weight: 700;
            letter-spacing: 1px;
            color: white;
          }
          
          .reservado-label {
            font-size: 8px; /* Reduzido pela metade de 16px */
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
          }
          
          .cliente-nome-principal {
            font-size: 9px; /* Reduzido pela metade de 18px */
            font-weight: 700;
            color: white;
          }
          
          .passageiros-detalhados {
            padding: 12px; /* Reduzido pela metade de 24px */
          }
          
          .passageiros-titulo {
            font-size: 8px; /* Reduzido pela metade de 16px */
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px; /* Reduzido pela metade de 16px */
          }
          
          .passageiros-lista-completa {
            display: flex;
            flex-direction: column;
            gap: 6px; /* Reduzido pela metade de 12px */
          }
          
          .passageiro-linha {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 8px; /* Reduzido pela metade de 16px */
            padding: 6px 8px; /* Reduzido pela metade de 12px 16px */
            background: #f8fafc;
            border-radius: 4px; /* Reduzido pela metade de 8px */
            border-left: 2px solid #3b82f6; /* Reduzido pela metade de 4px */
          }
          
          .passageiro-nome-completo {
            font-size: 7px; /* Reduzido pela metade de 14px */
            font-weight: 600;
            color: #111827;
          }
          
          .passageiro-cpf {
            font-size: 6px; /* Reduzido pela metade de 12px */
            color: #6b7280;
            font-weight: 500;
          }
          
          .passageiro-nascimento {
            font-size: 6px; /* Reduzido pela metade de 12px */
            color: #6b7280;
            font-weight: 500;
          }
          
          .status-viagem-section {
            background: #f8fafc;
            padding: 16px 24px;
            border-top: 1px solid #e5e7eb;
          }
          
          .status-grid {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
          }
          
          .status-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .status-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .valor-total-display {
            font-size: 14px;
            font-weight: 700;
            color: #059669;
          }
          
          .data-atualizacao {
            font-size: 12px;
            color: #6b7280;
          }
          
          /* Status Badges */
          .status-badge {
            font-size: 12px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 6px;
            text-transform: uppercase;
          }
          
          .status-aprovado {
            background: #dcfce7;
            color: #166534;
          }
          
          .status-lancado {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .status-aguardando {
            background: #fef3cd;
            color: #92400e;
          }
          
          .status-default {
            background: #f3f4f6;
            color: #374151;
          }
          
          .cliente-dados {
            flex: 1;
          }

          /* Elementos internos dos cards */
          .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }
          
          .card-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          
          .card-icon.cliente {
            background: linear-gradient(135deg, #3b82f6, #1e40af);
          }
          
          .card-icon.viagem {
            background: linear-gradient(135deg, #10b981, #047857);
          }
          
          .card-icon svg {
            width: 20px;
            height: 20px;
          }
          
          .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
          }
          
          .card-subtitle {
            font-size: 13px;
            color: #6b7280;
            margin: 2px 0 0 0;
          }
          
          .card-content {
            margin-top: 4px;
          }
          
          .passageiro-info {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            padding: 8px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 6px;
          }
          
          .passageiro-info svg {
            width: 16px;
            height: 16px;
            color: #3b82f6;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-badge.status-aprovado {
            background: #dcfce7;
            color: #166534;
          }
          
          .status-badge.status-lancado {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .status-badge.status-aguardando {
            background: #fef3cd;
            color: #92400e;
          }
          
          .status-badge.status-default {
            background: #f3f4f6;
            color: #374151;
          }
          
          .valor-total {
            font-weight: 700;
            color: #059669;
            font-size: 14px;
          }

          /* Seções de Voos */
          .voos-section {
            margin-bottom: 16px; /* Reduzido de 24px */
          }
          
          .section-header {
            display: flex;
            align-items: center;
            gap: 8px; /* Reduzido de 12px */
            margin-bottom: 12px; /* Reduzido de 16px */
            padding-bottom: 6px; /* Reduzido de 8px */
            border-bottom: 2px solid #e5e7eb;
          }
          
          .section-icon {
            width: 24px; /* Reduzido de 32px */
            height: 24px; /* Reduzido de 32px */
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          
          .section-icon.ida {
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          }
          
          .section-icon.volta {
            background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%);
          }
          
          .section-icon.interno {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
          }
          
          .section-icon svg {
            width: 12px; /* Reduzido de 16px */
            height: 12px; /* Reduzido de 16px */
          }
          
          .section-title {
            font-size: 14px; /* Reduzido de 18px */
            font-weight: 600;
            color: #1f2937;
          }

          /* Cards de Voo - Design Moderno Compacto */
          .voo-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 3px; /* Reduzido pela metade */
            margin-bottom: 6px; /* Reduzido pela metade */
            overflow: hidden;
          }
          
          .voo-header {
            padding: 6px 8px; /* Reduzido pela metade */
            border-bottom: 1px solid #f3f4f6;
          }
          
          .voo-header.ida {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
          }
          
          .voo-header.volta {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
          }
          
          .voo-header.interno {
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: white;
          }
          
          .voo-header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .voo-header-left {
            display: flex;
            align-items: center;
            gap: 4px; /* Reduzido pela metade */
          }
          
          .voo-icon-container {
            width: 16px; /* Reduzido pela metade */
            height: 16px; /* Reduzido pela metade */
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px; /* Reduzido pela metade */
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .voo-icon {
            width: 8px; /* Reduzido pela metade */
            height: 8px; /* Reduzido pela metade */
            color: white;
          }
          
          .voo-icon.volta {
            transform: rotate(180deg);
          }
          
          .voo-info h4 {
            font-size: 6px; /* Reduzido pela metade */
            font-weight: 600;
            margin: 0;
            color: white;
          }
          
          .voo-info p {
            font-size: 5px; /* Reduzido pela metade */
            margin: 0;
            opacity: 0.9;
          }
          
          .voo-badge {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 1px 4px; /* Reduzido pela metade */
            border-radius: 6px; /* Reduzido pela metade */
            font-size: 4px; /* Reduzido pela metade */
            font-weight: 600;
          }
          
          .voo-content {
            padding: 6px; /* Reduzido pela metade */
          }
          
          .voo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); /* Reduzido pela metade */
            gap: 4px; /* Reduzido pela metade */
          }

          /* Conteúdo Principal dos Voos */
          .voo-content {
            padding: 12px; /* Reduzido de 16px */
          }
          
          .voo-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 12px; /* Reduzido de 16px */
          }
          
          /* Seção de Rota */
          .rota-section {
            display: flex;
            flex-direction: column;
            gap: 8px; /* Reduzido de 12px */
          }
          
          .rota-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .cidade-info {
            text-align: center;
            flex: 1;
          }
          
          .cidade-codigo {
            font-size: 16px; /* Reduzido de 20px */
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 2px;
          }
          
          .cidade-tipo {
            font-size: 8px; /* Reduzido de 10px */
            color: #6b7280;
            margin-bottom: 2px;
          }
          
          .cidade-horario {
            font-size: 11px; /* Reduzido de 14px */
            font-weight: 600;
          }
          
          .cidade-horario.partida {
            color: #2563eb;
          }
          
          .cidade-horario.chegada {
            color: #059669;
          }
          
          .cidade-horario.volta {
            color: #ea580c;
          }
          
          /* Linha de Voo */
          .linha-voo {
            flex: 1;
            margin: 0 12px; /* Reduzido de 16px */
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .linha-horizontal {
            height: 2px;
            width: 100%;
            position: relative;
            margin-bottom: 4px; /* Reduzido de 6px */
          }
          
          .linha-horizontal.ida {
            background: linear-gradient(90deg, #2563eb 0%, #4f46e5 100%);
          }
          
          .linha-horizontal.volta {
            background: linear-gradient(90deg, #ea580c 0%, #dc2626 100%);
          }
          
          .linha-horizontal.interno {
            background: linear-gradient(90deg, #059669 0%, #047857 100%);
          }
          
          .aviao-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid;
            border-radius: 50%;
            padding: 3px; /* Reduzido de 4px */
            width: 20px; /* Reduzido de 24px */
            height: 20px; /* Reduzido de 24px */
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .aviao-icon.ida {
            border-color: #2563eb;
            color: #2563eb;
          }
          
          .aviao-icon.volta {
            border-color: #ea580c;
            color: #ea580c;
            transform: translate(-50%, -50%) scaleX(-1);
          }
          
          .aviao-icon.interno {
            border-color: #059669;
            color: #059669;
          }
          
          .aviao-icon svg {
            width: 8px; /* Reduzido de 10px */
            height: 8px; /* Reduzido de 10px */
            transform: rotate(90deg);
          }
          
          .voo-tipo {
            text-align: center;
          }
          
          .voo-tipo span {
            font-size: 8px; /* Reduzido de 9px */
            color: #6b7280;
            background: #f3f4f6;
            padding: 2px 6px; /* Reduzido de 3px 8px */
            border-radius: 8px; /* Reduzido de 10px */
          }

          /* Informações Adicionais */
          .info-adicional {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px; /* Reduzido de 8px */
            margin-top: 8px; /* Reduzido de 12px */
          }
          
          .info-box {
            background: #f9fafb;
            border-radius: 4px; /* Reduzido de 6px */
            padding: 6px; /* Reduzido de 8px */
          }
          
          .info-box-label {
            font-size: 8px; /* Reduzido de 10px */
            color: #6b7280;
            margin-bottom: 2px;
          }
          
          .info-box-value {
            font-size: 9px; /* Reduzido de 11px */
            font-weight: 600;
            color: #1f2937;
          }

          /* Seção de Status e Bagagem */
          .status-section {
            display: flex;
            flex-direction: column;
            gap: 8px; /* Reduzido de 12px */
          }
          
          .status-box {
            border-radius: 6px; /* Reduzido de 8px */
            padding: 8px; /* Reduzido de 12px */
            border: 1px solid;
          }
          
          .status-box.confirmado {
            background: #dcfce7;
            border-color: #bbf7d0;
          }
          
          .status-header {
            display: flex;
            align-items: center;
            gap: 4px; /* Reduzido de 6px */
            margin-bottom: 3px; /* Reduzido de 4px */
          }
          
          .status-dot {
            width: 6px; /* Reduzido de 8px */
            height: 6px; /* Reduzido de 8px */
            background: #16a34a;
            border-radius: 50%;
          }
          
          .status-label {
            font-size: 8px; /* Reduzido de 10px */
            font-weight: 600;
            color: #166534;
          }
          
          .status-value {
            font-size: 9px; /* Reduzido de 11px */
            font-weight: 600;
            color: #15803d;
          }
          
          .bagagem-box {
            background: #dbeafe;
            border-color: #bfdbfe;
          }
          
          .bagagem-title {
            font-size: 8px; /* Reduzido de 10px */
            color: #1e40af;
            margin-bottom: 4px; /* Reduzido de 6px */
            font-weight: 600;
          }
          
          .bagagem-list {
            display: flex;
            flex-direction: column;
            gap: 2px; /* Reduzido de 3px */
          }
          
          .bagagem-item {
            display: flex;
            align-items: center;
            gap: 4px; /* Reduzido de 6px */
          }
          
          .bagagem-dot {
            width: 5px; /* Reduzido de 6px */
            height: 5px; /* Reduzido de 6px */
            border-radius: 50%;
          }
          
          .bagagem-dot.incluido {
            background: #16a34a;
          }
          
          .bagagem-dot.nao-incluido {
            background: #dc2626;
          }
          
          .bagagem-text {
            font-size: 8px; /* Reduzido de 9px */
            color: #374151;
          }



          /* Observações */
          .observacoes-section {
            margin-top: 16px; /* Reduzido de 24px */
            background: #fef3cd;
            border: 1px solid #fbbf24;
            border-radius: 6px; /* Reduzido de 8px */
            padding: 12px; /* Reduzido de 16px */
          }
          
          .observacoes-title {
            display: flex;
            align-items: center;
            gap: 6px; /* Reduzido de 8px */
            font-size: 10px; /* Reduzido de 12px */
            font-weight: 600;
            color: #92400e;
            margin-bottom: 6px; /* Reduzido de 8px */
          }
          
          .observacoes-title svg {
            width: 12px; /* Reduzido de 16px */
            height: 12px; /* Reduzido de 16px */
          }
          
          .observacoes-content {
            font-size: 9px; /* Reduzido de 11px */
            color: #78350f;
            line-height: 1.4;
          }

          /* Otimização para Impressão */
          @media print {
            body { 
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-size: 10px; /* Ainda menor para impressão */
            }
            
            .container {
              padding: 8px; /* Reduzido para impressão */
            }
            
            @page { 
              margin: 1cm; /* Reduzido de 1.5cm */
              size: A4; 
            }
            
            .voo-card, .info-card, .passageiro-card { 
              break-inside: avoid; 
            }
            
            .header {
              padding: 12px; /* Reduzido para impressão */
            }
            
            .voo-content {
              padding: 8px; /* Reduzido para impressão */
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="main-card">
            
            <!-- Cabeçalho da Empresa -->
            <div class="header">
              <div class="header-content">
                <div class="logo-section">
                  ${empresaLogo ? 
                    `<img src="${empresaLogo}" alt="Logo da Empresa" class="logo" />` : 
                    '<div class="logo" style="background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">LOGO</div>'
                  }
                  <div class="empresa-info">
                    <h1>${empresaNome}</h1>
                    <div class="subtitle">Agência de Viagens</div>
                    ${empresaCnpj && empresaCnpj !== '-' ? `<div class="cnpj">CNPJ: ${empresaCnpj}</div>` : ''}
                  </div>
                </div>
                
                <div class="contact-info">
                  ${empresaTelefone ? `
                    <div class="contact-item">
                      <svg class="contact-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                      </svg>
                      <span>${empresaTelefone}</span>
                    </div>
                  ` : ''}
                  ${empresaEmail ? `
                    <div class="contact-item">
                      <svg class="contact-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                      </svg>
                      <span>${empresaEmail}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>



            <div class="content">
              
              <!-- Novo Design do Cabeçalho Único -->
              <div class="cabecalho-unico">
                <!-- Cabeçalho Principal -->
                <div class="cabecalho-principal">
                  <div class="reservado-por-titulo">
                    <div class="reservado-por-left">
                      <span class="reservado-label">Reservado por:</span>
                      <span class="cliente-nome-principal">${cliente ? cliente.nome : 'Cliente não informado'}</span>
                    </div>
                    <div class="codigo-agencia-right">
                      <span class="codigo-value">${cotacao?.codigo || cotacao?.id}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Lista de Passageiros -->
                <div class="passageiros-detalhados">
                  <div class="passageiros-titulo">Passageiros:</div>
                  <div class="passageiros-lista-completa">
                    ${passageiros.length > 0 ? 
                      passageiros.map((passageiro, index) => `
                        <div class="passageiro-linha">
                          <span class="passageiro-nome-completo">${passageiro.nome || 'Nome não informado'}</span>
                          ${passageiro.documento ? `<span class="passageiro-cpf">CPF: ${passageiro.documento}</span>` : '<span class="passageiro-cpf">CPF: Não informado</span>'}
                          ${passageiro.data_nascimento ? `<span class="passageiro-nascimento">Nascimento: ${formatarDataLocal(passageiro.data_nascimento)}</span>` : '<span class="passageiro-nascimento">Nascimento: Não informado</span>'}
                        </div>
                      `).join('') :
                      `<div class="passageiro-linha">
                        <span class="passageiro-nome-completo">Nenhum passageiro cadastrado</span>
                        <span class="passageiro-cpf">-</span>
                        <span class="passageiro-nascimento">-</span>
                      </div>`
                    }
                  </div>
                </div>
                
                <!-- Status e Informações da Viagem -->
                <div class="status-viagem-section">
                  <div class="status-grid">
                    <div class="status-item">
                      <span class="status-label">Status:</span>
                      <span class="status-badge ${
                        cotacao?.status === 'APROVADO' ? 'status-aprovado' :
                        cotacao?.status === 'LANÇADO' ? 'status-lancado' :
                        cotacao?.status === 'AGUARDANDO_CLIENTE' ? 'status-aguardando' :
                        'status-default'
                      }">
                        ${cotacao?.status?.replace('_', ' ')}
                      </span>
                    </div>
                    
                    ${cotacao?.valor_total ? `
                      <div class="status-item">
                        <span class="status-label">Valor Total:</span>
                        <span class="valor-total-display">
                          ${cotacao.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    ` : ''}
                    
                    <div class="status-item">
                      <span class="status-label">Atualizado em:</span>
                      <span class="data-atualizacao">${formatarDataLocal(new Date().toISOString())} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Seção de Voos -->
              ${voos.length > 0 ? `
                                    ${voos.filter(voo => voo.direcao === 'IDA').length > 0 ? `
                  <div class="voos-section">
                    <div class="section-header">
                      <div class="section-icon ida">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                      </div>
                      <div class="section-title">Voos de Ida</div>
                    </div>
                    
                    ${voos.filter(voo => voo.direcao === 'IDA').map((voo, i) => `
                      <div class="voo-card">
                        <!-- Cabeçalho do Card -->
                        <div class="voo-header ida">
                          <div class="voo-header-content">
                            <div class="voo-header-left">
                              <div class="voo-icon-container">
                                <svg class="voo-icon" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                                </svg>
                              </div>
                              <div class="voo-info">
                                <h4>${voo.companhia || 'Companhia Aérea'}</h4>
                                <p>Voo ${voo.numero_voo || 'N/A'}</p>
                              </div>
                            </div>
                            <div class="voo-badge">IDA</div>
                          </div>
                        </div>

                        <!-- Conteúdo Principal -->
                        <div class="voo-content">
                          <div class="voo-grid">
                            
                            <!-- Seção de Rota -->
                            <div class="rota-section">
                              <div class="rota-header">
                                <div class="cidade-info">
                                  <div class="cidade-codigo">${voo.origem}</div>
                                  <div class="cidade-tipo">Partida</div>
                                  <div class="cidade-horario partida">${formatarHorario(voo.horario_partida) || 'N/A'}</div>
                                </div>
                                
                                <div class="linha-voo">
                                  <div class="linha-horizontal ida">
                                    <div class="aviao-icon ida">
                                      <svg fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                                      </svg>
                                    </div>
                                  </div>
                                  <div class="voo-tipo">
                                    <span>Voo Direto</span>
                                  </div>
                                </div>
                                
                                <div class="cidade-info">
                                  <div class="cidade-codigo">${voo.destino}</div>
                                  <div class="cidade-tipo">Chegada</div>
                                  <div class="cidade-horario chegada">${formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                                </div>
                              </div>

                              <!-- Informações Adicionais -->
                              <div class="info-adicional">
                                <div class="info-box">
                                  <div class="info-box-label">Data do Voo</div>
                                  <div class="info-box-value">
                                    ${voo.data_ida ? formatarDataLocal(voo.data_ida) : '-'}
                                  </div>
                                </div>
                                <div class="info-box">
                                  <div class="info-box-label">Classe</div>
                                  <div class="info-box-value">${voo.classe || 'Econômica'}</div>
                                </div>
                              </div>
                            </div>

                            <!-- Seção de Status e Bagagem -->
                            <div class="status-section">
                              <div class="status-box confirmado">
                                <div class="status-header">
                                  <div class="status-dot"></div>
                                  <span class="status-label">Status</span>
                                </div>
                                <div class="status-value">Confirmado</div>
                              </div>
                              
                              <div class="status-box bagagem-box">
                                <div class="bagagem-title">Bagagem Incluída</div>
                                <div class="bagagem-list">
                                  <div class="bagagem-item">
                                    <div class="bagagem-dot incluido"></div>
                                    <span class="bagagem-text">Bagagem de Mão</span>
                                  </div>
                                  <div class="bagagem-item">
                                    <div class="bagagem-dot incluido"></div>
                                    <span class="bagagem-text">Item Pessoal</span>
                                  </div>
                                  <div class="bagagem-item">
                                    <div class="bagagem-dot nao-incluido"></div>
                                    <span class="bagagem-text">Bagagem Despachada</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${voos.filter(voo => voo.direcao === 'VOLTA').length > 0 ? `
                  <div class="voos-section">
                    <div class="section-header">
                      <div class="section-icon volta">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                      </div>
                      <div class="section-title">Voos de Volta</div>
                    </div>
                    
                    ${voos.filter(voo => voo.direcao === 'VOLTA').map((voo, i) => `
                      <div class="voo-card">
                        <!-- Cabeçalho do Card -->
                        <div class="voo-header volta">
                          <div class="voo-header-content">
                            <div class="voo-header-left">
                              <div class="voo-icon-container">
                                <svg class="voo-icon volta" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                                </svg>
                              </div>
                              <div class="voo-info">
                                <h4>${voo.companhia || 'Companhia Aérea'}</h4>
                                <p>Voo ${voo.numero_voo || 'N/A'}</p>
                              </div>
                            </div>
                            <div class="voo-badge">VOLTA</div>
                          </div>
                        </div>

                        <!-- Conteúdo Principal -->
                        <div class="voo-content">
                          <div class="voo-grid">
                            
                            <!-- Seção de Rota -->
                            <div class="rota-section">
                              <div class="rota-header">
                                <div class="cidade-info">
                                  <div class="cidade-codigo">${voo.origem}</div>
                                  <div class="cidade-tipo">Partida</div>
                                  <div class="cidade-horario volta">${formatarHorario(voo.horario_partida) || 'N/A'}</div>
                                </div>
                                
                                <div class="linha-voo">
                                  <div class="linha-horizontal volta">
                                    <div class="aviao-icon volta">
                                      <svg fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                                      </svg>
                                    </div>
                                  </div>
                                  <div class="voo-tipo">
                                    <span>Voo Direto</span>
                                  </div>
                                </div>
                                
                                <div class="cidade-info">
                                  <div class="cidade-codigo">${voo.destino}</div>
                                  <div class="cidade-tipo">Chegada</div>
                                  <div class="cidade-horario chegada">${formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                                </div>
                              </div>

                              <!-- Informações Adicionais -->
                              <div class="info-adicional">
                                <div class="info-box">
                                  <div class="info-box-label">Data do Voo</div>
                                  <div class="info-box-value">
                                    ${voo.data_volta ? formatarDataLocal(voo.data_volta) : formatarDataLocal(voo.data_ida)}
                                  </div>
                                </div>
                                <div class="info-box">
                                  <div class="info-box-label">Classe</div>
                                  <div class="info-box-value">${voo.classe || 'Econômica'}</div>
                                </div>
                              </div>
                            </div>

                            <!-- Seção de Status e Bagagem -->
                            <div class="status-section">
                              <div class="status-box confirmado">
                                <div class="status-header">
                                  <div class="status-dot"></div>
                                  <span class="status-label">Status</span>
                                </div>
                                <div class="status-value">Confirmado</div>
                              </div>
                              
                              <div class="status-box bagagem-box">
                                <div class="bagagem-title">Bagagem Incluída</div>
                                <div class="bagagem-list">
                                  <div class="bagagem-item">
                                    <div class="bagagem-dot incluido"></div>
                                    <span class="bagagem-text">Bagagem de Mão</span>
                                  </div>
                                  <div class="bagagem-item">
                                    <div class="bagagem-dot incluido"></div>
                                    <span class="bagagem-text">Item Pessoal</span>
                                  </div>
                                  <div class="bagagem-item">
                                    <div class="bagagem-dot nao-incluido"></div>
                                    <span class="bagagem-text">Bagagem Despachada</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${voos.filter(voo => voo.direcao === 'INTERNO').length > 0 ? `
                  <div class="voos-section">
                    <div class="section-header">
                      <div class="section-icon interno">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                      </div>
                      <div class="section-title">Voos Internos</div>
                    </div>
                    
                                          ${voos.filter(voo => voo.direcao === 'INTERNO').map((voo, i) => `
                      <div class="voo-card">
                        <!-- Cabeçalho do Card -->
                        <div class="voo-header interno">
                          <div class="voo-header-content">
                            <div class="voo-header-left">
                              <div class="voo-icon-container">
                                <svg class="voo-icon" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                                </svg>
                              </div>
                              <div class="voo-info">
                                <h4>${voo.companhia || 'Companhia Aérea'}</h4>
                                <p>Voo ${voo.numero_voo || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                              INTERNO
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Seção de Rota */}
                            <div className="lg:col-span-2">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                                  <div className="text-sm text-gray-500">Partida</div>
                                  <div className="text-lg font-semibold text-green-600">{voo.horario_partida || 'N/A'}</div>
                                </div>
                                
                                <div className="flex-1 mx-6 relative">
                                  <div className="h-0.5 bg-gray-300 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                                  </div>
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-green-500 rounded-full p-2">
                                    <Plane className="h-4 w-4 text-green-500 transform rotate-90" />
                                  </div>
                                  <div className="text-center mt-2">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                      Voo Direto
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                                  <div className="text-sm text-gray-500">Chegada</div>
                                  <div className="text-lg font-semibold text-blue-600">{voo.horario_chegada || 'N/A'}</div>
                                </div>
                              </div>

                              {/* Informações Adicionais */}
                              <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Data do Voo</div>
                                  <div className="font-semibold text-gray-900">
                                    ${voo.data_ida ? formatarDataLocal(voo.data_ida) : '-'}
                                  </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Classe</div>
                                  <div className="font-semibold text-gray-900">{voo.classe || 'Econômica'}</div>
                                </div>
                              </div>
                            </div>

                            {/* Seção de Status e Bagagem */}
                            <div className="flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800">Status</span>
                                  </div>
                                  <div className="text-green-700 font-semibold">Confirmado</div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="text-sm text-blue-600 mb-2">Bagagem Incluída</div>
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem de Mão</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Item Pessoal</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem Despachada</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              ` : ''}



              <!-- Observações -->
              ${cotacao?.observacoes ? `
                <div class="observacoes-section">
                  <div class="observacoes-title">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    Observações Importantes
                  </div>
                  <div class="observacoes-content">${cotacao.observacoes}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <script>
          // Aguardar carregamento completo das imagens
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 500);
          });
        </script>
      </body>
      </html>
    `;

    // Escrever conteúdo na nova janela
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    buscarDadosCotacao();
  }, []);

  const coresPersonalizadas = gerarCoresPersonalizadas(empresaCorPersonalizada);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados da cotação...</p>
        </div>
      </div>
    );
  }

  if (!cotacao) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="h-32 w-32 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cotação não encontrada</p>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white p-4 print:p-0">
      <div className="max-w-5xl mx-auto">
        
        {/* Botões de Ação - Flutuantes */}
        <div className="print:hidden no-print fixed top-4 right-4 flex flex-col space-y-2 z-50">
            <button
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-lg border flex items-center space-x-2 transition-all"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg flex items-center space-x-2 transition-all"
            onClick={gerarPDF}
          >
            <Download className="h-4 w-4" />
            <span>Baixar PDF</span>
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg flex items-center space-x-2 transition-all"
            onClick={imprimirPagina}
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
            </button>
          </div>

        {/* Container Principal */}
        <div className="print-container bg-white shadow-xl rounded-lg print:shadow-none print:rounded-none overflow-hidden">
          
          {/* Cabeçalho da Empresa */}
          <div 
            className="text-white px-6 py-4"
            style={{
              background: `linear-gradient(135deg, ${coresPersonalizadas.gradientFrom}, ${coresPersonalizadas.gradientTo})`
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
            {empresaLogo && (
                  <img 
                    src={empresaLogo} 
                    alt="Logo da Empresa" 
                    className="h-16 w-16 object-contain bg-white/20 rounded-lg p-2"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold">{empresaNome}</h1>
                  <p className="text-white/90">Agência de Viagens</p>
                  {empresaCnpj && empresaCnpj !== '-' && (
                    <p className="text-white/80 text-sm">CNPJ: {empresaCnpj}</p>
                  )}
          </div>
        </div>

              <div className="text-right space-y-1 text-sm">
                {empresaTelefone && (
                  <div className="flex items-center justify-end space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{empresaTelefone}</span>
                  </div>
                )}
                {empresaEmail && (
                  <div className="flex items-center justify-end space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{empresaEmail}</span>
                  </div>
            )}
          </div>
            </div>
          </div>



          <div className="p-6">
            
            {/* Seção de Informações Principais em Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* Informações do Cliente */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  <div>
                      <h3 className="font-bold text-gray-900">Reservado por</h3>
                      <p className="text-sm text-gray-600">{empresaNome}</p>
                    </div>
                    </div>
                  <div className="bg-blue-100 px-3 py-1 rounded-lg">
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {cotacao.codigo || cotacao.id}
                    </span>
                    </div>
                  </div>
                
                {cliente && (
                  <div className="space-y-2 bg-white p-3 rounded border border-blue-100">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Passageiros:</span>
                      <span className="font-medium">{passageiros.length} Adulto{passageiros.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{cliente.nome}</span>
                    </div>
                    {cliente.telefone && (
                      <div className="text-sm text-gray-600">
                        Tel: {cliente.telefone}
                      </div>
                    )}
                  </div>
                )}
        </div>

              {/* Status e Valor */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-green-600" />
              </div>
                <div>
                    <h3 className="font-bold text-gray-900">Detalhes da Viagem</h3>
                    <p className="text-sm text-gray-600">Status e informações</p>
                </div>
                </div>
                
                <div className="space-y-2 bg-white p-3 rounded border border-green-100">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cotacao.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                      cotacao.status === 'LANÇADO' ? 'bg-blue-100 text-blue-800' :
                      cotacao.status === 'AGUARDANDO_CLIENTE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cotacao.status?.replace('_', ' ')}
                    </span>
                  </div>
                  {cotacao.valor_total && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valor Total:</span>
                      <span className="font-bold text-green-600">
                        {cotacao.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Atualizado em:</span>
                    <span className="text-sm">{formatarDataLocal(new Date().toISOString())} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
        </div>
              </div>
            </div>

            {/* Seção de Voos */}
            {voos.length > 0 && (
              <div className="mb-6">
                {/* Voos de Ida */}
                {voos.filter(voo => voo.direcao === 'IDA').length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Plane className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Voos de Ida</h3>
                    </div>
                    
                    {voos.filter(voo => voo.direcao === 'IDA').map((voo, i) => (
                      <div key={`ida-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden">
                        {/* Cabeçalho do Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-white/20 p-2 rounded-lg">
                                <Plane className="h-5 w-5" />
                </div>
                <div>
                                <h4 className="font-bold text-lg">{voo.companhia || 'Companhia Aérea'}</h4>
                                <p className="text-blue-100 text-sm">Voo {voo.numero_voo || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                              IDA
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Seção de Rota */}
                            <div className="lg:col-span-2">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                                  <div className="text-sm text-gray-500">Partida</div>
                                  <div className="text-lg font-semibold text-blue-600">{formatarHorario(voo.horario_partida) || 'N/A'}</div>
                                </div>
                                
                                <div className="flex-1 mx-6 relative">
                                  <div className="h-0.5 bg-gray-300 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                  </div>
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-500 rounded-full p-2">
                                    <Plane className="h-4 w-4 text-blue-500 transform rotate-90" />
                                  </div>
                                  <div className="text-center mt-2">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                      Voo Direto
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                                  <div className="text-sm text-gray-500">Chegada</div>
                                  <div className="text-lg font-semibold text-green-600">{formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                                </div>
                              </div>

                              {/* Informações Adicionais */}
                              <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Data do Voo</div>
                                  <div className="font-semibold text-gray-900">
                                    ${voo.data_ida ? formatarDataLocal(voo.data_ida) : '-'}
                                  </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Classe</div>
                                  <div className="font-semibold text-gray-900">{voo.classe || 'Econômica'}</div>
                                </div>
                              </div>
                            </div>

                            {/* Seção de Status e Bagagem */}
                            <div className="flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800">Status</span>
                                  </div>
                                  <div className="text-green-700 font-semibold">Confirmado</div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="text-sm text-blue-600 mb-2">Bagagem Incluída</div>
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem de Mão</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Item Pessoal</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem Despachada</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Voos Internos */}
                {voos.filter(voo => voo.direcao === 'INTERNO').length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 p-2 rounded-lg mr-3">
                        <Plane className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Voos Internos</h3>
                    </div>
                    
                    {voos.filter(voo => voo.direcao === 'INTERNO').map((voo, i) => (
                      <div key={`interno-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden">
                        {/* Cabeçalho do Card */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-white/20 p-2 rounded-lg">
                                <Plane className="h-5 w-5" />
                </div>
                <div>
                                <h4 className="font-bold text-lg">{voo.companhia || 'Companhia Aérea'}</h4>
                                <p className="text-green-100 text-sm">Voo {voo.numero_voo || 'N/A'}</p>
                </div>
              </div>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                              INTERNO
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Seção de Rota */}
                            <div className="lg:col-span-2">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                                  <div className="text-sm text-gray-500">Partida</div>
                                  <div className="text-lg font-semibold text-green-600">{voo.horario_partida || 'N/A'}</div>
                                </div>
                                
                                <div className="flex-1 mx-6 relative">
                                  <div className="h-0.5 bg-gray-300 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                                  </div>
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-green-500 rounded-full p-2">
                                    <Plane className="h-4 w-4 text-green-500 transform rotate-90" />
                                  </div>
                                  <div className="text-center mt-2">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                      Voo Direto
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                                  <div className="text-sm text-gray-500">Chegada</div>
                                  <div className="text-lg font-semibold text-blue-600">{voo.horario_chegada || 'N/A'}</div>
                                </div>
                              </div>

                              {/* Informações Adicionais */}
                              <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Data do Voo</div>
                                  <div className="font-semibold text-gray-900">
                                    ${voo.data_ida ? formatarDataLocal(voo.data_ida) : '-'}
                                  </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Classe</div>
                                  <div className="font-semibold text-gray-900">{voo.classe || 'Econômica'}</div>
                                </div>
                              </div>
                            </div>

                            {/* Seção de Status e Bagagem */}
                            <div className="flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800">Status</span>
                                  </div>
                                  <div className="text-green-700 font-semibold">Confirmado</div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="text-sm text-blue-600 mb-2">Bagagem Incluída</div>
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem de Mão</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Item Pessoal</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem Despachada</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Voos de Volta */}
                {voos.filter(voo => voo.direcao === 'VOLTA').length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-2 rounded-lg mr-3">
                        <Plane className="h-5 w-5 text-orange-600 transform scale-x-[-1]" />
            </div>
                      <h3 className="text-xl font-bold text-gray-900">Voos de Volta</h3>
        </div>

                    {voos.filter(voo => voo.direcao === 'VOLTA').map((voo, i) => (
                      <div key={`volta-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden">
                        {/* Cabeçalho do Card */}
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-white/20 p-2 rounded-lg">
                                <Plane className="h-5 w-5 transform scale-x-[-1]" />
          </div>
                              <div>
                                <h4 className="font-bold text-lg">{voo.companhia || 'Companhia Aérea'}</h4>
                                <p className="text-orange-100 text-sm">Voo {voo.numero_voo || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                              VOLTA
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Seção de Rota */}
                            <div className="lg:col-span-2">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                                  <div className="text-sm text-gray-500">Partida</div>
                                  <div className="text-lg font-semibold text-orange-600">{voo.horario_partida || 'N/A'}</div>
                                </div>
                                
                                <div className="flex-1 mx-6 relative">
                                  <div className="h-0.5 bg-gray-300 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500"></div>
                                  </div>
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-orange-500 rounded-full p-2">
                                    <Plane className="h-4 w-4 text-orange-500 transform rotate-90 scale-x-[-1]" />
                                  </div>
                                  <div className="text-center mt-2">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                      Voo Direto
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                                  <div className="text-sm text-gray-500">Chegada</div>
                                  <div className="text-lg font-semibold text-green-600">{voo.horario_chegada || 'N/A'}</div>
                                </div>
                              </div>

                              {/* Informações Adicionais */}
                              <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Data do Voo</div>
                                  <div className="font-semibold text-gray-900">
                                    ${voo.data_volta ? formatarDataLocal(voo.data_volta) : formatarDataLocal(voo.data_ida)}
                                  </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-sm text-gray-500">Classe</div>
                                  <div className="font-semibold text-gray-900">{voo.classe || 'Econômica'}</div>
                                </div>
                              </div>
                            </div>

                            {/* Seção de Status e Bagagem */}
                            <div className="flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800">Status</span>
                                  </div>
                                  <div className="text-green-700 font-semibold">Confirmado</div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="text-sm text-blue-600 mb-2">Bagagem Incluída</div>
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem de Mão</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Item Pessoal</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-xs text-gray-700">Bagagem Despachada</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* Observações */}
            {cotacao.observacoes_venda && (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-700">{cotacao.observacoes_venda}</p>
                </div>
              </div>
            )}
        </div>

        {/* Rodapé */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium">Este documento não possui valor fiscal</p>
              <p className="mt-1">Para sua segurança, confirme os dados antes da viagem</p>
              {empresaEndereco && (
                <p className="mt-2 text-xs">{empresaEndereco}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotacaoPrint; 