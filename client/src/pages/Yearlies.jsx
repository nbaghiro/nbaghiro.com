import { useState, useEffect } from "react";
import YearSection from "../components/YearSection";

function Yearlies() {
    const [years, setYears] = useState([]);
    const [yearData, setYearData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            // First, get available years
            const yearsResponse = await fetch("/api/years");
            if (!yearsResponse.ok) {
                throw new Error("Failed to fetch years");
            }
            const yearsData = await yearsResponse.json();
            setYears(yearsData.years);

            // Then fetch data for each year
            const yearDataPromises = yearsData.years.map((year) =>
                fetch(`/api/years/${year}`).then((res) => {
                    if (!res.ok) throw new Error(`Failed to fetch year ${year}`);
                    return res.json();
                })
            );

            const allYearData = await Promise.all(yearDataPromises);
            setYearData(allYearData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <p>Loading yearly data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="week-title">Yearly Summary</h1>
            {yearData.map((year, index) => (
                <YearSection key={index} year={year} />
            ))}
        </div>
    );
}

export default Yearlies;
