import React from "react";
import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyAqu78CNrNMu_d7-XYZrxLXlfsRHL7kB8I",
  authDomain: "test-private-73e53.firebaseapp.com",
  projectId: "test-private-73e53",
  storageBucket: "test-private-73e53.appspot.com",
  messagingSenderId: "867921915417",
  appId: "1:867921915417:web:3c16b91322ce9cc33c4488",
  measurementId: "G-MRYPZR1EYF"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

export interface IFirebaseContext {
  updateDrumCount: (amt: number) => void;
  getDrumCount: () => Promise<number>;
}

export const FirebaseContext = React.createContext<IFirebaseContext>({
  updateDrumCount: () => {},
  getDrumCount: () => Promise.resolve(0),
});

export const FirebaseProvider: React.FC = ({ children }) => {
  const updateDrumCount = (amt: number) => {
    const docRef = db.collection("drumbeat").doc("tracking");
    docRef.set(
      { drumbeatCount: firebase.firestore.FieldValue.increment(amt) },
      {
        merge: true,
      }
    );
  };

  const getDrumCount = () => {
    return new Promise<number>(async (resolve) => {
      const docRef = db.collection("drumbeat").doc("tracking");
      const doc = await docRef.get();

      if (!doc.exists) {
        resolve(0);
      } else {
        const data = doc.data() as { drumbeatCount: number };
        resolve(data.drumbeatCount);
      }
    });
  };

  return (
    <FirebaseContext.Provider
      value={{
        updateDrumCount,
        getDrumCount,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
