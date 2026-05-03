# Fit Tracker

Sistema web de gestão de treinos utilizando React, Firebase e Vercel.

## Tecnologias

- **Frontend**: React com Vite
- **Backend**: Firebase (Auth + Firestore)
- **Deploy**: Vercel
- **UI**: Tailwind CSS

## Funcionalidades

- Autenticação com email/senha e Google OAuth
- Dashboard com treinos e destaque para "treino do dia"
- Visualização de treinos com exercícios e histórico
- Execução de treinos com edição de pesos
- CRUD de treinos e exercícios
- Proteção de rotas

## Configuração

### 1. Clonagem e instalação

```bash
git clone <repo-url>
cd fit-tracker
npm install
```

### 2. Configuração do Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative Authentication (Email/Password e Google)
4. Ative Firestore Database
5. Obtenha as credenciais do projeto

### 3. Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Copie o arquivo `.env.example` para `.env` e preencha os valores.

### 4. Configuração das Regras de Segurança do Firestore

As regras de segurança são essenciais para proteger seus dados. Siga estes passos:

#### Opção A: Usando Firebase CLI (Recomendado)

1. Instale o Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Autentique-se com Firebase:

```bash
firebase login
```

3. Inicialize Firebase no projeto:

```bash
firebase init
```

- Selecione "Firestore" quando perguntado
- Escolha seu projeto Firebase
- Use os nomes padrão para os arquivos

4. Copie as regras do arquivo `firestore.rules` para o arquivo gerado pela CLI (geralmente `firestore.rules`)

5. Deploy as regras:

```bash
firebase deploy --only firestore:rules
```

#### Opção B: Usando Firebase Console (Manual)

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para **Firestore Database** → **Rules**
4. Copie todo o conteúdo do arquivo `firestore.rules` do projeto
5. Cole no editor de regras do Firebase Console
6. Clique em **Publicar**

### Regras de Segurança Implementadas

- ✅ Usuários só podem ler/escrever seus próprios treinos
- ✅ Usuários autenticados podem acessar exercícios
- ✅ Usuários só podem ler/escrever seus próprios logs
- ✅ Protege dados contra acesso não autorizado

### 5. Executar localmente

```bash
npm run dev
```

Acesse `http://localhost:5173`

### 6. Deploy na Vercel

1. Faça push do código para um repositório Git
2. Conecte o repositório à Vercel
3. Configure as variáveis de ambiente na Vercel
4. Deploy

## Estrutura do projeto

```
src/
├── components/
│   └── ProtectedRoute.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── WorkoutView.jsx
│   ├── WorkoutStart.jsx
│   ├── Workouts.jsx
│   └── WorkoutForm.jsx
├── services/
│   ├── firebase.js
│   └── firestore.js
├── hooks/
│   └── useAuth.js
└── utils/
```

## Modelagem de dados (Firestore)

### users

- id: string
- email: string

### workouts

- id: string
- userId: string
- name: string
- order: number
- createdAt: timestamp

### exercises

- id: string
- workoutId: string
- name: string
- device?: string
- sets: number
- reps: number
- currentWeight?: number

### workoutLogs

- id: string
- workoutId: string
- userId: string
- date: timestamp

### exerciseLogs

- id: string
- exerciseId: string
- workoutLogId: string
- weight: number
- date: timestamp

## Regras de negócio

- "Treino do dia": primeiro treino não finalizado, ou o primeiro da lista
- Após finalizar um treino, o próximo vira "do dia"
- Peso atual: último peso utilizado
- Histórico: logs por exercício ordenados por data
- Treinos seguem ordem sequencial

## Desenvolvimento

- Use `npm run lint` para verificar código
- Componentes usam Tailwind CSS
- Autenticação obrigatória para acessar o sistema
- Feedback visual com react-hot-toast
