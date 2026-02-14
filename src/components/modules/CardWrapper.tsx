"use client";

import React, { useState } from "react";
import styles from "@/app/page.module.css";
import { IoMdClose } from "react-icons/io";

interface Props {
  onAdd: (title: string) => void;
}

const CardWrapper: React.FC<Props> = ({ onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title);
    setTitle("");
    setIsAdding(false);
  };

  return (
    <div style={{ width: "250px" }}>
      {isAdding ? (
        <div style={{ background: "#ebecf0", padding: "15px 8px", borderRadius: "8px" }}>
          <input
            type="text"
            placeholder="Enter a list title..."
            value={title}
            className={styles.inputs}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            style={{
              height : "40px"
            }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAdd}
              style={{
                background: "#5aac44",
                color: "white",
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Add list
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className={styles.close}
            >
              <IoMdClose color="black" size={20} fontWeight={"bold"}/>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className={styles.addItemButton}
        >
          + Add another list
        </button>
      )}
    </div>
  );
};

export default CardWrapper;
