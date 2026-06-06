/* ============================================================================
   WAYFORGE — app router + theme
   ========================================================================== */
function App() {
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const modal = useStore((s) => s.modal);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wf-theme", theme);
  }, [theme]);

  const screens = {
    home: Home, intake: Intake, loading: Loading, error: GenError, noResults: NoResults,
    viewer: Viewer, myRoadmaps: MyRoadmaps, login: Login, profile: Profile,
  };
  const Screen = screens[view] || Home;

  return (
    <React.Fragment>
      <Screen />
      {modal === "manual" && <ManualModal />}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
