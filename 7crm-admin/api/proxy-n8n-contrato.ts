import type { VercelRequest, VercelResponse } from "@vercel/node"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Handling
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  try {
    const n8nUrl = 'https://n8n.srv999039.hstgr.cloud/webhook/zapsign/contrato-agencia'
    
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    // Tenta ler a resposta
    const text = await response.text()
    
    // Tenta fazer o parse do JSON
    try {
        const jsonData = JSON.parse(text)
        res.status(response.status).json(jsonData)
    } catch {
        // Se não for JSON, retorna como mensagem
        res.status(response.status).json({ message: text })
    }
  } catch (error: any) {
    console.error('Proxy Error:', error)
    res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}