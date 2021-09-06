import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import Home from "./views/home";
import Reports from "./views/reports";
import Pairs from "./views/pairs";
import About from "./views/about";

const routes = [
  { path: "/", exact: true, component: Home, id: "home-route" },
  { path: "/reports", component: Reports, id: "reports-route" },
  { path: "/pairs", component: Pairs, id: "pairs-route" },
  { path: "/about", component: About, id: "about-route" }
];

function App() {
  return (
    <BrowserRouter>
      <Switch>
        {routes.map(route => (
          <Route
            path={route.path}
            exact={!!route.exact}
            component={route.component}
            key={route.id}
          />
        ))}
        <Redirect to="/" />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
