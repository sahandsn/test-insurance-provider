import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Simple from "./pages/Simple";
import Medium from "./pages/Medium";
import Hard from "./pages/Hard";
import Recept from "./pages/Recept";

function App() {
  return (
    <div>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2.5rem",
          color: "#3b82f6",
          textDecoration: "underline",
        }}
      >
        <Link to="/">Home</Link>
        <Link to="/simple">Simple</Link>
        <Link to="/medium">Medium</Link>
        <Link to="/hard">Hard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simple" element={<Simple />} />
        <Route path="/medium" element={<Medium />} />
        <Route path="/hard" element={<Hard />} />
        <Route path="/recept/:id" element={<Recept />} />
      </Routes>
    </div>
  );
}

export default App;
