import React from "react";
import styles from "./Avatar.module.css";
import Image from "next/image";

export function Avatar({ name, otherStyle }: { name: string; otherStyle: string }) {
  return (
    <div className={`${styles.avatar} ${otherStyle} h-9 w-9 rounded-full`} data-tooltip={name}>
      <Image
        alt="avatar"
        src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
        fill
        className={styles.avatar_picture}
      />
    </div>
  );
}