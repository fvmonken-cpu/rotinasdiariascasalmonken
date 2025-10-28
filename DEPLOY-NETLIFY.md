# Instruções de Deploy no Netlify

## Problemas Resolvidos

1. **Versão do Node.js atualizada**: De 18 para 20 para compatibilidade com React Router
2. **React Router downgrade**: De v7.5.0 para v6.28.0 para evitar incompatibilidades
3. **Package-lock.json**: Precisa ser regenerado após as mudanças

## Passos para Deploy

### 1. Regenerar package-lock.json
Antes de fazer o commit e push, execute localmente:

```bash
# Remover package-lock.json e node_modules
rm package-lock.json
rm -rf node_modules

# Reinstalar dependências
npm install
```

### 2. Configurar Variáveis de Ambiente no Netlify

No painel do Netlify, vá em **Site settings > Environment variables** e adicione:

```
VITE_SUPABASE_URL=https://wzlfjrzxzsbsideglexo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bGZqcnp4enNic2lkZWdsZXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDE4MTAsImV4cCI6MjA3MzgxNzgxMH0.lmLgmKjCuPkW2EBSQYzx2PkM5Qj42dDXi6ELfahL-Yk
```

### 3. Configurações do Build

O arquivo `netlify.toml` já está configurado corretamente com:
- Node.js versão 20
- Comando de build: `npm ci && npm run build`
- Diretório de publicação: `dist`
- Redirecionamento SPA para React Router

### 4. Teste Local

Antes do deploy, teste localmente:

```bash
npm run build
npm run preview
```

### 5. Deploy

Após confirmar que tudo funciona localmente:

```bash
git add .
git commit -m "Fix: Update Node.js to v20 and React Router for Netlify deployment"
git push origin main
```

## Troubleshooting

### Se ainda houver erro de package-lock.json:
1. Deletar `package-lock.json` do repositório
2. Fazer commit da mudança
3. O Netlify irá gerar um novo `package-lock.json` automaticamente

### Se houver erro de dependências:
- Verificar se todas as variáveis de ambiente estão configuradas
- Conferir se o build local está funcionando
- Verificar logs do Netlify para erros específicos