// components/Profile.js
import React from "react";
import styles from "../styles/Profile.module.css";

const Profile = ({ name, avatarUrl }) => {
  return (
    <div className={styles.profileContainer}>
      <img src={avatarUrl} alt="Profile Avatar" className={styles.avatar} />
      <p className={styles.name}>{name}</p>
    </div>
  );
};

export default Profile;
