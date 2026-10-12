import SignalBoot from "./components/SignalBoot";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import AddProject from "./components/AddProject";
import EditProject from "./components/EditProject";

function App() {
  const path = window.location.pathname;

  if (path === "/admin/projects/new") {
    return <AddProject />;
  }

  if (path.startsWith("/admin/projects/edit/")) {
    return <EditProject />;
  }

  if (path === "/admin/panel") {
    return <AdminPanel />;
  }

  if (path === "/admin") {
    return <AdminLogin />;
  }

  return <SignalBoot />;
}

export default App;
