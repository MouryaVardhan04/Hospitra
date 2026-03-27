import express from 'express';
import { loginLabs, addLabTest, getLabTests, updateLabTest, deleteLabTest, labsDashboard, lookupPatient, getLabAssignments, updateLabAssignment } from '../controllers/labsController.js';
import authLabs from '../middleware/authLabs.js';

const labsRouter = express.Router();

labsRouter.post("/login", loginLabs)
labsRouter.post("/add-test", authLabs, addLabTest)
labsRouter.get("/tests", authLabs, getLabTests)
labsRouter.post("/update-test", authLabs, updateLabTest)
labsRouter.post("/delete-test", authLabs, deleteLabTest)
labsRouter.get("/dashboard", authLabs, labsDashboard)
labsRouter.post("/patient-lookup", authLabs, lookupPatient)
labsRouter.get("/assignments", authLabs, getLabAssignments)
labsRouter.post("/assignment-update", authLabs, updateLabAssignment)

export default labsRouter;
