# Big 3 For GraphQL
1. Query: Sample Fetching Data From DB
2. Mutation: Create , Edit , Delete , Update with Data From DB
3. Subscription: For Web Socket Connection We Used Subscription

# JWT For Mutation and Query (for http req) 
- we need to declare or verify in `expressMiddleware()`
- Flow:
    - Client Req (header) -> expressMiddleware (get header & verify ) -> if valid (returns { user } in `context`) / if invalid (throw error and send back error)
    

# JWT For Subscription (for websocker req)
- we need to declare or verify in `useServer()`
- Flow:
    - Client WS (from localstorage sends authToken) -> In Backend(`useServer()`) -> get authToken -> verify -> if verify then attach `context` then send with `context` to respected route / throw error and close the connection

