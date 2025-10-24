import { useState, useEffect, useCallback, useRef } from "react";
import WeekSection from "../components/WeekSection";

const INITIAL_WEEKS = 3; // Load 3 weeks initially (all cached, faster load)
const LOAD_MORE_COUNT = 3; // Load 3 more weeks when scrolling

function Home() {
    const [weeks, setWeeks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef(null);

    useEffect(() => {
        fetchWeeks(0, INITIAL_WEEKS);
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMoreWeeks();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loadingMore, weeks]);

    const fetchWeeks = async (offset, limit) => {
        try {
            const response = await fetch(`/api/weeks?offset=${offset}&limit=${limit}`);
            if (!response.ok) {
                throw new Error("Failed to fetch weeks");
            }
            const data = await response.json();
            setWeeks(data.weeks);
            setHasMore(data.weeks.length === limit); // If we got fewer weeks, no more to load
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadMoreWeeks = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const offset = weeks.length;
            const response = await fetch(`/api/weeks?offset=${offset}&limit=${LOAD_MORE_COUNT}`);
            if (!response.ok) {
                throw new Error("Failed to fetch more weeks");
            }
            const data = await response.json();

            if (data.weeks.length === 0) {
                setHasMore(false);
            } else {
                setWeeks((prev) => [...prev, ...data.weeks]);
                setHasMore(data.weeks.length === LOAD_MORE_COUNT);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingMore(false);
        }
    }, [weeks, loadingMore, hasMore]);

    if (loading) {
        return (
            <div className="container">
                <p>Loading...</p>
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
            <h1 className="week-title">This Week</h1>
            {weeks.map((week, index) => (
                <WeekSection
                    key={index}
                    week={week}
                    isFirstWeek={index === 0}
                />
            ))}

            {/* Infinite scroll trigger */}
            {hasMore && (
                <div ref={observerTarget} style={{ padding: "20px", textAlign: "center" }}>
                    {loadingMore && <p>Loading more weeks...</p>}
                </div>
            )}

            {!hasMore && weeks.length > 0 && (
                <div style={{ padding: "20px", textAlign: "center", opacity: 0.5 }}>
                    <p>You've reached the end</p>
                </div>
            )}
        </div>
    );
}

export default Home;
