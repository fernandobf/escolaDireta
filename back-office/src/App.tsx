import { BrowserRouter, Routes, Route } from "react-router-dom";
import SpotList from "./components/SpotList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sala" element={<SpotListWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

// Wrapper para passar props obrigatórias do SpotList
function SpotListWrapper() {
  return (
    <SpotList
      setCurrentClass={() => {}}
      setOpenOccurrencesCount={() => {}}
    />
  );
}

export default App;
