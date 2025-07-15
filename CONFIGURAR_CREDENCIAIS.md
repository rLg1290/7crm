# 🔑 Configuração das Credenciais API Hotelbeds

## ✅ Credenciais Obtidas com Sucesso!

Suas credenciais da API Hotelbeds estão funcionando:
- **Status**: OK (verificado em 30/05/2025 19:45:38)
- **API Key**: `aee1137aba908f2c4e5fced6f4d7307e`
- **API Secret**: `35c87bb016`

## 📝 Como Configurar no Sistema

### Opção 1: Arquivo .env (Recomendado)
**ATENÇÃO:** No Vite, as variáveis devem começar com `VITE_`

Atualize seu arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Configuração da API Hotelbeds
VITE_HOTELBEDS_API_KEY=aee1137aba908f2c4e5fced6f4d7307e
VITE_HOTELBEDS_SECRET=35c87bb016

# Outras configurações
VITE_APP_NAME=Sistema CRM
VITE_APP_VERSION=1.0.0
```

### Opção 2: Arquivo .env.local
Alternativamente, crie um arquivo `.env.local` com o mesmo conteúdo acima.

### Opção 3: Configuração Direta no Código
Se preferir, pode editar o arquivo `src/services/hotelbedsService.ts` nas linhas 7-8:

```typescript
apiKey: 'aee1137aba908f2c4e5fced6f4d7307e',
secret: '35c87bb016',
```

## 🚀 Após Configurar

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Teste a funcionalidade**:
   - Acesse a página de Hotelaria
   - O alerta amarelo de "API não configurada" deve desaparecer
   - Digite um destino (ex: "São Paulo") para testar o autocomplete
   - Faça uma busca completa de hotéis

## ⚠️ Importante

- **Limites**: Sua conta tem quota de 50 requisições/dia para teste
- **Segurança**: Nunca compartilhe suas credenciais publicamente
- **Backup**: Guarde suas credenciais em local seguro
- **Vite**: As variáveis devem começar com `VITE_` para serem acessíveis no navegador

## 🔍 Funcionalidades Ativadas

✅ Autocomplete de destinos em tempo real
✅ Busca de hotéis com disponibilidade real
✅ Preços e informações atualizadas
✅ Galeria de imagens dos hotéis
✅ Filtros avançados (categoria, facilidades)
✅ Sistema de favoritos local

---

**Sistema pronto para uso com API Hotelbeds!** 🎉 