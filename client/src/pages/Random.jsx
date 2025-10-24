import { useState, useEffect } from "react";
import WeekSection from "../components/WeekSection";

function Random() {
    const [week, setWeek] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [weekNumber, setWeekNumber] = useState(null);

    useEffect(() => {
        fetchRandomWeek();
    }, []);

    const getRandomWeekNumber = () => {
        // Generate random week between 1 and 52 (exclude current week 0)
        return Math.floor(Math.random() * 52) + 1;
    };

    const fetchRandomWeek = async () => {
        setLoading(true);
        setError(null);

        try {
            const randomWeekNum = getRandomWeekNumber();
            setWeekNumber(randomWeekNum);

            const response = await fetch(`/api/weeks/${randomWeekNum}`);
            if (!response.ok) {
                throw new Error("Failed to fetch random week");
            }
            const data = await response.json();
            setWeek(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNewRandom = () => {
        fetchRandomWeek();
    };

    if (loading) {
        return (
            <div className="container">
                <p>Loading random week...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <p>Error: {error}</p>
                <button onClick={handleNewRandom} className="random-button">
                    Try Another Random Week
                </button>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="random-header">
                <div>
                    <h1 className="week-title">Random Week</h1>
                    <p className="random-subtitle">
                        {weekNumber} week{weekNumber !== 1 ? "s" : ""} ago
                    </p>
                </div>
                <button onClick={handleNewRandom} className="random-button">
                    Another Random Week
                </button>
            </div>
            {week && <WeekSection week={week} isFirstWeek={false} />}
        </div>
    );
}

export default Random;
