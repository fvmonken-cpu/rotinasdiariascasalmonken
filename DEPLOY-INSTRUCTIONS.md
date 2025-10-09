# 🚀 Deploy Manual no Netlify - Instruções Completas

## 📋 Checklist de Deploy

### 1. ✅ Preparação dos Arquivos
- [ ] Baixar todos os arquivos do projeto
- [ ] Verificar se todas as dependências estão listadas
- [ ] Configurar variáveis de ambiente

### 2. 🌐 Deploy no Netlify
- [ ] Acessar app.netlify.com
- [ ] Fazer deploy por drag & drop
- [ ] Configurar variáveis de ambiente
- [ ] Testar o app online

## 📁 Estrutura do Projeto

```
projeto/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.ico
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── types/
│   ├── utils/
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

## 🔧 Configurações Necessárias

### Variáveis de Ambiente (Netlify):
```
VITE_SUPABASE_URL=https://wzlfjrzxzsbsideglexo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bGZqcnp4enNic2lkZWdsZXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDE4MTAsImV4cCI6MjA3MzgxNzgxMH0.lmLgmKjCuPkW2EBSQYzx2PkM5Qj42dDXi6ELfahL-Yk
```

### Build Settings:
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18 ou superior

## 📱 Após o Deploy

1. ✅ Testar login no navegador
2. ✅ Verificar conexão com Supabase
3. ✅ Testar instalação PWA no celular
4. ✅ Compartilhar URL com equipe

## 🆘 Resolução de Problemas

### Se o build falhar:
1. Verificar se todas as dependências estão no package.json
2. Confirmar variáveis de ambiente
3. Verificar logs de build no Netlify

### Se o app não carregar:
1. Verificar console do navegador (F12)
2. Confirmar se Supabase está acessível
3. Limpar cache do navegador

## 📞 Suporte
Se precisar de ajuda, compartilhe:
- URL do deploy
- Mensagens de erro
- Logs do console