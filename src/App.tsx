import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "tailwindcss/tailwind.css";

//for commiting.
import Register from "./scenes/main/Register";
import Login from "./scenes/main/Login";
import AdminHome from "./scenes/admin/AdminHome";
import AgencyCheck from "./scenes/volunteer/AgencyCheck";
import ReliefCenter from "./scenes/volunteer/reliefCenter/ReliefCenter";
import CollectionCenter from "./scenes/volunteer/collection/CollectionCenter";
import NavBar from "./scenes/main/NavBar";
import SnackBar from "./scenes/main/Snackbar";
import MyReliefCenter from "./scenes/volunteer/reliefCenter/MyReliefCenter";
import MyCollectionCenter from "./scenes/volunteer/collection/MyCollectionCenter";
import Home from "./Home";
import DisasterPrecautions from "./components/DisasterPrecautions/DisasterPrecautions";
import NewsFeed from "./components/NewsFeed/NewsFeed";
import Donate from "./components/Donate/Donate";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NavBar />
      <SnackBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/do&donts" element={<DisasterPrecautions />} />
        <Route path="/newsfeed" element={<NewsFeed />} />
        <Route path="/donate" element={<Donate />} />

        {/* Auth Routes */}
        <Route path="/agency" element={<AgencyCheck />}>
          <Route index element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected Agency Routes */}
          <Route
            path="home"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="relief-center"
            element={
              <ProtectedRoute roles={['reliefCenter', 'admin']}>
                <ReliefCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-relief-center"
            element={
              <ProtectedRoute roles={['reliefCenter', 'admin']}>
                <MyReliefCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="collection-center"
            element={
              <ProtectedRoute roles={['collectionCenter', 'admin']}>
                <CollectionCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-collection-center"
            element={
              <ProtectedRoute roles={['collectionCenter', 'admin']}>
                <MyCollectionCenter />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
