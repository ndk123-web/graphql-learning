## Big 3 For GraphQL

1. Query: Sample Fetching Data From DB
2. Mutation: Create , Edit , Delete , Update with Data From DB
3. Subscription: For Web Socket Connection We Used Subscription

## JWT For Mutation and Query (for http req)

- we need to declare or verify in `expressMiddleware()`
- Flow:

  - Client Req (header) -> expressMiddleware (get header & verify ) -> if valid (returns { user } in `context`) / if invalid (throw error and send back error)
  - Ex:

  ```js
  app.use(
    "/graphql",
    cors({
      origin: [
        "http://localhost:4000",
        "http://localhost:5173",
        "https://studio.apollographql.com",
      ],
      credentials: true,
    }),
    express.json(),

    // jwt auth
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Here JWT AUTH LOGIC
        const token = req.headers.authorization;
        let user;

        if (!token) {
          console.log("Can'e Access Because UnAuthorized Request");
          throw new Error("Unauthorized");
        }

        user = "ndk";

        // THIS WILL BE SEND TO THE "CONTEXT" IN RESOLVERS ( MUTATION , QUERY , SUBSCRIPTION )
        return { user };
      },
    })
  );
  ```

  - After this { user } sent in context like

  ```js
   Query: {
        users: (_, __, context) => {

        // HERE JWT AUTH
        if (!context.user) {
            console.log("Can'e Access Because UnAuthorized Request")
            throw new Error("Can't Access")
        }

        return users
        },
    }
  ```

## JWT For Subscription (for websocker req)

- we need to declare or verify in `useServer()`
- Flow:

  - Client WS (from localstorage sends authToken) -> In Backend(`useServer()`) -> get authToken -> verify -> if verify then attach `context` then send with `context` to respected route / throw error and close the connection

  - Ex:
  - client Side

  ```js
  // WebSocket Link for subscriptions
  const wsLink = new GraphQLWsLink(
    createClient({
      url: "ws://localhost:4000/graphql",
      connectionParams: {
        authToken: localStorage.getItem("token"),
      },
    })
  );
  ```

  - Server Side

  ```js
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // FOR WEB SOCKET JWT AUTH

        // ctx.connectionParams contains data sent by client when connecting
        const token = ctx.connectionParams?.authToken; // or 'Authorization' based on your client

        if (!token) {
          throw new Error("Unauthorized: No token provided");
        }

        let user;
        try {
          // Verify JWT (replace with your actual secret)
          // user = jwt.verify(token.replace("Bearer ", ""), "SECRET_KEY");
          user = "ndk";
        } catch (err) {
          throw new Error("Invalid or expired token");
        }

        return { user }; // available in Subscription resolvers
      },
    },
    wsServer
  );
  ```

  - Now This { user } sent to the `Subscription`

  ```js
  Subscription: {
    userCreated: {
      subscribe: (_, __, { user }) => {
        // FOR WEB SOCKET JWT AUTH
        if (!user) {
          console.log("UnAuthorized in Subscription");
          throw new Error("UnAuthorized in Subscription");
        }

        return pubsub.asyncIterator(["USER_CREATED"]);
      };
    }
  }
  ```
