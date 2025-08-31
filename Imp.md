## Big 3 For GraphQL

1. Query: Sample Fetching Data From DB
2. Mutation: Create , Edit , Delete , Update with Data From DB
3. Subscription: For Web Socket Connection We Used Subscription

## JWT For HTTP & Web Socket

- `For HTTP → JWT in headers`
- `For WS → JWT in connectionParams`

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

## refetch

- `refetch()` guarantees fresh data from the server and keeps Apollo's cache consistent for all components where `GraphqlQuery` is used
- Thats the drawback because it also make network calls which is unnecessary
- EX:
    ```js
    const { refetch: refetchUsers , loading , data , error } = useQuery(GET_ALL_USERS)
    const { refetch: refetchPosts , loading , data, error  } = useQuery(GET_ALL_POSTS)

    // then we can use manually wherver want to refetch the query
    refetchPosts();
    refetchUsers();
    ```

## refetchQueries

- `refetchQueries` is an array of queries that will be refetched only that grahql `Queries` that we specified like below , after a mutation is completed
- `refetchedQueries` only work with `Queries`
- Ex:
    ```js
    const [createUser] = useMutation(CREATE_USER, {
      refetchQueries: [{ query: GET_ALL_USERS }, { query: GET_ALL_POSTS }],
    });
    ```

## In Short WorkFlow
- React component → `useQuery()` → Apollo checks split() → finds main operation (query) → routes to `httpLink` → sends full query (fragments expanded) → backend resolves → response → UI updates.

- React component → `useMutation()` → Apollo checks split() → finds main operation (mutation) → routes to `httpLink` → sends full query (fragments expanded) → backend resolves → response → UI updates.

- React component → `useSubscription()` → Apollo checks split() → finds main operation (subscription) → routes to `wsLink` → sends full query (fragments expanded) → backend resolves → response → UI updates.