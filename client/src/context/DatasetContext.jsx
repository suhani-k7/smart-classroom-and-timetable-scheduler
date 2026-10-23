import { createContext, useContext, useEffect, useState } from "react";
import { getDataset } from "../api/api";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [baseline, setBaseline] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDataset()
      .then((d) => {
        setBaseline(structuredClone(d));
        setDataset(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  const revert = () => setDataset(structuredClone(baseline));

  return (
    <DatasetContext.Provider value={{ dataset, setDataset, baseline, revert, error }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  return useContext(DatasetContext);
}