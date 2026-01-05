import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  User, 
  Building2,
  X
} from 'lucide-react'

interface Meeting {
  id: string
  nome_empresa: string
  contato_nome: string
  contato_email: string
  proxima_acao_data: string
  proxima_acao_descricao: string
  link_reuniao?: string
}

export default function CalendarioComercial() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      // Buscar leads que tenham data de próxima ação definida e sejam do tipo reunião ou status REUNIAO
      const { data, error } = await supabase
        .from('funil_vendas')
        .select('*')
        .eq('status', 'REUNIAO')
        .not('proxima_acao_data', 'is', null)

      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error)
    }
  }

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getDayMeetings = (day: number) => {
    return meetings.filter(m => {
      const date = new Date(m.proxima_acao_data)
      return (
        date.getDate() === day &&
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
      )
    }).sort((a, b) => new Date(a.proxima_acao_data).getTime() - new Date(b.proxima_acao_data).getTime())
  }

  const renderCalendarDays = () => {
    const days = []
    
    // Padding for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border-b border-r border-gray-100"></div>)
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayMeetings = getDayMeetings(day)
      const isToday = 
        day === new Date().getDate() && 
        currentDate.getMonth() === new Date().getMonth() && 
        currentDate.getFullYear() === new Date().getFullYear()

      days.push(
        <div key={day} className={`h-32 border-b border-r border-gray-100 p-2 relative group hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-[90px] custom-scrollbar">
            {dayMeetings.map(meeting => (
              <button
                key={meeting.id}
                onClick={() => setSelectedMeeting(meeting)}
                className="w-full text-left text-xs p-1.5 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors border border-purple-200 truncate flex items-center gap-1"
              >
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="font-semibold">
                  {new Date(meeting.proxima_acao_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="truncate">- {meeting.nome_empresa}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    return days
  }

  const getUpcomingMeetings = () => {
    return meetings
      .filter(m => new Date(m.proxima_acao_data) >= new Date())
      .sort((a, b) => new Date(a.proxima_acao_data).getTime() - new Date(b.proxima_acao_data).getTime())
      .slice(0, 5)
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário Comercial</h1>
          <p className="text-gray-500 mt-1">Gestão de reuniões agendadas</p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-6 h-full overflow-hidden">
        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Sidebar - Upcoming Meetings */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Próximas Reuniões
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {getUpcomingMeetings().length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nenhuma reunião futura agendada.</p>
            ) : (
              getUpcomingMeetings().map(meeting => (
                <div 
                  key={meeting.id}
                  onClick={() => setSelectedMeeting(meeting)}
                  className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      {new Date(meeting.proxima_acao_data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {new Date(meeting.proxima_acao_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 text-sm truncate mb-1" title={meeting.nome_empresa}>
                    {meeting.nome_empresa}
                  </h3>
                  
                  <div className="flex items-center text-xs text-gray-500 gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate">{meeting.contato_nome || 'Sem contato'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-600" />
                Detalhes da Reunião
              </h3>
              <button 
                onClick={() => setSelectedMeeting(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</span>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-900">{selectedMeeting.nome_empresa}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data</span>
                  <div className="flex items-center gap-2 mt-1 text-gray-900">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    {new Date(selectedMeeting.proxima_acao_data).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</span>
                  <div className="flex items-center gap-2 mt-1 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {new Date(selectedMeeting.proxima_acao_data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</span>
                <div className="flex items-center gap-2 mt-1 text-gray-900">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{selectedMeeting.contato_nome || 'N/A'}</span>
                </div>
              </div>

              {selectedMeeting.link_reuniao && (
                <div className="pt-2">
                  <a 
                    href={selectedMeeting.link_reuniao} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 shadow-sm transition-colors"
                  >
                    Entrar na Reunião
                  </a>
                  <p className="text-xs text-center text-gray-500 mt-2 break-all">
                    {selectedMeeting.link_reuniao}
                  </p>
                </div>
              )}

              {!selectedMeeting.link_reuniao && (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Link da reunião ainda não disponível. Aguarde o processamento ou verifique com o administrador.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
