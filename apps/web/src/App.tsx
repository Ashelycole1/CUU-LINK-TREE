import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { EventPage } from "./pages/EventPage";
import { NewEventPage } from "./pages/NewEventPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TreePage } from "./pages/TreePage";

export function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<TreePage />} />
        <Route path="/new" element={<NewEventPage />} />
        <Route path="/e/:slug" element={<EventPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
