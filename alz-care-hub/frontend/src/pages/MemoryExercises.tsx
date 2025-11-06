import { useEffect, useState } from "react";
import { FaBrain, FaFire } from "react-icons/fa";

import { useRole } from "../context/RoleContext";
import { getApiClient } from "../services/api";

type MemoryExercise = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  streak: number;
};

export const MemoryExercises = () => {
  const { entityId } = useRole();
  const [exercises, setExercises] = useState<MemoryExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const client = getApiClient();
        const { data } = await client.get<MemoryExercise[]>(`/patient/${entityId}/memory-exercises`);
        setExercises(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load memory exercises.");
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [entityId]);

  if (loading) {
    return <p>Loading exercises…</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="cards-grid">
      {exercises.map((exercise) => (
        <section key={exercise.id} className="card">
          <h2><FaBrain /> {exercise.title}</h2>
          <p>{exercise.description}</p>
          <p>
            Difficulty: <strong>{exercise.difficulty}</strong>
          </p>
          <p>
            <FaFire /> Streak: {exercise.streak} days
          </p>
          <button className="large-button" style={{ width: "auto" }}>
            Play now
          </button>
        </section>
      ))}
    </div>
  );
};
