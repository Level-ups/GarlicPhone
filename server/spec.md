## `/lobby`
```ts
// Create a new lobby
lobbyRouter.post('/', (req: Request, res: Response) => {
// Join a lobby by code
lobbyRouter.post('/join', (req: Request, res: Response) => {
// Leave a lobby
lobbyRouter.post('/:lobbyId/leave', (req: Request, res: Response) => {
// Set player ready status
lobbyRouter.post('/:lobbyId/ready', (req: Request, res: Response) => {
// Start the game
lobbyRouter.post('/:lobbyId/start', (req: Request, res: Response) => {
// End the game
lobbyRouter.post('/:lobbyId/end', (req: Request, res: Response) => {
// Get a lobby by ID
lobbyRouter.get('/:lobbyId', (req: Request, res: Response) => {
// Get a lobby by code
lobbyRouter.get('/code/:code', (req: Request, res: Response) => {
// Connect to lobby updates via Server-Sent Events
lobbyRouter.get('/:lobbyId/events', createServerSentEventHandler(sendEvent => {
```

## `/image`
```ts
router.get("/:id", async (req, res) => {
router.get("/prompt/:promptId", async (req, res) => {
```

## `/auth`
```ts
router.get('/start', (req, res) => {
router.get('/callback', async (req, res) => {
```