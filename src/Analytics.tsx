// @ts-nocheck
import React, { useEffect, useState, useContext } from 'react';
import { Card, Button } from "@material-ui/core";
import { FirebaseContext } from "./firebaseContext";
import { v4 as uuidv4 } from "uuid";



export const Analytics = () => {
    const [todays, setTodays] = useState();
    const [lastWeek, setlastWeek] = useState();
    const [lastMonth, setlastMonth] = useState();

    const { getVisit } = useContext(FirebaseContext);

    useEffect(() => {
        async function fetchVisits() {
            const start = 1650574800000; //april 21 
            const dayInterval = 86400000;
            let timestamp = Date.now();

            let dayIndex = (Math.floor((timestamp - start) / dayInterval)).toString();

            let result = await getVisit();

            let tempWeek = 0;
            let tempMonth = 0;

            result.forEach(element => {
                console.log(element.id)
                console.log(element.data)
                if (dayIndex === element.id) {
                    setTodays(element.data.visits)
                }
                if (dayIndex - element.id >= 0 && dayIndex - element.id < 7) {
                    tempWeek += element.data.visits;
                }
                if (dayIndex - element.id >= 0 && dayIndex - element.id < 30) {
                    tempMonth += element.data.visits;
                }
            });
            setlastWeek(tempWeek);
            setlastMonth(tempMonth)



        }
        fetchVisits();

    }, []);

    return (
        <div style={{
            height: "100vh"
            //, backgroundColor: "gray" 
        }}>
            Hello World
            <br></br>
            <h1>Visits</h1>
            Todays: {todays}
            <br></br>
            Last 7 days: {lastWeek}
            <br></br>
            Last 30 days: {lastMonth}
        </div>
    );
}

