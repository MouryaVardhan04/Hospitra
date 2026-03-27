import jwt from "jsonwebtoken"

// admin or reception authentication middleware
const authAdminOrReception = async (req, res, next) => {
    try {
        const { atoken } = req.headers
        if (!atoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
        const adminKey = process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD
        const receptionKey = process.env.RECEPTION_EMAIL + process.env.RECEPTION_PASSWORD
        if (token_decode !== adminKey && token_decode !== receptionKey) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdminOrReception
