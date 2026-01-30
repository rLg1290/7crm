import { useState, useEffect } from 'react'
import { Plane, Clock, MapPin, Users, AlertTriangle, CheckCircle, XCircle, RefreshCw, User } from 'lucide-react'

import { getAirlineLogoUrl } from '../utils/airlineLogos'

interface Voo {
  numero: string
  companhia: string
  origem: string
  destino: string
  portao: string
  horarioPartida: string
  horarioAtual: string
  status: 'confirmado' | 'atrasado' | 'cancelado' | 'embarcando' | 'encerrado'
  clienteResponsavel: string
  observacao: string
}

const QuadroVoos = () => {
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [voosHoje] = useState<Voo[]>([
    {
      numero: '1265',
      companhia: 'LATAM',
      origem: 'Brasília',
      destino: 'Congonhas',
      portao: '08',
      horarioPartida: '09:20',
      horarioAtual: '09:20',
      status: 'atrasado',
      clienteResponsavel: 'Maria Silva',
      observacao: 'Voo decolado'
    },
    {
      numero: '1262',
      companhia: 'GOL',
      origem: 'Brasília',
      destino: 'Guarulhos',
      portao: '02',
      horarioPartida: '09:50',
      horarioAtual: '09:50',
      status: 'confirmado',
      clienteResponsavel: 'João Santos',
      observacao: ''
    },
    {
      numero: '1195',
      companhia: 'GOL',
      origem: 'Brasília',
      destino: 'Porto Alegre',
      portao: '31',
      horarioPartida: '09:50',
      horarioAtual: '09:50',
      status: 'confirmado',
      clienteResponsavel: 'Ana Costa',
      observacao: ''
    },
    {
      numero: '1174',
      companhia: 'LATAM',
      origem: 'Brasília',
      destino: 'Buenos Aires',
      portao: '30',
      horarioPartida: '09:50',
      horarioAtual: '09:50',
      status: 'confirmado',
      clienteResponsavel: 'Carlos Lima',
      observacao: ''
    },
    {
      numero: '1589',
      companhia: 'LATAM',
      origem: 'Brasília',
      destino: 'Curitiba',
      portao: '28',
      horarioPartida: '09:55',
      horarioAtual: '09:55',
      status: 'confirmado',
      clienteResponsavel: 'Fernanda Rocha',
      observacao: ''
    },
    {
      numero: '1457',
      companhia: 'Azul',
      origem: 'Brasília',
      destino: 'Natal',
      portao: '02',
      horarioPartida: '09:55',
      horarioAtual: '09:55',
      status: 'encerrado',
      clienteResponsavel: 'Pedro Oliveira',
      observacao: 'Voo encerrado'
    },
    {
      numero: '4651',
      companhia: 'Azul',
      origem: 'Brasília',
      destino: 'Maceió',
      portao: '22',
      horarioPartida: '10:00',
      horarioAtual: '10:00',
      status: 'embarcando',
      clienteResponsavel: 'Luciana Mendes',
      observacao: 'Última chamada'
    },
    {
      numero: '2488',
      companhia: 'American Airlines',
      origem: 'Brasília',
      destino: 'Miami',
      portao: '18',
      horarioPartida: '10:05',
      horarioAtual: '10:05',
      status: 'encerrado',
      clienteResponsavel: 'Roberto Silva',
      observacao: 'Voo encerrado'
    },
    {
      numero: '1124',
      companhia: 'GOL',
      origem: 'Brasília',
      destino: 'Recife',
      portao: '21',
      horarioPartida: '10:20',
      horarioAtual: '10:20',
      status: 'confirmado',
      clienteResponsavel: 'Patricia Alves',
      observacao: ''
    },
    {
      numero: '2236',
      companhia: 'TAP Portugal',
      origem: 'Brasília',
      destino: 'Lisboa',
      portao: '11',
      horarioPartida: '10:30',
      horarioAtual: '10:30',
      status: 'confirmado',
      clienteResponsavel: 'Miguel Torres',
      observacao: ''
    },
    {
      numero: '2488',
      companhia: 'Copa Airlines',
      origem: 'Brasília',
      destino: 'Panamá',
      portao: '18',
      horarioPartida: '11:05',
      horarioAtual: '11:05',
      status: 'confirmado',
      clienteResponsavel: 'Carla Ferreira',
      observacao: ''
    }
  ])

  // Atualizar hora atual a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'atrasado':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'cancelado':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'embarcando':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'encerrado':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="h-4 w-4" />
      case 'atrasado':
        return <AlertTriangle className="h-4 w-4" />
      case 'cancelado':
        return <XCircle className="h-4 w-4" />
      case 'embarcando':
        return <Plane className="h-4 w-4" />
      case 'encerrado':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado'
      case 'atrasado': return 'Voo decolado'
      case 'cancelado': return 'Cancelado'
      case 'embarcando': return 'Última chamada'
      case 'encerrado': return 'Voo encerrado'
      default: return status
    }
  }

  const formatarHora = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatarData = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header estilo aeroporto */}
      <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Plane className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <Clock className="h-6 w-6 mr-3 text-blue-400" />
                  PARTIDAS
                </h1>
                <p className="text-slate-300 text-sm">
                  {formatarData(horaAtual)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-white">
                  {formatarHora(horaAtual)}
                </div>
                <div className="text-sm text-slate-300">Horário Local</div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-blue-400">
                  Viajar & Sonhar Turismo
                </div>
                <div className="text-sm text-slate-300">Agência de Viagens</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de voos */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          {/* Header da tabela */}
          <div className="bg-slate-800 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Voos da Agência - Hoje ({voosHoje.length} voos)
              </h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Headers das colunas */}
          <div className="bg-slate-100 border-b border-slate-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold text-slate-700 uppercase tracking-wide">
              <div className="col-span-1">VOO</div>
              <div className="col-span-2">COMPANHIA</div>
              <div className="col-span-1">ORIGEM</div>
              <div className="col-span-2">DESTINO</div>
              <div className="col-span-1">PORTÃO</div>
              <div className="col-span-1">HORA</div>
              <div className="col-span-2">CLIENTE RESPONSÁVEL</div>
              <div className="col-span-2">STATUS</div>
            </div>
          </div>

          {/* Lista de voos */}
          <div className="divide-y divide-slate-200">
            {voosHoje.map((voo, index) => (
              <div 
                key={`${voo.numero}-${index}`}
                className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-50 transition-colors"
              >
                {/* Número do voo */}
                <div className="col-span-1">
                  <div className="font-bold text-slate-900 text-lg">
                    {voo.numero}
                  </div>
                </div>

                {/* Companhia */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm overflow-hidden">
                      {getAirlineLogoUrl(voo.companhia) ? (
                        <img 
                          src={getAirlineLogoUrl(voo.companhia) || ''} 
                          alt={voo.companhia} 
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Plane className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="font-semibold text-slate-700">
                      {voo.companhia}
                    </div>
                  </div>
                </div>

                {/* Origem */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-600 text-sm">
                      {voo.origem}
                    </span>
                  </div>
                </div>

                {/* Destino */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-yellow-600 text-lg">
                      {voo.destino}
                    </span>
                  </div>
                </div>

                {/* Portão */}
                <div className="col-span-1">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800 text-white font-bold text-lg rounded-lg">
                    {voo.portao}
                  </div>
                </div>

                {/* Horário */}
                <div className="col-span-1">
                  <div className="font-mono font-bold text-slate-900 text-lg">
                    {voo.horarioPartida}
                  </div>
                </div>

                {/* Cliente Responsável */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {voo.clienteResponsavel}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border text-sm font-semibold ${getStatusColor(voo.status)}`}>
                    {getStatusIcon(voo.status)}
                    <span>{getStatusText(voo.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas do dia */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Voos</p>
                <p className="text-3xl font-bold text-slate-900">{voosHoje.length}</p>
              </div>
              <Plane className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Clientes</p>
                <p className="text-3xl font-bold text-slate-900">
                  {new Set(voosHoje.map(voo => voo.clienteResponsavel)).size}
                </p>
              </div>
              <Users className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Confirmados</p>
                <p className="text-3xl font-bold text-green-600">
                  {voosHoje.filter(voo => voo.status === 'confirmado').length}
                </p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Em Atraso</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {voosHoje.filter(voo => voo.status === 'atrasado').length}
                </p>
              </div>
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Sistema em Tempo Real</p>
              <p className="text-sm text-slate-600 mt-1">
                Informações atualizadas automaticamente. Última atualização: {formatarHora(horaAtual)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuadroVoos 