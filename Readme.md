# 🚀 GraphQL Full Example (Apollo Server + React Client)

This project demonstrates how to build a **GraphQL server** using **Apollo Server** and consume it on the **frontend with React + Apollo Client**.
It fetches data from **JSONPlaceholder API** via GraphQL.

---

## ✅ Features

* **GraphQL Schema Definition (SDL)**
* **Apollo Server** (Standalone Mode)
* **Resolvers** (with `fetch` from JSONPlaceholder)
* **Apollo Client** for React
* **GraphQL Playground** at `http://localhost:4000/`
* Two Queries:

  * `getTodos` (with nested `user`)
  * `getUsers` & `getUserByID`

---

## 🛠 Tech Stack

* **Backend**: Node.js, Apollo Server
* **Frontend**: React, Apollo Client
* **API Source**: [JSONPlaceholder](https://jsonplaceholder.typicode.com)

---

## 📂 Project Structure

```
graphql-project/
│
├── server/
│   └── index.js       # Apollo Server
│
└── client/
    ├── src/
    │   ├── App.jsx    # UI for Todos & Users
    │   └── index.jsx  # Apollo Provider
    └── package.json
```

---

## ⚡ Setup & Run

### 1. **Backend (GraphQL Server)**

#### Install dependencies:

```bash
npm install @apollo/server graphql graphql-tag node-fetch
```

#### Create `server/index.js`:

```js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { gql } = require('graphql-tag');
const fetch = require('node-fetch');

// ✅ Type Definitions (GraphQL Schema)
const typeDefs = gql`
    type Geo {
        lat: String!
        lng: String!
    }

    type Address {
        street: String!
        suite: String!
        city: String!
        zipcode: String!
        geo: Geo!
    }

    type User {
        id: ID!
        name: String!
        username: String!
        email: String!
        address: Address!
    }

    type Todo {
        userId: ID!
        id: ID!
        title: String!
        completed: Boolean
        user: User
    }

    type Query {
        getTodos: [Todo]
        getUsers: [User]
        getUserByID(id: ID!): User
    }
`;

// ✅ Resolvers
const resolvers = {
    Todo: {
        user: async (todo) => {
            const response = await fetch(`https://jsonplaceholder.typicode.com/users/${todo.userId}`);
            return response.json();
        }
    },
    Query: {
        getTodos: () => fetch("https://jsonplaceholder.typicode.com/todos").then(res => res.json()),
        getUsers: () => fetch("https://jsonplaceholder.typicode.com/users").then(res => res.json()),
        getUserByID: async (_, { id }) => {
            const response = await fetch("https://jsonplaceholder.typicode.com/users");
            const users = await response.json();
            return users.find(u => u.id === parseInt(id));
        }
    },
};

// ✅ Start Server
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
    const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
    console.log(`🚀 GraphQL server ready at ${url}`);
}

startServer();
```

#### Start server:

```bash
node server/index.js
```

GraphQL Playground available at:

```
http://localhost:4000/
```

---

### 2. **Frontend (React + Apollo Client)**

#### Install dependencies:

```bash
npm install @apollo/client graphql
```

#### Setup `index.jsx`:

```js
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import App from './App.jsx'
import './index.css'

// ✅ Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>,
)
```

#### Create `App.jsx`:

```jsx
import { useQuery, gql } from '@apollo/client'
import './App.css'

// ✅ GraphQL Queries
const GET_TODOS = gql`
  query GetTodos {
    getTodos {
      id
      userId
      title
      completed
      user {
        id
        name
        email
        username
      }
    }
  }
`

const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      username
      email
      address {
        street
        city
        zipcode
      }
    }
  }
`

// ✅ Components
function TodoList() {
  const { loading, error, data } = useQuery(GET_TODOS)

  if (loading) return <p>Loading todos...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h2>Todos</h2>
      {data.getTodos.slice(0, 10).map(todo => (
        <div key={todo.id}>
          <h3>{todo.title}</h3>
          <p>User: {todo.user.name}</p>
        </div>
      ))}
    </div>
  )
}

function UserList() {
  const { loading, error, data } = useQuery(GET_USERS)

  if (loading) return <p>Loading users...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h2>Users</h2>
      {data.getUsers.slice(0, 6).map(user => (
        <div key={user.id}>
          <h3>{user.name} (@{user.username})</h3>
          <p>Email: {user.email}</p>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div>
      <h1>🚀 GraphQL Learning App</h1>
      <TodoList />
      <UserList />
    </div>
  )
}
```

---

## ✅ Run Frontend:

```bash
npm run dev
```

Open:

```
http://localhost:5173/
```

---

## 🔍 How GraphQL Works Here:

* **Backend**

  * `typeDefs` → Defines **GraphQL Schema** (Types + Queries)
  * `resolvers` → Defines **how data is fetched**
  * Apollo Server → Runs GraphQL API at `/graphql`
* **Frontend**

  * Uses **Apollo Client** to send queries