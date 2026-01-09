
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Building, Search, Check, X, Plane } from 'lucide-react'

interface Empresa {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  aereo_enabled: boolean
  created_at: string
}

export default function AdminAgencias() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchEmpresas()
  }, [])

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome')

      if (error) throw error
      setEmpresas(data || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAereo = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ aereo_enabled: !currentValue })
        .eq('id', id)

      if (error) throw error

      setEmpresas(prev => prev.map(emp => 
        emp.id === id ? { ...emp, aereo_enabled: !currentValue } : emp
      ))
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error)
      alert('Erro ao atualizar permissão')
    }
  }

  const filteredEmpresas = empresas.filter(emp => 
    emp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cnpj?.includes(searchTerm)
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Agências</h1>
          <p className="text-gray-500">Controle de acesso e permissões</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar agência..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agência</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ/Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastro</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acesso Aéreo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Carregando...</td>
              </tr>
            ) : filteredEmpresas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Nenhuma agência encontrada</td>
              </tr>
            ) : (
              filteredEmpresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{empresa.nome}</div>
                        <div className="text-sm text-gray-500">ID: {empresa.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{empresa.email || '-'}</div>
                    <div className="text-sm text-gray-500">{empresa.cnpj || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(empresa.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => toggleAereo(empresa.id, empresa.aereo_enabled)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        empresa.aereo_enabled
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {empresa.aereo_enabled ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
