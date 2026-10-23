import { createContext, useContext, useEffect, useState } from "react";
import { getDataset, getDefaultDataset, resetDataset } from "../api/api";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [baseline, setBaseline] = useState(null); // original seed data (never changes)
  const [dataset, setDataset] = useState(null);   // current data (server's saved state + edits)
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDefaultDataset(), getDataset()])
      .then(([def, current]) => {
        setBaseline(def);
        setDataset(current);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Go back to the original seed data, on the server AND in the UI
  const revert = async () => {
    try {
      const fresh = await resetDataset();
      setDataset(fresh);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <DatasetContext.Provider value={{ dataset, setDataset, baseline, revert, error }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  return useContext(DatasetContext);
}