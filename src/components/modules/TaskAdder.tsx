"use client";

import React, { useState } from "react";
import styles from "@/assets/css/page.module.css";
import { IoMdClose } from "react-icons/io";

interface Props {
  onAdd: (title: string) => void;
}

const TaskAdder: React.FC<Props> = ({ onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title);
    setTitle("");
    setIsAdding(false);
  };

  return isAdding ? (
    <div style={{ marginTop: "8px" }}>
      <textarea
        placeholder="Enter a card title..."
        value={title}
        rows={4}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className={styles.inputs}
      ></textarea>
      <div style={{ display: "flex", gap: "8px" }}>
        <button className={styles.createCard} onClick={handleAdd}>
          Create Card
        </button>
        <button onClick={() => setIsAdding(false)} className={styles.close}>
          <IoMdClose color="black" size={20} fontWeight={"bold"} />
        </button>
      </div>
    </div>
  ) : (
    <button
      onClick={() => setIsAdding(true)}
      style={{
        marginTop: "8px",
        background: "transparent",
        border: "none",
        color: "#5e6c84",
        cursor: "pointer",
        textAlign: "left",
        padding: "4px 0",
      }}
    >
      + Add another Card
    </button>
  );
};

export default TaskAdder;
