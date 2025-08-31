import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import express from 'express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import { PubSub } from 'graphql-subscriptions';

// Initialize PubSub for subscriptions
const pubsub = new PubSub();

// Sample data
let users = [
  { id: "1", name: "Rahul", age: 25, salary: 70000, department: "Engineering" },
  { id: "2", name: "Aisha", age: 30, salary: 85000, department: "Marketing" },
  { id: "3", name: "Ravi", age: 22, salary: 60000, department: "Support" },
];

let nextUserId = 4;

// GraphQL Schema
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    age: Int!
    salary: Float!
    department: String!
  }

  type Query {
    # Get all users
    users: [User!]!
    
    # Get user by ID
    user(id: ID!): User
    
    # Get users by department
    usersByDepartment(department: String!): [User!]!
  }

  type Mutation {
    # Create a new user
    createUser(input: CreateUserInput!): User!
    
    # Update existing user
    updateUser(id: ID!, input: UpdateUserInput!): User
    
    # Delete user
    deleteUser(id: ID!): Boolean!
  }

  type Subscription {
    # Subscribe to user creation events
    userCreated: User!
    
    # Subscribe to user updates
    userUpdated: User!
    
    # Subscribe to user deletion events
    userDeleted: ID!
  }

  input CreateUserInput {
    name: String!
    age: Int!
    salary: Float!
    department: String!
  }

  input UpdateUserInput {
    name: String
    age: Int
    salary: Float
    department: String
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: (_, __, context) => {

      // HERE JWT AUTH 
      // if (!context.user) {
      //   console.log("Can'e Access Because UnAuthorized Request")
      //   throw new Error("Can't Access")
      // }

      return users
    },

    user: (_, { id }) => {
      const user = users.find(u => u.id === id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      return user;
    },

    usersByDepartment: (_, { department }) => {
      return users.filter(u => u.department.toLowerCase() === department.toLowerCase());
    }
  },

  Mutation: {
    createUser: (_, { input }) => {
      const newUser = {
        id: nextUserId.toString(),
        ...input
      };
      nextUserId++;
      users.push(newUser);

      // Publish to subscription
      pubsub.publish('USER_CREATED', { userCreated: newUser });

      return newUser;
    },

    updateUser: (_, { id, input }) => {
      const userIndex = users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Update user with new data
      users[userIndex] = { ...users[userIndex], ...input };

      // Publish to subscription
      pubsub.publish('USER_UPDATED', { userUpdated: users[userIndex] });

      return users[userIndex];
    },

    deleteUser: (_, { id }) => {
      const userIndex = users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        throw new Error(`User with ID ${id} not found`);
      }

      users.splice(userIndex, 1);

      // Publish to subscription
      pubsub.publish('USER_DELETED', { userDeleted: id });

      return true;
    }
  },

  Subscription: {
    userCreated: {
      subscribe: (_, __, { user }) => {

      // FOR WEB SOCKET JWT AUTH 
      /* 
      
       if (!user){
        console.log("UnAuthorized in Subscription")
        throw new Error("UnAuthorized in Subscription") 
       }
      
      */
       
       return  pubsub.asyncIterator(['USER_CREATED'])
      }

    },

    userUpdated: {
      subscribe: () => pubsub.asyncIterator(['USER_UPDATED'])
    },

    userDeleted: {
      subscribe: () => pubsub.asyncIterator(['USER_DELETED'])
    }
  }
};

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Create WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

// Setup WebSocket server for GraphQL subscriptions
const serverCleanup = useServer({
  schema,
  context: async (ctx) => {
   
   // FOR WEB SOCKET JWT AUTH
   /*
    // ctx.connectionParams contains data sent by client when connecting
    const token = ctx.connectionParams?.authToken; // or 'Authorization' based on your client

    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    let user;
    try {
      // Verify JWT (replace with your actual secret)
      // user = jwt.verify(token.replace("Bearer ", ""), "SECRET_KEY");
      user = "ndk"
    } catch (err) {
      throw new Error("Invalid or expired token");
    }

    return { user }; // available in Subscription resolvers
    */

  }
}, wsServer);

// Create Apollo Server
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

// Start the server
async function startServer() {
  await server.start();

  // Apply CORS and JSON middleware BEFORE GraphQL middleware
  app.use(
    '/graphql',
    cors({
      origin: ['http://localhost:4000', 'http://localhost:5173', 'https://studio.apollographql.com'],
      credentials: true,
    }),
    express.json(),

    // jwt auth 
    expressMiddleware(server, {
      context: async ({ req }) => {

        // Here JWT AUTH LOGIC 
        /* 

        const token = req.headers.authorization
        let user;

        if (!token) {
          console.log("Can'e Access Because UnAuthorized Request")
          throw new Error("Unauthorized")
        }

        user = "ndk"

        // THIS WILL BE SEND TO THE "CONTEXT" IN RESOLVERS ( MUTATION , QUERY , SUBSCRIPTION ) 
        return { user } 

        */

      }
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'GraphQL server is running' });
  });

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🔄 Subscriptions ready at ws://localhost:${PORT}/graphql`);
    console.log(`📊 Apollo Studio: https://studio.apollographql.com/dev`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.stop();
  httpServer.close();
});

// Start the server
startServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});