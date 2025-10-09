# 🚀 Configuração do Supabase - Sistema de Checklist

Este guia explica como configurar o Supabase para o sistema de gerenciamento de checklists.

## 📋 Passos para Configuração

### 1. Criar Conta no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Faça login com GitHub, Google ou crie uma conta

### 2. Criar Novo Projeto
1. Clique em **"New project"**
2. Escolha sua organização
3. Configure o projeto:
   - **Name**: `checklist-management-system`
   - **Database Password**: Anote esta senha com segurança!
   - **Region**: Escolha a região mais próxima do Brasil (us-east-1 ou sa-east-1)
4. Clique em **"Create new project"**

### 3. Configurar Variáveis de Ambiente
Após o projeto ser criado, você precisará das seguintes informações:

1. Vá para **Settings** > **API**
2. Copie os valores:
   - **Project URL**
   - **anon public key**

### 4. Executar Script SQL
1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `database-setup.sql`
4. Cole no editor SQL
5. Clique em **"Run"**

✅ **Pronto!** Suas tabelas e dados iniciais foram criados.

### 5. Configurar no Aplicativo
1. No sistema, faça login como **Admin**
2. Vá para o **Painel Administrativo**
3. Na seção **Database Status**, clique em **"Connect to Supabase"**
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`: Sua Project URL
   - `VITE_SUPABASE_ANON_KEY`: Sua anon public key

## 🎯 Funcionalidades Após Conexão

### ✅ Recursos Ativados:
- **Banco PostgreSQL** completo
- **Autenticação segura** 
- **Dados persistentes** (não se perdem)
- **Multi-usuário real** (vários usuários simultâneos)
- **Backup automático**
- **Sincronização em tempo real**
- **Relatórios avançados**

### 📊 Estrutura do Banco:
- `users` - Usuários do sistema
- `professional_categories` - Categorias profissionais
- `task_categories` - Categorias de tarefas
- `master_tasks` - Tarefas principais
- `daily_checklists` - Checklists diários
- `task_progress` - Progresso das tarefas
- `user_reports` - Relatórios de usuários

## 🔒 Segurança

### Row Level Security (RLS):
- ✅ Usuários só veem seus próprios dados
- ✅ Admins e diretores têm acesso supervisório
- ✅ Políticas de segurança automáticas
- ✅ Proteção contra acesso não autorizado

### Permissões por Função:
- **Admin**: Acesso total ao sistema
- **Director**: Visualiza todos os relatórios
- **Secretária/Enfermeira/SDR**: Apenas seus próprios checklists

## 🔄 Migração Automática

O sistema migra automaticamente os dados existentes do localStorage para o Supabase:

1. **Usuários** → Tabela `users`
2. **Checklists** → Tabela `daily_checklists`
3. **Progresso** → Tabela `task_progress`
4. **Configurações** → Tabelas de configuração

## 🆘 Resolução de Problemas

### Erro de Conexão:
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo
- Verifique se executou o script SQL completo

### Dados Não Aparecem:
- Confirme que a migração foi executada
- Verique os logs no console do navegador
- Teste a conexão no SQL Editor do Supabase

### Performance:
- O sistema criou índices automáticos para performance
- Consultas são otimizadas automaticamente
- Cache automático de dados frequentes

## 📈 Monitoramento

No painel do Supabase você pode monitorar:
- **Usage** - Uso do banco de dados
- **Logs** - Logs de atividade
- **Performance** - Performance das consultas
- **Auth** - Tentativas de login

## 🎉 Próximos Passos

Após a configuração:
1. ✅ Teste o login com diferentes usuários
2. ✅ Crie alguns checklists de teste
3. ✅ Verifique os relatórios no painel admin
4. ✅ Configure backup automático (já incluído)
5. ✅ Monitore o uso e performance

---

**💡 Dica:** O sistema funciona perfeitamente mesmo sem Supabase (usando localStorage), mas com Supabase você tem todos os benefícios de um banco de dados profissional!

**🔗 Links Úteis:**
- [Documentação Supabase](https://supabase.com/docs)
- [Dashboard Supabase](https://app.supabase.com)
- [Status Page](https://status.supabase.com)