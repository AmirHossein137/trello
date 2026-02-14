"use client";

import React, { useEffect, useState } from "react";
import { dbClient } from "@/lib/db";
import type { Comment } from "@/types/kanban";
import styles from "@/assets/css/CommentsModal.module.css";

interface CommentsModalProps {
  taskId: number;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  taskId,
  taskTitle,
  isOpen,
  onClose,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      const db = dbClient();
      const data = await db.comments
        .where("taskId")
        .equals(taskId)
        .sortBy("createdAt");
      setComments(data);
    };

    fetchComments();
  }, [isOpen, taskId]);

  const addComment = async () => {
    if (!newComment.trim()) return;
    const db = dbClient();
    const comment: Comment = {
      taskId,
      content: newComment,
      createdAt: Date.now(),
    };
    const id = await db.comments.add(comment);
    setComments((prev) => [...prev, { ...comment, id }]);
    setNewComment("");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Comments for {taskTitle}</h2>
        <button className={styles.closeBtn} onClick={onClose} />

        <div className={styles.commentsList}>
          {comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>You</span>
                <span className={styles.commentTime}>
                  · {formatDate(c.createdAt)}
                </span>
              </div>
              <div className={styles.commentContent}>{c.content}</div>
            </div>
          ))}
        </div>

        <div className={styles.addComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addComment();
              }
            }}
          />
          <button onClick={addComment} disabled={!newComment.trim()}>
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
