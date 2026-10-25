import { createContext, useContext, useEffect, useState } from "react";
import { getDataset, getDefaultDataset, resetDataset } from "../api/api";

const DatasetContext = createContext(null);
const clone = (x) => structuredClone(x);

export function DatasetProvider({ children }) {
  const [baseline, setBaseline] = useState(null); // original seed data (for the change summary)
  const [saved, setSaved] = useState(null);       // last state stored on the server
  const [dataset, setDataset] = useState(null);   // what the user is editing now
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getDefaultDataset(), getDataset()])
      .then(([def, current]) => {
        setBaseline(def);
        setSaved(clone(current));
        setDataset(current);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Undo edits that haven't been sent to the server yet
  const revertUnsaved = () => setDataset(clone(saved));

  // Server + UI back to the seed data
  const resetToDefault = async () => {
    const fresh = await resetDataset();
    setSaved(clone(fresh));
    setDataset(fresh);
  };

  // Call after a successful Generate (the server stored this dataset)
  const markSaved = (ds) => setSaved(clone(ds));

  // Call after a teacher saves their availability
  const markFacultySaved = (facultyId) => {
    const fac = dataset.FACULTY.find((f) => f.id === facultyId);
    setSaved((s) => ({
      ...s,
      FACULTY: s.FACULTY.map((f) => (f.id === facultyId ? clone(fac) : f)),
    }));
  };

  const hasUnsaved = !!saved && !!dataset && JSON.stringify(saved) !== JSON.stringify(dataset);

  return (
    <DatasetContext.Provider
      value={{
        dataset, setDataset, baseline, saved, error, hasUnsaved,
        revertUnsaved, resetToDefault, markSaved, markFacultySaved,
        revert: resetToDefault, // keeps older code working
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  return useContext(DatasetContext);
}