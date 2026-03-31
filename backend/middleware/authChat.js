import jwt from 'jsonwebtoken'

const authChat = async (req, res, next) => {
  const token = req.headers.token
  const dtoken = req.headers.dtoken

  const rawToken = token || dtoken
  if (!rawToken) {
    return res.status(401).json({ success: false, message: 'Not Authorized' })
  }

  try {
    const decoded = jwt.verify(rawToken, process.env.JWT_SECRET)
    if (token) {
      req.chatActor = { id: decoded.id, role: 'user' }
    } else {
      req.chatActor = { id: decoded.id, role: 'doctor' }
    }
    next()
  } catch (error) {
    console.log(error)
    res.status(401).json({ success: false, message: error.message })
  }
}

export default authChat