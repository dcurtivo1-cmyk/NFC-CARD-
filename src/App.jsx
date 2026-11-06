import { Component, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { EmptyState, FeedbackProvider, Loading } from "./components/UI";
import Landing from "./pages/Landing";
const Selection = lazy(() => import("./pages/Selection"));
const Editor = lazy(() => import("./pages/Editor"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AboutDemo = lazy(() => import("./pages/AboutDemo"));

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>Something interrupted this little page.</h1>
        <p>
          Your saved data is still in your browser. Reload the app to try again.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Reload Folio
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function EditorRoute() {
  const location = useLocation();
  return <Editor key={location.pathname + location.search} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <FeedbackProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="create" element={<Selection />} />
              <Route path="editor" element={<EditorRoute />} />
              <Route path="editor/:id" element={<EditorRoute />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="p/:id" element={<Profile />} />
              <Route path="about-demo" element={<AboutDemo />} />
              <Route
                path="*"
                element={
                  <div className="section-container">
                    <EmptyState
                      title="A little off the beaten path."
                      action={{ to: "/", label: "Back to home" }}
                    >
                      We couldn’t find that page. Let’s start somewhere
                      familiar.
                    </EmptyState>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </FeedbackProvider>
    </ErrorBoundary>
  );
}
