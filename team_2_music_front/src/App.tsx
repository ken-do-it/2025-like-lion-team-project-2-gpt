import { Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ExplorePage from "./pages/ExplorePage";
import EditTrackPage from "./pages/EditTrackPage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import TrackDetailPage from "./pages/TrackDetailPage";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tracks/:trackId" element={<TrackDetailPage />} />
        <Route path="/tracks/:trackId/edit" element={<EditTrackPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
