import jwt from "jsonwebtoken"

// Labs admin authentication middleware
const authLabs = async (req, res, next) => {
    try {
        const { labstoken } = req.headers
        if (!labstoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        const token_decode = jwt.verify(labstoken, process.env.JWT_SECRET)
        if (token_decode !== process.env.LABS_EMAIL + process.env.LABS_PASSWORD) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }
        req.auditActor = { type: 'labs', id: process.env.LABS_EMAIL }
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authLabs;
