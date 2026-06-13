import { Routes, Route } from 'react-router-dom';

/**
 * Root component. Routes are declared here; feature pages (login, dashboard,
 * repositories, pull requests) get added as they are built.
 */
export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<div className="p-8 text-xl font-semibold">PR Intelligence Platform</div>}
      />
    </Routes>
  );
}
