import jwt from "jsonwebtoken"

// Pharmacy admin authentication middleware
const authPharmacy = async (req, res, next) => {
    try {
        const { pharmtoken } = req.headers
        if (!pharmtoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        const token_decode = jwt.verify(pharmtoken, process.env.JWT_SECRET)
        if (token_decode !== process.env.PHARMACY_EMAIL + process.env.PHARMACY_PASSWORD) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authPharmacy;
