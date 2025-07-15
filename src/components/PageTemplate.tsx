import React from 'react'
import { LucideIcon } from 'lucide-react'

interface PageTemplateProps {
  title: string
  subtitle: string
  icon: LucideIcon
  iconColor: string
  children?: React.ReactNode
  comingSoonFeatures?: string[]
}

const PageTemplate: React.FC<PageTemplateProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
  comingSoonFeatures = []
}) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-200`}>
              <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {children ? (
          children
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 mb-6`}>
                <Icon className={`h-16 w-16 ${iconColor}`} />
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                {title} em Desenvolvimento
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Estamos trabalhando para trazer as melhores funcionalidades para sua gestão de turismo.
              </p>

              {comingSoonFeatures.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    🚀 Em breve:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {comingSoonFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center text-blue-800">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageTemplate 