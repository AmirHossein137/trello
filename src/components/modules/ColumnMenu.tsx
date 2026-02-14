"use client";

import React, { useRef, useEffect, useState } from "react";
import styles from "@/assets/css/ColumnMenu.module.css";
import { IoMdClose } from "react-icons/io";
import { FaChevronLeft } from "react-icons/fa";

interface ColumnMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onDeleteList: () => void;
  onDeleteAllCards: () => void;
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({
  isOpen,
  position,
  onClose,
  onDeleteList,
  onDeleteAllCards,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [stepDelete, setStepDelete] = useState(1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.menu}
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        background: "white",
        maxWidth: "272px",
      }}
    >
      {stepDelete === 1 ? (
        <>
          <div className={styles.header}>
            <span>List Actions</span>
            <button className={styles.closeBtn} onClick={onClose}>
              <IoMdClose color="black" size={20} fontWeight={"bold"} />
            </button>
          </div>
          <div className={styles.menuItems}>
            <button
              className={styles.menuItem}
              onClick={() => setStepDelete(2)}
            >
              Delete List
            </button>
            <button
              className={styles.menuItem}
              onClick={() => setStepDelete(3)}
            >
              Delete All Cards
            </button>
          </div>
        </>
      ) : stepDelete === 2 ? (
        <>
          <div className={styles.header}>
            <button className={styles.back} onClick={() => setStepDelete(1)}>
              <FaChevronLeft color="black" />
            </button>
            <span>List Actions</span>
            <button className={styles.closeBtn} onClick={onClose}>
              <IoMdClose color="black" size={20} fontWeight={"bold"} />
            </button>
          </div>
          <div className={styles.deleteCard}>
            <span>
              All actions will be removed from the activity feed and you won’t
              be able to re-open the list. There is no undo.
            </span>
            <button onClick={onDeleteList}>Delete List</button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.header}>
            <button className={styles.back} onClick={() => setStepDelete(1)}>
              <FaChevronLeft color="black" />
            </button>
            <span>List Actions</span>
            <button className={styles.closeBtn} onClick={onClose}>
              <IoMdClose color="black" size={20} fontWeight={"bold"} />
            </button>
          </div>
          <div className={styles.deleteCard}>
            <span>
              This will remove all the cards in this list from the board.
            </span>
            <button onClick={onDeleteAllCards}>Delete All</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ColumnMenu;
