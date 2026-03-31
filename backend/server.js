import express from "express"
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import 'dotenv/config'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import pharmacyRouter from "./routes/pharmacyRoute.js"
import labsRouter from "./routes/labsRoute.js"
import { verifyEmailTransport } from './services/emailService.js'
import chatRouter from './routes/chatRoute.js'
import debugRouter from './routes/debugRoute.js'
import { seedPharmacyMedicines } from "./seed/pharmacySeed.js"
import auditLogger from './middleware/auditLogger.js'
import registerChatSocket from './socket/chatSocket.js'

// app config
const app = express()
const port = process.env.PORT || 4000
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

registerChatSocket(io)

// Initialize services, then start server only when DB is connected
connectDB()
  .then(async () => {
    connectCloudinary()
    await verifyEmailTransport()
    await seedPharmacyMedicines()
    // Mount debug email routes only when a token is configured
    if (process.env.DEBUG_EMAIL_TOKEN) {
      app.use('/api/debug', debugRouter)
      console.log('[debug] email routes enabled')
    }
    server.listen(port, '0.0.0.0', () => console.log(`Server started on PORT:${port}`))
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err?.message || err)
    process.exit(1)
  })

// middlewares
app.use(express.json())
app.use(cors())
app.use(auditLogger)

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/pharmacy", pharmacyRouter)
app.use("/api/labs", labsRouter)
app.use("/api/chat", chatRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

// server is started after successful DB connection above