import { Router } from "express";
import { auth } from "../../middleware/auth";
import {
  createIssue,
  deleteIssue,
  getIssueById,
  getIssues,
  updateIssue
} from "./issues.controller";

const router = Router();

router.post("/", auth, createIssue);
router.get("/", getIssues);
router.get("/:id", getIssueById);
router.patch("/:id", auth, updateIssue);
router.delete("/:id", auth, deleteIssue);

export default router;
