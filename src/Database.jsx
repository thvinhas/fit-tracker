import React, { useEffect, useState } from "react";
import { database } from "./configuration"; // Assuming the correct path to your configuration file
import { getDatabase, ref, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";

// App.js

function Database() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log(auth);

    // Initialize the Firebase database with the provided configuration

    // Reference to the specific collection in the database
    const collectionRef = ref(database, "your_collection");

    // Function to fetch data from the database
    const fetchData = () => {
      // Listen for changes in the collection
      onValue(collectionRef, (snapshot) => {
        const dataItem = snapshot.val();
        console.log(dataItem);

        // Check if dataItem exists
        if (dataItem) {
          // Convert the object values into an array
          const displayItem = Object.values(dataItem);
          setData(displayItem);
        }
      });
    };

    // Fetch data when the component mounts
    fetchData();
  }, []);

  return (
    <div>
      <h1>Data from database:</h1>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default Database;
