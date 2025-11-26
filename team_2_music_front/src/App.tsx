import { Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ExplorePage from "./pages/ExplorePage";
import LibraryPage from "./pages/LibraryPage";
import TrackDetailPage from "./pages/TrackDetailPage";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/tracks/:trackId" element={<TrackDetailPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
