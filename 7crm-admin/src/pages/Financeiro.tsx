import React, { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Filter } from 'lucide-react'

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'contas_pagar' | 'contas_receber' | 'fluxo_caixa'>('visao_geral')

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 mt-1">Gestão financeira, contas e fluxo de caixa</p>
        </div>
      </div>

      {/* Tabs / Subdivisões */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('visao_geral')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'visao_geral'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <DollarSign className="w-4 h-4" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('contas_receber')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'contas_receber'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <TrendingUp className="w-4 h-4" />
            Contas a Receber
          </button>
          <button
            onClick={() => setActiveTab('contas_pagar')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'contas_pagar'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <TrendingDown className="w-4 h-4" />
            Contas a Pagar
          </button>
          <button
            onClick={() => setActiveTab('fluxo_caixa')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'fluxo_caixa'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <FileText className="w-4 h-4" />
            Fluxo de Caixa
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'visao_geral' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Receita Mensal</h3>
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">R$ 0,00</div>
              <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <span>+0%</span>
                <span className="text-gray-400">vs mês anterior</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Despesas Mensais</h3>
                <div className="p-2 bg-red-50 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">R$ 0,00</div>
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>+0%</span>
                <span className="text-gray-400">vs mês anterior</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Saldo em Caixa</h3>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">R$ 0,00</div>
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                <span>Disponível</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contas_receber' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Contas a Receber</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              Nenhum registro encontrado
            </div>
          </div>
        )}

        {activeTab === 'contas_pagar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Contas a Pagar</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              Nenhum registro encontrado
            </div>
          </div>
        )}

        {activeTab === 'fluxo_caixa' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Fluxo de Caixa</h2>
            <div className="text-center py-12 text-gray-500">
              Gráfico de fluxo de caixa em desenvolvimento
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
